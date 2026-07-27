"""
Email (SMTP) settings that can be configured from the Admin UI and persisted
in LiteLLM_Config, overriding the SMTP_* env vars.

The SMTP password is encrypted at rest with the proxy salt key and is never
returned to the UI. `resolve_email_config` merges stored settings over env vars
(stored wins per field) and is what `send_email` uses at send time. MailJet is
supported through its SMTP relay, so it reuses this same path with no extra
provider code.
"""

import os
from dataclasses import dataclass
from typing import Any, Optional

EMAIL_SETTINGS_PARAM = "email_settings"
_DEFAULT_SMTP_PORT = 587


@dataclass(frozen=True, slots=True)
class ResolvedEmailConfig:
    smtp_host: Optional[str]
    smtp_port: int
    smtp_username: Optional[str]
    smtp_password: Optional[str]
    sender_email: Optional[str]
    use_tls: bool
    email_provider: str


def _to_bool(value: Any, default: bool = True) -> bool:
    if value is None:
        return default
    if isinstance(value, bool):
        return value
    return str(value).strip().lower() in ("true", "1", "yes", "on")


def _to_port(value: Any) -> int:
    try:
        return int(value)
    except (TypeError, ValueError):
        return _DEFAULT_SMTP_PORT


async def get_stored_email_settings(prisma_client: Any) -> Optional[dict]:
    """
    Read persisted email settings, decrypting the SMTP password.
    Returns None when nothing has been saved.
    """
    if prisma_client is None:
        return None

    from litellm.proxy.common_utils.encrypt_decrypt_utils import decrypt_value_helper
    from litellm.repositories.config_repository import ConfigRepository

    param = await ConfigRepository(prisma_client).get_param(EMAIL_SETTINGS_PARAM)
    if param is None or not isinstance(param.param_value, dict):
        return None

    settings = dict(param.param_value)
    encrypted_password = settings.get("smtp_password")
    if encrypted_password:
        settings["smtp_password"] = decrypt_value_helper(
            encrypted_password,
            key="smtp_password",
            exception_type="debug",
            return_original_value=False,
        )
    return settings


async def save_email_settings(
    prisma_client: Any,
    *,
    smtp_host: Optional[str],
    smtp_port: Optional[int],
    smtp_username: Optional[str],
    smtp_password: Optional[str],
    sender_email: Optional[str],
    use_tls: bool,
    email_provider: str,
) -> None:
    """
    Persist email settings. The password is encrypted at rest. An empty
    password keeps the previously stored one (so the UI never has to resend it).
    """
    from litellm.proxy.common_utils.encrypt_decrypt_utils import encrypt_value_helper
    from litellm.proxy.utils import invalidate_config_param
    from litellm.repositories.config_repository import ConfigRepository

    existing = await get_stored_email_settings(prisma_client) or {}
    password = smtp_password if smtp_password else existing.get("smtp_password")

    stored = {
        "smtp_host": smtp_host,
        "smtp_port": _to_port(smtp_port),
        "smtp_username": smtp_username,
        "smtp_password": encrypt_value_helper(password) if password else None,
        "smtp_sender_email": sender_email,
        "smtp_tls": use_tls,
        "email_provider": email_provider,
    }
    await ConfigRepository(prisma_client).set_param(EMAIL_SETTINGS_PARAM, stored)
    await invalidate_config_param(EMAIL_SETTINGS_PARAM)


async def resolve_email_config(prisma_client: Any) -> ResolvedEmailConfig:
    """Merge stored settings over env vars (stored wins per field)."""
    stored = await get_stored_email_settings(prisma_client) or {}

    def pick(stored_key: str, env_key: str, default: Optional[str] = None) -> Optional[str]:
        value = stored.get(stored_key)
        if value not in (None, ""):
            return value
        return os.getenv(env_key, default)

    tls_source = stored["smtp_tls"] if "smtp_tls" in stored else os.getenv("SMTP_TLS")

    return ResolvedEmailConfig(
        smtp_host=pick("smtp_host", "SMTP_HOST"),
        smtp_port=_to_port(pick("smtp_port", "SMTP_PORT", str(_DEFAULT_SMTP_PORT))),
        smtp_username=pick("smtp_username", "SMTP_USERNAME"),
        smtp_password=stored.get("smtp_password") or os.getenv("SMTP_PASSWORD"),
        sender_email=pick("smtp_sender_email", "SMTP_SENDER_EMAIL"),
        use_tls=_to_bool(tls_source, default=True),
        email_provider=str(stored.get("email_provider") or "smtp-generic"),
    )
