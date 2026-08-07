# Manzil — Authorization & Ownership Security Audit

**Date:** 2026-08-07
**Branch:** `feat/frontend-elevation`
**Scope:** `apps/api` (deployed NestJS API), `apps/web` / `apps/admin` (frontend), `packages/db/schema.prisma`
**Method:** Read-only source review. No code was modified. No runtime exploitation was attempted; every claim below cites file and line.

---

## The governing principle

> **URLs identify resources; identities authorize access.**
> Changing `/businesses/iwash` to `/businesses/ravotsoy` must change only the public page — never granting access to that business's workspace, drafts, analytics, finances, CRM, customers, bookings, revenue, messages, campaigns, employees, tax IDs (STIR), owner emails, or internal metadata.

**Verdict: the principle holds across the entire deployed authorization surface.**

This is the headline result and it is not a hedge. Across 109 routes on 21 controllers there is **not one route** that derives ownership, `businessId`, `organizationId`, or `ownerId` from a route param, query string, request body, or header instead of the authenticated session. A repo-wide grep for the pattern returns zero hits:

```
grep -rn 'body\.(businessId|ownerId|userId|organizationId|actorId|role|claimedByUserId)|query\.(businessId|ownerId|userId)' apps/api/src
→ (no matches)
```

Every owner-scoped route follows the same shape: the slug (or a record id) is used **only to look up the row**, and authorization is then decided against `business.claimedByUserId === actor.userId`. The findings below are real but none of them is an ownership bypass. The severity distribution reflects that honestly.

### Findings at a glance

| # | Severity | Finding |
|---|----------|---------|
| F-1 | Medium | Public photo endpoints do not exclude suspended businesses — the `6c0027f` visibility predicate is applied to 3 of 5 public read paths |
| F-2 | Medium | `apps/backend/` is an undeployed second API whose admin controller has no role check |
| F-3 | Medium | No audit trail exists for any business-owner mutation; `AuditLog.actorId` is FK-bound to `AdminUser` and structurally cannot record one |
| F-11 | Medium | `GET /console/businesses/:id/detail` returns STIR, contracts, acceptance IPs and owner PII under `business.view`, bypassing the `legal.view` boundary |
| F-4 | Low | Business claim submission (`POST /claims`) has no dedicated rate limit |
| F-5 | Low | Public *writes* (visit, event, review) accept a suspended or merged business |
| F-6 | Low | Two ownership predicates coexist with divergent rules (both fail closed) |
| F-7 | Low | Any authenticated user can create `pending` Photo rows against any business |
| F-10 | Low | `apps/admin` ships **zero** security headers — the highest-privilege origin has the weakest browser hardening |
| F-12 | Low | `apps/admin` dev-header fallback has no `NODE_ENV` guard |
| F-13 | Low | `MANZIL_DEV_AUTH` defaults **on** in the web app and **off** in the API |
| F-8 | Info | `Permissions-Policy` header absent on the API |
| F-9 | Info | Announcement/package draft state is protected by the *absence* of a public route, not by a predicate — Epic 19 cannot rely on today's model |
| F-14 | Info | `apps/web` CSP allows `'unsafe-inline'` in `script-src` |

No **critical** or **high** findings. See "Areas that came back clean" for the explicit no-findings statements.

---

## Resolved findings — verified present and correct

### R-1 — `6c0027f` · Public reads exclude suspended and merged businesses · **Partially verified**

The predicate is present and correct:

`apps/api/src/modules/repositories/database.repository.ts:62-65`
```ts
const PUBLICLY_VISIBLE = {
  status: { not: "suspended" },
  mergedIntoId: null
} as const;
```

Root cause confirmed: `ConsoleRepository.rejectBusiness` (`apps/api/src/modules/console/console.repository.ts:211`) writes `status: "suspended"` and nothing else; `mergeBusiness` (`:268`) writes `mergedIntoId: targetId, status: "suspended"`. Neither removes the row, so every read path must carry the predicate itself.

**Coverage across all public read paths:**

| Public read path | Predicate applied | Evidence |
|---|---|---|
| `GET /v1/businesses` | ✅ | `database.repository.ts:164` |
| `GET /v1/businesses/:slug` | ✅ (`findFirst`, not `findUnique`) | `database.repository.ts:219-226` |
| `GET /v1/search` | ✅ | `database.repository.ts:135` |
| `GET /v1/lists/:slug` | ✅ inherited — filters over `listBusinesses()` | `lists.controller.ts:27` |
| `GET /v1/occasions/:slug` | ✅ inherited — filters over `listBusinesses()` | `occasions.controller.ts:27` |
| `GET /v1/home` | ✅ stricter (`status: "claimed"`) | `home.repository.ts:33, 42, 52, 57` |
| `POST /v1/gurman/ask` | ✅ `VISIBLE_BUSINESS_WHERE` | `gurman.retriever.ts:21-24, 48, 88` |
| `GET /v1/media/businesses/:slug/photos` | ❌ **only `mergedIntoId`** | `media.controller.ts:257-259` |
| `GET /v1/media/business-covers` | ❌ **no business predicate at all** | `media/business-cover.ts:36-43` |

The fix is correct where it was applied, but **coverage is incomplete** — see F-1. Note that `6c0027f`'s commit message asserts "the public photo gallery … already used" the predicate; it uses half of it (`mergedIntoId: null` without the suspension check).

### R-2 — `58469bc` · Campaigns entitlement on campaign-id routes · **Verified correct**

`apps/api/src/modules/crm/campaigns.repository.ts:46-56` defines `assertCampaignsEntitled(businessId)`, called on all three campaign-id routes after ownership is established:

- `setCampaignActive` → `:137-138`
- `runCampaign` → `:165-166`
- `getCampaignSends` → `:191-192`

The reasoning recorded in the commit is confirmed by reading `EntitlementGuard` (`apps/api/src/modules/plans/entitlement.guard.ts:34-45`): it resolves the business from `params.slug ?? params.businessId ?? params.id`. On `/campaigns/:id/*` that `id` is a campaign id, the lookup returns `null`, and the guard **returns `true`** (line 43-45, "let the downstream handler produce the canonical 404"). A `@RequireEntitlement` decorator on those routes would have failed open. Enforcing in the repository, where the business is resolved *from the campaign*, is the correct placement.

The auth half is also confirmed: `CrmController` carries class-level `@UseGuards(ManzilAuthGuard)` + `@RequireAuth()` (`crm.controller.ts:43-46`), which NestJS applies to every handler in the class.

### R-3 — `cd76e19` · Gurman registered flat, not as a Nest module · **Verified correct**

No `GurmanModule` exists anywhere in the tree. Gurman is registered flat in `app.module.ts`: `GurmanController` in `controllers` (`:106`), and `GURMAN_RETRIEVER` / `GURMAN_LLM` / `GurmanService` in `providers` (`:148-150`). `PrismaService` is provided once, at `app.module.ts:115`, so there is a single connection pool.

*Honest framing:* this is an architecture-consistency and resource-management fix, not a security fix. It is confirmed as landed, but it does not close an authorization gap and should not be counted as one.

---

## Full route table

**Legend.** *Auth* = authentication required. *Authz* = authorization check beyond authentication. *Basis* = **identity** (decided from the verified session) or **input** (decided from client-supplied data). "Public" means intentionally reachable anonymously.

`ManzilAuthGuard` (`auth/manzil-auth.guard.ts:22-51`) requires auth when `@RequireAuth()` or `@Roles(...)` is present, resolves the actor via Clerk, and attaches it to `request.manzilActor`. Identity and role are read from the **database** (`clerk-auth.service.ts:65-75`), never from the token claims or a client header.

### Public / anonymous (intended)

