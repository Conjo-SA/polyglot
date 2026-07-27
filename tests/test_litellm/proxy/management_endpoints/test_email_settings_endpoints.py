"""
Regression tests for the admin email settings endpoints.

Locks in: proxy-admin gating (403 for non-admins), the SMTP password is never
returned (only a boolean), and the test-email route surfaces a 400 when the
send fails instead of falsely reporting success.
"""

from unittest.mock import AsyncMock, MagicMock

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from litellm.proxy._types import LitellmUserRoles, UserAPIKeyAuth
from litellm.proxy.auth.user_api_key_auth import user_api_key_auth
from litellm.proxy.common_utils.email_settings import ResolvedEmailConfig
from litellm.proxy.management_endpoints import email_settings_endpoints
from litellm.proxy.management_endpoints.email_settings_endpoints import router

RESOLVED = ResolvedEmailConfig(
    smtp_host="in-v3.mailjet.com",
    smtp_port=587,
    smtp_username="apikey",
    smtp_password="super-secret",
    sender_email="from@example.com",
    use_tls=True,
    email_provider="mailjet",
)


def _client(role: LitellmUserRoles) -> TestClient:
    app = FastAPI()
    app.include_router(router)
    app.dependency_overrides[user_api_key_auth] = lambda: UserAPIKeyAuth(user_role=role, api_key="sk-test")
    return TestClient(app, raise_server_exceptions=False)


@pytest.fixture(autouse=True)
def _patch(monkeypatch):
    monkeypatch.setattr("litellm.proxy.proxy_server.prisma_client", MagicMock(), raising=False)
    monkeypatch.setattr(email_settings_endpoints, "resolve_email_config", AsyncMock(return_value=RESOLVED))
    monkeypatch.setattr(email_settings_endpoints, "save_email_settings", AsyncMock())


def test_get_masks_password_and_never_returns_it():
    resp = _client(LitellmUserRoles.PROXY_ADMIN).get("/email/settings")
    assert resp.status_code == 200
    body = resp.json()
    assert body["smtp_password_set"] is True
    assert "smtp_password" not in body
    assert "super-secret" not in resp.text


def test_non_admin_forbidden_on_get():
    resp = _client(LitellmUserRoles.INTERNAL_USER).get("/email/settings")
    assert resp.status_code == 403


def test_non_admin_forbidden_on_update():
    resp = _client(LitellmUserRoles.INTERNAL_USER).post("/email/settings", json={"smtp_host": "x"})
    assert resp.status_code == 403


def test_update_persists_and_returns_masked(monkeypatch):
    resp = _client(LitellmUserRoles.PROXY_ADMIN).post(
        "/email/settings",
        json={
            "smtp_host": "in-v3.mailjet.com",
            "smtp_port": 587,
            "smtp_username": "apikey",
            "smtp_password": "new-secret",
            "smtp_sender_email": "from@example.com",
            "smtp_tls": True,
            "email_provider": "mailjet",
        },
    )
    assert resp.status_code == 200
    email_settings_endpoints.save_email_settings.assert_awaited_once()
    assert "new-secret" not in resp.text


def test_test_email_returns_400_when_send_fails(monkeypatch):
    monkeypatch.setattr("litellm.proxy.utils.send_email", AsyncMock(return_value=False))
    resp = _client(LitellmUserRoles.PROXY_ADMIN).post("/email/settings/test", json={"test_email": "to@example.com"})
    assert resp.status_code == 400


def test_test_email_success(monkeypatch):
    mail = AsyncMock(return_value=True)
    monkeypatch.setattr("litellm.proxy.utils.send_email", mail)
    resp = _client(LitellmUserRoles.PROXY_ADMIN).post("/email/settings/test", json={"test_email": "to@example.com"})
    assert resp.status_code == 200
    assert resp.json()["status"] == "success"
    _, kwargs = mail.call_args
    assert kwargs["receiver_email"] == "to@example.com"
