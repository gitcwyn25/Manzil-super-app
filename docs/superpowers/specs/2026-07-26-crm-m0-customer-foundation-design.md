# CRM M0 — Customer foundation (design)

Status: approved, ready for implementation planning
Scope: M0 (customer entity + backfill) plus a thin read-only customer list page, so M0 is verifiable end-to-end in the dashboard rather than only via direct API/DB calls. M1 (full customer directory with profile pages, notes, tag editing), M2 (segmentation), M3 (loyalty), M4 (campaigns), and M5 (legal gate) are explicitly **not** in this design — each becomes its own spec, one milestone at a time, per the master prompt.

## Why this design differs from the master prompt's premises

The master prompt frames M0 as greenfield work ("There is no `Customer` entity... milestone 0 is not optional"). On inspection, most of it already exists as **uncommitted, in-progress work** in this repository:

- `Customer`, `CustomerVisit`, `Booking.customerId`, and `User.customers` are already in `packages/db/schema.prisma`, matching the prompt's proposed shape almost field-for-field (including `consentMarketing`).
- A migration file (`packages/db/migrations/20260726000000_add_customer_crm_m0/migration.sql`) already exists with the corresponding DDL.
- `packages/db/scripts/backfill-customers.ts` already exists and is well-built: dry-run by default, canonicalizes Uzbek phone numbers, and stops on ambiguous rows rather than guessing — exactly what the prompt's §6 demands.

What's genuinely missing, and what this design actually covers:

1. **The migration has never been applied.** The live database has no `_prisma_migrations` table at all — this project has always used `prisma db push`, not tracked migrations. `Booking.customerId` does not exist in the live database (confirmed by attempting the dry-run backfill, which failed with `P2022: column does not exist`).
2. **Zero API code references `Customer`/`CustomerVisit` anywhere.** The repository/controller layer is untouched.
3. **The architecture doc has no record of the `CustomerVisit`-vs-`BusinessVisit` decision**, which the prompt explicitly requires to be justified in writing.
4. **`BusinessStaff` is not wired into any authorization code.** The prompt claims CRM screens "already" gate through `BusinessStaff` roles; the model exists but the mechanism doesn't. Building that mechanism is a real sub-feature (invites, roles, accept flow) that no other CRM screen uses today — out of scope for M0.
5. **A previously undetected risk in the deploy pipeline** (built earlier this session, in `deploy-api.yml`/`db-migrate.yml`): both assume `prisma migrate deploy` works against production, but production has never been migration-tracked. Run as-is, the first real migration deploy would fail outright (Prisma would try to `CREATE TABLE "Business"`, which already exists). This design fixes that as part of applying M0.

## A — Migration baseline plan

There is exactly one migration file in the whole project — this M0 one — so there is no long history to baseline, only "everything that exists today" vs. "this one new change."

1. Get the pre-Customer schema via `git show HEAD:packages/db/schema.prisma` into a temp file. This does not touch the working tree.
2. `prisma migrate diff --from-empty --to-schema-datamodel <temp-file> --script` → write the output as a new baseline migration (e.g. `packages/db/migrations/20260726000001_baseline/migration.sql`) representing everything already live in production.
3. `prisma migrate resolve --applied 20260726000001_baseline` against the target database. This creates `_prisma_migrations` and records the baseline as applied **without executing its SQL** — the tables it describes already exist.
4. `prisma migrate deploy`. Prisma sees the baseline is resolved and applies only the real M0 migration (`Customer`, `CustomerVisit`, `Booking.customerId`) for real.
5. From this point on, `deploy-api.yml` and `db-migrate.yml` work correctly for every future migration.

This is a one-time, per-environment step. Steps 3–4 touch a real (shared, currently the only) database and require explicit go-ahead at implementation time before running, even though every part of the change is additive (new tables, one nullable column) and nothing existing is altered or dropped.

## B — Schema + backfill script review

**Schema:** no changes needed. `Customer`/`CustomerVisit` field types, indexes (`(businessId, phone)` uniqueness, `(businessId, lastVisitAt)`, `(businessId, tags)`), and cascade rules (`onDelete: Cascade` from `Business`, `onDelete: SetNull` on `CustomerVisit.bookingId`) are all correct as written.

**Backfill script (`packages/db/scripts/backfill-customers.ts`):** one bug fix required. Current `spendForBooking()`:

```ts
function spendForBooking(booking: BookingRow) {
  if (booking.payment?.status === "paid") return booking.payment.amount;
  if (booking.depositAmount) return booking.depositAmount;
  return new Prisma.Decimal(0);
}
```

