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

## Last verified

- `npm run build --workspace @manzil/shared`
- `npm run typecheck`
- `npx prisma validate --schema packages/db/schema.prisma`
- `npx prisma generate --schema packages/db/schema.prisma`
- `npm run build`

Local database note: `npm run db:seed` is wired to `packages/db/prisma/seed.ts`, but it requires PostgreSQL to be running at the `DATABASE_URL` in `.env`.