| Method · Path | Auth | Authz | Basis | Notes |
|---|---|---|---|---|
| `GET /v1/health` | — | — | — | `@SkipThrottle()`, DB liveness only |
| `GET /v1/categories` | — | — | — | Cached catalogue |
| `GET /v1/businesses` | — | — | — | `PUBLICLY_VISIBLE` ✅ |
| `GET /v1/businesses/:slug` | — | — | — | `PUBLICLY_VISIBLE` ✅; records a `view` event server-side |
| `POST /v1/businesses/:slug/visit` | — | — | — | Anonymous tracking; no visibility filter (F-5) |
| `GET /v1/search` | — | — | — | `PUBLICLY_VISIBLE` ✅ |
| `GET /v1/home` | — | — | — | `status: "claimed"` ✅ |
| `GET /v1/lists`, `GET /v1/lists/:slug` | — | — | — | Static list defs + filtered public businesses |
| `GET /v1/occasions`, `GET /v1/occasions/:slug` | — | — | — | Same |
| `GET /v1/plans` | — | — | — | Public price catalogue |
| `GET /v1/legal/registration-terms` | — | — | — | Deliberate: read terms before agreeing |
| `POST /v1/gurman/ask` | — | — | — | Public by design; `ThrottleGurman` is the cost ceiling |
| `POST /v1/waitlist`, `GET /v1/waitlist/count` | — | — | — | Public capture |
| `POST /v1/analytics/businesses/:slug/events` | — | — | — | Anonymous funnel event; no visibility filter (F-5) |
| `GET /v1/media/business-covers` | — | — | — | ⚠️ no visibility filter (F-1) |
| `GET /v1/media/businesses/:slug/photos` | — | — | — | ⚠️ `mergedIntoId` only (F-1); approved photos only ✅ |
| `POST /v1/auth/session` | — | — | — | Exchanges a Clerk token; `ThrottleAuth` |
| `POST /v1/billing/webhook` | — | signature | n/a | Stripe HMAC stands in for auth; raw body preserved |
| `POST /v1/console/auth/login` | — | credentials | n/a | `ThrottleAdminLogin` 5/15min, 1h block |
| `POST /v1/console/auth/logout` | — | — | — | Clears cookie |
| `GET /v1/console/auth/session` | — | cookie/Clerk | identity | Mirrors `PermissionGuard`; 401 when not an admin |

### Authenticated — self-scoped

| Method · Path | Auth | Authz | Basis | Evidence |
|---|---|---|---|---|
| `POST /v1/auth/sync` | ✅ | self | **identity** | `auth.controller.ts:30-38` — clerkId from actor, never from body |
| `GET /v1/auth/me` | ✅ | self | **identity** | `auth.controller.ts:66` — `actor.userId` |
| `GET /v1/businesses/mine` | ✅ | self | **identity** | `database.repository.ts:179-189` — `WHERE claimedByUserId = actor.userId` |
| `POST /v1/claims` | ✅ | anti-hijack | **identity** | `database.repository.ts:556-563` — refuses a claimed business |
| `POST /v1/reviews/:id/helpful` | ✅ | self | **identity** | `review-trust.repository.ts:37-39` — cannot self-endorse |
| `POST /v1/reviews/:id/verify` | ✅ | self | **identity** | `review-trust.repository.ts:98-108` — review AND booking must be the caller's |
| `POST /v1/reviews/:id/report` | ✅ | — | **identity** | Reporter recorded from actor |
| `POST /v1/businesses/:slug/reviews` | ✅ | — | **identity** | Author from `actor.userId`; upsert keyed `(businessId, userId)` |
| `POST /v1/media/presign` | ✅ | owner-or-pending | **identity** | `media.controller.ts:64` — `isOwnerUpload` computed server-side; non-owner uploads land `pending` |

### Authenticated — business-owner scoped

Every route below resolves the business from the URL and then authorizes on the session identity. `requireOwnedBusiness` (`crm/business-ownership.util.ts:11-30`) is the shared predicate.

| Method · Path | Authz mechanism | Evidence |
|---|---|---|
| `PATCH /v1/businesses/:slug` | `@Roles` + `assertCanManageBusiness` | `businesses.controller.ts:76`, `database.repository.ts:256, 1008-1021` |
| `POST /v1/reviews/:id/replies` | `@Roles` + `assertCanManageBusiness` | `reviews.controller.ts:48`, `database.repository.ts:386` |
| `POST /v1/crm/register` | creates + self-claims | `crm.repository.ts:202-205` |
| `GET/POST /v1/crm/businesses/:slug/announcements` | `requireOwnedBusiness` | `crm.repository.ts:277, 287` |
| `PATCH/DELETE /v1/crm/announcements/:id` | record → slug → `requireOwnedBusiness` | `crm.repository.ts:317, 360` |
| `GET/POST /v1/crm/businesses/:slug/packages` | `requireOwnedBusiness` | `crm.repository.ts:393, 403` |
| `PATCH/DELETE /v1/crm/packages/:id` | record → slug → `requireOwnedBusiness` | `crm.repository.ts:431, 465` |
| `GET/POST /v1/crm/businesses/:slug/bookings` | `requireOwnedBusiness` | `bookings.repository.ts:58, 114` |
| `PATCH /v1/crm/bookings/:id/status` | record → slug → `requireOwnedBusiness` | `bookings.repository.ts:194` |
| `GET /v1/crm/businesses/:slug/customers` | `requireOwnedBusiness` | `customers.repository.ts:59` |
| `GET /v1/crm/businesses/:slug/customers/:customerId` | `requireOwnedBusiness` + `(id AND businessId)` | `customers.repository.ts:129-135` |
| `POST /v1/crm/businesses/:slug/customers/:customerId/consent` | `requireOwnedBusiness` + `(id AND businessId)` | `customers.repository.ts:95-104` |
| `GET /v1/crm/businesses/:slug/segments[/:key]` | `requireOwnedBusiness` + `crm.segments` entitlement | `segments.repository.ts:115, 163` |
| `GET/POST /v1/crm/businesses/:slug/campaigns` | `requireOwnedBusiness` + `crm.campaigns` entitlement | `campaigns.repository.ts:59, 105` |
| `PATCH /v1/crm/campaigns/:id/active` | campaign → slug → `requireOwnedBusiness` + entitlement | `campaigns.repository.ts:137-138` |
| `POST /v1/crm/campaigns/:id/run` | campaign → slug → `requireOwnedBusiness` + entitlement | `campaigns.repository.ts:165-166` |
| `GET /v1/crm/campaigns/:id/sends` | campaign → slug → `requireOwnedBusiness` + entitlement | `campaigns.repository.ts:191-192` |
| `GET /v1/crm/businesses/:slug/stats` | `requireOwnedBusiness` | `crm.repository.ts:488` |
| `GET/POST /v1/crm/businesses/:slug/subscription` | `requireOwnedBusiness` | `crm.repository.ts:575, 613` |
| `GET /v1/analytics/businesses/:slug` | explicit owner check + `analytics.basic` entitlement | `analytics.controller.ts:108-120` |
| `POST /v1/billing/checkout` | `requireOwnedBusiness(body.businessSlug)` | `billing.controller.ts:37` |
| `GET /v1/legal/businesses/:slug/contract` | `requireOwnedBusiness` | `legal.controller.ts:39` |
| `GET /v1/legal/businesses/:slug/acceptances` | `requireOwnedBusiness` | `legal.controller.ts:48` |
| `GET /v1/media/photos?business=` | `isBusinessOwner` | `media.controller.ts:214-216` |
| `POST /v1/media/photos/:id/cover` | photo → business → `isBusinessOwner` | `media.controller.ts:155-161` |

`POST /v1/billing/checkout` deserves a note: it takes `businessSlug` **in the request body**, which looks like the client-trust anti-pattern. It is not. The slug is passed straight into `requireOwnedBusiness`, which authorizes on `claimedByUserId === actor.userId`. The body supplies *which* resource; the session supplies *whether*. The Stripe price is also resolved server-side from `Plan.stripePriceId` — no client-supplied amount reaches Stripe.

### Admin — `User.role === "admin"` (7 routes)

`AdminController` carries class-level `@UseGuards(ManzilAuthGuard)` + `@Roles("admin")` (`admin.controller.ts:25-27`). Role is read from the database row, not from the token.

`GET /v1/admin/overview` · `GET /v1/admin/claims` · `POST /v1/admin/claims/:id/approve` · `POST /v1/admin/claims/:id/reject` · `GET /v1/admin/moderation` · `POST /v1/admin/reports/:id/resolve` · `POST /v1/admin/reports/:id/reject`

### Admin console — `AdminUser` + permission (37 routes)

`ConsoleController` carries class-level `@UseGuards(PermissionGuard)` (`console.controller.ts:29-31`). Each handler declares its exact permission. Deliberately a **separate identity system** from `User.role`, documented at `console.controller.ts:58-66`.

