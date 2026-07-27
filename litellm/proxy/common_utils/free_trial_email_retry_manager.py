"""
Background retry for free trial welcome emails.

When the welcome email fails at registration time, the row is left with
email_sent=false and its attempt state recorded. This manager, run on a
scheduler interval, reprocesses those rows with exponential backoff up to a
cap. In multi-pod deployments a PodLockManager ensures a single pod sends.
"""

from datetime import datetime, timedelta, timezone
from typing import Any, Optional

from litellm._logging import verbose_proxy_logger

FREE_TRIAL_EMAIL_RETRY_JOB_NAME = "free_trial_email_retry_job"
FREE_TRIAL_EMAIL_MAX_ATTEMPTS = 5
FREE_TRIAL_EMAIL_BACKOFF_BASE_SECONDS = 60
FREE_TRIAL_EMAIL_LOCK_TTL_SECONDS = 300


def _backoff_seconds(attempts: int) -> int:
    return FREE_TRIAL_EMAIL_BACKOFF_BASE_SECONDS * (2**attempts)


def _is_due(last_attempt_at: Optional[datetime], attempts: int, now: datetime) -> bool:
    if last_attempt_at is None:
        return True
    if last_attempt_at.tzinfo is None:
        last_attempt_at = last_attempt_at.replace(tzinfo=timezone.utc)
    return now - last_attempt_at >= timedelta(seconds=_backoff_seconds(attempts))


class FreeTrialEmailRetryManager:
    def __init__(self, prisma_client: Any, pod_lock_manager: Optional[Any] = None):
        self.prisma_client = prisma_client
        self.pod_lock_manager = pod_lock_manager

    async def process_pending(self) -> None:
        lock_acquired = False
        try:
            if self.pod_lock_manager and self.pod_lock_manager.redis_cache:
                lock_acquired = (
                    await self.pod_lock_manager.acquire_lock(
                        cronjob_id=FREE_TRIAL_EMAIL_RETRY_JOB_NAME,
                        ttl=FREE_TRIAL_EMAIL_LOCK_TTL_SECONDS,
                    )
                    or False
                )
                if not lock_acquired:
                    return

            await self._reprocess_due_rows()
        except Exception as e:
            verbose_proxy_logger.error("Free trial email retry failed: %s", e)
        finally:
            if lock_acquired and self.pod_lock_manager and self.pod_lock_manager.redis_cache:
                await self.pod_lock_manager.release_lock(cronjob_id=FREE_TRIAL_EMAIL_RETRY_JOB_NAME)

    async def _reprocess_due_rows(self) -> None:
        from litellm.repositories.table_repositories import FreeTrialRegistrationRepository

        repo = FreeTrialRegistrationRepository(self.prisma_client)
        pending = await repo.table.find_many(
            where={
                "email_sent": False,
                "email_attempts": {"lt": FREE_TRIAL_EMAIL_MAX_ATTEMPTS},
            }
        )

        now = datetime.now(timezone.utc)
        for row in pending:
            if not _is_due(getattr(row, "email_last_attempt_at", None), row.email_attempts, now):
                continue
            await self._retry_row(repo, row)

    async def _retry_row(self, repo: Any, row: Any) -> None:
        from litellm.proxy.management_endpoints.free_trial_endpoints import (
            _decrypt_key,
            _resolve_logo,
            _welcome_email_html,
        )
        from litellm.proxy.utils import send_email

        api_key = _decrypt_key(getattr(row, "key_encrypted", None))
        logo_src, inline_images = _resolve_logo()
        try:
            sent = await send_email(
                receiver_email=row.email,
                subject="Seu acesso de teste ao Jarbas AI",
                html=_welcome_email_html(name=row.name, instagram=row.instagram, api_key=api_key, logo_src=logo_src),
                inline_images=inline_images,
            )
            error = None if sent else "email delivery failed"
        except Exception as e:
            sent = False
            error = str(e)

        if sent:
            await repo.table.update(where={"id": row.id}, data={"email_sent": True})
            verbose_proxy_logger.info("Free trial welcome email retried successfully for %s", row.email)
            return

        await repo.table.update(
            where={"id": row.id},
            data={
                "email_attempts": {"increment": 1},
                "email_last_error": (error or "email delivery failed")[:1000],
                "email_last_attempt_at": datetime.now(timezone.utc),
            },
        )