If a payment exists but is `failed` or `refunded`, this falls through to `depositAmount` and counts it as spend — a refunded booking would inflate `totalSpend`. Fix: only fall back to `depositAmount` when there is **no payment record at all**; a payment in any terminal non-`paid` state must count as zero:

```ts
function spendForBooking(booking: BookingRow) {
  if (booking.payment?.status === "paid") return booking.payment.amount;
  if (!booking.payment && booking.depositAmount) return booking.depositAmount;
  return new Prisma.Decimal(0);
}
```

Everything else — phone canonicalization (`+998` handling), stop-on-ambiguous-rows, transactional upsert, the `visitCount` heuristic (count `completed` bookings, or all bookings if none are `completed` yet) — is sound as-is.

## C — API layer

- New file `apps/api/src/modules/crm/customers.repository.ts` (`CustomersRepository`). Matches the existing pattern of one focused repository per concern (`CrmRepository`, `AnalyticsRepository`, `PlansRepository`) rather than growing the already-611-line `crm.repository.ts`.
- New route on the **existing** `CrmController` (per the master prompt's "extend it, don't fork a parallel structure"): `GET /crm/businesses/:slug/customers`.
  - Ordered by `lastVisitAt desc` (nulls last — customers with visits but no bookings yet still surface).
  - Capped at `take: 500`, matching this codebase's existing no-pagination list convention (`listBusinesses`, `search`, etc.).
  - Response: `{ data: { customers: CustomerSummary[] } }` where `CustomerSummary = { id, phone, name, lastVisitAt, visitCount, totalSpend, tags, consentMarketing }`.
  - Read-only. No create/update/delete of `Customer` in M0 — directory editing (notes, tags, manual entries) belongs to M1.
- **Authorization:** reuses the ownership check already used by `getStats`/`getSubscription` on `CrmController` (owner via `Business.claimedByUserId === actor.userId`, or admin). Not `BusinessStaff` — see premise correction above. If multi-staff access to the customer directory becomes a real requirement, that is `BusinessStaff` authorization wiring as its own milestone, not something to build silently inside M0.
- No new rate-limit tier. Sibling authenticated GETs under `CrmController` rely on the global default throttle (300/min); this follows the same convention rather than inventing a bespoke one.

## D — Dashboard page, architecture doc, verification

**Dashboard page** — `apps/web/app/[locale]/dashboard/customers/page.tsx`, added to the sidebar menu (`dashboard/layout.tsx`) next to Reviews/Analytics. A plain table: name/phone, last visit, visit count, total spend, tags, consent badge. Per the dataviz skill's form-choice rule, a customer directory is inherently tabular data ("more than ~7 classes that all carry meaning → a table"), not a chart. New `getCustomers(slug)` added to `crm-api.ts`; new trilingual `customers` copy block added to `crm-copy.ts`, matching the `analytics` block added earlier this session. Empty state for a business with zero customers yet (expected — nothing populates `Customer` until the backfill runs, and nothing grows it further until M4's booking-completion hook exists).

**Architecture doc** — a short section added to `tech-office/docs/ARCHITECTURE.md` explaining why `CustomerVisit` is a separate model rather than folded into `BusinessVisit`: `BusinessVisit` records *anonymous* traffic (a hashed IP+UA visitor key, used for the public profile-view analytics built in Track 2 of the prior session); `CustomerVisit` records *identified* transactions tied to a real `Customer` row. Merging them would force an anonymous hash and a real identity into the same column — a modeling and privacy mismatch, not a simplification. This satisfies the master prompt's explicit requirement to document this decision rather than leave it implicit.

**Verification plan** (all required before M0 is considered done):

1. `prisma validate` on the schema.
2. Apply the baseline + M0 migration to the dev database — with explicit go-ahead at implementation time (real, if additive, change to a shared database).
3. Run the backfill dry-run, review the ambiguous-rows output if any; run with `--apply`; spot-check resulting `Customer`/`CustomerVisit` rows and `Booking.customerId` against known bookings.
4. Typecheck all workspaces.
5. Boot the API, call the new endpoint with dev auth headers — verify response shape, and that a non-owner request gets 403/404.
6. Confirm the dashboard page builds and renders (empty state at minimum; real data if the backfill produced any).

## Explicitly out of scope for this milestone

- Editing `Customer` (notes, tags, manual entries, consent toggling) — M1.
- Segmentation, loyalty, campaigns, legal consent-gated messaging — M2 through M5, each its own future spec.
- `BusinessStaff`-based authorization — separate milestone if/when multi-staff access becomes a real requirement.
- Staging environment migration — no staging database exists yet (flagged as an open item from the prior session's Track 3A work); this applies only to the current shared database until staging is provisioned.
