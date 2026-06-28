# Implementation Status

## Current focus: Phase 0 — frontend end-to-end (mock data)

Build order agreed with product:

1. **Frontend end-to-end (mock data)** — Phase 0A–0C complete
2. API / backend logic
3. Database & storage
4. Clerk auth
5. Deploy (Vercel + Railway) → custom domain
6. CI/CD, security, scaling

Clerk routes exist in the repo but auth integration is **deferred** until after frontend + deploy.

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

## Legacy scaffold (still in repo)

NestJS API, Prisma, Docker Compose, Clerk admin — used when `NEXT_PUBLIC_USE_MOCK=false`. Not current dev priority.

---

## Last verified

- `npm run build --workspace @manzil/shared`
- `npm run typecheck`
