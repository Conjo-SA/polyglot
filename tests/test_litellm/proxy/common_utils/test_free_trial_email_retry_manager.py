"""
Regression tests for the free trial welcome-email retry manager.

Locks in the backoff schedule and the reprocessing behavior: due rows are
resent and marked email_sent on success; failures increment attempts and
record the error; rows not yet past their backoff window are skipped.
"""

from datetime import datetime, timedelta, timezone
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock

import pytest

from litellm.proxy.common_utils.free_trial_email_retry_manager import (
    FreeTrialEmailRetryManager,
    _backoff_seconds,
    _is_due,
)


def test_backoff_grows_exponentially():
    assert _backoff_seconds(0) == 60
    assert _backoff_seconds(1) == 120
    assert _backoff_seconds(2) == 240


def test_is_due_when_never_attempted():
    assert _is_due(None, attempts=0, now=datetime.now(timezone.utc)) is True


def test_is_due_respects_backoff_window():
    now = datetime.now(timezone.utc)
    # attempts=1 -> 120s backoff; 60s ago is not due yet, 200s ago is due
    assert _is_due(now - timedelta(seconds=60), attempts=1, now=now) is False
    assert _is_due(now - timedelta(seconds=200), attempts=1, now=now) is True


def test_is_due_handles_naive_timestamps():
    now = datetime.now(timezone.utc)
    naive_old = (now - timedelta(seconds=500)).replace(tzinfo=None)
    assert _is_due(naive_old, attempts=1, now=now) is True


def _row(**kwargs):
    base = dict(
        id="reg-1",
        email="user@example.com",
        name="Fulano",
        instagram="@fulano",
        key_encrypted=None,
        email_attempts=0,
        email_last_attempt_at=None,
    )
    base.update(kwargs)
    return SimpleNamespace(**base)


@pytest.fixture
def repo_and_patches(monkeypatch):
    monkeypatch.setenv("LITELLM_SALT_KEY", "sk-salt-key-for-tests-0123456789")
    repo = MagicMock()
    repo.table.update = AsyncMock()
    repo_factory = MagicMock(return_value=repo)
    monkeypatch.setattr(
        "litellm.repositories.table_repositories.FreeTrialRegistrationRepository",
        repo_factory,
    )
    return repo


@pytest.mark.asyncio
async def test_due_row_resent_with_decrypted_key_and_marked_sent(monkeypatch, repo_and_patches):
    from litellm.proxy.common_utils.encrypt_decrypt_utils import encrypt_value_helper

    repo = repo_and_patches
    encrypted = encrypt_value_helper("sk-retry-key")
    repo.table.find_many = AsyncMock(return_value=[_row(key_encrypted=encrypted)])
    mail = AsyncMock()
    monkeypatch.setattr("litellm.proxy.utils.send_email", mail)

    await FreeTrialEmailRetryManager(prisma_client=MagicMock()).process_pending()

    _, mail_kwargs = mail.call_args
    assert mail_kwargs["receiver_email"] == "user@example.com"
    assert "Fulano" in mail_kwargs["html"]
    assert "@fulano" in mail_kwargs["html"]
    assert "sk-retry-key" in mail_kwargs["html"]  # the key is re-sent on retry
    _, update_kwargs = repo.table.update.call_args
    assert update_kwargs["data"] == {"email_sent": True}


@pytest.mark.asyncio
async def test_failed_retry_increments_attempts(monkeypatch, repo_and_patches):
    repo = repo_and_patches
    repo.table.find_many = AsyncMock(return_value=[_row()])
    monkeypatch.setattr("litellm.proxy.utils.send_email", AsyncMock(side_effect=RuntimeError("smtp down")))

    await FreeTrialEmailRetryManager(prisma_client=MagicMock()).process_pending()

    _, update_kwargs = repo.table.update.call_args
    data = update_kwargs["data"]
    assert data["email_attempts"] == {"increment": 1}
    assert "smtp down" in data["email_last_error"]
    assert "email_sent" not in data


@pytest.mark.asyncio
async def test_row_not_due_is_skipped(monkeypatch, repo_and_patches):
    repo = repo_and_patches
    recent = datetime.now(timezone.utc) - timedelta(seconds=10)
    repo.table.find_many = AsyncMock(return_value=[_row(email_attempts=1, email_last_attempt_at=recent)])
    mail = AsyncMock()
    monkeypatch.setattr("litellm.proxy.utils.send_email", mail)

    await FreeTrialEmailRetryManager(prisma_client=MagicMock()).process_pending()

    mail.assert_not_called()
    repo.table.update.assert_not_called()


@pytest.mark.asyncio
async def test_query_filters_out_maxed_out_rows(monkeypatch, repo_and_patches):
    repo = repo_and_patches
    repo.table.find_many = AsyncMock(return_value=[])
    monkeypatch.setattr("litellm.proxy.utils.send_email", AsyncMock())

    await FreeTrialEmailRetryManager(prisma_client=MagicMock()).process_pending()

    _, find_kwargs = repo.table.find_many.call_args
    where = find_kwargs["where"]
    assert where["email_sent"] is False
    assert where["email_attempts"] == {"lt": 5}
