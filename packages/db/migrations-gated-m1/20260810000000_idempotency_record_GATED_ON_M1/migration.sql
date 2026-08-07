-- ⚠️ GATED ON M1 — NOT APPLIED, NOT MARKED APPLIED. ⚠️
--
-- This file is deliberately OUTSIDE packages/db/migrations/, so
-- `prisma migrate deploy` cannot pick it up. Do not move it there until the
-- M1 drift-reconciliation migration has landed and the drift check in
-- .github/workflows/db-migrate.yml passes. See ../README.md for the full
-- procedure and the reasoning.
--
-- Epic 18 (API idempotency): durable storage for the outcome of a mutation,
-- keyed by the caller's `Idempotency-Key`. Until this lands the API stores
-- records in Redis (shared across replicas, TTL'd, evictable) or in process,
-- and `IdempotencyStore.durable` reports false so nothing pretends otherwise.

CREATE TABLE "IdempotencyRecord" (
    "id"             TEXT         NOT NULL,
    -- Who the key belongs to: 'user:<id>', 'admin:<id>', or 'anon:<digest>'
    -- for an unauthenticated caller. Part of the primary uniqueness, which is
    -- what stops one caller's key from reading another's response.
    "scope"          TEXT         NOT NULL,
    -- The client's key. A UUID v4 from the browser, per the PXS contract, but
    -- stored as text: a server-to-server caller with its own id scheme is not
    -- wrong, and legislating the client's format buys nothing.
    "key"            TEXT         NOT NULL,
    -- 'POST /v1/crm/register'. Recorded for audit, not for matching — a key
    -- reused on a different route is caught by the fingerprint below.
    "route"          TEXT         NOT NULL,
    -- SHA-256 of method + URL + canonicalized body. The hash and never the
    -- body: this table would otherwise hold a copy of every registration
    -- payload, contact address and campaign draft for 24h, and a fingerprint
    -- answers the only question asked of it — "is this the same request?".
    "fingerprint"    TEXT         NOT NULL,
    -- 'in_flight' while the original runs, 'completed' once recorded.
    "state"          TEXT         NOT NULL DEFAULT 'in_flight',
    -- The status and body the first caller received, replayed verbatim.
    -- Null until the request completes.
    "responseStatus" INTEGER,
    "responseBody"   JSONB,
    "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt"    TIMESTAMP(3),
    -- createdAt + 24h. A column rather than a computed expression so the
    -- prune job and the takeover-an-expired-row path can both index on it.
    "expiresAt"      TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IdempotencyRecord_pkey" PRIMARY KEY ("id")
);

-- ⭐ The whole design rests on this index.
--
-- `claim()` is an unconditional INSERT. When two duplicate requests race, one
-- INSERT succeeds and the other is rejected here — the database arbitrates,
-- and there is no window between a check and a write for the second request to
-- slip through, because there is no check. A read-then-write guard (which is
-- what `CrmRepository.registerBusiness` still uses) has exactly that window,
-- and it is the most plausible origin of the duplicate listing in the live
-- catalogue.
CREATE UNIQUE INDEX "IdempotencyRecord_scope_key_key"
    ON "IdempotencyRecord"("scope", "key");

-- The prune job asks one question: what has expired? Across every scope.
CREATE INDEX "IdempotencyRecord_expiresAt_idx" ON "IdempotencyRecord"("expiresAt");

-- The state vocabulary is closed even though the column is text.
ALTER TABLE "IdempotencyRecord"
    ADD CONSTRAINT "IdempotencyRecord_state_valid"
    CHECK ("state" IN ('in_flight', 'completed'));

-- A completed record must have something to replay. A row claiming completion
-- with no status would be replayed as a 200 with a null body — a fabricated
-- success, which is precisely what this layer must never produce.
ALTER TABLE "IdempotencyRecord"
    ADD CONSTRAINT "IdempotencyRecord_completed_has_response"
    CHECK ("state" <> 'completed' OR "responseStatus" IS NOT NULL);

-- Only a success is worth replaying. A 4xx should be re-run once the client
-- fixes the payload and a 5xx should be retryable, so neither is ever recorded
-- — the API releases the claim instead. The constraint makes that a property
-- of the data and not only of the code that writes it.
ALTER TABLE "IdempotencyRecord"
    ADD CONSTRAINT "IdempotencyRecord_response_is_success"
    CHECK ("responseStatus" IS NULL OR ("responseStatus" >= 200 AND "responseStatus" < 300));

-- A window that ends before it starts is a corrupt record, and every replay
-- decision is made by comparing "now" against expiresAt.
ALTER TABLE "IdempotencyRecord"
    ADD CONSTRAINT "IdempotencyRecord_window_ordered"
    CHECK ("expiresAt" > "createdAt");
