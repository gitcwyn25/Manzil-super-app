# Technical Architecture Document
## [Platform Name] — Local Business Discovery & Reviews Platform

**Version:** 0.1 (draft)
**Companion document:** PRD.md

---

## 1. Architecture goals & principles

- **Lean MVP, room to scale.** Every choice below favors low operational cost and fast solo/small-team velocity over premature scalability. This is a pre-traction MVP — over-engineering it is a bigger risk than under-engineering it.
- **One deployable unit per concern.** Web, mobile, and backend are separate deployables so any one of them can ship independently without redeploying the others.
- **Boring technology where it doesn't matter, opinionated choices where it does.** Search relevance and review trust are the two places worth extra engineering care; everything else should be the simplest thing that works.
- **Localization is structural, not cosmetic.** Uzbek/Russian/English support is a property of the data model (translatable fields) and API (locale-aware responses), not just frontend string files.

---

## 2. High-level system overview

See the architecture diagram above for the visual version. In text form:

- **Clients:** Web app (Next.js) and mobile app talk to a single backend API over HTTPS.
- **Backend API:** Stateless API service handling auth delegation, business logic, search queries, and review/photo writes; a background job runner handles async work (image processing, moderation queue, email notifications, future AI calls).
- **Data layer:** Postgres (system of record), Redis (cache + job queue), a dedicated search index (denormalized from Postgres), and object storage for photos.
- **External integrations:** A managed auth provider and a maps provider, both called from the backend rather than directly from clients where possible, to keep API keys and business logic server-side.

---

## 3. Recommended stack (from your listed options)

| Layer | Options given | Recommendation | Why |
|---|---|---|---|
| Frontend (web) | React, Next.js, TypeScript, Tailwind | **Next.js + TypeScript + Tailwind** | Already specified and the right choice — SSR/SEO matters for a discovery product where business profile pages need to be indexable by Google |
| Mobile | Flutter or React Native | **React Native (with Expo)** | Shares TypeScript and a meaningful slice of logic/types with the Next.js web app; one language across the whole stack matters more at solo/small-team scale than Flutter's native performance edge, which this app doesn't need |
| Backend | Python (FastAPI) or Node.js (NestJS) | **Node.js (NestJS)** | Same language as both frontends (TypeScript end-to-end), simpler hiring/context-switching for a small team. FastAPI is a reasonable alternative specifically if Phase 2 AI/ML work ends up wanting Python's ML ecosystem directly — but for MVP, calling an LLM API is identical effort from Node |
| Database | PostgreSQL | **PostgreSQL** | Confirmed — also gives you PostGIS for proper geo-queries later if needed |
| Cache | Redis | **Redis** | Confirmed — doubles as the job queue backend (e.g. BullMQ) |
| Search | Elasticsearch or Meilisearch | **Meilisearch** | Far simpler to self-host and operate at this scale; sub-50ms relevant search out of the box with much less tuning than Elasticsearch needs. Revisit Elasticsearch only if you outgrow Meilisearch's scale ceiling, which is unlikely before Phase 3 |
| Storage | Cloudflare R2 or AWS S3 | **Cloudflare R2** | S3-compatible API (no migration cost if you ever switch), zero egress fees — meaningfully cheaper for an image-heavy product than S3 |
| Auth | Clerk or Firebase Auth | **Clerk** | Cleaner multi-tenant patterns out of the box for the consumer-vs-business-owner account split, and pairs well with Next.js. Firebase Auth is a fine alternative if you want it bundled with other Firebase services you're already using |
| Maps | Google Maps, OpenStreetMap, or Mapbox | **Google Maps** | Best POI and address data coverage for Uzbekistan specifically as of writing — verify current Tashkent data quality directly before committing, since this varies by region and changes over time |
| Hosting | Vercel, Railway, Hetzner, or AWS | **Vercel (web) + Railway (API, Postgres, Redis, workers)** | Minimal DevOps overhead at MVP scale; both have generous free/cheap tiers and you can move to AWS/Hetzner later if cost or scale demands it |

---

## 4. Component detail

### 4.1 Web app (Next.js)
- App Router, server components for business profile pages (SEO-critical — these pages need to rank in Google search).
- Client components for interactive pieces: search filters, review submission, map widget.
- i18n routing for Uzbek/Russian/English (locale-prefixed routes or a locale cookie + middleware).

### 4.2 Mobile app (React Native + Expo)
- Shares a generated TypeScript API client with the web app (see Section 6) to avoid duplicating request/response types.
- Push notifications via Expo's push service, wired up in Phase 2.

### 4.3 Backend API (NestJS)
- Modular structure: `auth`, `businesses`, `reviews`, `search`, `media`, `admin` modules.
- Background job runner (BullMQ on Redis) handles: image resizing/optimization, moderation queue processing, outbound notification emails, and (Phase 2) AI API calls for summarization/translation — kept async so these never block a user-facing request.

### 4.4 Database schema (core entities)

| Entity | Key fields | Notes |
|---|---|---|
| `users` | id, email/phone, display_name, locale, role (consumer/business_owner/admin) | Single table for both consumer and owner accounts; role determines permissions |
| `businesses` | id, name, category_id, description (per-locale), address, lat/lng, phone, hours_json, price_tier, claimed_by_user_id, status (unclaimed/claimed/pending) | `claimed_by_user_id` nullable until claimed |
| `categories` | id, name (per-locale), parent_category_id | Self-referencing for category/subcategory hierarchy |
| `reviews` | id, business_id, user_id, rating (1-5), text, created_at, helpful_count | Unique constraint on (business_id, user_id) — one review per user per business |
| `review_replies` | id, review_id, business_owner_id, text, created_at | One reply per review at MVP |
| `photos` | id, owner_type (business/review), owner_id, storage_url, moderation_status | Polymorphic association to either a business or a review |
| `claims` | id, business_id, user_id, verification_method, status, reviewed_by_admin_id | Audit trail for the business claim/verification flow |
| `reports` | id, target_type (review/photo), target_id, reporter_user_id, reason, status | Abuse reporting queue feeding the admin panel |

