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

## Applying it, after M1

1. Land the M1 consolidation migration; confirm the drift check passes.
2. `git mv packages/db/migrations-gated-m1/20260807000000_graph_relationship_GATED_ON_M1 packages/db/migrations/`
   (rename off the `_GATED_ON_M1` suffix if you prefer; nothing reads it).
3. `npm run db:migrate:deploy` — verify the table, unique index and CHECK
   constraint exist.
4. `npm run db:generate` so `@prisma/client` gains the `graphRelationship`
   delegate.
5. Set `KNOWLEDGE_GRAPH_EDGE_STORE=prisma` on the API service. **Both** signals
   are required: the delegate appears at every image build once the model is in
   `schema.prisma`, so the env var is what says a human actually applied the
   table. Until it is set, the API stays in projection-only mode and
   `InferRelationshipsJob` reports `tool_unavailable` instead of writing.

No API code changes at any step — see
`apps/api/src/modules/intelligence/knowledge-graph/KNOWLEDGE-GRAPH.md`.
