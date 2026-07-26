# Implementation Status

## Current focus: Phase 1 — backend/database hardening

Build order agreed with product:

1. **Frontend end-to-end (mock data)** — Phase 0A–0C complete
2. API / backend logic — claim approval, owner-safe updates, review replies implemented
3. Database & storage — Prisma/Postgres source of truth now lives in `packages/db`
4. Clerk auth — API guard foundation exists; production Clerk env still required
5. Deploy (Vercel + Railway) → custom domain
6. CI/CD, security, scaling

Clerk routes exist in the repo. Local development can still use dev headers where supported; production deployment needs Clerk environment variables.

---

## Phase 0A — Feed-first platform (done)

**Shared layer** (`packages/shared/`): platform types, mock data, feed/occasions/lists helpers.

**Web routes:** home feed, discover, business profile, occasions, lists.

**Mock mode:** `NEXT_PUBLIC_USE_MOCK` defaults to mock; set `false` for real API later.

---

## Phase 0B — Social + concierge (done)

User profile, concierge chat, business pricing, save/follow preferences (localStorage), mobile tab parity.

---

## Phase 0C — Design polish + i18n (done)

- `packages/shared/src/ui-copy.ts` — `getUiCopy(locale)` for uz / ru / en
- Web + mobile wired to shared copy; CSS polish per design system (glass, 16:9 cards, gold stars)

---

## Phase 1A — Live API foundation (done)

- NestJS API serves categories, businesses, search, reviews, claims, and admin overview.
- Prisma repository is wired to PostgreSQL via `packages/db/schema.prisma`.
- Admin claim queue supports listing, approval, and rejection.
- Business owners can update their claimed business and reply to reviews.
- Shared API client uses built-in `fetch` so the shared package has no Axios dependency.

## Phase 1B — Next backend steps

- Review/photo report and moderation endpoints are now implemented in the live API.
- Lists and occasions have live read endpoints backed by shared curated data plus database businesses.
- Add media upload storage provider configuration.
- Add production migration workflow for Railway/Postgres.
- Connect Clerk production keys and verify real auth end to end.

## Backend/database improvement fields

- **One backend path:** `apps/api` is the active frontend-integrated API. `apps/backend` is a legacy scaffold with useful ideas, but it should not be deployed separately.
- **Moderation:** reports now support open/resolved/rejected workflow; next improvement is richer admin notes and audit history.
- **Database:** core foreign-key/filter indexes exist. Next schema work should add first-class tables for community lists, occasions, saves/follows, and uploaded media ownership.
- **Search:** current Postgres `contains` search is fine for beta; later switch to Meilisearch/Postgres full-text when listings grow.
- **Storage:** media presign is still a placeholder; connect R2/S3 and persist uploaded `Photo` rows.
- **Auth:** local dev headers are useful, but production must rely on Clerk tokens and synced users.

---

---

## Phase 2 — Security hardening, analytics, deployment reliability (2026-07-26)

### Corrections to the plan's premises

Four assumptions in the brief did not match the repository and changed what was built:

1. **There is no OTP endpoint.** `PhoneVerification` exists in `schema.prisma` with
   **zero code references** — no send, no verify, nowhere. The "single most exploitable
   endpoint" is unimplemented, so rate limiting shipped against the routes that do
   exist. `ThrottleOtpSend`/`ThrottleOtpVerify` tiers and a phone-number tracker are
   defined and ready to attach when the endpoint lands.
2. **`crm.controller.ts` was not a validation reference.** It had no runtime validation
   at all. `class-validator`/`ValidationPipe`/`@nestjs/throttler` existed only in
   `apps/backend`, which is **not in the workspace list** and is not deployed. Track 1.3
   was therefore "add validation from scratch," not "audit existing DTOs."
3. **Analytics data was not being collected.** `BusinessEvent`, `SearchQueryLog`,
   `Booking`, and `Payment` had **zero writers**; only `BusinessVisit` and `Review` were
   populated. Dashboards would have rendered empty at any traffic level, so
   instrumentation shipped first.
