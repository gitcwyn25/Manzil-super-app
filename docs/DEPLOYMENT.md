# Deployment Guide

Architecture: **Vercel (web)** + **Railway (API)** + **Supabase (Postgres)** + **Upstash (Redis)** + **Clerk (auth)** + **Cloudflare R2 (media, optional)**.

```
Browser ──> Vercel (Next.js, apps/web) ──> Railway (NestJS, apps/api) ──> Supabase Postgres
                                                     │
                                                     ├──> Upstash Redis (cache)
                                                     └──> Cloudflare R2 (media)
```

The web app is the **business portal** (owners + admins). Consumers use the mobile apps.

---

## 1. API on Railway

1. Sign up at railway.com → **New Project → Deploy from GitHub repo** → pick this repo.
2. Service **Settings → Config file path**: `apps/api/railway.json` (uses the monorepo-aware `apps/api/Dockerfile`; keep Root Directory `/`).
3. Environment variables (Service → Variables):

   | Variable | Value |
   |---|---|
   | `DATABASE_URL` | Supabase **pooler** URL (below) |
   | `CLERK_SECRET_KEY` | Clerk **production** secret key |
   | `REDIS_URL` | Upstash TLS URL (below) |
   | `WEB_ORIGIN` | your Vercel domain, e.g. `https://manzil.vercel.app` |
   | `NODE_ENV` | `production` |
   | `CLOUDFLARE_R2_ACCOUNT_ID` / `..._ACCESS_KEY_ID` / `..._SECRET_ACCESS_KEY` / `..._BUCKET` / `..._PUBLIC_URL` | optional — media presign returns 503 until set |

   **Never set `MANZIL_DEV_AUTH` in production.** Dev-header auth is also hard-blocked by code when `NODE_ENV=production`.

4. Deploy. Verify: `https://<railway-domain>/v1/health` → `{"ok":true,"database":"up","cache":"redis"}`.

### Supabase `DATABASE_URL`

The direct host (`db.<ref>.supabase.co`) is **IPv6-only**. Use the Supavisor pooler (session mode, port 5432) everywhere:

```
postgresql://postgres.<project-ref>:<password>@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres?sslmode=require&connect_timeout=30&pool_timeout=30&connection_limit=5
```

Copy it from Supabase Dashboard → **Connect → Connection pooling** (this project lives in `aws-1-ap-southeast-1`). The password must be URL-encoded.

### Schema & seed

```bash
npx prisma db push --schema packages/db/schema.prisma   # sync schema (early development)
npm run db:migrate:deploy                               # real migrations (staging/prod)
npm run db:seed                                         # optional demo data
```

## 2. Web on Vercel

1. vercel.com → **Add New Project** → import this repo.
2. **Root Directory: `apps/web`**, keep “Include files outside root directory” **enabled** (required for `packages/shared`).
3. Framework preset: Next.js (auto-detected). Default build command.
4. Environment variables:

   | Variable | Value |
   |---|---|
   | `NEXT_PUBLIC_API_URL` | `https://<railway-domain>/v1` |
   | `NEXT_PUBLIC_APP_URL` | `https://<vercel-domain>` |
   | `NEXT_PUBLIC_USE_MOCK` | `false` |
   | `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk production `pk_live_…` |
   | `CLERK_SECRET_KEY` | Clerk production `sk_live_…` |
   | `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | `/uz/sign-in` |
   | `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | `/uz/sign-up` |
   | `NEXT_PUBLIC_SUPABASE_URL` | `https://<ref>.supabase.co` |
   | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase publishable key |

5. After the first deploy, set the Vercel domain as `WEB_ORIGIN` on Railway (CORS) and as a domain in Clerk.

## 3. Redis on Upstash — where to get the host

1. **console.upstash.com** → sign in → **Create Database** → region `ap-southeast-1` (Singapore, next to the DB/API).
2. On the database page copy the **TLS connect URL**:
   `rediss://default:<password>@<name>-<id>.upstash.io:6379`
3. Set it as `REDIS_URL` on Railway (and in local `.env` to test).

If your key came from **Redis Cloud** instead (app.redislabs.com): Databases → your DB → *Configuration* → **Public endpoint**; the URL is `rediss://default:<password>@<endpoint>`.

The API degrades gracefully to an in-memory cache when `REDIS_URL` is missing or unreachable — Redis is an optimization, never a hard dependency.

## 4. Clerk production

1. Clerk Dashboard → create a **Production instance** (dev `pk_test/sk_test` keys are rate-limited).
2. Add the Vercel domain under **Domains**; put `pk_live_…`/`sk_live_…` into Vercel and Railway env.
3. Grant the first admin after sign-in, directly in Supabase (Table Editor → `users`) or SQL:

   ```sql
   update users set role = 'admin' where email = 'you@example.com';
   ```

## 5. Post-deploy checklist

- [ ] `GET /v1/health` → `database: up`, `cache: redis`
- [ ] Landing renders with live catalogue stats
- [ ] Clerk sign-in works on the production domain
- [ ] `/uz/admin` reachable only by admin-role users
- [ ] Claim → admin approval → owner dashboard unlock works end-to-end
- [ ] Review reply from the owner dashboard appears on the business profile
