# Technical Architecture Document
## Manzil Super-app — Local Business Discovery & Reviews Platform

**Version:** 0.1 (draft)

---

## 1. Stack Summary

| Layer | Recommendation | Why |
|---|---|---|
| Frontend (web) | Next.js + TypeScript + Tailwind | SSR/SEO for business profiles; one language end-to-end |
| Mobile | React Native + Expo | Shares TypeScript with web; simpler small-team context |
| Backend | NestJS + TypeScript | Same language everywhere; clean module structure |
| Database | PostgreSQL | Confirmed; PostGIS later if needed |
| Cache | Redis | Cache + job queue (BullMQ) |
| Search | Meilisearch | Self-hosted, sub-50ms search, easier to operate than Elasticsearch at MVP scale |
| Storage | Cloudflare R2 | S3-compatible, zero egress fees |
| Auth | Clerk | Multi-tenant patterns, Next.js-friendly |
| Maps | Google Maps | Best POI data for Tashkent (verify before committing) |
| Hosting | Vercel (web) + Railway (API/DB) | Minimal DevOps overhead |

---

## 2. Component Architecture

```
Clients (Web + Mobile) →  Backend API (NestJS) →  Postgres (system of record)
                        ↓
                    Redis (cache + job queue)
                        ↓
                    Meilisearch (search index)
                        ↓
                    Cloudflare R2 (media storage)
```

---

## 3. Backend Modules (NestJS)

| Module | Responsibility |
|---|---|
| `auth` | Clerk integration, JWT verification, role management |
| `businesses` | CRUD operations, geo-queries, claim management |
| `reviews` | Rating, text, photo submission; business replies; abuse reports |
| `search` | Meilisearch proxy; ranking logic; locale-aware results |
| `media` | Photo upload to R2; resizing; moderation queue |
| `admin` | Moderation, analytics, claim approval |
| `subscriptions` | Tier management (Phase 2) |
| `social` | Follows, groups, lists (Phase 2+) |
| `achievements` | Gamification (Phase 2+) |
| `ai` | Shared LLM integration (Phase 2+) |
| `jobs` | Background tasks via BullMQ (image processing, notifications, etc.) |

---

## 4. Database Schema (Core MVP Entities)

| Table | Purpose |
|---|---|
| `users` | Consumer + business owner + admin accounts |
| `businesses` | Business profiles, metadata, status |
| `categories` | Hierarchical category taxonomy |
| `reviews` | Ratings, text, visibility status |
| `review_replies` | Owner responses to reviews |
| `photos` | Media for businesses/reviews with moderation status |
| `claims` | Audit trail for business claim/verification flow |
| `reports` | Abuse reporting queue |
| `follows` | Social graph (Phase 2) |
| `lists` | Community-curated lists (Phase 2) |
| `subscriptions` | Tier assignment (Phase 2) |

Full schema: see [packages/db/schema.prisma](../packages/db/schema.prisma)

---

## 5. API Design

- REST, versioned from day one (`/api/v1/...`)
- Key groups: `/auth`, `/businesses`, `/reviews`, `/search`, `/categories`, `/admin`
- Locale-aware responses (all translatable fields returned in requested language)
- Rate limiting on write endpoints (Redis-backed) to prevent spam

---

## 6. Deployment

- **Web:** Vercel, auto-deployed from `main`, preview per PR
- **Backend:** Railway (API, database, Redis, workers on separate services)
- **Media:** Cloudflare R2 + CDN
- **Environments:** Staging and production separated
- **Migrations:** Run as deploy step (Prisma migrations)

---

## 7. Security

- Ownership checks server-side (verify `claimed_by_user_id`)
- Review submission rate-limited per user
- Photo uploads scanned before visibility
- All secrets in environment variables, never committed
- Uzbekistan data localization requirements verified before launch

---

## 8. Monitoring

- Error tracking: Sentry (frontend + backend)
- Uptime monitoring: basic health checks
- Success metrics: dashboard queries from analytics database
- Log aggregation: structured JSON logging

---

See [PRD.md](./PRD.md) for product context, [FEATURES.md](./FEATURES.md) for Phase 2/3.
