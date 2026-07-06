# Manzil MVP API Contracts

Base path: `/v1`

## Health

- `GET /v1/health`
- Returns API service status.

## Categories

- `GET /v1/categories`
- Returns launch categories in Uzbek, Russian, and English.

## Search

- `GET /v1/search?q=&category=`
- Returns businesses and categories.
- Current scaffold uses shared demo data.
- Production target uses Meilisearch through the API.

## Businesses

- `GET /v1/businesses`
- `GET /v1/businesses/:slug`
- `POST /v1/businesses/:slug/reviews`

Review creation target rules:

- Authenticated user required.
- One review per user per business.
- Minimum review length enforced.
- Review write triggers business rating aggregate and search re-index.

## Claims

- `POST /v1/claims`

Claim target rules:

- Business owner identity required.
- Manual admin approval for MVP.
- Approved claim sets business owner permissions.

## Media

- `POST /v1/media/presign`

Media target rules:

- Client uploads to R2 presigned URL.
- Uploaded media starts as `pending`.
- Admin/moderation approval required before public display.

## Admin

- `GET /v1/admin/overview`

Admin target rules:

- Admin role required.
- Future endpoints approve claims, moderate photos/reviews, and manage categories.
