# Tech Office

The product and the machines that run it. Everything here answers: *what have we built, how does it run, and what ships next?*

## Where the code lives (and why it stays there)

The deployable code stays at the repo root — **`apps/`** and **`packages/`** — because production pins those paths: Vercel builds `apps/web` (its configured root directory), Railway builds `apps/api` (Dockerfile paths), and npm workspaces resolve `apps/*` / `packages/*`. Moving them is a coordinated migration (Vercel project PATCH + Railway config + workspace globs in one commit), not a folder drag. This office holds everything *about* the code.

| Code | What it is |
|---|---|
| [apps/web](../apps/web/) | Next.js 16 marketing site + business dashboard/CRM (Vercel: manzil-business.vercel.app) |
| [apps/admin](../apps/admin/) | Admin console — RBAC, moderation, dynamic pricing editor |
| [apps/api](../apps/api/) | NestJS API (Railway: manzil-api-production.up.railway.app) |
| [packages/db](../packages/db/) | Prisma schema + seeds (Supabase Postgres) |
| [packages/shared](../packages/shared/) | Shared types + i18n copy |

## Documents

| Document | What it is |
|---|---|
| [TECH-STACK.md](TECH-STACK.md) | The stack at a glance + environments + deploy runbook. |
| [ARCHITECTURE.md](ARCHITECTURE.md) | System architecture (original design doc). |
| [PRD.md](PRD.md) | Product requirements document. |
| [android/design/](android/design/) | Android consumer app design research, screen plans, and UX direction. |
| [docs/](docs/) | Engineering reference: API contracts, database, deployment, beta operations, contributor guide. |
| [qa/](qa/) | Playwright E2E suite + production smoke tests (`cd tech-office/qa && npx playwright test`). |
| [tools/](tools/) | Seed validation utilities (`npm run seed:validate` from repo root). |

## Standing engineering rules

- Entitlements are enforced **server-side only** (EntitlementGuard + @RequireEntitlement); UI locks are cosmetic.
- Pricing is data (Plan/PlanFeature tables), never hardcoded.
- Admin mutations are audited inside the same transaction as the change.
- No secrets in the repo — it is public; env files are gitignored.
- Design changes pass the impeccable hook (no AI-tell patterns).

## Shared knowledge

What to build next: [ceo-office/MASTER-PLAN.md](../ceo-office/MASTER-PLAN.md) · What merchants were promised: [sales-office](../sales-office/) · Brand system: [marketing-office](../marketing-office/)