| Permission | Routes |
|---|---|
| *(session only)* | `GET /console/me` |
| `analytics.view` | `GET /console/overview`, `GET /console/analytics` |
| `business.view` | `GET /console/businesses`, `…/:id/duplicates`, `…/:id/detail`, `…/:id/consumers`, `GET /console/categories` |
| `business.edit` | `POST /console/businesses/:id/feature`, `PATCH /console/businesses/:id` |
| `business.approve` / `business.reject` / `business.merge` | `POST /console/businesses/:id/{approve,reject,merge}` |
| `media.approve` | `POST /console/photos/:id/moderate` |
| `legal.view` / `legal.publish` | `GET /console/legal`, `POST /console/legal` |
| `category.manage` | `POST /console/categories` |
| `review.view` / `review.approve` / `review.reject` / `review.delete` | `GET /console/reviews`, `POST /console/reviews/:id/{approve,reject,delete}` |
| `user.view` / `user.ban` / `user.suspend` / `user.unban` | `GET /console/users`, `GET /console/users/:id`, `POST /console/users/:id/{ban,suspend,unban}` |
| `plan.manage` | `GET /console/plans`, `PATCH /console/plans/:tier`, `POST /console/plans/:tier/features` |
| `audit.view` | `GET /console/audit` |
| `notification.view` | `GET /console/notifications`, `POST /console/notifications/read-all`, `POST /console/notifications/:id/read` |
| `supabase.view` | `GET /console/supabase/overview`, `…/storage`, `…/tables/:table` |

**Nothing ambiguous was found in the route table.** Every route's intended audience is either declared by a guard or documented in a comment adjacent to the handler, and in every case the comment matches the code.

---

## Findings

### F-1 · Medium · Public photo endpoints do not exclude suspended businesses

**Evidence**

`apps/api/src/modules/controllers/media.controller.ts:256-259`
```ts
const business = await this.prisma.business.findFirst({
  where: { OR: [{ id: slug }, { slug }], mergedIntoId: null },
  select: { id: true }
});
```
`status: { not: "suspended" }` is absent.

`apps/api/src/modules/media/business-cover.ts:36-43` — `getBusinessCoversBySlug` filters on `isCover`, `moderationStatus: "approved"` and the slug set, with **no business-visibility predicate whatsoever**.

**Exploitation scenario**

An admin suspends a business for a policy violation — say a listing posting illegal services. `GET /v1/businesses/that-slug` now correctly returns 404, and the listing disappears from search, the directory, and the home feed. But:

1. `GET /v1/media/businesses/that-slug/photos` still returns up to 12 approved photo URLs.
2. `GET /v1/media/business-covers?slugs=that-slug` still returns its cover URL.

The photos themselves live on public object storage, so the URLs were already publicly fetchable — this is not a leak of newly-private data. What it *is*: a takedown that does not fully take down, and an API that will happily confirm the suspended listing still exists and render its imagery on any surface that calls the covers endpoint with a stale slug list. If the suspension was for illegal or abusive imagery, the imagery is still being served by Manzil's own API after the takedown.

**Severity rationale:** Medium, not High. No private data crosses a boundary and no authorization is bypassed. It is an incomplete remediation of a finding already accepted as real (`6c0027f`), on a content-moderation control, which is why it is not Low.

**Remediation (not applied — this audit is read-only):** apply the same two-clause predicate in both places. `PUBLICLY_VISIBLE` is currently duplicated in three files (`database.repository.ts:62`, `gurman.retriever.ts:21`, and implicitly in `home.repository.ts`); a single exported constant would make the next omission structurally harder.

### F-2 · Medium · `apps/backend/` is an undeployed second API with an unrole-gated admin controller

**Evidence**

`apps/backend/` contains a complete second NestJS application (`apps/backend/src/app.module.ts` and 20+ source files). It is:
- **not** in the npm workspaces list — `package.json:6-14` lists `packages/shared`, `packages/db`, `apps/api`, `apps/web`, `apps/admin`, `apps/mobile`, `marketing-office/telegram-bot`
- **not** deployed — `railway.json` builds `apps/api/Dockerfile` and starts `apps/api/dist/main.js`

Its admin surface has authentication but no authorization:

`apps/backend/src/admin/admin.controller.ts:5-6`
```ts
@Controller('admin')
@UseGuards(JwtAuthGuard)
```
No `@Roles`, no permission decorator. The routes beneath it are `GET claims/pending`, `POST claims/:id/approve`, `POST claims/:id/reject`, `GET moderation-queue` — i.e. **any authenticated user could approve their own business claim**.

**Exploitation scenario**

Not exploitable today: the code is not built, not deployed, and not in the workspace. The scenario is operational. Someone adds `apps/backend` to the workspaces array to fix a build error, or points a second Railway service at it, or a future agent greps for "admin claims approve" and edits the wrong file. At that moment the platform gains an endpoint where a `consumer`-role user with any valid JWT approves their own ownership claim over any business in the directory — the exact ownership-transfer bypass this audit exists to prevent.

**Severity rationale:** Medium. Dead code with a live-looking authorization hole, one config line away from being reachable. Recommend deletion, or relocation outside `apps/` with a README stating it is a superseded scaffold.

### F-3 · Medium · No audit trail for business-owner mutations, and the schema cannot record one

**Evidence**

`packages/db/schema.prisma:581-599`
```prisma
model AuditLog {
  actorId     String
  ...
  actor AdminUser @relation(fields: [actorId], references: [id])
}
```

`actorId` is a foreign key to **`AdminUser`**. A business owner is a `User`. `writeAudit` (`console/audit.util.ts:23-36`) therefore *cannot* record an owner action — the insert would violate the FK.

The consequence is visible in the call sites. `writeAudit` is called only from admin paths:

| Audited today | Location |
|---|---|
| `claim.approve`, `claim.reject` | `database.repository.ts:853, 939` |
| `report.resolve`, `report.reject` | `database.repository.ts:494, 532` |
| `admin.login.success`, `admin.login.failed` | `console-auth.controller.ts:90, 119` |
| business approve / reject / merge / edit / feature, photo moderation, review moderation, user ban/suspend/unban, plan + feature edits, legal publish, category upsert, notification reads, Supabase browsing | `console/*.repository.ts` |

**Not audited — every owner-side mutation:**

- `PATCH /businesses/:slug` — profile edits including `legalName` and `taxId` (`database.repository.ts:258`)
- announcement create / update / delete (`crm.repository.ts:290, 333, 361`)
- package create / update / delete (`crm.repository.ts:406, 440, 466`)
- booking create and status transitions, including the completion that writes a `Customer` row and awards loyalty (`bookings.repository.ts:162, 210, 239`)
- campaign create / activate / **run** — the action that sends messages to real customers (`campaigns.repository.ts:111, 140, 177`)
- **marketing consent changes** (`customers.repository.ts:106`) — a consent record with legal weight, written with a timestamp but no actor, no IP, and no before/after
- **subscription tier changes** (`crm.repository.ts:587`) — billing state, unaudited
- review replies (`database.repository.ts:388`), photo uploads and cover changes (`media.controller.ts:107, 173`), claim submission (`database.repository.ts:591`)

**Why this is Medium and not Low:** the two most consequential owner actions — sending marketing messages to a customer list, and recording/withdrawing the consent that authorizes those sends — leave no attributable record. If a customer complains that they were messaged without consent, there is no way to establish who set the flag, from where, or when it changed. That is a compliance exposure, not merely a missing feature.

**What a complete implementation needs**

| Field | Present today | Notes |
|---|---|---|
| user (actor) | ⚠️ admin only | Needs a polymorphic actor: `actorType` (`admin` \| `user` \| `system`) + `actorId`, dropping the hard FK, or a nullable `userActorId` alongside the existing FK |
| business | ❌ | Add `businessId` — the natural filter for "show me everything that happened to this listing", and the join key an owner-facing activity log would need |
| action | ✅ | `action: String` |
| timestamp | ✅ | `createdAt @default(now())` |
| IP | ⚠️ | Column exists; populated on console paths and admin login, `null` elsewhere |
| before/after | ✅ | `beforeState` / `afterState` as `Json?` — used well on the console paths |
| request id | ❌ | Absent entirely |

**Epic 18 pairing.** The idempotency-key work now in flight is the natural carrier for the request id. An idempotency key is already a client-supplied, per-mutation unique token that the server persists; extending the same record with `requestId` (or reusing the idempotency key as the correlation id) gives every audit row a handle that ties it to the exact HTTP attempt, including retries. Doing this while the idempotency middleware is being written costs almost nothing; retrofitting it later means touching every mutation path twice.

### F-4 · Low · Business claim submission has no dedicated rate limit

**Evidence**

`apps/api/src/modules/controllers/claims.controller.ts:12-14` — `POST /v1/claims` carries `@UseGuards(ManzilAuthGuard)` + `@RequireAuth()` and **no `@Throttle*` decorator**, so it falls through to `DEFAULT_THROTTLE` — 300 requests per minute (`security/throttle.config.ts:16-20`).

By contrast `POST /v1/crm/register`, the *other* way a user acquires a business, carries `ThrottleRegister()` — 5 per hour with a 1-hour block (`crm.controller.ts:59`).

