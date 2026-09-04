-- ACTIVATION CONTRACT: GATED ON M1 — NOT APPLIED, NOT MARKED APPLIED.
--
-- This file intentionally lives outside packages/db/migrations/. The current
-- database has schema/migration drift, so Prisma migrate deploy must not pick
-- this up until the M1 reconciliation gate is complete.
--
-- Public WaitlistSignup rows are preserved; the added fields are an operator
-- workflow. Company connection is a CRM link, not an ownership approval.

CREATE TYPE "WaitlistReviewStatus" AS ENUM ('new', 'contacted', 'qualified', 'accepted', 'rejected', 'duplicate', 'connected');
CREATE TYPE "OutboxChannel" AS ENUM ('email');
CREATE TYPE "OutboxStatus" AS ENUM ('pending', 'processing', 'sent', 'failed', 'canceled');
CREATE TYPE "AdminSignatureStatus" AS ENUM ('active', 'revoked');

ALTER TABLE "WaitlistSignup"
    ADD COLUMN "status" "WaitlistReviewStatus" NOT NULL DEFAULT 'new',
    ADD COLUMN "assignedAdminId" TEXT,
    ADD COLUMN "reviewedByAdminId" TEXT,
    ADD COLUMN "decisionReason" TEXT,
    ADD COLUMN "contactedAt" TIMESTAMP(3),
    ADD COLUMN "reviewedAt" TIMESTAMP(3),
    ADD COLUMN "connectedBusinessId" TEXT,
    ADD COLUMN "connectedAt" TIMESTAMP(3),
    ADD COLUMN "connectedByAdminId" TEXT,
    ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- @updatedAt is maintained by Prisma on writes; the default above is only for
-- existing rows during the additive migration.
ALTER TABLE "WaitlistSignup" ALTER COLUMN "updatedAt" DROP DEFAULT;

CREATE TABLE "AdminSignature" (
    "id" TEXT NOT NULL,
    "adminUserId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "displayName" TEXT NOT NULL,
    "title" TEXT,
    "status" "AdminSignatureStatus" NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "AdminSignature_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "OutboxMessage" (
    "id" TEXT NOT NULL,
    "channel" "OutboxChannel" NOT NULL,
    "status" "OutboxStatus" NOT NULL DEFAULT 'pending',
    "kind" TEXT NOT NULL,
    "recipient" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "payload" JSONB,
    "idempotencyKey" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "availableAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lockedAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "lastError" TEXT,
    "waitlistSignupId" TEXT,
    "createdByAdminId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OutboxMessage_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "OperationalSignature" (
    "id" TEXT NOT NULL,
    "adminUserId" TEXT NOT NULL,
    "adminSignatureId" TEXT NOT NULL,
    "auditLogId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT,
    "payloadHash" TEXT NOT NULL,
    "signature" TEXT NOT NULL,
    "algorithm" TEXT NOT NULL DEFAULT 'hmac-sha256',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OperationalSignature_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AdminSignature_adminUserId_version_key"
    ON "AdminSignature"("adminUserId", "version");
CREATE INDEX "AdminSignature_adminUserId_status_idx"
    ON "AdminSignature"("adminUserId", "status");
CREATE UNIQUE INDEX "AdminSignature_one_active_per_admin_key"
    ON "AdminSignature"("adminUserId") WHERE "status" = 'active';

CREATE UNIQUE INDEX "OutboxMessage_idempotencyKey_key"
    ON "OutboxMessage"("idempotencyKey");
CREATE INDEX "OutboxMessage_status_availableAt_idx"
    ON "OutboxMessage"("status", "availableAt");
CREATE INDEX "OutboxMessage_waitlistSignupId_createdAt_idx"
    ON "OutboxMessage"("waitlistSignupId", "createdAt");
CREATE INDEX "OutboxMessage_createdByAdminId_createdAt_idx"
    ON "OutboxMessage"("createdByAdminId", "createdAt");

CREATE UNIQUE INDEX "OperationalSignature_auditLogId_key"
    ON "OperationalSignature"("auditLogId");
CREATE INDEX "OperationalSignature_adminUserId_createdAt_idx"
    ON "OperationalSignature"("adminUserId", "createdAt");
CREATE INDEX "OperationalSignature_targetType_targetId_createdAt_idx"
    ON "OperationalSignature"("targetType", "targetId", "createdAt");

CREATE INDEX "WaitlistSignup_status_createdAt_idx"
    ON "WaitlistSignup"("status", "createdAt");
CREATE INDEX "WaitlistSignup_assignedAdminId_status_idx"
    ON "WaitlistSignup"("assignedAdminId", "status");
CREATE INDEX "WaitlistSignup_connectedBusinessId_idx"
    ON "WaitlistSignup"("connectedBusinessId");

ALTER TABLE "WaitlistSignup"
    ADD CONSTRAINT "WaitlistSignup_assignedAdminId_fkey"
    FOREIGN KEY ("assignedAdminId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    ADD CONSTRAINT "WaitlistSignup_reviewedByAdminId_fkey"
    FOREIGN KEY ("reviewedByAdminId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    ADD CONSTRAINT "WaitlistSignup_connectedBusinessId_fkey"
    FOREIGN KEY ("connectedBusinessId") REFERENCES "Business"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    ADD CONSTRAINT "WaitlistSignup_connectedByAdminId_fkey"
    FOREIGN KEY ("connectedByAdminId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AdminSignature"
    ADD CONSTRAINT "AdminSignature_adminUserId_fkey"
    FOREIGN KEY ("adminUserId") REFERENCES "AdminUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "OutboxMessage"
    ADD CONSTRAINT "OutboxMessage_waitlistSignupId_fkey"
    FOREIGN KEY ("waitlistSignupId") REFERENCES "WaitlistSignup"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    ADD CONSTRAINT "OutboxMessage_createdByAdminId_fkey"
    FOREIGN KEY ("createdByAdminId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "OperationalSignature"
    ADD CONSTRAINT "OperationalSignature_adminUserId_fkey"
    FOREIGN KEY ("adminUserId") REFERENCES "AdminUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    ADD CONSTRAINT "OperationalSignature_adminSignatureId_fkey"
    FOREIGN KEY ("adminSignatureId") REFERENCES "AdminSignature"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    ADD CONSTRAINT "OperationalSignature_auditLogId_fkey"
    FOREIGN KEY ("auditLogId") REFERENCES "AuditLog"("id") ON DELETE CASCADE ON UPDATE CASCADE;