This is intentionally a normalized relational model — Postgres is the system of record, and the search index below is a denormalized projection of `businesses` + aggregated review stats, not a second source of truth.

### 4.5 Search architecture
- Meilisearch index built from `businesses` joined with aggregate review stats (avg rating, review count) and category names in all three locales.
- Re-index triggered on business create/update and on review create (to refresh aggregate rating) — via the background job queue, not synchronously in the request path.
- Search API endpoint on the backend proxies to Meilisearch rather than exposing it directly to clients, so ranking logic and access control stay server-side.

### 4.6 Maps integration
- Geocoding (address → lat/lng) happens once at business creation/edit time, server-side, and is cached — not re-geocoded on every page load.
- Map rendering on the client uses the Maps SDK directly with a restricted, domain-locked API key.
- **Action item before committing:** directly compare Google Maps, Mapbox, and OpenStreetMap data quality for several real Tashkent addresses and POIs — coverage quality for secondary cities can differ meaningfully between providers and changes over time, so verify rather than assume.

### 4.7 Auth flow
- Clerk handles credential storage, OAuth, and session tokens; backend verifies Clerk-issued JWTs on each request rather than managing sessions itself.
- Role (consumer vs. business owner vs. admin) stored in your own `users` table, synced from Clerk on signup/webhook, not stored only in the auth provider.

### 4.8 Media pipeline
- Client uploads directly to a pre-signed R2 URL (not through the backend) to avoid routing large files through your API servers.
- Backend job picks up the new object, generates resized variants, and runs it through the moderation queue (manual review at MVP scale) before it's marked visible.

---

## 5. API design

- REST, versioned from day one (`/v1/...`) even though there's only one version initially — avoids a painful migration later.
- Key endpoint groups: `/v1/auth`, `/v1/businesses`, `/v1/businesses/:id/reviews`, `/v1/search`, `/v1/categories`, `/v1/claims`, `/v1/admin/*`.
- All list endpoints support locale-aware responses (category names, business descriptions returned in the requested locale with a fallback chain: requested → Russian → English).
- Rate limiting at the API gateway level (Redis-backed) on write endpoints (review submission, photo upload) specifically to blunt spam/abuse — read endpoints can be more permissive.

---

## 6. Shared types between web and mobile

Generate a shared TypeScript types/client package (e.g. via OpenAPI spec exported from NestJS, or tRPC if you want end-to-end type safety without manual spec generation) so the web app and React Native app consume identical request/response types. This avoids an entire category of bugs where the two clients silently drift from what the API actually returns.

---

## 7. Security considerations

- All business-mutating endpoints (edit listing, reply to review) check `claimed_by_user_id` ownership server-side — never trust client-side role checks alone.
- Review submission rate-limited per user per time window to blunt review-bombing.
- Photo uploads scanned for obviously inappropriate content before being marked visible (automated check + manual queue at MVP scale).
- Uzbekistan has its own personal data protection law (data localization requirements have applied to personal data of Uzbek citizens in some contexts) — confirm current requirements before storing user data, particularly around where data is hosted, since this can affect your choice of hosting region.

---

## 8. Infrastructure & deployment

- **Web:** Vercel, auto-deployed from the main branch, preview deployments per PR.
- **Backend + Postgres + Redis + workers:** Railway, separate services for the API and the background worker so a slow job never blocks API request handling.
- **Mobile:** Expo Application Services (EAS) for build and over-the-air updates; App Store/Google Play submission once the MVP is stable enough for store review.
- **Object storage:** Cloudflare R2, fronted by Cloudflare's CDN for photo delivery.
- **Environments:** at minimum, separate staging and production databases/API instances — don't test against production data.

---

## 9. CI/CD

- GitHub Actions (or equivalent): lint + typecheck + test on every PR, deploy to staging on merge to `main`, manual promote to production.
- Database migrations run as a deploy step (e.g. Prisma or TypeORM migrations), never applied manually against production.

---

## 10. Scalability path (for when you need it, not before)

- Postgres read replica once read load from search/profile views meaningfully outpaces write load.
- Move from Meilisearch to Elasticsearch only if document volume or query complexity genuinely outgrows it — don't pre-optimize for this.
- Introduce a CDN/edge cache layer for business profile pages (which are mostly read-heavy and don't change often) ahead of needing it for photos specifically, since that's R2/Cloudflare's job already.
- Geographic expansion (new cities) is primarily a data/ops problem (seeding listings, local outreach) more than an infrastructure problem — the architecture above doesn't need to change to support more cities.

---

## 11. Rough infra cost shape (MVP, illustrative)

Actual numbers depend on usage and change over time — verify current pricing directly with each provider before budgeting. Directionally: Vercel and Railway both have usable free/low-cost tiers for an early-stage MVP with light traffic; the main cost drivers as you grow will be Postgres/Redis instance size on Railway, Cloudflare R2 storage + bandwidth for photos, and Google Maps API call volume (geocoding + map loads) — Maps is usually the first line item worth watching closely since it bills per-call.

---

## 12. Monitoring & observability

- Application-level error tracking (e.g. Sentry) on both the backend and the frontends from day one — cheap to add early, painful to retrofit after launch.
- Basic uptime monitoring on the API and database.
- Track the PRD's success metrics (Section 5 of PRD.md) as actual dashboard queries, not just a doc — claimed listings, reviews/week, search-to-profile-view rate should be things you can check at a glance, not numbers you have to dig for.