**Why it matters:** `createClaim` flips the target business to `status: "pending_claim"` (`database.repository.ts:600-603`) and writes `phone` and `displayName` onto the caller's `User` row (`:582-589`). 300/minute against a list of unclaimed slugs would mass-flip the directory into a pending state and flood the admin claim queue. Anti-hijack protection on already-claimed businesses is correct (`:556-563`), so this is queue/state spam, not ownership theft — hence Low.

### F-5 · Low · Public writes accept suspended and merged businesses

**Evidence** — three public write paths resolve the business with a bare `findUnique`/`findFirst` and no visibility predicate:

- `POST /v1/businesses/:slug/visit` → `crm.repository.ts:624-627`
- `POST /v1/analytics/businesses/:slug/events` → `analytics.controller.ts:70-73`
- `POST /v1/businesses/:slug/reviews` → `database.repository.ts:330-336`

A suspended listing keeps accruing visits, funnel events, and reviews. A review left on a *merged* duplicate attaches to the dead row rather than the surviving listing, so it is invisible to readers and to the surviving business's owner, and it silently skews `avgRating` on a business nobody can see. Low: no data crosses a boundary, and the effect is data-quality rather than access.

### F-6 · Low · Two ownership predicates with divergent rules

**Evidence**

`crm/business-ownership.util.ts:21-26` — the canonical predicate:
```ts
const isOwner =
  business.claimedByUserId === actor.userId ||
  (business.status === "pending_claim" && business.createdByUserId === actor.userId);
if (actor.role !== "admin" && !isOwner) throw new ForbiddenException(...)
```

`repositories/database.repository.ts:1008-1021` — a second predicate used by `PATCH /businesses/:slug` and `POST /reviews/:id/replies`:
```ts
if (actor.role === "admin") return;
if (actor.role === "business_owner" && actor.userId && business.claimedByUserId === actor.userId) return;
throw new ForbiddenException(...)
```

`media/business-ownership.ts:18-23` — a third, deliberately a plain boolean so a non-owner upload degrades to `pending` instead of throwing (documented at `:1-11`; this one is fine).

The divergence between the first two: `assertCanManageBusiness` additionally requires `actor.role === "business_owner"`, and does **not** honour the `pending_claim` + `createdByUserId` case.

**Both directions fail closed** — `assertCanManageBusiness` is strictly stricter, so this is not a bypass. It is a correctness and maintenance risk: an owner whose `User.role` has not been upgraded can drive the entire CRM but is rejected by profile editing. The real hazard is drift — the next person to relax a rule may relax the wrong copy. Recommend collapsing to one function.

### F-7 · Low · Any authenticated user can create `pending` Photo rows against any business

**Evidence** — `apps/api/src/modules/controllers/media.controller.ts:55-89`. `POST /v1/media/presign` accepts `ownerType: "business"` with any `ownerId`, verifies only that the business **exists**, and issues a presigned upload URL plus a `Photo` row. Ownership determines `moderationStatus` (`approved` for the owner, `pending` otherwise), not access.

This is documented as intentional at `:83-87` and the moderation status is computed server-side from the database row, never from a client flag — the important part is correct. The residual issue is that an authenticated stranger can create unbounded `pending` Photo rows and storage objects against businesses they do not own, bounded only by `ThrottleUpload` (20 per 5 minutes, `throttle.config.ts:59-60`). Pending photos are never served publicly (`media.controller.ts:267`), so this is a storage-cost and moderation-queue concern, not a disclosure one.

### F-8 · Info · `Permissions-Policy` absent on the API

Covered under Security headers below.

### F-9 · Info · Draft state is protected by route absence, not by a predicate

Covered under Draft visibility below.

### F-10 · Low · `apps/admin` ships zero security headers

**Evidence**

`apps/admin/next.config.ts` is seven lines in full:
```ts
const nextConfig = {
  transpilePackages: ["@manzil/shared"],
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: false }
};
```
No `headers()` function. `apps/admin/middleware.ts` sets none either — it only wraps `clerkMiddleware`. There is no reverse-proxy layer that could add them: the repo contains no `vercel.json`, no nginx or Caddy config, and `railway.json` covers build/deploy/healthcheck only. The API's own `helmet` (`apps/api/src/main.ts:43`) protects the API origin, not the admin frontend origin.

