"""
Free trial registration endpoint.

An external system calls this endpoint (authenticated with a shared secret from
the FREE_TRIAL_API_KEY env var) to provision a budget-capped virtual key for
Polyglot testing and to trigger a welcome email.

The endpoint is intentionally public (no LiteLLM virtual-key auth); its only gate
is the shared secret. Uniqueness of email, phone and name is enforced by DB
unique constraints, not by a read-then-write check, so concurrent registrations
cannot create duplicates. The model backing Polyglot is never exposed to the
caller.
"""

import hmac
import os
import re
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, EmailStr, field_validator

from litellm._logging import verbose_proxy_logger

router = APIRouter()

FREE_TRIAL_API_KEY_HEADER = "x-litellm-free-trial-key"
_DEFAULT_FREE_TRIAL_MODEL = "qwen3"
_DEFAULT_FREE_TRIAL_MAX_BUDGET = 5000.0
_FREE_TRIAL_CURRENCY = "BRL"
_NON_DIGITS = re.compile(r"\D")


@dataclass(frozen=True, slots=True)
class FreeTrialConfig:
    api_key: str
    model: str
    max_budget: float
    currency: str


def _resolve_free_trial_config() -> Optional[FreeTrialConfig]:
    """
    Resolve config from env. Returns None when the feature is not configured
    (no shared secret), which the endpoint surfaces as 503.
    """
    api_key = os.getenv("FREE_TRIAL_API_KEY")
    if not api_key:
        return None

    raw_budget = os.getenv("FREE_TRIAL_MAX_BUDGET")
    try:
        max_budget = float(raw_budget) if raw_budget else _DEFAULT_FREE_TRIAL_MAX_BUDGET
    except ValueError:
        max_budget = _DEFAULT_FREE_TRIAL_MAX_BUDGET

    return FreeTrialConfig(
        api_key=api_key,
        model=os.getenv("FREE_TRIAL_MODEL", _DEFAULT_FREE_TRIAL_MODEL),
        max_budget=max_budget,
        currency=_FREE_TRIAL_CURRENCY,
    )


def _normalize_name(name: str) -> str:
    return re.sub(r"\s+", " ", name).strip().lower()


def _normalize_instagram(handle: str) -> str:
    stripped = handle.strip().lower().lstrip("@").strip()
    return f"@{stripped}"


def _normalize_phone(raw: str) -> str:
    """
    Normalize to an E.164-ish canonical form (+<digits>) so duplicates match
    regardless of formatting. Numbers without a country code are assumed to be
    Brazilian (10-11 local digits) and get a 55 prefix. Rejects anything that
    can't be a real number.
    """
    has_country_code = raw.strip().startswith("+")
    digits = _NON_DIGITS.sub("", raw)
    if not has_country_code and len(digits) in (10, 11):
        digits = f"55{digits}"
    if not 11 <= len(digits) <= 15:
        raise ValueError("Invalid phone number")
    return f"+{digits}"


