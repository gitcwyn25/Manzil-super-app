# Split by Role — Manzil API Service Decomposition

**Date:** 2026-08-05
**Status:** Approved — Phases A and B committed; Phase C conditional on a written trigger.
**Driver (user-stated):** independent deploy/scale.
**Method:** 8-agent design workflow — code-grounded coupling map, three independent proposals (minimal-cut, domain-driven, traffic-shaped), three-lens judge panel (cost, solo-maintainer, goal-fit), adversarial synthesis.

## Decision

**One Docker image, four roles, three phases — only the first two committed.**

A single image whose `AppModule` imports a feature-module set selected by `MANZIL_SERVICE_ROLE` (`all | public | core | console | gurman`, default `all` for local/CI). Zero inter-service RPC (one deliberate exception in Phase B). One Postgres, one Prisma schema, one migration history, one shared Redis. Deploy independence and failure independence are real because services never call each other at runtime.

Rejected alternatives, with code-grounded reasons:

- **Edge-as-reverse-proxy** (traffic proposal): makes public a hard runtime dependency of the other three — inverting the blast-radius argument — and forces `trust proxy: 2` everywhere; `main.ts:35` is verified correct for exactly one hop today, and its own comment warns a wrong hop count makes the rate limiter bucket all traffic together.
- **Private-network BFF** (domain proposal): dead on arrival — `.vercel/project.json` confirms `apps/web` deploys to Vercel, where `*.railway.internal` does not resolve.
- **Eight-service split / per-service databases**: sagas and split schemas for a 16-business catalog maintained by one person.

**Decisive constraint found in code:** `prisma.service.ts:6-8` calls `$connect()` in `onModuleInit` and `cache.service.ts:54` connects Redis in the constructor — any service handed a `DATABASE_URL` or `REDIS_URL` holds open sockets from boot and can never satisfy Railway's scale-to-zero condition. Only gurman (no DB, no Redis) is a credible sleeper. This is why Phase C costs ~+$5/mo, not the ~$1 a naive plan assumes, and why it is conditional.

## The four roles

### manzil-public — always-on, the site's pulse
- **Owns:** Health, Home, Search, Categories, Businesses (whole — never split a controller along an auth annotation), Reviews, Media, Lists, Occasions, Plans, Waitlist, Auth, Claims controllers; DatabaseRepository, HomeRepository, ReviewTrustRepository, PlansRepository, WaitlistRepository, Analytics write path, ClerkAuthService + ManzilAuthGuard, storage providers, CacheModule, SecurityModule, PrismaService.
- **Why separate:** every anonymous page view lands here; it must never cold-boot and must survive deploys of everything else. Today a hung Anthropic call or the console's 30-table browser shares its event loop.
- **Config:** existing Dockerfile + railway.json unchanged; `MANZIL_SERVICE_ROLE=public`; restricted Postgres role (SELECT on catalog tables + INSERT on businessVisit only) `?connection_limit=5`, direct 5432; `REDIS_URL` set; holds the public domain.

### manzil-core — the money and the long transactions
- **Owns:** Admin, Crm, Billing, Analytics, Legal (+Health); CRM repositories, StripeService, AlertService, LegalService, EntitlementGuard, ClerkAuthService.
- **Why separate:** the 20-second interactive registration transaction (`crm.repository.ts:156-239`), booking idempotency, claim approval, and the Stripe webhook (unauthenticated public POST needing `rawBody`) — none of which should share fate with the homepage, and none of which may sleep.
- **Config:** same image; `MANZIL_SERVICE_ROLE=core`; always-on; **the only service whose start command runs `prisma migrate deploy`** (exactly one migration owner, or concurrent deploys race the advisory lock); full-privilege DB role `?connection_limit=5`; `REDIS_URL` set.

### manzil-console — deploy isolation for the most-edited surface
- **Owns:** Console, ConsoleAuth (+Health); the four console repositories, AdminAuthService, PermissionGuard, writeAudit.
- **Why separate:** one operator, single-digit sessions/day, but the most-edited surface in the API (2,456 LOC) — its deploys most often threaten everything else. Highest-privilege process (30-table read browser). Independent identity (AdminUser + signed cookie) once the Clerk edge is cut.
- **Config:** same image; `MANZIL_SERVICE_ROLE=console`; **keeps `REDIS_URL` and does NOT sleep** — console actions bump the `businesses`/`home` cache namespaces the public site reads; dropping Redis would bump a per-process counter and serve the public site stale forever. Full-privilege DB role `?connection_limit=3`. Plainly: console separation buys deploy isolation, **not** security containment.

### manzil-gurman — the only true sleeper
- **Owns:** GurmanController (`POST /gurman/ask`), GurmanService, HTTP retriever behind the existing `GURMAN_RETRIEVER` token, AnthropicLlm (+Health). No tables, no datastores.
- **Why separate:** third-party latency, per-request Anthropic credit cost, p99 in seconds. Total failure is already a designed outcome (`UNAVAILABLE_RESULT`).
- **Config:** same image; `MANZIL_SERVICE_ROLE=gurman`; **no `DATABASE_URL`, no `REDIS_URL`, Sentry session tracking off** — all three, or it never sleeps; `INTERNAL_CATALOG_URL` → manzil-public. Enable Railway sleeping only after 48h of metrics confirm zero idle outbound traffic.

## Data strategy

One Supabase Postgres, one schema, one migration history. This buys deploy/scale independence and **zero** data independence — stated plainly, not dressed up. Enforced boundaries:

