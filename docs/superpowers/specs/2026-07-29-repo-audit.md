# Repo audit — unfinished work and dead code

**Date:** 2026-07-29 · **Branch:** `feat/frontend-elevation`

Findings from a pass over the repo, the live database, and the deployed site.
Items marked FIXED were resolved in this session.

## Critical: things that were silently broken in production

| # | Finding | State |
|---|---|---|
| 1 | **Self-registered businesses could never appear anywhere.** Every public surface (home feed, category counts, totals, search) filters `status: "claimed"`, and "Just joined" orders by `claimedAt`. Registration created `pending_claim` with `claimedAt` null and no admin was working the claim queue. One owner had already bought Pro on an invisible listing. | **FIXED** — self-registration now claims immediately; existing row backfilled. Business is live in `/v1/home`. |
| 2 | **Duplicate business registration.** `uniqueSlug()` always succeeds by suffixing, so a double submit created two businesses, two claims and two contracts. Reproduced in production: two rows 4s apart. | **FIXED** — idempotency guard in `registerBusiness` + pending-state submit button. Existing duplicate merged via `mergedIntoId`. |
| 3 | **An E2E test fixture was serving as production legal terms.** `terms_of_service` version `e2e-1.0`, title "E2E test shartlari", 64-byte body, published 2026-07-27 — newer than the real v1.0, so `getCurrent()` returned it to real registrants. | **FIXED** — deleted (0 acceptances, 0 contracts referenced it). Live API now serves "Manzil foydalanish shartlari" v1.0. |
| 4 | **Gurman AI is not wired.** `gurman.retriever.ts` and `gurman.grounding.ts` exist and are tested, but there is no controller or service, nothing is registered in `app.module.ts`, and nothing imports them. The web `ConciergeChat` calls `getConciergeReply()` — a canned keyword matcher in `@manzil/shared`. No `ANTHROPIC_API_KEY` exists. | In progress |
| 5 | **Businesses cannot upload photos.** `PhotoUpload` is complete and mounted nowhere; photos are created `pending` and nothing approves them; nothing reads `Photo.publicUrl` for display. | In progress |

## Blocked on configuration, not code

| Finding | What is needed |
|---|---|
| `STRIPE_WEBHOOK_SECRET` is empty, so the billing webhook rejects every event by design. Checkout works; plan activation does not. | Create the endpoint in Stripe (or `stripe listen`), set the `whsec_…` in `.env` **and** Railway. |
| Gurman cannot answer without `ANTHROPIC_API_KEY`. | Set the key in `.env` and Railway. |
| The platform has **1 business, 1 review, 0 photos**. Every discovery feature renders near-empty. | Seed real Tashkent listings. `tech-office/PRD.md` §8 calls this the non-negotiable prerequisite. |

## Dead code

| Item | Action |
|---|---|
| `apps/mobile-old` — 11 tracked files, zero references, untouched since 2026-07-04 | **REMOVED** |
| `apps/backend` — 36 tracked files, superseded by `apps/api`, excluded from workspaces, never built. Referenced only by `.dockerignore` and two docs that describe it as legacy. | Kept deliberately: removing it means editing contributor docs that still point at it. Worth a separate decision. |
| Orphaned components: `feed-card.tsx`, `home-search.tsx`, `occasion-rail.tsx`, `motion/hero-backdrop.tsx`, `workspace/ws-skeleton.tsx` | Left in place — `ws-skeleton` is intended for the workspace loading states and the others may serve planned surfaces. Delete only with a decision on those surfaces. |
| `photo-upload.tsx` was orphaned | Being mounted now (finding 5) |

## Still mock-backed

`apps/web/app/lib/api.ts` routes these through `mockApi` regardless of the real
API: `getBusinesses`, `getBusiness`, `getCategories`, `searchBusinesses`,
`getConciergePrompts`, `getUserProfile`, `getAchievements`, `getOccasions`,
`getOccasionPage`, `getListsPage`, `getListDetail`, `getSocialActivities`,
`getDiscoverableUsers`, `getSubscriptionPlans`, `getAdminOverview`,
`getAdminClaims`, `approveClaim`, `rejectClaim`.

`useMockData` defaults to **true** (`NEXT_PUBLIC_USE_MOCK !== "false"`), so any
environment that forgets the flag serves fabricated data. Production sets it to
false — verified: `/discover` renders the real business. The default is still
backwards and should be inverted so the safe state is real data.

## Verified working in production

- `/v1/health`, `/v1/home`, `/v1/plans`, `/v1/waitlist/count` — all 200
- Billing webhook rejects an unsigned forged event with 400
- `/discover` renders the real business from the live API
- Stripe Prices exist for pro and max; the sync script is idempotent
- Home feed returns the real business after the claim fix
