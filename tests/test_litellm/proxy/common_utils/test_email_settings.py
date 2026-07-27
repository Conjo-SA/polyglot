"""
Regression tests for email settings persistence and resolution.

Locks in: the SMTP password is encrypted at rest (never stored in the clear),
an empty password on update keeps the previously stored one, and resolution
merges stored settings over env vars with stored winning per field.
"""

from types import SimpleNamespace

import pytest

from litellm.proxy.common_utils import email_settings as email_settings_module
from litellm.proxy.common_utils.email_settings import (
    get_stored_email_settings,
    resolve_email_config,
    save_email_settings,
)


class _InMemoryConfigRepo:
    def __init__(self, prisma_client):
        pass

    store: dict = {}

    async def get_param(self, param_name):
        if param_name not in self.store:
            return None
        return SimpleNamespace(param_name=param_name, param_value=self.store[param_name])

    async def set_param(self, param_name, param_value):
        self.store[param_name] = param_value
        return SimpleNamespace(param_name=param_name, param_value=param_value)


@pytest.fixture(autouse=True)
def _patch_infra(monkeypatch):
    _InMemoryConfigRepo.store = {}
    monkeypatch.setenv("LITELLM_SALT_KEY", "sk-salt-key-for-tests-0123456789")
    monkeypatch.setattr("litellm.repositories.config_repository.ConfigRepository", _InMemoryConfigRepo)

    async def _noop(param_name):
        return None

    monkeypatch.setattr("litellm.proxy.utils.invalidate_config_param", _noop)
    for var in ("SMTP_HOST", "SMTP_PORT", "SMTP_USERNAME", "SMTP_PASSWORD", "SMTP_SENDER_EMAIL", "SMTP_TLS"):
        monkeypatch.delenv(var, raising=False)


@pytest.mark.asyncio
async def test_password_encrypted_at_rest_and_recovered():
    await save_email_settings(
        prisma_client=object(),
        smtp_host="in-v3.mailjet.com",
        smtp_port=587,
        smtp_username="apikey",
        smtp_password="super-secret",
        sender_email="from@example.com",
        use_tls=True,
        email_provider="mailjet",
    )

    stored_raw = _InMemoryConfigRepo.store["email_settings"]["smtp_password"]
    assert stored_raw != "super-secret"  # encrypted, not plaintext

    recovered = await get_stored_email_settings(prisma_client=object())
    assert recovered["smtp_password"] == "super-secret"


@pytest.mark.asyncio
async def test_empty_password_on_update_keeps_previous():
    await save_email_settings(
        prisma_client=object(),
        smtp_host="host1",
        smtp_port=587,
        smtp_username="u",
        smtp_password="keep-me",
        sender_email="from@example.com",
        use_tls=True,
        email_provider="mailjet",
    )
    await save_email_settings(
        prisma_client=object(),
        smtp_host="host2",
        smtp_port=587,
        smtp_username="u",
        smtp_password="",  # not changing the password
        sender_email="from@example.com",
        use_tls=True,
        email_provider="mailjet",
    )

    recovered = await get_stored_email_settings(prisma_client=object())
    assert recovered["smtp_host"] == "host2"
    assert recovered["smtp_password"] == "keep-me"


@pytest.mark.asyncio
async def test_resolve_falls_back_to_env_when_unset(monkeypatch):
    monkeypatch.setenv("SMTP_HOST", "env-host")
    monkeypatch.setenv("SMTP_PORT", "2525")
    monkeypatch.setenv("SMTP_SENDER_EMAIL", "env@example.com")
    monkeypatch.setenv("SMTP_PASSWORD", "env-pass")

    config = await resolve_email_config(prisma_client=None)
    assert config.smtp_host == "env-host"
    assert config.smtp_port == 2525
    assert config.sender_email == "env@example.com"
    assert config.smtp_password == "env-pass"


@pytest.mark.asyncio
async def test_stored_settings_override_env(monkeypatch):
    monkeypatch.setenv("SMTP_HOST", "env-host")
    monkeypatch.setenv("SMTP_SENDER_EMAIL", "env@example.com")

    await save_email_settings(
        prisma_client=object(),
        smtp_host="stored-host",
        smtp_port=465,
        smtp_username="u",
        smtp_password="stored-pass",
        sender_email="stored@example.com",
        use_tls=False,
        email_provider="mailjet",
    )

    config = await resolve_email_config(prisma_client=object())
    assert config.smtp_host == "stored-host"
    assert config.sender_email == "stored@example.com"
    assert config.smtp_password == "stored-pass"
    assert config.use_tls is False
    assert config.smtp_port == 465
