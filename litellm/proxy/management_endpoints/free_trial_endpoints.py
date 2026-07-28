"""
Free trial registration endpoint.

An external system calls this endpoint (authenticated with a shared secret from
the FREE_TRIAL_API_KEY env var) to provision a budget-capped virtual key for
Jarbas AI testing and to trigger a welcome email.

The endpoint is intentionally public (no LiteLLM virtual-key auth); its only gate
is the shared secret. Uniqueness of email, phone and name is enforced by DB
unique constraints, not by a read-then-write check, so concurrent registrations
cannot create duplicates. The model backing Jarbas AI is never exposed to the
caller.
"""

import hmac
import html as html_lib
import os
import re
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, HTTPException, Request, Response
from pydantic import BaseModel, EmailStr, field_validator

from litellm._logging import verbose_proxy_logger

router = APIRouter()

FREE_TRIAL_API_KEY_HEADER = "x-litellm-free-trial-key"
_DEFAULT_FREE_TRIAL_MODEL = "qwen3"
_DEFAULT_FREE_TRIAL_MAX_BUDGET = 5000.0
_FREE_TRIAL_CURRENCY = "BRL"
_NON_DIGITS = re.compile(r"\D")
_DEFAULT_EMAIL_LOGO_URL = "https://polyglot.hub.conjochat.conjosa.com.br/get_image"


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


_LOGO_CID = "jarbas_logo"
_BUNDLED_LOGO_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "assets", "jarbas_ai_logo.png")


def _read_logo_bytes(path: str) -> Optional[bytes]:
    try:
        with open(path, "rb") as f:
            return f.read()
    except OSError:
        return None


def _resolve_logo() -> tuple[str, dict[str, bytes]]:
    """
    Resolve the email logo, in priority order:

    1. EMAIL_LOGO_FILE  -> embed that file inline (cid), no external link
    2. EMAIL_LOGO_URL   -> use that hosted URL
    3. bundled Jarbas AI logo (litellm/proxy/assets/jarbas_ai_logo.png) -> inline (cid)
    4. hardcoded hosted URL fallback

    Returns (img_src, inline_images).
    """
    env_file = os.getenv("EMAIL_LOGO_FILE")
    if env_file:
        data = _read_logo_bytes(env_file)
        if data is not None:
            return f"cid:{_LOGO_CID}", {_LOGO_CID: data}
        verbose_proxy_logger.warning("EMAIL_LOGO_FILE not readable: %s", env_file)

    env_url = os.getenv("EMAIL_LOGO_URL")
    if env_url:
        return env_url, {}

    bundled = _read_logo_bytes(_BUNDLED_LOGO_PATH)
    if bundled is not None:
        return f"cid:{_LOGO_CID}", {_LOGO_CID: bundled}

    return _DEFAULT_EMAIL_LOGO_URL, {}