**All six are absent** from the admin console: `Content-Security-Policy`, `Strict-Transport-Security`, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`.

The contrast is the point. `apps/web/next.config.ts:75-100` configures all six, carefully, with comments explaining each choice — `frame-ancestors 'self'` deliberately agreed with a `SAMEORIGIN` legacy fallback, HSTS at two years with `preload`, `Permissions-Policy` denying camera/microphone/geolocation, `X-XSS-Protection: 0` with a note on why the legacy auditor is worse than nothing. That care was simply never applied to the sibling app, which happens to be the one holding ban, suspend, merge, approve, plan-pricing and Supabase-browsing powers.

**Severity rationale — Low, deliberately.** I could not construct a clean exploit path, and inflating this would be dishonest:

- **Clickjacking is largely self-mitigating.** Framing the console cross-site would not carry the session: Clerk's session cookie is `SameSite=Lax`, and Lax cookies are not sent on cross-site iframe subresource requests. The framed page renders logged-out, so there is nothing to trick a click into.
- **HSTS adds downgrade protection only.** Both hosting targets terminate TLS and serve no plaintext origin.
- **`nosniff` matters where user-controlled content is served** as a document; the console renders server components and proxies JSON.

It is nonetheless a real omission on the highest-privilege surface in the product, and it is ranked first in the recommendations *because the fix is trivial* — not because the risk is large. Risk reduction per unit of effort is what makes it worth doing this week.

### F-11 · Medium · Console business detail returns legal, tax and PII data under `business.view`

**Evidence**

`GET /v1/console/businesses/:id/detail` requires exactly one permission:

`apps/api/src/modules/console/console.controller.ts:88-89`
```ts
@Get("businesses/:id/detail")
@RequirePermission("business.view")
```

Its payload (`apps/api/src/modules/console/console-curation.repository.ts:42-141`) includes:

- `legalName` and `taxId` — the Uzbek STIR (`:96-97`)
- `claimedByUser` — the owner's `displayName`, **`email` and `phone`** (`:47`)
- `legal.acceptances[]` — every terms acceptance with document kind/version, `acceptedBy`, and **`ipAddress`** (`:123-132`)
- `legal.contracts[]` — contract numbers, template versions, generation timestamps (`:133-139`)
- `subscription` — plan and billing status (`:48`)

Meanwhile the console treats legal data as its own permission tier: `GET /v1/console/legal` is gated on `legal.view` (`console.controller.ts:135-136`), and `POST /v1/console/legal` on `legal.publish` (`:141-142`).

The admin UI reflects the intended boundary — `apps/admin/app/businesses/[id]/page.tsx:103` computes `canViewLegal = can(me, "legal.view")` and hides the legal block at `:297`. That gate is applied to data the server already sent. Because the page is a React Server Component the hidden fields never reach the browser bundle, so **this is not a client-side leak**; the UI author correctly assumed a boundary that the API does not enforce.

**Exploitation scenario**

Grant a junior moderator the `business.view` permission so they can triage listings — a reasonable, minimal-looking grant, and the console's own `GET /console/businesses` list route requires exactly that. They open the browser devtools network tab on the business detail page they are legitimately allowed to view, or simply `curl` the endpoint with their session cookie:

```
GET /v1/console/businesses/<id>/detail
Cookie: manzil_admin_session=<their own valid session>
```

The response hands them every listed business's STIR, legal entity name, owner email and phone, signed contract numbers, and the IP address from which the owner accepted the terms. Iterating the id list from `GET /console/businesses` — which they are also entitled to — turns this into a full dump of the platform's business-registry PII and legal records by someone holding only a read-triage permission. No `legal.view` grant, no audit distinction, and nothing in the console tells them they crossed a line.

**Compounding factor — this read is not audited.** `GET /console/supabase/tables/:table` passes an actor context and writes an audit row, on the stated principle that "browsing production data, including other people's PII, is an auditable act" (`console.controller.ts:327-331`). But `businessDetail` and `businessConsumers` call `this.curation.getBusinessDetail(id)` / `getBusinessConsumers(id)` with **no `ctx`** (`console.controller.ts:90-91, 97-98`) and write nothing. So the endpoint that returns STIR, contracts, acceptance IPs and owner PII — plus the sibling route that returns a business's full customer and reviewer list — leaves no trace of who read it. The Supabase browser is held to a standard these two are not, despite returning comparable data.

**Severity rationale:** Medium. It is a genuine privilege-boundary violation with a straightforward path and sensitive data (tax IDs, contract records, IP addresses attached to legal consent). It is not High because the actor must already be an authenticated, active `AdminUser` — this is privilege escalation *within* the admin population, not a boundary an outsider crosses. It is also the one place in the audit where the RBAC model's own vocabulary (`legal.view` exists as a distinct permission) is contradicted by an endpoint.

**Remediation direction (not applied):** either split the endpoint so the legal/contract/tax block is a separate `legal.view`-gated fetch, or apply a permission check inside the handler and omit the block when the caller lacks `legal.view` — the same opt-in shape `mapBusiness`'s `includeLegalIdentity` already uses successfully on the public side (`database.repository.ts:1099-1104`).

### F-12 · Low · Admin dev-header fallback has no environment guard

**Evidence**

`apps/admin/lib/console.ts:19-23`
```ts
// Local dev without Clerk: impersonate the bootstrap admin via dev headers.
if (!headers.Authorization && process.env.ADMIN_DEV_CLERK_ID) {
  headers["x-manzil-role"] = "admin";
  headers["x-manzil-user-id"] = process.env.ADMIN_DEV_CLERK_ID;
}
```

There is **no `NODE_ENV` check**. The sole condition is that no Clerk token was obtained and `ADMIN_DEV_CLERK_ID` is set. Compare the web app's equivalent (`apps/web/app/lib/auth.ts:28-34`), which requires `NODE_ENV !== "production"` *and* `MANZIL_DEV_AUTH !== "false"` *and* no Clerk key, and restricts the headers to `/admin*` and `/console*` paths.

**Why this is Low and not High:** it fails closed at the receiving end. `ClerkAuthService` accepts dev headers only when `MANZIL_DEV_AUTH === "true"` **and** `NODE_ENV !== "production"` **and** Clerk is not configured (`clerk-auth.service.ts:12-13, 24-26`). A production API rejects them outright. The finding is that the admin console would *emit* forged admin credentials on every unauthenticated request if `ADMIN_DEV_CLERK_ID` were ever set in a production environment — a single stray variable away from sending admin-impersonation headers over the wire, defended only by the far end's discipline. Defence in depth means not relying on that.

### F-13 · Low · `MANZIL_DEV_AUTH` has opposite defaults on the two sides

`apps/web/app/lib/auth.ts:31` treats the flag as **opt-out** (`MANZIL_DEV_AUTH !== "false"` — absent means enabled). `apps/api/src/modules/auth/clerk-auth.service.ts:13` treats it as **opt-in** (`MANZIL_DEV_AUTH === "true"` — absent means disabled).

Both are individually defensible and the composition is currently safe, because the restrictive side is the one that decides. But one environment variable with inverted polarity across two apps is a trap for whoever next reasons about it: reading either file alone yields a confident and wrong belief about what unsetting the variable does.

### F-14 · Info · `apps/web` CSP allows `'unsafe-inline'` in `script-src`

`apps/web/next.config.ts:60` includes `'unsafe-inline'` in `script-src` with no nonce or hash mechanism (`'unsafe-eval'` is correctly dev-only). This materially weakens the CSP's value as an XSS mitigation — an injected inline `<script>` executes.

Recorded as informational rather than a finding: it is the standard trade-off for Next.js without nonce plumbing, everything else in that header block is well-configured, and no XSS sink was identified in this audit. Worth revisiting when Next's nonce support is wired up, not worth blocking on.

---

## Frontend (`apps/web`, `apps/admin`) — report only

The brief asked one question: does the frontend ever treat a client-side `isOwner` check as security? **It does not.** Every ownership and role gate found in either app is a UI affordance backed by an independent server-side check.

### Client-side ownership filtering — **no findings**

The strongest evidence is structural. **Every** dashboard page re-derives its business scope from an authenticated server call to `GET /v1/businesses/mine` rather than from a URL parameter:

`dashboard/page.tsx:50-51` · `bookings/page.tsx:76` · `analytics/page.tsx:77` · `customers/page.tsx:39` · `customers/[id]/page.tsx:52` · `reviews/page.tsx:45` · `packages/page.tsx:24` · `announcements/page.tsx:134` · `settings/page.tsx:29`

There is consequently **no `?business=` IDOR surface on any owner-facing read** — the client cannot ask for a business it does not own, because it never names one. The layout gate (`apps/web/app/[locale]/(workspace)/dashboard/layout.tsx:26-35`) is a server-side `auth()` that renders a sign-in panel instead of children, not a client redirect.

Writes *do* carry a slug in a hidden form field (`bookings/page.tsx:149`, `announcements/page.tsx:186, 252`, `settings/page.tsx:89` → `apps/web/app/lib/crm-actions.ts:166, 198, 309`). This is correct and expected: the API re-derives ownership from the session on every one of those calls via `requireOwnedBusiness`. The hidden field says *which*; the session says *whether*. `PATCH /businesses/:slug` is additionally DTO-allowlisted (`apps/api/src/modules/controllers/business.dto.ts:36-40`) so an owner cannot smuggle a status or ownership reassignment into a profile edit.

Client components using `isSignedIn` (`claim-form.tsx:35`, `helpful-button.tsx:33, 71`, `review-form.tsx:126`, `header-auth.tsx:12, 28`) are pure affordances — the API rejects unauthenticated calls regardless. `apps/web/app/lib/mock-api.ts:143` sets `role: "business_owner"` in fixture data, not in a gate.

### Route protection — **no findings**

- `apps/admin/middleware.ts:10-16` — `clerkMiddleware` + `auth.protect()` on everything except `/sign-in(.*)` and `/access-denied`. **Authentication only**, and the comment at `:8-9` says so explicitly; authorization is per-page plus API-side.
- `apps/web/middleware.ts:88-90` — deliberately performs no authorization, handling only locale redirects and Supabase session refresh. Admin gating was moved out, and `apps/web/app/[locale]/(workspace)/admin/` is now an empty directory with no route.
- Admin console pages are all server components that fetch `getMe()` and gate on the returned permission set (`audit/page.tsx:33`, `businesses/page.tsx:39`, `categories/page.tsx:21`, `plans/page.tsx:24`, `reviews/page.tsx:28`, `users/page.tsx:29`, `legal/page.tsx:24`, `analytics/page.tsx:32`), with a step-up re-check before every mutation at `apps/admin/lib/actions.ts:13-18` — and the API re-checking independently via `@RequirePermission` regardless.

One observation, not a finding: both middlewares gate Clerk on `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` being set (`web:6`, `admin:5`). If that variable were missing from a production deploy, `apps/admin/middleware.ts:16` degrades to `NextResponse.next()` and the edge authentication gate silently disappears. It still fails closed overall — pages call `getMe()` and the API enforces `PermissionGuard` — but the failure is silent, and a loud one would be better.

### API calls and dev headers

Bearer tokens are attached consistently: server-side at `apps/web/app/lib/auth.ts:37-42` and `apps/admin/lib/console.ts:12-14`; browser-side in `claim-form.tsx:45, 50`, `helpful-button.tsx:44, 47`, `review-form.tsx:59, 139, 144`, `photo-upload.tsx:75, 170-174`, `business-photo-manager.tsx:59-68`. The legacy console path forwards the httpOnly `manzil_admin_session` cookie server-to-server (`apps/web/app/lib/auth.ts:22-26`), re-issued with `httpOnly`, `sameSite: "lax"`, and `secure` in production (`apps/web/app/lib/console-actions.ts:78-84`).

Two dev-mode auth bypass emitters exist, both server-side only (never reachable from a browser): `apps/web/app/lib/auth.ts:44-49` and `apps/admin/lib/console.ts:20-23`. See F-12 and F-13. Dev headers are also scrubbed from Sentry events (`apps/api/src/instrument.ts:40-41`).

### `NEXT_PUBLIC_*` secrets exposure — **no findings**

Every `NEXT_PUBLIC_*` variable in either app is a legitimate public identifier. No service-role key, private API key, or admin token is exposed through a public-prefixed name. Inventory (**names and locations only — no values were read or reproduced**):

`NEXT_PUBLIC_API_URL` · `NEXT_PUBLIC_SUPABASE_URL` · `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (publishable/anon by design — RLS is the boundary) · `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` · `NEXT_PUBLIC_SENTRY_DSN` / `_ENVIRONMENT` / `_TRACES_SAMPLE_RATE` · `NEXT_PUBLIC_APP_URL` · `NEXT_PUBLIC_USE_MOCK`

