# Implementation Status

## Completed in this scaffold

- Root npm workspace for `apps/*` and `packages/*`.
- Production-shaped Next.js web app in `apps/web`.
- NestJS REST API skeleton in `apps/api`.
- Shared TypeScript contracts and demo data in `packages/shared`.
- PostgreSQL Prisma schema for MVP entities.
- Seed-data CSV template for initial Tashkent listings.
- Local Docker Compose services for PostgreSQL, Redis, and Meilisearch.
- Static `mvp-site` preserved as UX reference.

## Current architecture mode

The Phase 0 scaffold is now database-backed locally:

- PostgreSQL 18 local service is used for development.
- Prisma schema is pushed to the local `manzil` database.
- `prisma/seed.ts` loads the initial Tashkent categories, businesses, and reviews.
- NestJS API controllers read and write through Prisma-backed repositories.
- Next.js web pages fetch from the API instead of importing demo data directly.
- Admin API routes are protected by a role guard with a local-only development role header fallback.
- Shared demo data remains as seed/input material and prototype fallback reference.

## Next implementation slice

1. Replace the local-only role fallback with Clerk token verification.
2. Add admin mutation endpoints for claim approval and moderation.
3. Add owner-safe business update and review reply endpoints.
4. Add Meilisearch indexing jobs after business/review writes.
5. Add media metadata and Cloudflare R2 presigned upload implementation.
6. Add seed import tooling for the first 500+ Tashkent listings.

## Last verified

- `npm run db:push`
- `npm run db:seed`
- `npm run typecheck`
- `npm run build`
- Local API smoke tests for health, categories, businesses, search, business detail, and review creation.
- Local web smoke tests for `/uz`, `/uz/discover?q=osh`, `/uz/businesses/yunusobod-osh-markazi`, and `/uz/admin`.
