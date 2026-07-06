# Manzil — Company HQ

Manzil is Uzbekistan's local business platform: consumers discover and trust places; businesses run their reputation, promotions, and customers from one dashboard. Tashkent-first, O2O by design — the Meituan/Dianping playbook at Uzbekistan scale.

**Live:** web [manzil-business.vercel.app](https://manzil-business.vercel.app) · API [manzil-api-production.up.railway.app](https://manzil-api-production.up.railway.app/v1/health)

This repository is the whole company — code *and* shared knowledge, organized as offices:

## The offices

| Office | Owns | Start here |
| --- | --- | --- |
| [ceo-office/](ceo-office/) | Vision, strategy, fundraising, OKRs | **[MASTER-PLAN.md](ceo-office/MASTER-PLAN.md)** — the company document (+ investor PDF) |
| [cfo-office/](cfo-office/) | Revenue model, cash flow, cap table, funding | [FINANCE.md](cfo-office/FINANCE.md) |
| [marketing-office/](marketing-office/) | Brand, story, channels | [README](marketing-office/README.md) + [brand-identity/](marketing-office/brand-identity/) |
| [sales-office/](sales-office/) | Merchant acquisition & upgrades | [SALES-PLAYBOOK.md](sales-office/SALES-PLAYBOOK.md) |
| [tech-office/](tech-office/) | Product, architecture, QA, runbooks | [TECH-STACK.md](tech-office/TECH-STACK.md) |

## The product (code)

Deployable code stays at the root — production build systems pin these paths (see [tech-office/README.md](tech-office/README.md)):

- `apps/web` — Next.js 16 marketing site + business dashboard/CRM (trilingual uz/ru/en)
- `apps/admin` — admin console: RBAC, moderation, dynamic pricing
- `apps/api` — NestJS REST API `/v1`
- `packages/shared` — shared contracts + locale copy · `packages/db` — Prisma schema + seeds
- `data/` — seed-listing templates

## Quick start

```bash
npm install
npm run dev        # web  → http://localhost:3000/uz
npm run dev:api    # api  → http://localhost:4000/v1/health
```

Env setup: copy `.env.example`; Clerk keys enable auth (public browsing works without). Full runbook, environments, and sharp edges: [tech-office/TECH-STACK.md](tech-office/TECH-STACK.md).

## House rules

- Reviews are never removable for payment — structural, in code, non-negotiable.
- Pricing is admin-set data, not hardcoded copy.
- Entitlements enforce server-side; the repo is public — no secrets, ever.
- E2E before deploy: `cd tech-office/qa && npx playwright test`