4. **Railway already gates deploys on a health check** (`railway.json` →
   `healthcheckPath: /v1/health`); traffic only switches after a 200. The real gaps were
   no post-deploy smoke test, no staging, and no rollback.

### Bugs found and fixed along the way

- **`deploy-api.yml` never deployed the API.** It ran `railway deploy`, which
  *provisions a template* (a database, etc.); deploying your own code is `railway up`.
  With no `--template` it also prompts interactively. Migrations were being applied to
  production while the code never shipped.
- **`db-migrate.yml` had never run.** Its path filter was `prisma/**`; the schema lives
  at `packages/db/schema.prisma` and there is no root `prisma/` directory. It also ran
  `migrate dev` (interactive, *authors* migrations) instead of `migrate deploy`.
- **Presigned uploads signed only `host`.** Content-Type and Content-Length were
  unsigned, so a client could PUT any file of any size regardless of server-side checks.
- **The legacy `/v1/admin` surface wrote no audit rows** — including `approveClaim`,
  which transfers business ownership *and* elevates a user to `business_owner`.
  `/v1/console` was fully audited; the two surfaces disagreed.

### Track 1 — Security

- **Rate limiting** (`@nestjs/throttler` v6) registered as a global `APP_GUARD`, so a new
  route is throttled unless it opts out. Storage is a custom Redis backend reusing the
  **existing** `CacheService` connection (no new datastore) with an atomic Lua
  check-increment-block; it degrades to per-instance in-memory limits rather than failing
  open. Per-route tiers in `security/throttle.config.ts`. `/v1/health` is exempt so
  Railway's own healthcheck cannot trip it.
- **`trust proxy` set to 1 hop.** Without it every request behind Railway reports the
  proxy's IP and the limiter buckets all traffic together; trusting the whole chain would
  let a client spoof `X-Forwarded-For` for a fresh bucket per request.
- **helmet** with an API-appropriate CSP; **CORS wildcard refuses to boot in production**.
- **Validation**: `ValidationPipe` with `whitelist` + `forbidNonWhitelisted`, and DTOs
  across CRM, businesses, auth, media, reviews, claims, admin, and console. Unknown
  properties are now rejected, so `role`/`status` cannot be smuggled into a create.
- **Uploads**: MIME allowlist (extension derived *from* the accepted type), size caps,
  and both values **signed into the presigned URL** so R2 enforces them.
- **CI**: `security.yml` (npm audit gating high/critical on prod deps, gitleaks over full
  history via the official image — no licence key needed, CodeQL) + `dependabot.yml`.
- **OWASP**: no `$queryRawUnsafe`/`$executeRawUnsafe` anywhere; the only raw SQL is a
  parameterised `` $queryRaw`SELECT 1` ``. The one `dangerouslySetInnerHTML` is a static
  literal. No UGC reaches raw HTML.

### Track 2 — Analytics

- `AnalyticsService` writes `BusinessEvent` and `SearchQueryLog` fire-and-forget, so
  analytics can never fail or slow a user request. Search is logged **outside** the cached
  loader, or only cache misses would be recorded. Visitors are a hash of IP+UA — unique
  counts without storing who visited what.
- `AnalyticsRepository`: bounded Postgres aggregations, 120s cache.
- **Owner dashboard** (`/[locale]/dashboard/analytics`) — visits, funnel with conversion,
  rating trend, bookings, revenue. Gated on `analytics.basic` via the existing
  `EntitlementGuard`; a 403 renders the upgrade path, not an error.
- **Platform dashboard** (`apps/admin/app/analytics`) — zero-result rate and **unmet
  demand** (the queries that name what to seed next), growth, tier distribution. Served
  from `/v1/console/analytics` so the admin surface keeps **one** auth model
  (AdminUser + permission), not two.
- Charts are dependency-free server-rendered SVG: no client JS, CSP-safe, native
  `<title>` tooltips, and a table view behind every chart. The blue ordinal ramp was
  validated against both surfaces (not chosen by eye).

