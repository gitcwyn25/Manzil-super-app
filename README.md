# Manzil Platform

Manzil is a Tashkent-first local business discovery and reviews platform for Uzbekistan.

## Workspace

- `apps/web` - production Next.js customer and admin web app.
- `apps/api` - NestJS REST API skeleton under `/v1`.
- `packages/shared` - shared TypeScript contracts, demo data, and locale helpers.
- `prisma/schema.prisma` - PostgreSQL data model for the MVP.
- `data/tashkent-seed-template.csv` - seed-listing import template for launch operations.
- `mvp-site` - original static prototype kept as UX reference.

## Start

1. Copy `.env.example` to `.env.local` or app-specific env files.
2. Install dependencies with `npm install`.
3. Run the web app with `npm run dev:web`.
4. Run the API with `npm run dev:api`.

The first implementation is local-data-backed so the web app can run before PostgreSQL, Clerk, R2, and Meilisearch credentials are configured.

## Local URLs

- Web: `http://localhost:3000/uz`
- Discovery: `http://localhost:3000/uz/discover`
- Business profile: `http://localhost:3000/uz/businesses/yunusobod-osh-markazi`
- Admin scaffold: `http://localhost:3000/uz/admin`
- API health: `http://localhost:4000/v1/health`
- API search: `http://localhost:4000/v1/search?q=osh`

## Verification

The scaffold has been verified with:

- `npm run build`
- `npm run typecheck --workspace @manzil/web`
- `npm run typecheck --workspace @manzil/api`
- `npm run seed:validate`
- HTTP smoke tests for the main web routes and API endpoints

Next.js dev/build scripts explicitly use Webpack and `NODE_OPTIONS=--max-old-space-size=4096` because Turbopack and default worker memory were unstable in this Windows environment.