Genuinely secret variables are correctly server-only: `CLERK_SECRET_KEY`, `SENTRY_AUTH_TOKEN` (`apps/web/next.config.ts:140`), `ADMIN_DEV_CLERK_ID`, `CLOUDFLARE_R2_PUBLIC_URL`, `ADMIN_SESSION_SECRET`.

**No credential was found committed to git.** Untracked `.env` files exist at the repo root and under `apps/web` and `apps/admin`; none was opened, and their contents are not reproduced anywhere in this document. Confirming they are covered by `.gitignore` is a worthwhile one-line check that was not performed as part of this read-only review.

### Dead frontend code

`apps/web/app/lib/console-api.ts`, `apps/web/app/lib/console-actions.ts`, and `apps/web/app/components/admin/` serve an admin surface whose routes no longer exist — `apps/web/app/[locale]/(workspace)/admin/` is empty. Removing them would also eliminate the web app's only dev-header emitter (`apps/web/app/lib/auth.ts:44-49`). Housekeeping, not a finding, but it shares a shape with F-2: retired code that still contains live-looking auth logic.

---

## Areas that came back clean

### Client-trust violations — **no findings**

A systematic grep for ownership derived from client input returns nothing across `apps/api/src`:

```
body.businessId · body.ownerId · body.userId · body.organizationId
body.actorId · body.role · body.claimedByUserId
query.businessId · query.ownerId · query.userId
→ 0 matches
```

Three routes accept an identifier that *looks* client-controlled; all three are correct:

- `POST /v1/billing/checkout` takes `body.businessSlug` → fed to `requireOwnedBusiness` (`billing.controller.ts:37`).
- `POST /v1/auth/sync` takes a body, but reads identity exclusively from `request.manzilActor` (`auth.controller.ts:30-38`), with the reasoning documented at `:17-22`.
- `POST /v1/media/presign` takes `ownerType`/`ownerId` → used to locate the target; the trust decision is computed server-side (`media.controller.ts:64`).

**No repository method filters by slug where it should filter by ownership.** Every slug-taking repository method in `crm/`, `plans/`, `analytics/` and `legal/` calls `requireOwnedBusiness` (or an explicit equivalent) *before* the slug is used as a filter, and thereafter filters on the resolved `business.id`.

Two id-taking methods were checked specifically for the "id alone is authorization" mistake and both compound the id with the owned business id:

- `customers.repository.ts:131-135` — `findFirst({ where: { id: customerId, businessId: business.id } })`
- `customers.repository.ts:97-101` — same shape for consent

Additionally, `class-validator` runs globally with `whitelist: true` and `forbidNonWhitelisted: true` (`main.ts:77-84`), so a client cannot smuggle an extra `role`, `status`, or `claimedByUserId` field into any DTO-typed create or update.

### Coverage of `requireOwnedBusiness` — **no findings**

Every owner-scoped operation routes through it or through a documented equivalent. Checked exhaustively:

| Surface | Covered by | Evidence |
|---|---|---|
| Packages / services | `requireOwnedBusiness` | `crm.repository.ts:393, 403, 431, 465` |
| Announcements | `requireOwnedBusiness` | `crm.repository.ts:277, 287, 317, 360` |
| Campaigns | `requireOwnedBusiness` + entitlement | `campaigns.repository.ts:59, 105, 137, 165, 191` |
| Customers | `requireOwnedBusiness` | `customers.repository.ts:59, 95, 129` |
| Segments | `requireOwnedBusiness` | `segments.repository.ts:115, 163` |
| Bookings | `requireOwnedBusiness` | `bookings.repository.ts:58, 114, 194` |
| Analytics | explicit owner check | `analytics.controller.ts:108-120` |
| Photos | `isBusinessOwner` | `media.controller.ts:160, 214` |
| Plan / subscription | `requireOwnedBusiness` | `crm.repository.ts:575, 613` |
| Billing checkout | `requireOwnedBusiness` | `billing.controller.ts:37` |
| Legal contract / acceptances | `requireOwnedBusiness` | `legal.controller.ts:39, 48` |
| Stats | `requireOwnedBusiness` | `crm.repository.ts:488` |
| Review replies | `assertCanManageBusiness` | `database.repository.ts:386` |
| Business profile edit | `assertCanManageBusiness` | `database.repository.ts:256` |

The record-id routes (`/announcements/:id`, `/packages/:id`, `/bookings/:id/status`, `/campaigns/:id/*`) all use the same safe pattern: load the record, read `record.business.slug`, then authorize. The id is never treated as a capability.

**No missed call site was found.** This was the most likely place for a real vulnerability and it is clean.

### Private data in public responses — **no findings**

The serialization layer was reviewed, not just the controllers.

`mapBusiness` (`database.repository.ts:1065-1106`) gates `legalName` and `taxId` (the Uzbek STIR) behind an opt-in `includeLegalIdentity` flag. Exactly two call sites pass it, both owner-scoped after an ownership assertion:
- `listOwnedBusinesses` — `:209`
- `updateBusiness` — `:284`, immediately after `assertCanManageBusiness` at `:256`

Every public path (`search`, `listBusinesses`, `getBusiness`, lists, occasions, claims) takes the default and never emits them. Verified by reading each call site, not by trusting the comment.

- `claimedByUserId` / `createdByUserId` / `mergedIntoId` — never emitted by `mapBusiness` under any option.
- `mapReview` (`:1108-1126`) emits `authorName` (display name) only — no email, no `userId`.
- `mapReport` (`:1175-1210`) emits the reporter's email, reachable only via `GET /v1/admin/moderation` under `@Roles("admin")`.
- `listClaims` (`:765-787`) emits requester email, phone and role — admin-only.
- `Business.email` / `phone` / `website` / `instagram` / `telegram` are emitted publicly by design; these are the `Business` contact columns collected at registration (`crm.repository.ts:177-181`), distinct from `User.email`. No owner account email reaches a public response.

**Cache poisoning across trust levels was checked specifically** — this is where a serialization gate usually fails. It does not here:
- The public detail cache key is `businesses/detail:${slug}` (`:215`) and its value is the default-mapped public payload.
- `listOwnedBusinesses` — the one path that emits STIR — is **not cached** (`:175-212`, direct Prisma read).
- `updateBusiness` returns its enriched payload directly and invalidates the public namespace (`:280-284`).
- Analytics is cached under `analytics/business:${businessId}:${days}` (`analytics.repository.ts:58`) — business-scoped, with ownership asserted before the call.

No cache entry is shared between an owner-scoped and a public read.

### Draft visibility — **no findings today; the model cannot carry Epic 19**

Unpublished content is unreachable from any public route:

- `Announcement.status` is `draft | published | archived` (`crm.repository.ts:57`). The **only** route that serves announcements is `GET /v1/crm/businesses/:slug/announcements`, which is owner-gated (`crm.repository.ts:277`) and deliberately returns all statuses so an owner can see their own drafts.
- `BusinessPackage.isActive` — same shape, owner-gated only.
- Campaigns — owner-gated plus entitlement.

A repo-wide search confirms `announcement` and `businessPackage` appear in exactly three places outside tests: the CRM module (owner-gated), `console-supabase.repository.ts` (admin, permission-gated, audited), and the `intelligence/` engines — which register **no controllers** (`intelligence.module.ts` declares none) and are therefore unreachable over HTTP.

**The honest framing: today's boundary is the absence of a public route, not a predicate.** Nothing in the data layer distinguishes a draft from a published announcement on read; the safety comes from there being no public reader at all.

**Can today's model enforce Epic 19's Draft → Scheduled → Published → Expired → Archived state machine? No.**

1. The `AnnouncementStatus` enum has three values. `scheduled` and `expired` do not exist.
2. `startsAt` / `endsAt` exist on `Announcement` (`crm.repository.ts:298-299`) and are written, but **no read path anywhere evaluates them**. They are inert columns today.
3. There is no shared, exported published-visibility predicate for announcements — the analogue of `PUBLICLY_VISIBLE` for businesses. The first public feed route will have to invent one, and (per F-1, where the business predicate was duplicated into three files and applied to three of five paths) hand-copied predicates are exactly how a draft ends up public.

**Recommendation for Epic 19, before the first public feed route lands:** extend the enum, then define one exported `PUBLISHED_ANNOUNCEMENT_WHERE` that combines status, the `startsAt`/`endsAt` window, and the business's own `PUBLICLY_VISIBLE` predicate — and make the public feed the only consumer of it. Getting this in before the route is cheap; retrofitting it after a draft leaks is not.

### Authentication mechanics — **no findings**

