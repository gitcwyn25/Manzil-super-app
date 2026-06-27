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

The platform is intentionally local-data-backed for the first runnable scaffold:

- Web pages import shared demo data for server-rendered MVP pages.
- API controllers expose `/v1` endpoints using the same shared demo data.
- Prisma schema defines the target database model but repositories are not wired to PostgreSQL yet.

This keeps the product UI and API contracts buildable before Clerk, R2, Meilisearch, and PostgreSQL credentials exist.

## Next implementation slice

1. Install dependencies and run type/build verification.
2. Connect API repositories to Prisma.
3. Replace web direct data imports with API calls where appropriate.
4. Add Clerk auth middleware and role checks.
5. Add admin mutation endpoints for claim approval and moderation.
6. Add Meilisearch indexing jobs after business/review writes.
