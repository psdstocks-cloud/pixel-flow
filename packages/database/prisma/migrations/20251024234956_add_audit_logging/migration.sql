-- CreateEnum
CREATE TYPE "AuditEventType" AS ENUM ('AUTHENTICATION', 'AUTHORIZATION', 'DATA_ACCESS', 'DATA_MODIFICATION', 'DATA_DELETION', 'DATA_EXPORT', 'PAYMENT', 'SYSTEM_CONFIG', 'SESSION_MANAGEMENT', 'CONSENT_MANAGEMENT', 'SECURITY_EVENT');

-- CreateEnum
CREATE TYPE "AuditEventCategory" AS ENUM ('USER_MANAGEMENT', 'DATA_PROCESSING', 'FINANCIAL', 'SECURITY', 'COMPLIANCE', 'SYSTEM', 'API');

-- CreateEnum
CREATE TYPE "AuditSeverity" AS ENUM ('INFO', 'WARNING', 'ERROR', 'CRITICAL');

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "eventType" "AuditEventType" NOT NULL,
    "eventCategory" "AuditEventCategory" NOT NULL,
    "severity" "AuditSeverity" NOT NULL DEFAULT 'INFO',
    "userId" UUID,
    "userEmail" VARCHAR(255),
    "actor_type" TEXT NOT NULL DEFAULT 'user',
    "ip_address" VARCHAR(45) NOT NULL,
    "user_agent" TEXT,
    "session_id" VARCHAR(255),
    "action" VARCHAR(100) NOT NULL,
    "resource" VARCHAR(255),
    "resource_id" VARCHAR(255),
    "old_value" JSONB,
    "new_value" JSONB,
    "status" TEXT NOT NULL DEFAULT 'success',
    "error_message" TEXT,
    "metadata" JSONB,
    "is_pii" BOOLEAN NOT NULL DEFAULT false,
    "is_payment" BOOLEAN NOT NULL DEFAULT false,
    "requires_review" BOOLEAN NOT NULL DEFAULT false,
    "timestamp" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "audit_logs_userId_timestamp_idx" ON "audit_logs"("userId", "timestamp");

-- CreateIndex
CREATE INDEX "audit_logs_eventType_timestamp_idx" ON "audit_logs"("eventType", "timestamp");

-- CreateIndex
CREATE INDEX "audit_logs_eventCategory_timestamp_idx" ON "audit_logs"("eventCategory", "timestamp");

-- CreateIndex
CREATE INDEX "audit_logs_ip_address_timestamp_idx" ON "audit_logs"("ip_address", "timestamp");

-- CreateIndex
CREATE INDEX "audit_logs_action_timestamp_idx" ON "audit_logs"("action", "timestamp");

-- CreateIndex
CREATE INDEX "audit_logs_is_pii_idx" ON "audit_logs"("is_pii");

-- CreateIndex
CREATE INDEX "audit_logs_is_payment_idx" ON "audit_logs"("is_payment");
