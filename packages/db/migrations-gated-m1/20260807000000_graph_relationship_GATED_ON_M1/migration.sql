-- ⚠️ GATED ON M1 — NOT APPLIED, NOT MARKED APPLIED. ⚠️
--
-- This file is deliberately OUTSIDE packages/db/migrations/, so
-- `prisma migrate deploy` cannot pick it up. Do not move it there until the
-- M1 drift-reconciliation migration has landed and the drift check in
-- .github/workflows/db-migrate.yml passes. See ../README.md for the full
-- procedure and the reasoning.
--
-- Epic 04 (Knowledge Graph): storage for edges no projection can derive —
-- explicit declarations and inferred relationships. Everything the relational
-- schema already proves is projected on read and never stored here.

CREATE TABLE "GraphRelationship" (
    "id"         TEXT             NOT NULL,
    -- Registry kind name; text rather than an enum because the edge
    -- vocabulary is an open registry in TypeScript and an enum would make
    -- every new kind a migration.
    "kind"       TEXT             NOT NULL,
    -- Prefixed graph ids ("business:clx…"), not raw row ids: the graph names
    -- nodes no table owns, such as a neighborhood (a city/district pair).
    "fromId"     TEXT             NOT NULL,
    "toId"       TEXT             NOT NULL,
    "attributes" JSONB            NOT NULL DEFAULT '{}',
    -- 'explicit' (declared by a human) | 'inferred' (derived by a job).
    "origin"     TEXT             NOT NULL,
    -- KnowledgeSource: merchant_input, platform_inference, visit, review, …
    "source"     TEXT             NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "createdAt"  TIMESTAMP(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"  TIMESTAMP(3)     NOT NULL,

    CONSTRAINT "GraphRelationship_pkey" PRIMARY KEY ("id")
);

-- Confidence is a probability. The contract says so, the validators enforce
-- it on the way in, and the database refuses anything else — three layers,
-- because an out-of-range confidence silently corrupts every ranking that
-- reads it.
ALTER TABLE "GraphRelationship"
    ADD CONSTRAINT "GraphRelationship_confidence_range"
    CHECK ("confidence" >= 0 AND "confidence" <= 1);

-- Origin is a closed set even though the column is text.
ALTER TABLE "GraphRelationship"
    ADD CONSTRAINT "GraphRelationship_origin_valid"
    CHECK ("origin" IN ('explicit', 'inferred'));

-- An edge is one statement about the world: the same (kind, from, to) written
-- twice is one row with a newer updatedAt. This is what makes
-- InferRelationshipsJob idempotent in Postgres and not only in memory.
CREATE UNIQUE INDEX "GraphRelationship_kind_fromId_toId_key"
    ON "GraphRelationship"("kind", "fromId", "toId");

-- Reads are always "edges incident to these nodes", from either end.
CREATE INDEX "GraphRelationship_fromId_idx" ON "GraphRelationship"("fromId");
CREATE INDEX "GraphRelationship_toId_idx" ON "GraphRelationship"("toId");
CREATE INDEX "GraphRelationship_kind_idx" ON "GraphRelationship"("kind");
