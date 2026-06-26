# Deployment Guide

## Manzil Super-app Production Deployment

This guide covers staging and production deployment for the web app, API, database, search, storage, authentication, and CI/CD workflows.

## Prerequisites

- Vercel account and project for the Next.js web app.
- Railway account and project for the API, PostgreSQL, and Redis.
- Cloudflare R2 bucket for media storage.
- Clerk application for authentication.
- Google Cloud project with Maps APIs enabled.
- GitHub repository secrets configured for CI/CD.

## Database Setup

Create a PostgreSQL service on Railway and copy the `DATABASE_URL`.

Run migrations locally before production deployment:

```bash
npm run migrate:dev --workspace db
```

Production migrations are run by `.github/workflows/deploy-api.yml`:

```bash
npm run migrate:deploy --workspace db
```

Seed initial data when needed:

```bash
DATABASE_URL="your-production-db-url" npm run db:seed --workspace db
```

## Redis Setup

Create a Redis service in the same Railway project and add the `REDIS_URL` value to backend environment variables.

## Backend Deployment

The backend deploys to Railway. Required Railway environment variables:

```text
NODE_ENV=production
DATABASE_URL=<railway-postgres-url>
REDIS_URL=<railway-redis-url>
MEILISEARCH_URL=<meilisearch-url>
MEILISEARCH_KEY=<meilisearch-key>
CLERK_SECRET_KEY=<clerk-secret-key>
OPENAI_API_KEY=<openai-api-key>
R2_BUCKET_NAME=<cloudflare-r2-bucket>
R2_ACCOUNT_ID=<cloudflare-account-id>
R2_ACCESS_KEY_ID=<cloudflare-r2-access-key>
R2_SECRET_ACCESS_KEY=<cloudflare-r2-secret-key>
```

Manual deployment:

```bash
npm install -g @railway/cli
railway login
railway link
railway up
```

Automatic deployment runs through `.github/workflows/deploy-api.yml` after changes to backend, shared, or database packages are pushed to `main`.

## Web Deployment

The web app deploys to Vercel with `apps/web` as the project root.

Recommended Vercel settings:

```text
Build Command: npm run build --workspace @manzil/web
Output Directory: .next
Root Directory: apps/web
```

Required Vercel environment variables:

```text
NEXT_PUBLIC_API_URL=https://your-api.railway.app/api
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=<clerk-publishable-key>
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=<google-maps-api-key>
```

Automatic deployment runs through `.github/workflows/deploy-web.yml` after changes to web or shared packages are pushed to `main`.

## Meilisearch

For local development:

```bash
docker run -it --rm -p 7700:7700 -e MEILI_MASTER_KEY=your-master-key getmeili/meilisearch:v1.5
```

For production, use a managed Meilisearch Cloud project or a dedicated self-hosted instance. Store the URL and key in backend environment variables.

## Cloudflare R2

Create a bucket, create an R2 API token, and configure CORS for browser uploads:

```json
[
  {
    "allowedOrigins": ["https://manzil.app", "https://*.manzil.app"],
    "allowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "allowedHeaders": ["*"],
    "maxAgeSeconds": 3600
  }
]
```

## Clerk Authentication

Create a Clerk application, enable the desired sign-in methods, and copy the publishable and secret keys into Vercel and Railway.

Optional Clerk webhook endpoint:

```text
https://your-api.railway.app/api/v1/webhooks/clerk
```

## Google Maps

Enable these APIs in Google Cloud:

- Maps JavaScript API
- Places API
- Geocoding API

Restrict the browser API key to production domains and localhost for development.

## GitHub Actions

The repository includes these workflows:

- `lint-test.yml`: type checks, linting, and tests on pull requests and pushes to `main`.
- `deploy-web.yml`: builds and deploys the web app to Vercel.
- `deploy-api.yml`: builds the backend, runs migrations, and deploys to Railway.
- `db-migrate.yml`: validates database migrations against a PostgreSQL service.

Required GitHub secrets:

```text
NEXT_PUBLIC_API_URL
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
VERCEL_TOKEN
VERCEL_ORG_ID
VERCEL_PROJECT_ID
DATABASE_URL
RAILWAY_TOKEN
```

## Monitoring

Use Railway logs for backend runtime logs and Vercel deployment logs for web builds.

Optional Sentry environment variable:

```text
NEXT_SENTRY_DSN=<sentry-dsn>
```

Add uptime checks against:

```text
https://your-api.railway.app/api/v1/health
```

## Domain Setup

Point the main domain to Vercel and the API subdomain to Railway or an API gateway.

Recommended pattern:

```text
manzil.app -> Vercel web app
api.manzil.app -> Railway backend
```

## First Deployment Checklist

- Database created and migrations run.
- Redis instance running.
- Meilisearch configured.
- Backend deployed to Railway.
- Web app deployed to Vercel.
- Environment variables set in each service.
- GitHub Actions secrets configured.
- DNS records pointed to the correct services.
- SSL certificates active.
- Database backups enabled.

## Rollback

For Vercel, promote a previous deployment from the Vercel dashboard.

For Railway, redeploy a previous deployment from the Railway dashboard.

For database issues, restore from Railway backups and re-run critical migrations if needed.
