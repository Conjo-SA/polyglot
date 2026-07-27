-- CreateTable
CREATE TABLE IF NOT EXISTS "LiteLLM_FreeTrialRegistration" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone_normalized" TEXT NOT NULL,
    "name_normalized" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "instagram" TEXT NOT NULL,
    "key_token" TEXT NOT NULL,
    "email_sent" BOOLEAN NOT NULL DEFAULT false,
    "email_attempts" INTEGER NOT NULL DEFAULT 0,
    "email_last_error" TEXT,
    "email_last_attempt_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LiteLLM_FreeTrialRegistration_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "LiteLLM_FreeTrialRegistration_email_key" ON "LiteLLM_FreeTrialRegistration"("email");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "LiteLLM_FreeTrialRegistration_phone_normalized_key" ON "LiteLLM_FreeTrialRegistration"("phone_normalized");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "LiteLLM_FreeTrialRegistration_name_normalized_key" ON "LiteLLM_FreeTrialRegistration"("name_normalized");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "LiteLLM_FreeTrialRegistration_email_sent_idx" ON "LiteLLM_FreeTrialRegistration"("email_sent");