### Track 3 — Deployment reliability + PWA

- `deploy-api.yml` rebuilt: **staging → smoke test → production → smoke test → automatic
  rollback**. Rollback uses Railway's GraphQL `deploymentRollback` (the CLI has no
  rollback subcommand; `redeploy` re-runs the broken deployment).
- `smoke-test.mjs` verifies more than liveness: database reachable *through* the app,
  public reads, security headers present, and protected routes still rejecting anonymous
  callers.
- **Sentry** on API (`@sentry/nestjs`, init before instrumented imports) and web
  (Node/Edge/client). PII off, auth headers scrubbed, throttle rejections ignored, and
  the Sentry origin added to the web CSP `connect-src` — otherwise reports are silently
  blocked.
- **PWA**: manifest, generated icon set (incl. a separate maskable asset), and a
  hand-written service worker — network-first navigations with an offline fallback,
  stale-while-revalidate for fingerprinted static assets, and **API responses never
  cached** (a stale price or review is worse than an error).

### Still open

- Malware scanning on uploads is **not** implemented. Type and size are now enforced
  end-to-end and `upload-policy.ts` ships magic-number verification for the post-upload
  scan, but nothing calls it yet — photos still rely on `moderationStatus: pending`
  gating. Wire this before Stage 7 legal-document upload.
- `Booking`/`Payment` still have no writers, so those dashboard panels stay at zero until
  booking and payments ship. The queries are correct and will populate on their own.
- Staging deploy needs `STAGING_*` and `RAILWAY_*` secrets set before it can run.

---

## CRM M0 — Customer foundation (2026-07-26)

Design: [docs/superpowers/specs/2026-07-26-crm-m0-customer-foundation-design.md](../../docs/superpowers/specs/2026-07-26-crm-m0-customer-foundation-design.md)
Plan: [docs/superpowers/plans/2026-07-26-crm-m0-customer-foundation.md](../../docs/superpowers/plans/2026-07-26-crm-m0-customer-foundation.md)

**Correction to the CRM brief's premise.** The brief framed M0 as greenfield ("There is no `Customer` entity"). In fact `Customer`, `CustomerVisit`, `Booking.customerId`, and a working backfill script already existed as uncommitted work — what was missing was applying it and exposing it. This milestone finished that rather than rebuilding it.

### Migration history now exists

The database had **no migration history at all** — it was built with `prisma db push`, so `_prisma_migrations` did not exist. That meant `prisma migrate deploy` (used by `deploy-api.yml` and `db-migrate.yml`) would have failed on its first real run, trying to `CREATE TABLE "Business"` over existing tables.

Fixed by baselining: a generated `20260725235959_baseline` migration describing the pre-Customer schema was marked applied **without executing its SQL** (`prisma migrate resolve --applied`), then `20260726000000_add_customer_crm_m0` was deployed for real. `_prisma_migrations` now holds 2 finished rows and the CI/CD migration path works going forward.

**Blocker found and fixed:** `packages/db/migrations/migration_lock.toml` (committed back in `27d008e`) contained **SQL rather than TOML** — leftover DDL from an abandoned early schema with a lowercase `users` table and uppercased enum values. Prisma reads that file for the provider name, found none, and failed with `P3019`. Replaced with the standard provider declaration.

### Shipped

- **Backfill bug fix** — `spendForBooking()` counted a refunded or failed payment's deposit as revenue, because it fell through to `depositAmount` whenever the payment wasn't `paid`. Now only falls back when there is no payment record at all.
- **`GET /crm/businesses/:slug/customers`** — read-only customer list, `take: 500`, `Decimal` serialized as a string. Authorization reuses the existing ownership rule, extracted to `apps/api/src/modules/crm/business-ownership.util.ts` and shared with `CrmRepository` (all 11 existing call sites unchanged).
- **`/[locale]/dashboard/customers`** — customer table in the owner dashboard, trilingual (uz/ru/en), reusing existing `.crm-table` / `.crm-cell-sub` styles (no new CSS).
- **Architecture doc** — records why `CustomerVisit` is separate from `BusinessVisit` (anonymous hashed traffic vs. identified transactions).

