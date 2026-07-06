# Tech Stack & Runbook

## Stack

| Layer | Choice | Notes |
|---|---|---|
| Web | Next.js 16 (App Router), React 19 | `apps/web` — marketing + business CRM, trilingual uz/ru/en |
| Admin | Next.js 16 | `apps/admin` — RBAC console (AdminUser + granular permissions) |
| API | NestJS 11 | `apps/api` — REST `/v1`, EntitlementGuard, Redis cache |
| DB | Supabase Postgres via Prisma 6 | Connect through the **Supavisor pooler** (`aws-1-ap-southeast-1`, session mode 5432) — the direct host is IPv6-only and unreachable from most local machines |
| Auth | Clerk | Same instance for web + admin; admin gated by AdminUser table, not Clerk roles |
| Cache | Redis (Upstash-compatible) | Search + hot lookups |
| Payments (planned) | Payme merchant API | https://developer.help.paycom.uz/metody-merchant-api/ |
| Design system | Teal #005454 + gold; Libre Caslon Display + Geist + Inter | `apps/web/DESIGN.md`; impeccable hook enforces quality |
| E2E | Playwright (chromium) | `tech-office/qa` — runs against production by default, `E2E_BASE_URL` to override |

## Environments

| Env | Where | Deploy trigger |
|---|---|---|
| Web production | Vercel project `manzil-web` (root dir `apps/web`) → manzil-business.vercel.app | Push to `main` |
| API production | Railway `manzil-api-production` | Push to `main` (root railway.json) |
| DB | Supabase (Singapore) | `npm run db:push` / migrations from `packages/db` |

## Runbook

```bash
npm install                     # root — installs all workspaces
npm run dev                     # web on :3000
npm run dev:api                 # api on :4000
npm run build                   # all workspaces (shared builds first via prebuild)
npm run db:generate             # prisma client (stop the API first on Windows — EPERM on the query engine DLL)
npm run db:seed                 # seed Tashkent businesses
npm run seed:validate           # validate data/tashkent-seed-template.csv
cd tech-office/qa && npx playwright test            # E2E vs production
cd tech-office/qa && E2E_BASE_URL=http://localhost:3210 npx playwright test   # E2E vs local
```

Deploy verification after push: `npx vercel ls` (web), Railway dashboard or `/v1/health` (API — checks DB connectivity too).

## Known sharp edges

- Windows + Prisma generate: stop any running API first (file lock on query engine DLL).
- Vercel build overrides: install/build commands `cd ../..`-based because of the monorepo; don't remove the `prebuild` that builds `@manzil/shared`.
- CSP is set in `apps/web/next.config.ts` — new third-party origins must be added there or they're silently blocked.
