"""
Regression tests for the free trial registration endpoint.

These lock in the behavior the feature depends on: shared-secret auth, the
budget-capped key creation, DB-level uniqueness surfaced as 409, and the
welcome email being best-effort (a failed email still returns the key while
recording state for retry). The model backing Polyglot must never leak to the
caller.
"""

from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from litellm.proxy.management_endpoints import free_trial_endpoints
from litellm.proxy.management_endpoints.free_trial_endpoints import router

VALID_HEADER = {"x-litellm-free-trial-key": "secret-123"}
VALID_BODY = {
    "name": "Fulano De Tal",
    "email": "Fulano@Example.com",
    "phone": "+55 85 99999-8888",
    "instagram": "fulano",
}


@pytest.fixture
def client() -> TestClient:
    app = FastAPI()
    app.include_router(router)
    return TestClient(app, raise_server_exceptions=False)


@pytest.fixture
def mock_repo() -> MagicMock:
    repo_instance = MagicMock()
    created = MagicMock()
    created.id = "reg-1"
    repo_instance.table.create = AsyncMock(return_value=created)
    repo_instance.table.update = AsyncMock()
    return repo_instance


def _patch_deps(monkeypatch, repo_instance, *, generate_key=None, send_email=None, prisma_client="db"):
    monkeypatch.setenv("FREE_TRIAL_API_KEY", "secret-123")
    monkeypatch.setenv("FREE_TRIAL_MODEL", "qwen3")
    monkeypatch.setenv("LITELLM_SALT_KEY", "sk-salt-key-for-tests-0123456789")

    fake_proxy_server = MagicMock()
    fake_proxy_server.prisma_client = MagicMock() if prisma_client == "db" else None
    monkeypatch.setattr("litellm.proxy.proxy_server.prisma_client", fake_proxy_server.prisma_client, raising=False)

    repo_factory = MagicMock(return_value=repo_instance)
    monkeypatch.setattr(
        "litellm.repositories.table_repositories.FreeTrialRegistrationRepository",
        repo_factory,
    )

    gen = generate_key or AsyncMock(return_value={"token": "sk-created-key", "token_id": "hashabc"})
    monkeypatch.setattr(
        "litellm.proxy.management_endpoints.key_management_endpoints.generate_key_helper_fn",
        gen,
    )

    mail = send_email or AsyncMock()
    monkeypatch.setattr("litellm.proxy.utils.send_email", mail)
    monkeypatch.setattr("litellm.proxy.utils.hash_token", lambda k: f"hash:{k}")
    return gen, mail


def test_feature_disabled_without_secret(client, monkeypatch):
    monkeypatch.delenv("FREE_TRIAL_API_KEY", raising=False)
    resp = client.post("/free-trial/register", json=VALID_BODY, headers=VALID_HEADER)
    assert resp.status_code == 503


def test_wrong_secret_rejected(client, monkeypatch, mock_repo):
    _patch_deps(monkeypatch, mock_repo)
    resp = client.post("/free-trial/register", json=VALID_BODY, headers={"x-litellm-free-trial-key": "wrong"})
    assert resp.status_code == 401


def test_missing_header_rejected(client, monkeypatch, mock_repo):
    _patch_deps(monkeypatch, mock_repo)
    resp = client.post("/free-trial/register", json=VALID_BODY)
    assert resp.status_code == 401