- **One Postgres role per service with GRANTs** — the only boundary a tired developer cannot bypass. Public gets minimal grants; core/console keep full privilege; gurman gets no DB at all.
- **`connection_limit` set explicitly per service (5/5/3), direct 5432, never the transaction-mode pooler** (hostile to the interactive transactions). Today the repo sets no limit anywhere → Prisma defaults to `num_cpus*2+1` per instance; set limits **in the monolith before any split**, or overlapping rolling deploys exhaust the Supabase cap and take everything down at once.
- **Redis stays one shared instance:** it is the cross-service cache-invalidation channel and the single global throttle-bucket space. `throttler-redis.storage.ts:85-87` silently degrades to per-instance in-memory limiting without Redis — a Redis-less service is an unthrottled service.

## Gateway strategy

**No gateway, no BFF, no proxy.** `apps/web/app/lib/api-base-url.ts` becomes four env-backed bases plus `apiUrl(path)` with cascading fallbacks (GURMAN ?? PUBLIC, CORE ?? PUBLIC, CONSOLE ?? CORE ?? PUBLIC). Prefix map: `/console` → console; `/admin /crm /billing /analytics /legal` → core; `/gurman` → gurman; everything else → public.

Every base defaults to PUBLIC, so the change is a production no-op until a Vercel env var is set; each cutover and each rollback is **one env var, ~60 seconds, no code deploy**.

CORS: set the same `WEB_ORIGIN` on all services (`resolveCorsOrigins` already handles it) — 8 call-site files are `"use client"` and hit the API from the browser, notably `concierge-chat.tsx` → gurman. Admin cookie needs no cross-domain work (forwarded server-side).

Known drift risk: role membership (api module lists) and the web prefix map are two config lists with no compile-time link — the route-manifest snapshot test exists precisely for this.

## Phases

**Phase A — free; committed. Do in the monolith regardless of any split.**
1. Refactor the flat `AppModule` (21 controllers + 33 providers, zero feature modules) into feature modules: PublicModule, CoreModule, ConsoleModule, GurmanModule, plus a PlatformModule for the genuinely shared core.
2. Cut the two auth edges: move `syncUser` out of `DatabaseRepository` into an `IdentityService` so `ClerkAuthService` (`clerk-auth.service.ts:18`) stops loading 1,186 lines of catalog code on every token verification; delete `ClerkAuthService` from console's `PermissionGuard` (`permission.guard.ts:30-33,52-57`) — the console has exactly one door (AdminUser + cookie) by design.
3. Fix the `AuditLog` identity collision while it is a one-file change (`schema.prisma:593` declares `actor AdminUser` but `database.repository.ts:994-1008` passes `User` ids as `actorId`).
4. Add `connection_limit` per the data strategy.
5. Add `MANZIL_SERVICE_ROLE` module selection + a route-manifest snapshot test per role (CI fails if a route changes owner).

**Phase B — ~cost-neutral; committed.** `GET /internal/catalog/visible` on public (reusing `VISIBLE_BUSINESS_WHERE`); swap `CatalogRetriever` for an HTTP retriever behind the existing DI token (one-provider change); deploy manzil-gurman with no datastores; set `NEXT_PUBLIC_API_GURMAN_URL` on Vercel. Revert = unset one variable.

**Phase C — conditional; NOT committed. Trigger, decided in advance:** a named incident within the last 90 days that a console/CRM deploy or failure took down (or would have taken down) the public site. Without that incident in writing, Phase C does not start. C1: peel off console. C2: split core from public and move `prisma migrate deploy` to core. Cost: roughly doubles hosting (~+$5/mo).

**Phase D — measure with a pre-committed undo.** Railway watch paths per service; watch one full billing cycle; the written undo rule: `MANZIL_SERVICE_ROLE=all` on the original service + unset the three Vercel vars = full rollback in ~60 seconds.

## Web changes (verified counts)

- `api-base-url.ts` — the one real edit (prefix router).
- Mechanical sweep `${API_BASE_URL}${path}` → `apiUrl(path)`: 55 references in 16 files.
- New optional Vercel vars: `NEXT_PUBLIC_API_GURMAN_URL` (Phase B), `NEXT_PUBLIC_API_CONSOLE_URL`, `NEXT_PUBLIC_API_CORE_URL` (Phase C).
- No change to Dockerfile, railway.json (`/v1/health` works in every role), or `trust proxy`.

## Test impact

Baseline: 23 suites, 182 tests, pass in ~22s. Phase A1 is near-zero impact (specs instantiate classes directly, not through AppModule). New tests: route-manifest snapshot per role; IdentityService unit tests; HTTP-retriever contract test against the internal catalog endpoint shape.

## Do NOT proceed to Phase C if any of these hold

- The hosting budget hasn't moved — the API was down *because of cost*; Phase C doubles it.
- No nameable incident in 90 days that the split would have prevented.
- Phase A isn't finished (splitting before cutting the auth edges welds `DatabaseRepository` into every service).
- The route-manifest snapshot test isn't being maintained.
- The native Android app is about to ship — freeze the API surface first; native apps hardcode base URLs no Vercel var can fix.

## Accepted risks (from the adversarial self-critique)

- Prefix-map/module-list drift (mitigated by the snapshot test; it is the load-bearing test of this design).
- manzil-public retains the 1,186-line `DatabaseRepository` and most future feature work — the split isolates the low-change surfaces, not the high-change one.
- Local dev runs `role=all` with a full-privilege DB role; role/GRANT boundary bugs are not reproducible locally.
- Shared Postgres + shared Redis = shared availability fate; this design buys deploy isolation, not availability isolation.
- Four Sentry streams correlated by hand.
- The five-domain registration transaction and console→catalog cross-writes survive untouched — this design does not make them worse, but does not make them better.
