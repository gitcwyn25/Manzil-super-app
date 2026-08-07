# Migrations gated on M1 (platform hygiene)

**Nothing in this directory has been applied, and nothing here may be applied
until the M1 drift-reconciliation migration lands.**

This is not the Prisma migrations directory. `prisma migrate deploy` reads
`packages/db/migrations/` only, so a file placed here cannot reach a database
by accident — which is the point.

## Why a migration would be held back

`schema.prisma` and `packages/db/migrations/` already disagree: several table
and column families (`WaitlistSignup`, `AdminNotification`, the Stripe
subscription columns, admin credentials) exist in the schema and in no
migration, because production was `prisma db push`-ed. A fresh environment
therefore cannot be built from migrations alone, and the `Check for
schema/migration drift` step in `.github/workflows/db-migrate.yml` fails on
any `packages/db/**` change.

M1 fixes that with a `prisma migrate diff` consolidation migration and
restores `migrate deploy` as the single truth. Adding a new migration to
`packages/db/migrations/` before then would stack an ordinary change on top of
a history that cannot be replayed — deepening the exact problem M1 exists to
solve, and making the consolidation harder to author.

## Pending: `20260807000000_graph_relationship_GATED_ON_M1`

Creates the `GraphRelationship` table for Epic 04's knowledge graph: the
explicit and inferred edges that no projection over existing rows can derive.
The graph is fully functional without it — everything the relational schema
proves is projected on read, at confidence 1.0 — so this is additive
capability, never a launch blocker.

## Pending: `20260808000000_memory_object_GATED_ON_M1`

Creates the `MemoryObject` table for Epic 05's memory engine: the six memory
tiers as one generic, tier-discriminated row, unique on `(tier, subjectId)`.
The engine is fully functional without it — memory is kept in process, and
`MemoryEngineService.persistence` reports `{ backend: "memory", durable:
false }` so nothing pretends otherwise — but memory does not survive a
restart until this lands.

## Pending: `20260809000000_intelligence_summary_GATED_ON_M1`

Creates the `IntelligenceSummary` table for Epic 06's marketplace
intelligence: every stored summary and derived feature vector as one generic,
kind-discriminated row, unique on `(kind, subjectId)`. Doc 22 requires
summaries to be *stored* and refreshed by jobs rather than regenerated per
query, so this is what makes that promise durable. The layer is fully
functional without it — summaries are kept in process, and
`MarketplaceIntelligenceService.persistence` reports
`{ backend: "memory", durable: false }` so nothing pretends otherwise — but a
restart costs a re-summarization pass until this lands.

## Applying them, after M1

All three pending migrations follow the same five steps; do them one migration
at a time.

1. Land the M1 consolidation migration; confirm the drift check passes.
2. `git mv packages/db/migrations-gated-m1/<migration> packages/db/migrations/`
   (rename off the `_GATED_ON_M1` suffix if you prefer; nothing reads it).
3. `npm run db:migrate:deploy` — verify the table, unique indexes and CHECK
   constraints exist.
4. `npm run db:generate` so `@prisma/client` gains the delegate
   (`graphRelationship` / `memoryObject` / `intelligenceSummary`).
5. Set the opt-in env var on the API service:
   `KNOWLEDGE_GRAPH_EDGE_STORE=prisma` for the graph,
   `MEMORY_ENGINE_STORE=prisma` for memory,
   `MARKETPLACE_INTELLIGENCE_STORE=prisma` for summaries. **Both** signals are
   required in each case: the delegate appears at every image build once the
   model is in `schema.prisma`, so the env var is what says a human actually
   applied the table. Until it is set, the graph stays in projection-only mode
   (`InferRelationshipsJob` reports `tool_unavailable` instead of writing), and
   memory and summaries stay in process.

No API code changes at any step — see
`apps/api/src/modules/intelligence/knowledge-graph/KNOWLEDGE-GRAPH.md`,
`apps/api/src/modules/intelligence/memory-engine/MEMORY-ENGINE.md` and
`apps/api/src/modules/intelligence/marketplace-intelligence/MARKETPLACE-INTELLIGENCE.md`.