def test_happy_path_creates_capped_key_and_hides_model(client, monkeypatch, mock_repo):
    gen, mail = _patch_deps(monkeypatch, mock_repo)
    resp = client.post("/free-trial/register", json=VALID_BODY, headers=VALID_HEADER)

    assert resp.status_code == 200
    body = resp.json()
    assert body == {"key": "sk-created-key", "max_budget": 5000.0, "currency": "BRL"}
    # model must not leak anywhere in the response
    assert "qwen3" not in resp.text

    # key was created with the BRL cap, no reset window, restricted to the model, no team
    _, kwargs = gen.call_args
    assert kwargs["key_max_budget"] == 5000.0
    assert kwargs["key_budget_duration"] is None
    assert kwargs["models"] == ["qwen3"]
    assert kwargs.get("team_id") is None

    # registration persisted with normalized values and the key stored encrypted (not plaintext)
    _, create_kwargs = mock_repo.table.create.call_args
    data = create_kwargs["data"]
    assert data["email"] == "fulano@example.com"
    assert data["name_normalized"] == "fulano de tal"
    assert data["phone_normalized"] == "+5585999998888"
    assert data["instagram"] == "@fulano"
    assert data["key_encrypted"] and data["key_encrypted"] != "sk-created-key"

    # welcome email delivered to the provided address, containing name, instagram AND the key
    _, mail_kwargs = mail.call_args
    assert mail_kwargs["receiver_email"] == "fulano@example.com"
    assert "Fulano De Tal" in mail_kwargs["html"]
    assert "@fulano" in mail_kwargs["html"]
    assert "sk-created-key" in mail_kwargs["html"]
    mock_repo.table.update.assert_awaited()  # marked email_sent


def test_logo_embedded_from_repo_file_as_cid(client, monkeypatch, mock_repo, tmp_path):
    logo = tmp_path / "polyglot.png"
    logo.write_bytes(b"\x89PNG\r\n\x1a\nFAKELOGO")
    monkeypatch.setenv("EMAIL_LOGO_FILE", str(logo))

    _, mail = _patch_deps(monkeypatch, mock_repo)
    resp = client.post("/free-trial/register", json=VALID_BODY, headers=VALID_HEADER)

    assert resp.status_code == 200
    _, mail_kwargs = mail.call_args
    # image referenced by cid and shipped inline from the file, no external link
    assert 'src="cid:polyglot_logo"' in mail_kwargs["html"]
    assert mail_kwargs["inline_images"] == {"polyglot_logo": b"\x89PNG\r\n\x1a\nFAKELOGO"}


def test_duplicate_returns_409_and_rolls_back_key(client, monkeypatch, mock_repo):
    mock_repo.table.create = AsyncMock(side_effect=Exception("Unique constraint failed on the fields: (`email`)"))
    delete_mock = AsyncMock()

    gen, _ = _patch_deps(monkeypatch, mock_repo)
    fake_prisma = MagicMock()
    fake_prisma.db.litellm_verificationtoken.delete = delete_mock
    monkeypatch.setattr("litellm.proxy.proxy_server.prisma_client", fake_prisma, raising=False)

    resp = client.post("/free-trial/register", json=VALID_BODY, headers=VALID_HEADER)

    assert resp.status_code == 409
    delete_mock.assert_awaited_once()  # the just-created key was rolled back


def test_email_failure_still_returns_key_and_records_retry_state(client, monkeypatch, mock_repo):
    failing_mail = AsyncMock(side_effect=RuntimeError("smtp down"))
    _patch_deps(monkeypatch, mock_repo, send_email=failing_mail)

    resp = client.post("/free-trial/register", json=VALID_BODY, headers=VALID_HEADER)

    assert resp.status_code == 200
    assert resp.json()["key"] == "sk-created-key"
    _, update_kwargs = mock_repo.table.update.call_args
    assert update_kwargs["data"]["email_sent"] is False
    assert "smtp down" in update_kwargs["data"]["email_last_error"]


@pytest.mark.parametrize("bad_phone", ["123", "not-a-phone", ""])
def test_invalid_phone_rejected_before_any_side_effect(client, monkeypatch, mock_repo, bad_phone):
    gen, _ = _patch_deps(monkeypatch, mock_repo)
    resp = client.post(
        "/free-trial/register",
        json={**VALID_BODY, "phone": bad_phone},
        headers=VALID_HEADER,
    )
    assert resp.status_code == 422
    gen.assert_not_called()
    mock_repo.table.create.assert_not_called()
