# Manzil Super-app — Local Business Discovery & Reviews Platform

A Yelp-style platform purpose-built for Uzbekistan. Users discover and review local businesses; business owners claim listings and manage their reputation. Tashkent-first, with native support for Uzbek (Latin), Russian, and English.

**Status:** Pre-build planning (Phase 0)  
**Stack:** Next.js + React Native (Expo) + NestJS + PostgreSQL + Redis  
**Hosting:** Vercel (web) + Railway (backend/DB) + Cloudflare R2 (media)

---

## Quick Start (Local Development)

### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- Git

### Setup

```bash
# Clone the repo
git clone https://github.com/gitcwyn25/Manzil-super-app.git
cd Manzil-super-app

# Install dependencies (root)
npm install

# Start local services (Postgres, Redis, Meilisearch)
docker-compose up -d

# Set up environment variables
cp .env.example .env.local

# Run database migrations
npm run db:migrate

# Start development servers
npm run dev
# Web app: http://localhost:3000
# Backend API: http://localhost:3001
# Meilisearch: http://localhost:7700
```

---

## Repository Structure

```
manzil-super-app/
├── apps/
│   ├── web/                 # Next.js frontend (SSR, i18n)
│   ├── mobile/              # React Native (Expo)
│   └── backend/             # NestJS API
├── packages/
│   ├── shared/              # Shared TypeScript types
│   └── db/                  # Prisma schema & migrations
├── docs/                    # Documentation
├── .github/workflows/       # CI/CD
├── docker-compose.yml       # Local dev services
└── package.json             # Root workspace
```

---

## Documentation

- **[PRD.md](./docs/PRD.md)** — Product vision, goals, success metrics
- **[ARCHITECTURE.md](./docs/ARCHITECTURE.md)** — Technical stack, data model
- **[FEATURES.md](./docs/FEATURES.md)** — Phase 2/3 feature map
- **[CONTRIBUTOR.md](./docs/CONTRIBUTOR.md)** — How to pick up a feature
- **[DATABASE.md](./docs/DATABASE.md)** — Schema reference
- **[DEPLOYMENT.md](./docs/DEPLOYMENT.md)** — Deployment guide

---

## MVP Features (Phase 1)

- ✅ Business search & discovery
- ✅ User ratings & reviews
- ✅ Business owner account & claims
- ✅ Owner replies to reviews
- ✅ Map-based browse
- ✅ Photo upload & moderation
- ✅ Full i18n: Uzbek + Russian + English
- ✅ Admin panel
- ✅ Mobile-responsive web + React Native app

---

## License

MIT
