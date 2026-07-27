"""
Admin endpoints for configuring the proxy's email (SMTP) integration.

All routes are proxy-admin only. The stored SMTP password is encrypted at rest
and never returned; reads expose only whether a password is set. MailJet is
configured through its SMTP relay (host in-v3.mailjet.com, API key/secret as
username/password), so it uses the generic SMTP path.
"""

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr

from litellm._logging import verbose_proxy_logger
from litellm.proxy._types import LitellmUserRoles, UserAPIKeyAuth
from litellm.proxy.auth.user_api_key_auth import user_api_key_auth
from litellm.proxy.common_utils.email_settings import (
    resolve_email_config,
    save_email_settings,
)

router = APIRouter()


class EmailSettingsResponse(BaseModel):
    smtp_host: Optional[str] = None
    smtp_port: int = 587
    smtp_username: Optional[str] = None
    smtp_sender_email: Optional[str] = None
    smtp_tls: bool = True
    email_provider: str = "smtp-generic"
    smtp_password_set: bool = False


class EmailSettingsUpdateRequest(BaseModel):
    smtp_host: Optional[str] = None
    smtp_port: Optional[int] = None
    smtp_username: Optional[str] = None
    smtp_password: Optional[str] = None
    smtp_sender_email: Optional[str] = None
    smtp_tls: bool = True
    email_provider: str = "smtp-generic"


class TestEmailRequest(BaseModel):
    test_email: EmailStr


def _require_admin(user_api_key_dict: UserAPIKeyAuth) -> None:
    if user_api_key_dict.user_role != LitellmUserRoles.PROXY_ADMIN:
        raise HTTPException(status_code=403, detail="Only proxy admins can manage email settings")


@router.get("/email/settings", tags=["email"], response_model=EmailSettingsResponse)
async def get_email_settings(
    user_api_key_dict: UserAPIKeyAuth = Depends(user_api_key_auth),
) -> EmailSettingsResponse:
    from litellm.proxy.proxy_server import prisma_client

    _require_admin(user_api_key_dict)
    config = await resolve_email_config(prisma_client)
    return EmailSettingsResponse(
        smtp_host=config.smtp_host,
        smtp_port=config.smtp_port,
        smtp_username=config.smtp_username,
        smtp_sender_email=config.sender_email,
        smtp_tls=config.use_tls,
        email_provider=config.email_provider,
        smtp_password_set=bool(config.smtp_password),
    )


@router.post("/email/settings", tags=["email"], response_model=EmailSettingsResponse)
async def update_email_settings(
    request_data: EmailSettingsUpdateRequest,
    user_api_key_dict: UserAPIKeyAuth = Depends(user_api_key_auth),
) -> EmailSettingsResponse:
    from litellm.proxy.proxy_server import prisma_client

    _require_admin(user_api_key_dict)
    if prisma_client is None:
        raise HTTPException(status_code=503, detail="No database connected")

    await save_email_settings(
        prisma_client,
        smtp_host=request_data.smtp_host,
        smtp_port=request_data.smtp_port,
        smtp_username=request_data.smtp_username,
        smtp_password=request_data.smtp_password,
        sender_email=request_data.smtp_sender_email,
        use_tls=request_data.smtp_tls,
        email_provider=request_data.email_provider,
    )
    return await get_email_settings(user_api_key_dict=user_api_key_dict)


@router.post("/email/settings/test", tags=["email"])
async def send_test_email(
    request_data: TestEmailRequest,
    user_api_key_dict: UserAPIKeyAuth = Depends(user_api_key_auth),
) -> dict:
    from litellm.proxy.utils import send_email

    _require_admin(user_api_key_dict)
    try:
        sent = await send_email(
            receiver_email=str(request_data.test_email),
            subject="LiteLLM test email",
            html="<p>This is a test email from your LiteLLM proxy email configuration.</p>",
        )
    except Exception as e:
        verbose_proxy_logger.warning("Test email failed: %s", e)
        raise HTTPException(status_code=400, detail=f"Failed to send test email: {e}")

    if not sent:
        raise HTTPException(
            status_code=400,
            detail="Failed to send test email. Check the SMTP settings and the proxy logs.",
        )
    return {"status": "success", "message": f"Test email sent to {request_data.test_email}"}
