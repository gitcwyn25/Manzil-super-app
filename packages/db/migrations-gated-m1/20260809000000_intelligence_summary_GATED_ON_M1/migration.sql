-- ⚠️ GATED ON M1 — NOT APPLIED, NOT MARKED APPLIED. ⚠️
--
-- This file is deliberately OUTSIDE packages/db/migrations/, so
-- `prisma migrate deploy` cannot pick it up. Do not move it there until the
-- M1 drift-reconciliation migration has landed and the drift check in
-- .github/workflows/db-migrate.yml passes. See ../README.md for the full
-- procedure and the reasoning.
--
-- Epic 06 (Marketplace Intelligence): durable storage for stored summaries and
-- derived feature vectors. One generic kind-discriminated table, because the
-- kind vocabulary is a TypeScript union and a table per summarizer would make
-- every new summarizer a migration. Until this lands the layer keeps summaries
-- in process — fully functional, and honest about not surviving a restart.

CREATE TABLE "IntelligenceSummary" (
    "id"          TEXT             NOT NULL,
    -- SummaryKind name; text rather than an enum for the reason above.
    "kind"        TEXT             NOT NULL,
    -- What the summary is about. A business id, an account id, a neighborhood
    -- id, a normalized service id, or a composite subject: '<metric>@<entity>'
    -- for trends and '<category>@<area>' for demand.
    "subjectId"   TEXT             NOT NULL,
    -- Derived from (kind, subjectId), so a recommendation's recorded
    -- provenance (doc 23 §9) still resolves after the nightly job has run.
    "summaryId"   TEXT             NOT NULL,
    -- KnowledgeSource: review, booking, visit, merchant_input, campaign,
    -- platform_inference.
    "source"      TEXT             NOT NULL,
    "confidence"  DOUBLE PRECISION NOT NULL,
    -- Observations behind the payload. A column rather than a JSON field
    -- because ranking weighs it and a query has to be able to filter on it.
    "sampleSize"  INTEGER          NOT NULL DEFAULT 0,
    -- Observation window, where the summary has one.
    "windowStart" TIMESTAMP(3),
    "windowEnd"   TIMESTAMP(3),
    -- The structured summary or feature vector. Never prose, never chat.
    "payload"     JSONB            NOT NULL DEFAULT '{}',
    -- When the platform last looked; freshness is measured against this.
    "computedAt"  TIMESTAMP(3)     NOT NULL,
    "createdAt"   TIMESTAMP(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3)     NOT NULL,

    CONSTRAINT "IntelligenceSummary_pkey" PRIMARY KEY ("id")
);

-- Confidence is a probability. The contract says so, the repository enforces
-- it on the way in and on the way out, and the database refuses anything else
-- — three layers, because an out-of-range confidence silently corrupts every
-- ranking that reads it.
ALTER TABLE "IntelligenceSummary"
    ADD CONSTRAINT "IntelligenceSummary_confidence_range"
    CHECK ("confidence" >= 0 AND "confidence" <= 1);

-- A sample size is a count of rows that existed. A negative one would mean the
-- evidence record itself is corrupt, and the whole honesty design of this layer
-- rests on that number being true.
ALTER TABLE "IntelligenceSummary"
    ADD CONSTRAINT "IntelligenceSummary_sample_size_nonnegative"
    CHECK ("sampleSize" >= 0);

-- The kind vocabulary is closed even though the column is text.
ALTER TABLE "IntelligenceSummary"
    ADD CONSTRAINT "IntelligenceSummary_kind_valid"
    CHECK ("kind" IN (
        'business',
        'customer',
        'neighborhood',
        'service',
        'trend',
        'campaign',
        'workspace',
        'demand',
        'demand_prediction',
        'business_features',
        'customer_features',
        'neighborhood_features'
    ));

-- A window is half-open [start, end) or absent entirely; one bound without the
-- other describes nothing.
ALTER TABLE "IntelligenceSummary"
    ADD CONSTRAINT "IntelligenceSummary_window_complete"
    CHECK (
        ("windowStart" IS NULL AND "windowEnd" IS NULL)
        OR ("windowStart" IS NOT NULL AND "windowEnd" IS NOT NULL AND "windowStart" < "windowEnd")
    );

-- One summary per (kind, subject): running a summarizer twice is one row with
-- a newer computedAt. This is what makes SummarizeBusinessJob idempotent in
-- Postgres and not only in memory.
CREATE UNIQUE INDEX "IntelligenceSummary_kind_subjectId_key"
    ON "IntelligenceSummary"("kind", "subjectId");

-- The derived id is unique for the same reason, and is what a stored
-- recommendation trace refers to.
CREATE UNIQUE INDEX "IntelligenceSummary_summaryId_key"
    ON "IntelligenceSummary"("summaryId");

-- Reading everything known about one subject across kinds.
CREATE INDEX "IntelligenceSummary_subjectId_idx" ON "IntelligenceSummary"("subjectId");

-- The refresh queue asks exactly one question — "what of this kind is oldest?"
-- — so the index is on the pair, in that order.
CREATE INDEX "IntelligenceSummary_kind_computedAt_idx"
    ON "IntelligenceSummary"("kind", "computedAt");