class FreeTrialRegistrationRequest(BaseModel):
    name: str
    email: EmailStr
    phone: str
    instagram: str

    @field_validator("name")
    @classmethod
    def _validate_name(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Name is required")
        return v.strip()

    @field_validator("phone")
    @classmethod
    def _validate_phone(cls, v: str) -> str:
        return _normalize_phone(v)

    @field_validator("instagram")
    @classmethod
    def _validate_instagram(cls, v: str) -> str:
        if not v or not v.strip() or not v.strip().lstrip("@").strip():
            raise ValueError("Instagram is required")
        return _normalize_instagram(v)


class FreeTrialRegistrationResponse(BaseModel):
    key: str
    max_budget: float
    currency: str


def _welcome_email_html(name: str, instagram: str) -> str:
    return (
        f"<p>Olá {name},</p>"
        "<p>Seu acesso de teste ao Polyglot foi criado.</p>"
        f"<p>Instagram: {instagram}</p>"
        "<p>Atenciosamente,<br/>Equipe Polyglot</p>"
    )


def _is_unique_violation(error: Exception) -> bool:
    try:
        from prisma.errors import UniqueViolationError

        if isinstance(error, UniqueViolationError):
            return True
    except ImportError:
        pass
    message = str(error).lower()
    return "unique" in message and "constraint" in message


async def _create_free_trial_key(config: FreeTrialConfig, name: str, email: str, instagram: str, phone: str) -> str:
    """Create the budget-capped virtual key and return the plaintext key."""
    from litellm.proxy._types import GenerateKeyResponse
    from litellm.proxy.management_endpoints.key_management_endpoints import generate_key_helper_fn

    alias_slug = re.sub(r"[^a-z0-9-]+", "-", _normalize_name(name)).strip("-") or "user"
    key_alias = f"free-trial-{alias_slug}"[:255]

    raw = await generate_key_helper_fn(
        request_type="key",
        table_name="key",
        duration=None,
        models=[config.model],
        key_max_budget=config.max_budget,
        key_budget_duration=None,
        key_alias=key_alias,
        metadata={
            "origin": "free_trial",
            "instagram": instagram,
            "name": name,
            "email": email,
            "phone": phone,
        },
    )
    key_response = GenerateKeyResponse(**raw)
    return key_response.key


async def _send_welcome_email(
    prisma_client: object, registration_id: str, name: str, email: str, instagram: str
) -> None:
    """Best-effort welcome email. Records delivery state for background retry."""
    from litellm.proxy.utils import send_email
    from litellm.repositories.table_repositories import FreeTrialRegistrationRepository

    repo = FreeTrialRegistrationRepository(prisma_client)
    try:
        sent = await send_email(
            receiver_email=email,
            subject="Seu acesso de teste ao Polyglot",
            html=_welcome_email_html(name=name, instagram=instagram),
        )
        error: Optional[str] = None if sent else "email delivery failed"
    except Exception as email_error:
        sent = False
        error = str(email_error)

    if sent:
        await repo.table.update(where={"id": registration_id}, data={"email_sent": True})
        return

    verbose_proxy_logger.warning("Free trial welcome email to %s failed: %s", email, error)
    await repo.table.update(
        where={"id": registration_id},
        data={
            "email_sent": False,
            "email_attempts": {"increment": 1},
            "email_last_error": (error or "email delivery failed")[:1000],
            "email_last_attempt_at": datetime.now(timezone.utc),
        },
    )


@router.post(
    "/free-trial/register",
    tags=["free trial"],
    response_model=FreeTrialRegistrationResponse,
)
async def register_free_trial(
    request_data: FreeTrialRegistrationRequest, request: Request
) -> FreeTrialRegistrationResponse:
    from litellm.proxy.proxy_server import prisma_client
    from litellm.repositories.table_repositories import FreeTrialRegistrationRepository

    config = _resolve_free_trial_config()
    if config is None:
        raise HTTPException(status_code=503, detail="Free trial feature is not enabled")

    provided_key = request.headers.get(FREE_TRIAL_API_KEY_HEADER, "")
    if not hmac.compare_digest(provided_key, config.api_key):
        raise HTTPException(status_code=401, detail="Invalid free trial API key")

    if prisma_client is None:
        raise HTTPException(status_code=503, detail="Free trial feature is not enabled")

    normalized_name = _normalize_name(request_data.name)
    normalized_email = str(request_data.email).lower()

    plaintext_key = await _create_free_trial_key(
        config=config,
        name=request_data.name,
        email=normalized_email,
        instagram=request_data.instagram,
        phone=request_data.phone,
    )

    repo = FreeTrialRegistrationRepository(prisma_client)
    try:
        registration = await repo.table.create(
            data={
                "email": normalized_email,
                "phone_normalized": request_data.phone,
                "name_normalized": normalized_name,
                "name": request_data.name,
                "instagram": request_data.instagram,
                "key_token": _hash_key(plaintext_key),
            }
        )
    except Exception as create_error:
        await _rollback_key(prisma_client, plaintext_key)
        if _is_unique_violation(create_error):
            raise HTTPException(status_code=409, detail="A registration with this email, phone or name already exists")
        verbose_proxy_logger.exception("Free trial registration failed")
        raise HTTPException(status_code=500, detail="Failed to register free trial")

    await _send_welcome_email(
        prisma_client=prisma_client,
        registration_id=registration.id,
        name=request_data.name,
        email=normalized_email,
        instagram=request_data.instagram,
    )

    return FreeTrialRegistrationResponse(
        key=plaintext_key,
        max_budget=config.max_budget,
        currency=config.currency,
    )


def _hash_key(plaintext_key: str) -> str:
    from litellm.proxy.utils import hash_token

    return hash_token(plaintext_key)


async def _rollback_key(prisma_client: object, plaintext_key: str) -> None:
    try:
        await prisma_client.db.litellm_verificationtoken.delete(where={"token": _hash_key(plaintext_key)})  # type: ignore[attr-defined]
    except Exception:
        verbose_proxy_logger.warning("Failed to roll back free trial key after registration error")