### Verified

All four workspaces typecheck and build. Schema validates. Endpoint checked live across five auth paths: owner → 200, admin → 200, wrong user → 403, unknown slug → 404, anonymous → 401. Data preserved: 14 businesses / 6 users / 3 reviews; 2 finished migrations.

**The database has zero bookings**, so the backfill was a verified no-op (0 customers created) and the dashboard renders its empty state. This is the real production state, not a gap in the work — the pipeline populates itself once bookings exist.

### Not in this milestone

- Editing customers (notes, tags, consent) — M1.
- Segmentation (M2), loyalty (M3), campaigns (M4), legal consent gate (M5).
- `BusinessStaff`-based authorization: the model exists but has **no** authorization wiring anywhere in the codebase. The CRM brief assumed it was already a working mechanism; it is not. Ownership checks remain `claimedByUserId`-based.
- Deferred minors: two dead imports (`ForbiddenException` in `crm.repository.ts`, `type CustomerSummary` in `crm.controller.ts`), and `formatMoney` duplicated between the customers and analytics dashboard pages.

---

## CRM M1 — Customer profile (2026-07-26)

Builds on M0. The customer *list* shipped early as part of M0 (so M0 was verifiable in the UI), so M1 is the remaining piece: the per-customer profile and the dashboard entry point.

### Shipped

- **`GET /crm/businesses/:slug/customers/:customerId`** — one customer with bookings, reviews, and visit history. The row is fetched by `id` **and** `businessId` together, so a customer id from another business returns 404 rather than leaking; the id alone is never treated as authorization.
- **`/[locale]/dashboard/customers/[id]`** — profile page: visit/spend/first-seen stats, contact and consent details, booking table, reviews, and visit history. Trilingual.
- **List rows link through** to the profile; the name is the affordance rather than adding a "view" column for nothing.
- **Dashboard home entry point** — customer count on the overview panel links straight to the directory, satisfying the CRM brief's "reachable in one click from `dashboard/page.tsx`, not a buried sub-page". Served off the existing `getStats` call rather than a second round trip.

### Two modelling facts the UI has to be honest about

- **Reviews hang off `User`, not `Customer`.** A customer who booked by phone and never made a Manzil account *cannot* have reviews. `hasAccount` distinguishes that from "left no review", and the page says which — an empty list would otherwise read as a judgment about the customer.
- **Booking amounts count only settled payments**, mirroring the backfill rule. A pending or refunded payment is not revenue received.

### Verified

Typecheck and build clean across all workspaces. The endpoint was exercised against seeded data spanning two businesses:

| Case | Result |
|---|---|
| Owner reads own customer | 200, full profile |
| Owner requests another business's customer id | 404 (no leak) |
| Owner reaches for another business entirely | 403 |
| Unknown customer id | 404 |
| Anonymous | 401 |

Test rows were deleted afterwards — the database is back to zero customers and zero customer visits.

### Still true from M0

Zero bookings exist, so the directory and profile render their empty states in production until booking data arrives. The pipeline is correct but unexercised against real traffic.

### Next

M2 (segmentation) → M3 (loyalty) → M4 (campaigns, Telegram/SMS-first) → M5 (legal consent gate, required before any campaign reaches a real customer).

Two carried-forward items worth their own tasks: `apps/api` still has **no test framework**, so there is nowhere for regression tests on the money logic to live; and `formatMoney` is now duplicated across three dashboard pages with diverging currency/zero handling.

---

## Last verified

- `npm run build --workspace @manzil/shared`
- `npm run typecheck`
- `npx prisma validate --schema packages/db/schema.prisma`
- `npx prisma generate --schema packages/db/schema.prisma`
- `npm run build`

Local database note: `npm run db:seed` is wired to `packages/db/prisma/seed.ts`, but it requires PostgreSQL to be running at the `DATABASE_URL` in `.env`.
