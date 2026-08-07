-- ⚠️ GATED ON M1 — NOT APPLIED, NOT MARKED APPLIED. ⚠️
--
-- This file is deliberately OUTSIDE packages/db/migrations/, so
-- `prisma migrate deploy` cannot pick it up. Do not move it there until the
-- M1 drift-reconciliation migration has landed and the drift check in
-- .github/workflows/db-migrate.yml passes. See ../README.md for the full
-- procedure and the reasoning.
--
-- Epic 05 (Memory Engine): durable storage for the six memory tiers. One
-- generic tier-discriminated table, because the tier vocabulary is a
-- TypeScript union and a table per tier would make every new tier a
-- migration. Until this lands the engine keeps memory in process — fully
-- functional, and honest about not surviving a restart.

CREATE TABLE "MemoryObject" (
    "id"                TEXT             NOT NULL,
    -- MemoryTier name; text rather than an enum because the tier vocabulary
    -- lives in TypeScript and an enum would make every new tier a migration.
    "tier"              TEXT             NOT NULL,
    -- Who the memory is about: a customer (tiers 1-3, 5), a workspace
    -- (tier 4), or the market itself (tier 6, subject 'marketplace').
    "subjectId"         TEXT             NOT NULL,
    -- Derived from (tier, subjectId), so a recommendation's recorded
    -- `memoryIds consulted` (doc 23 §9) still resolve after memory changes.
    "memoryId"          TEXT             NOT NULL,
    -- KnowledgeSource: onboarding, conversation, booking, visit, workspace…
    -- 'conversation' means facts extracted FROM a conversation, never text.
    "source"            TEXT             NOT NULL,
    "confidence"        DOUBLE PRECISION NOT NULL,
    -- The structured knowledge payload. Never a transcript: the write path
    -- refuses transcript-shaped payloads (memory.validation.ts), and the
    -- read path refuses to serve them if one ever gets in.
    "knowledge"         JSONB            NOT NULL DEFAULT '{}',
    "createdAt"         TIMESTAMP(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"         TIMESTAMP(3)     NOT NULL,
    -- NULL = does not expire on its own (preference, relationship, timeline).
    -- The volatile tiers set it.
    "expiresAt"         TIMESTAMP(3),
    -- Index into the binding tier order (0-5).
    "retrievalPriority" INTEGER          NOT NULL,

    CONSTRAINT "MemoryObject_pkey" PRIMARY KEY ("id")
);

-- Confidence is a probability. The contract says so, the validators enforce
-- it on the way in, and the database refuses anything else — three layers,
-- because an out-of-range confidence silently corrupts every ranking that
-- reads it.
ALTER TABLE "MemoryObject"
    ADD CONSTRAINT "MemoryObject_confidence_range"
    CHECK ("confidence" >= 0 AND "confidence" <= 1);

-- The tier vocabulary is closed even though the column is text.
ALTER TABLE "MemoryObject"
    ADD CONSTRAINT "MemoryObject_tier_valid"
    CHECK ("tier" IN (
        'mission_context',
        'preference_context',
        'relationship_context',
        'workspace_timeline',
        'business_context',
        'marketplace_context'
    ));

-- Retrieval priority is a position in a six-element order, not a free score.
-- A row outside the range would sort into a place the contract does not have.
ALTER TABLE "MemoryObject"
    ADD CONSTRAINT "MemoryObject_retrieval_priority_range"
    CHECK ("retrievalPriority" >= 0 AND "retrievalPriority" <= 5);

-- One memory per (tier, subject): the same memory written twice is one row
-- with a newer updatedAt. This is what makes UpdateCustomerMemoryJob
-- idempotent in Postgres and not only in memory.
CREATE UNIQUE INDEX "MemoryObject_tier_subjectId_key"
    ON "MemoryObject"("tier", "subjectId");

-- The derived id is unique for the same reason, and is what a stored
-- recommendation trace refers to.
CREATE UNIQUE INDEX "MemoryObject_memoryId_key" ON "MemoryObject"("memoryId");

-- Recall loads every tier of one subject at once.
CREATE INDEX "MemoryObject_subjectId_idx" ON "MemoryObject"("subjectId");
CREATE INDEX "MemoryObject_tier_idx" ON "MemoryObject"("tier");

-- The expiry sweep asks one question — "what has aged out?" — and only rows
-- that can expire are candidates, so the index excludes the ones that cannot.
CREATE INDEX "MemoryObject_expiresAt_idx"
    ON "MemoryObject"("expiresAt") WHERE "expiresAt" IS NOT NULL;