- Identity and role are resolved from the **database** on every request (`clerk-auth.service.ts:65-75`), not from token claims. A user cannot self-assign `admin` by editing a JWT payload.
- Dev-header auth is double-gated: `MANZIL_DEV_AUTH === "true" && NODE_ENV !== "production"` (`clerk-auth.service.ts:12-13`) **and** `!isClerkConfigured()` (`:24-26`). In production with Clerk configured, both gates are closed.
- Admin session cookies are HMAC-SHA256 signed with `timingSafeEqual` comparison, fail closed with no secret configured, and carry an explicit expiry (`admin-session.util.ts:42-97`). `httpOnly`, `sameSite=lax`, `secure` in production, path-scoped to `/v1/console` (`console-auth.controller.ts:42-52`).
- Admin login returns an identical error for unknown username, wrong password, and deactivated account, and always runs the password comparison so timing does not distinguish them (`admin-auth.service.ts:87-110`, `console-auth.controller.ts:31`).
- The console explicitly refuses to accept a Clerk actor as an admin credential — one door only (`admin-auth.service.ts:51-75`).
- CORS refuses to boot in production with a wildcard or unset `WEB_ORIGIN` (`main.ts:61-67`, `security/cors.config.ts:29-39`).

---

## Rate limiting

Rate limiting is **global by default** — `ManzilThrottlerGuard` is registered as an `APP_GUARD` (`app.module.ts:114`), so a route is limited unless it opts out. That is the right default and it means no newly added endpoint is silently unthrottled.

| Surface | Dedicated limit | Config | Evidence |
|---|---|---|---|
| **Login** (admin console) | ✅ | 5 / 15min, **1h block** | `console-auth.controller.ts:72`, `throttle.config.ts:98-99` |
| **Login** (Clerk session exchange) | ✅ | 10 / min, 5min block | `auth.controller.ts:43`, `throttle.config.ts:39-40` |
| **Review submission** | ✅ | 20 / min, 2min block | `businesses.controller.ts:90` |
| **Messages** (campaign run — the only outbound-message path) | ✅ | 20 / min, 2min block | `crm.controller.ts:300` |
| **Bookings** (create + status) | ✅ | 20 / min, 2min block | `crm.controller.ts:172, 182` |
| **Service creation** (packages) | ✅ create only | 20 / min | `crm.controller.ts:121` — `PATCH`/`DELETE /packages/:id` fall to default |
| **Announcements** | ✅ create only | 20 / min | `crm.controller.ts:90` — `PATCH`/`DELETE /announcements/:id` fall to default |
| **Gurman / AI** | ✅ | 10 / 15min, 30min block | `gurman.controller.ts:18`, `throttle.config.ts:87-88` |
| **Search** | ✅ | 30 / min | `search.controller.ts:14`; `GET /home` too (`home.controller.ts:13`) |
| **Business claim** | ❌ | default 300 / min | `claims.controller.ts:12` — **F-4** |
| **Business registration** | ✅ | 5 / hour, 1h block | `crm.controller.ts:59`, `throttle.config.ts:43-44` |

Also present: `ThrottleUpload` on presign (20/5min), `ThrottleVisit` on anonymous tracking (60/min), `ThrottleWebhook` on the Stripe receiver (deliberately generous — signature verification is the real boundary, and a tight limit would drop legitimate Stripe retries). `@SkipThrottle()` on `/health` is correct: Railway's deploy healthcheck polls it from one address and throttling it would fail a healthy deploy.

`ThrottleOtpSend` / `ThrottleOtpVerify` and the `phoneTracker` are defined (`throttle.config.ts:26-36`, `manzil-throttler.guard.ts:63-73`) but **not wired to any route** — no OTP endpoints exist yet. That is correct pre-positioning, not a gap.

### What "Redis is not provisioned in production" actually constrains

`RedisThrottlerStorage` (`security/throttler-redis.storage.ts`) uses an atomic Lua script for check-increment-block — genuinely correct distributed limiting, immune to the GET/INCR/SET race. But when `cache.client` is `null` it falls back to the in-memory `ThrottlerStorageService` (`:85-87`), and `CacheService` returns `null` whenever `REDIS_URL` is unset (`cache/cache.service.ts:26-29`).

With no Redis in production, **every limit in the table above is per-process and in-memory**. Stated honestly:

1. **They do still apply.** On a single Railway instance, the in-memory limiter enforces the configured numbers correctly. This is not "rate limiting is off."
2. **They do not survive a restart.** Counters and block markers live in process memory. The 1-hour block after five failed admin logins is erased by any deploy, crash, or restart — and Railway restarts on failure with up to 5 retries (`railway.json`). An attacker who can trigger or wait out a restart resets their own block. This is the single most consequential effect, because that limit is the only thing standing between a guessable admin password and the console.
3. **They multiply by replica count.** The moment the API scales past one instance, an N-replica deployment enforces N × the configured limit globally, and a client that reconnects lands on an arbitrary replica with an independent counter. The Gurman AI limit — the primary control on a paid LLM bill — degrades in direct proportion.
4. **The degradation is deliberate and fails closed, not open.** The code chooses per-instance limiting over no limiting (documented at `throttler-redis.storage.ts:57-67`). That is the right call.

**Bottom line:** the rate-limiting design is production-grade; its *durability* is not, and will not be until Redis is provisioned. Until then, treat the admin-login block as best-effort and rely on password strength rather than lockout. Provisioning Redis is a configuration change — the code is already written and already correct.

---

## Security headers

Set by `helmet` at `apps/api/src/main.ts:42-57`. The API serves JSON only, which justifies a much stricter posture than a browser-page default.

| Header | Status | Evidence |
|---|---|---|
| `Content-Security-Policy` | ✅ deny-all — `default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'` | `main.ts:44-51` |
| `Strict-Transport-Security` | ✅ production only — `max-age=15552000; includeSubDomains` | `main.ts:55` |
| `X-Frame-Options` | ✅ helmet default (`SAMEORIGIN`), plus `frame-ancestors 'none'` in CSP | `main.ts:43` |
| `X-Content-Type-Options` | ✅ `nosniff`, helmet default | `main.ts:43` |
| `Referrer-Policy` | ✅ explicit `no-referrer` | `main.ts:54` |
| `Permissions-Policy` | ❌ not set — helmet does not emit it by default | — |

`crossOriginResourcePolicy: "cross-origin"` (`main.ts:52`) is a deliberate relaxation so the web app on a different origin can read responses, and is documented as such.

**On the missing `Permissions-Policy` (F-8, Info):** it governs browser feature access (camera, geolocation, microphone) for *documents*. This API returns `application/json` under `default-src 'none'`; no document is ever rendered from it, so the header has no behaviour to govern. Adding it is harmless and costs one line, but calling its absence a vulnerability would be inflation. It matters on `apps/web`, not here.

`hsts` is correctly disabled outside production — enabling it would pin `localhost` in a developer's browser. Note it does not set `preload`; that is a deliberate, hard-to-reverse commitment and its absence is appropriate at this stage.

### The two frontends

Headers are per-origin, so the API's `helmet` config protects nothing on the web or admin origins. Those are configured independently — and inconsistently.

| Header | `apps/web` | `apps/admin` |
|---|---|---|
| `Content-Security-Policy` | ✅ `next.config.ts:76` (built `:52-73`) | ❌ **absent** |
| `Strict-Transport-Security` | ✅ `:92-94` — `max-age=63072000; includeSubDomains; preload` | ❌ **absent** |
| `X-Frame-Options` | ✅ `:88` — `SAMEORIGIN`, agreeing with `frame-ancestors 'self'` | ❌ **absent** |
| `X-Content-Type-Options` | ✅ `:78` — `nosniff` | ❌ **absent** |
| `Referrer-Policy` | ✅ `:77` — `strict-origin-when-cross-origin` | ❌ **absent** |
| `Permissions-Policy` | ✅ `:82-84` — camera/microphone/geolocation denied | ❌ **absent** |

`apps/web` additionally sets `X-XSS-Protection: 0` (with a comment explaining the legacy auditor is worse than nothing), `X-DNS-Prefetch-Control: on`, `poweredByHeader: false` (`:111`) and `productionBrowserSourceMaps: false` (`:108`). It is a well-considered configuration; its only weakness is F-14.

`apps/admin` has none of it — see F-10. No reverse proxy compensates: the repo contains no `vercel.json`, no nginx or Caddy configuration, and `railway.json` sets build, deploy and healthcheck only.

---

## RBAC maturity

### Two role models, deliberately separate