def _welcome_email_html(name: str, instagram: str, api_key: Optional[str], logo_src: str) -> str:
    """
    Branded HTML welcome email. Uses a table-based layout with inline styles for
    broad email-client compatibility. `logo_src` is either a hosted URL or a
    cid: reference to an inline image. User-supplied values are HTML-escaped.
    """
    logo_url = html_lib.escape(logo_src)
    safe_name = html_lib.escape(name)
    safe_instagram = html_lib.escape(instagram)
    font = "font-family:Arial,Helvetica,sans-serif;"

    key_block = ""
    if api_key:
        safe_key = html_lib.escape(api_key)
        key_block = "".join(
            [
                '<p style="margin:0 0 8px;font-size:13px;color:#6b7280;'
                'text-transform:uppercase;letter-spacing:.05em;">Sua chave de acesso</p>',
                '<div style="background:#0f172a;border-radius:10px;padding:16px 18px;margin:0 0 8px;">',
                '<code style="font-family:Consolas,Menlo,monospace;font-size:15px;'
                f'color:#a5b4fc;word-break:break-all;">{safe_key}</code></div>',
                '<p style="margin:0 0 24px;font-size:13px;color:#9ca3af;">Guarde esta chave com '
                "segurança. Ela é o seu acesso ao free trial e não será exibida novamente.</p>",
            ]
        )

    accent_style = "height:4px;font-size:0;line-height:0;background:linear-gradient(90deg,#4f46e5 0%,#7c3aed 100%);"
    header_style = "background:#ffffff;padding:28px 32px;text-align:center;border-bottom:1px solid #eef0f4;"
    card_style = (
        "max-width:600px;width:100%;background:#ffffff;border-radius:16px;"
        "overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.08);"
    )
    return "".join(
        [
            '<!DOCTYPE html><html lang="pt-BR">',
            '<body style="margin:0;padding:0;background:#f3f4f6;">',
            '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" '
            'style="background:#f3f4f6;padding:32px 12px;"><tr><td align="center">',
            '<table role="presentation" width="600" cellpadding="0" cellspacing="0" '
            f'style="{card_style}">',
            f'<tr><td style="{accent_style}">&nbsp;</td></tr>',
            f'<tr><td style="{header_style}">',
            f'<img src="{logo_url}" alt="Jarbas AI" height="44" style="height:44px;max-height:44px;" />',
            "</td></tr>",
            '<tr><td style="padding:36px 36px 12px;">',
            f'<h1 style="margin:0 0 12px;{font}font-size:22px;color:#111827;">Olá {safe_name},</h1>',
            f'<p style="margin:0 0 24px;{font}font-size:15px;line-height:1.6;color:#374151;">'
            "Seu acesso de teste ao <strong>Jarbas AI</strong> está pronto. "
            "Use a chave abaixo para começar a testar.</p>",
            key_block,
            f'<p style="margin:0 0 6px;{font}font-size:14px;color:#374151;">'
            f"Instagram: <strong>{safe_instagram}</strong></p>",
            f'<p style="margin:18px 0 0;{font}font-size:14px;color:#374151;">'
            "Não deixe de seguir "
            '<a href="https://www.instagram.com/andreconjo" '
            'style="color:#7c3aed;font-weight:bold;text-decoration:none;">@andreconjo</a></p>',
            "</td></tr>",
            '<tr><td style="padding:24px 36px 36px;border-top:1px solid #f0f0f0;">',
            f'<p style="margin:16px 0 0;{font}font-size:13px;color:#9ca3af;">'
            "Enviado automaticamente pela equipe Jarbas AI. "
            "Se você não solicitou este acesso, ignore este email.</p>",
            "</td></tr></table></td></tr></table></body></html>",
        ]
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


def _encrypt_key(plaintext_key: str) -> str:
    from litellm.proxy.common_utils.encrypt_decrypt_utils import encrypt_value_helper

    return encrypt_value_helper(plaintext_key)


def _decrypt_key(encrypted_key: Optional[str]) -> Optional[str]:
    if not encrypted_key:
        return None
    from litellm.proxy.common_utils.encrypt_decrypt_utils import decrypt_value_helper

    return decrypt_value_helper(
        encrypted_key, key="free_trial_key", exception_type="debug", return_original_value=False
    )


async def _send_welcome_email(
    prisma_client: object, registration_id: str, name: str, email: str, instagram: str, api_key: Optional[str]
) -> None:
    """Best-effort welcome email. Records delivery state for background retry."""
    from litellm.proxy.utils import send_email
    from litellm.repositories.table_repositories import FreeTrialRegistrationRepository

    logo_src, inline_images = _resolve_logo()
    repo = FreeTrialRegistrationRepository(prisma_client)
    try:
        sent = await send_email(
            receiver_email=email,
            subject="Seu acesso de teste ao Jarbas AI",
            html=_welcome_email_html(name=name, instagram=instagram, api_key=api_key, logo_src=logo_src),
            inline_images=inline_images,
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
    status_code=200,
)
async def register_free_trial(request_data: FreeTrialRegistrationRequest, request: Request) -> Response:
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
                "key_encrypted": _encrypt_key(plaintext_key),
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
        api_key=plaintext_key,
    )

    return Response(status_code=200)


def _hash_key(plaintext_key: str) -> str:
    from litellm.proxy.utils import hash_token

    return hash_token(plaintext_key)


async def _rollback_key(prisma_client: object, plaintext_key: str) -> None:
    try:
        await prisma_client.db.litellm_verificationtoken.delete(where={"token": _hash_key(plaintext_key)})  # type: ignore[attr-defined]
    except Exception:
        verbose_proxy_logger.warning("Failed to roll back free trial key after registration error")
