# Epic 18 — API Idempotency & Mutation Integrity (server side)

> **QUEUED — dispatches when an `apps/api` agent slot frees.** Pairs with Epic 17's client-side mutation system. Numbered 18; Autonomous Marketplace moves to 19. See [EPIC-LADDER.md](EPIC-LADDER.md).

## Why this is not theoretical

The live catalogue contains a duplicate business listing — the same business twice, with **conflicting 5.0 and 4.0 ratings** — flagged by an external product review as a data-integrity problem. The most likely cause is a double-clicked create form: the UI gave no feedback, the user clicked again, and the endpoint happily created a second record.

**Deleting the duplicate without fixing the endpoint fixes the symptom and leaves the cause.** Epic 17 stops the second click at the client; Epic 18 makes the second *request* harmless regardless of where it comes from — double-click, slow network, browser retry, mobile reconnect, or an impatient client library.

## Scope

1. **Idempotency middleware/interceptor for all POST (create) endpoints.** Client sends a UUID via the header Epic 17 specifies (expected: `Idempotency-Key` — read `docs/design/PRODUCT-EXPERIENCE-SYSTEM.md` § "Server-side contract required" for the authoritative name and semantics before implementing).
2. **Replay returns the original result**, not a new resource and not an error. Same status code, same body.
3. **Storage** with a TTL (24h is the industry norm). Must record: key, route, a hash of the request body, the response status + body, and the created-at time. **A key replayed against a *different* body is a client bug and must fail loudly (409), not silently return the wrong resource.**
4. **Concurrency:** two identical requests racing must not both create. Use a unique constraint on the key and let the database arbitrate — do not rely on read-then-write.
5. **Scope keys per authenticated principal** so one user's key cannot collide with or read another's result.
6. **Follow the M1 gating discipline** used by Epics 04-06: if this needs a table, write the migration into `packages/db/migrations-gated-m1/` with double-signal activation, and provide a working in-memory/cache-backed store until M1 reconciliation runs.

## Also in scope

- **Audit the existing duplicate**: identify the duplicate listing and report exactly how it was created (timestamps, identical fields) as evidence for the root cause. Report — the data fix itself is an operator action.
- **Unique constraints where the domain implies them** (e.g. a business name + district + owner should probably not repeat). Report candidates; do not add constraints that could reject legitimate records without the owner's decision.

## Out of scope

Deleting or merging the existing duplicate records (operator action, production data). Changing recommendation, ranking, or grounding logic.

## Gates

`cd apps/api && npx tsc --noEmit` → `npm run build` → `npm test`, sequentially. Do not regress the suite (54 suites / 616 tests at Epic 06).

## Success

A create endpoint called twice with the same idempotency key produces exactly one resource and two identical responses — proven by a test that issues concurrent duplicate requests.