**1. Platform users — flat enum.** `User.role` is `consumer | business_owner | admin`, enforced by `@Roles(...)` on `ManzilAuthGuard` (`auth/manzil-auth.guard.ts:46-48`). Authorization for anything business-specific is **not** role-based at all — it is a direct ownership comparison, `business.claimedByUserId === actor.userId`. The role is a coarse gate; ownership is the real check. That is the right factoring and it is why the surface holds up.

**2. Admin console — genuinely granular.** `AdminUser → AdminUserRole → Role → RolePermission → Permission`, resolved into a permission `Set` per request (`admin-auth.service.ts:121-137`) and enforced per handler by `@RequirePermission` (`console/permission.guard.ts:66-70`). Roles are data, not code; permissions are declared next to each route. This is already a mature model — 20+ distinct permission slugs across 37 routes.

The separation is intentional and documented (`console.controller.ts:58-66`): mixing `User.role` and `AdminUser` on one admin surface is exactly how a permission check gets bypassed. Keeping `/admin/*` (7 routes, `User.role`) and `/console/*` (37 routes, `AdminUser`) apart is defensible, though the duplication of claim/report moderation across both is a consolidation opportunity, not a security issue.

### What granular business permissions would require

The Organization/Employee model does not exist yet (Epic 15). Ownership is currently **1:1** — one `claimedByUserId` per business — so today there is no such thing as "an employee with partial access." Recommendations, not a design:

1. **The join table is the whole change.** Moving from `Business.claimedByUserId` to a `BusinessMember(businessId, userId, role)` join is the structural move; everything else follows. Because *every* owner-scoped route already funnels through `requireOwnedBusiness`, the predicate can change in one file — `crm/business-ownership.util.ts` — and the entire CRM inherits it. That property is worth protecting: it exists only because coverage is currently complete (see "Coverage of `requireOwnedBusiness`"). Resolve F-6 (the second predicate in `database.repository.ts`) **before** Epic 15, or the change will need to be made in two places and one of them will be missed.

2. **Model permissions on the console's shape, not a new one.** The `Role → RolePermission → Permission` structure already works and is already understood. A business-side `member.role → permissions` mapping should mirror it rather than invent a parallel vocabulary.

3. **Start with roles, not a permission matrix.** Three or four named roles (`owner`, `manager`, `staff`, `viewer`) with fixed permission sets will cover the real cases — a barbershop owner does not want to compose an ACL. `SegmentsRepository`'s five fixed segments over a query builder (`segments.repository.ts:23-30`) is the same judgment applied to a different problem, and it was the right one.

4. **The permission boundaries the data already implies.** Reading customer PII, changing marketing consent, running campaigns, viewing revenue, and editing the legal identity (`legalName`/`taxId`) are each distinct sensitivity tiers that a flat "employee" role would flatten. They are the natural first permission splits.

5. **Entitlements and permissions must stay orthogonal.** The codebase already gets this right — `analytics.controller.ts:89-95` states it explicitly: an entitlement says which *features* a plan includes, never *who* may read a given business. Employee permissions must compose with entitlements, not substitute for them.

---

## Recommendations, ranked by risk reduction per unit of effort

Clearly separated from confirmed findings above. None of these has been applied.

### 1. Finish the `6c0027f` predicate and make it un-forgettable — *highest ratio*

Two lines of `where` clause (`media.controller.ts:258`, `business-cover.ts:38`) close F-1. Then export `PUBLICLY_VISIBLE` from one module and import it in the three places that currently redeclare it (`database.repository.ts:62`, `gurman.retriever.ts:21`, and the inline literals in `home.repository.ts`). The audit found the predicate applied to 3 of 5 public read paths *because* it is copied rather than shared; a single import turns the next omission into a compile-time-visible one. Minutes of work, and it removes the whole class of bug rather than the two instances.

### 2. Delete or exile `apps/backend/` — *near-zero effort, removes a latent admin bypass*

F-2 is one config line away from being a real unauthenticated-claim-approval endpoint. It is not in the workspaces list, not deployed, and superseded by `apps/api`. `git rm -r apps/backend` costs nothing and permanently removes the possibility. If it must be kept for reference, move it outside `apps/` with a README stating it is superseded and must never be deployed.

### 3. Stop `GET /console/businesses/:id/detail` handing legal and tax data to `business.view` — *modest effort, closes a real privilege boundary*

F-11 is the only finding in this audit where the RBAC model contradicts itself: `legal.view` exists as a distinct permission, gates `GET /console/legal`, and is checked by the admin UI at `apps/admin/app/businesses/[id]/page.tsx:103` — but the endpoint that actually carries STIR, contract records, owner email/phone and terms-acceptance IP addresses asks only for `business.view`. Roughly twenty lines: make the `legal` block conditional on the caller's permission set inside `getBusinessDetail`, using the same opt-in shape `mapBusiness`'s `includeLegalIdentity` flag already uses successfully on the public side. It closes a genuine intra-admin escalation path and, equally valuable, makes the permission vocabulary mean what the UI already assumes it means.

### Time-sensitive, higher effort — do it while Epic 18 is open

**Give `AuditLog` a polymorphic actor and a `businessId` (F-3).** This cannot be fixed incrementally: the `AdminUser` FK (`schema.prisma:593`) makes owner attribution structurally impossible, so it is a migration either way. Doing it now has two advantages that will not exist later. First, Epic 18's idempotency keys are being written this week and are the natural carrier for the `requestId` correlation field — adding it now is free, retrofitting means touching every mutation path a second time. Second, the highest-value call sites are small and known: `setMarketingConsent` (`customers.repository.ts:106`), `runCampaign` (`campaigns.repository.ts:177`), `chooseSubscription` (`crm.repository.ts:587`), and `updateBusiness` (`database.repository.ts:258`). Those four cover consent, outbound messaging, billing state, and legal-identity edits — the mutations most likely to be questioned after the fact. The rest can follow incrementally once the schema supports them.

### Trivial — worth folding into the same pass

- **Copy `apps/web`'s headers block into `apps/admin/next.config.ts`** (F-10). About fifteen lines, already written and commented in the sibling app. Low risk reduction, but the effort is close to zero and it removes an obvious asymmetry on the highest-privilege origin.
- **Add a dedicated throttle to `POST /claims`** (F-4). One decorator, mirroring `ThrottleRegister` on the other ownership-acquisition route.
- **Add a `NODE_ENV` guard to `apps/admin/lib/console.ts:20`** (F-12) and align the `MANZIL_DEV_AUTH` polarity across the two apps (F-13).

### Before their epic lands, not after

- **Collapse `assertCanManageBusiness` into `requireOwnedBusiness`** (F-6) *before* Epic 15. The reason the Organization/Employee migration is cheap today is that one file defines ownership for the entire CRM; a second, divergent copy is what turns a one-file change into a two-file change with one of them forgotten.
- **Define an exported `PUBLISHED_ANNOUNCEMENT_WHERE`** (F-9) *before* Epic 19's first public feed route exists. F-1 is the empirical argument: a hand-copied visibility predicate reached three of five paths.

---

## Closing assessment

**The architecture is sound, and that is the finding.**

Fourteen findings, none critical, none high. Not one route in 109 authorizes on client input. Not one repository method filters by slug where it should filter by ownership. Not one owner-scoped operation escapes `requireOwnedBusiness`. Not one frontend page treats a client-side ownership check as security — every dashboard page re-derives its scope from an authenticated server call rather than a URL parameter, so there is no owner-facing IDOR surface to attack. The one place where private data could plausibly leak into a cached public response — `legalName` and `taxId` through `mapBusiness` — is gated by an opt-in flag with exactly two call sites, both verified, and the owner-scoped path that passes the flag is deliberately uncached.

Changing `/businesses/iwash` to `/businesses/ravotsoy` changes the public page and nothing else. That claim was tested against the public surface, the owner surface, the serialization layer, the cache keys, and both frontends, and it held in every one.

What is genuinely missing is not ownership authorization but three things adjacent to it: **accountability** (F-3 — no owner action is attributable, and the schema cannot record one), **durability** (rate limits that do not survive a restart, pending Redis), and **one internal permission boundary that the model declares but the API does not enforce** (F-11). All three are real, all three are addressable, and none is a hole an outsider walks through today.

The strongest signal in this codebase is that the comments explaining *why* a security decision was made match what the code actually does — checked repeatedly during this audit, and it held every time, including in the two places where a plausible-looking decorator would have failed open (`EntitlementGuard` on campaign-id routes) and where a client-supplied flag would have been the obvious shortcut (`isOwnerUpload` in the presign path). That is not a common property, and it is worth defending.
