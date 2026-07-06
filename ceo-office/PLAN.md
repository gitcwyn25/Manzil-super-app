# Manzil Superapp Implementation Plan

## Summary
Build Manzil as a full-platform local discovery and reviews superapp for Uzbekistan, starting with a Tashkent-first Yelp-like MVP and expanding into mobile, business tools, premium listings, analytics, AI-assisted discovery, and city expansion.

Chosen defaults:
- Scope: full platform roadmap based on existing Manzil docs.
- Delivery priority: web first, then mobile.
- Team model: lean team of founder plus 2-4 contributors.
- Stack: Next.js, TypeScript, Tailwind, NestJS, PostgreSQL, Redis, Meilisearch, Cloudflare R2, Clerk, Google Maps pending verification, Vercel, Railway.

## Implementation Phases

### Phase 0: Foundation & Product Lock
Timeline: 2-3 weeks

Milestones:
- Confirm brand name as Manzil and freeze MVP scope.
- Convert current static `mvp-site` into the reference UX prototype.
- Finalize data model for users, businesses, categories, reviews, photos, claims, reports.
- Verify Google Maps vs Mapbox vs OpenStreetMap for Tashkent POI/address quality.
- Define launch category focus: cafes/restaurants first, then beauty/auto/repairs.
- Create seed-data process for first 500+ Tashkent listings.

Dependencies:
- Product scope must be locked before backend schema and UI routes.
- Maps provider must be selected before geocoding and map UX.
- Seed-data format must be defined before admin import tooling.

Resources:
- Product/PM: founder
- Design: 1 UI/UX contributor
- Engineering: 1 full-stack lead
- Ops/data: founder or part-time data assistant

### Phase 1: Core Platform MVP
Timeline: 8-10 weeks

Milestones:
- Set up monorepo or coordinated repos for web, API, shared types, and deployment.
- Build production Next.js web app from the static MVP:
  - home/search page
  - category browse
  - business profile pages
  - review form
  - business claim entry
  - Uzbek/Russian/English routing
- Build NestJS API modules:
  - auth/user sync
  - businesses
  - categories
  - reviews
  - claims
  - media metadata
  - admin/moderation
- Set up PostgreSQL migrations and seed import.
- Set up Meilisearch indexing for businesses and aggregate review stats.
- Set up R2 photo upload flow with moderation status.
- Build minimal admin panel for listing approval, claim approval, flagged reviews/photos, and category management.

Dependencies:
- Auth must exist before reviews, claims, owner replies, and admin actions.
- Business/category data must exist before search and profile pages.
- Review creation must update aggregate rating and search index.
- Media upload must support moderation before photos become public.

Resources:
- Frontend: 1 engineer
- Backend: 1 engineer
- Design: part-time
- QA: founder plus part-time tester
- Ops/data: founder plus 1 helper for listing collection

### Phase 2: Private Beta & Supply Seeding
Timeline: 4-6 weeks

Milestones:
- Import 500+ Tashkent listings across 2-3 dense categories.
- Manually onboard first 100-200 businesses.
- Invite first seed reviewers from personal/TSUE network.
- Add founding reviewer and founding business badges.
- Validate search-to-profile-view tracking.
- Fix high-friction UX issues from beta sessions.
- Prepare Telegram/Instagram content pipeline.

Dependencies:
- Admin panel must support claim approval before business onboarding.
- Review flow must be stable before seed reviewer campaign.
- Analytics must be active before beta users arrive.

Resources:
- Founder/PM: heavy involvement
- Outreach: 1-2 helpers
- Engineering: 1-2 engineers for fixes
- QA/support: part-time

### Phase 3: Public Launch, Tashkent
Timeline: 3-4 weeks

Milestones:
- Public launch in Tashkent only.
- Launch categories remain narrow: cafes/restaurants plus 1-2 adjacent categories.
- Launch SEO-ready business profile pages.
- Activate Telegram, Instagram, referral tracking, and PR outreach.
- Monitor weekly active users, reviews/week, claimed listings, search-to-profile-view rate, and owner reply rate.
- Stabilize infra, support flows, and moderation operations.

Dependencies:
- Do not launch publicly until seeded categories have enough listings and reviews.
- Public marketing depends on moderation capacity and working claim flow.
- SEO depends on server-rendered profile pages and clean metadata.

Resources:
- Founder/PM
- 1 frontend/backend engineer on support rotation
- 1 outreach/community operator
- Part-time moderation/QA

### Phase 4: Growth Modules
Timeline: 8-12 weeks after launch signal

Milestones:
- Add deeper business owner dashboard:
  - profile views
  - search appearances
  - review queue
  - owner replies
- Add notification emails for new reviews and claim status.
- Add premium listing pilot without sponsored search.
- Add mobile app foundation with React Native + Expo.
- Share API client/types between web and mobile.
- Expand category coverage after core categories show density.

Dependencies:
- Premium should not ship until businesses see organic value.
- Mobile should consume stable API contracts from the web/API MVP.
- Analytics must be reliable before business dashboard productization.

Resources:
- Frontend/mobile: 1 engineer
- Backend: 1 engineer
- Product/design: part-time
- Business/outreach: founder plus helper

### Phase 5: Advanced Platform Expansion
Timeline: 3-6 months after launch traction

Milestones:
- Add AI-assisted natural language search.
- Add review summarization.
- Add review translation across Uzbek/Russian/English.
- Add spam/fake-review support tooling.
- Expand beyond Tashkent to [NEXT_CITY].
- Evaluate sponsored placement only after Premium proves business willingness to pay.
- Consider data products only using aggregated, anonymized data.

Dependencies:
- AI features require enough review/search data to be useful.
- New city launch requires repeating seed/outreach playbook.
- Sponsored placement requires trust guardrails and clear labeling.

Resources:
- Full-stack/AI integration engineer
- Data/ops lead
- Community/outreach lead
- QA/moderation support

## Public Interfaces & Core Contracts
- REST API versioned under `/v1`.
- Initial endpoint groups:
  - `/v1/auth`
  - `/v1/businesses`
  - `/v1/businesses/:id/reviews`
  - `/v1/search`
  - `/v1/categories`
  - `/v1/claims`
  - `/v1/admin/*`
- Locale-aware responses must support Uzbek, Russian, and English with fallback behavior.
- Core entities:
  - users
  - businesses
  - categories
  - reviews
  - review replies
  - photos
  - claims
  - reports
- Shared TypeScript client/types should be generated from API contracts for web and mobile.

## First Steps To Begin Building

1. Create production project structure:
   - Next.js web app
   - NestJS API
   - shared TypeScript types package
   - database migration setup
   - environment templates

2. Migrate the existing static MVP:
   - reuse Manzil visual tokens
   - rebuild homepage, discovery list, business profile, review form, and claim CTA in Next.js
   - preserve mobile-first layout from current prototype

3. Implement foundational backend:
   - PostgreSQL schema and migrations
   - seed categories and demo businesses
   - business list/detail APIs
   - basic search endpoint backed by database first, then Meilisearch

4. Add auth and permissions:
   - Clerk integration
   - user sync table
   - roles: consumer, business_owner, admin
   - server-side ownership checks for owner actions

5. Build admin and moderation basics:
   - listing import/review
   - claim approval
   - flagged review/photo queue
   - category management

6. Prepare beta operations:
   - seed-data spreadsheet/import format
   - first 100-200 business outreach list
   - founding reviewer invite flow
   - analytics dashboard for MVP metrics

## Test Plan
- Search:
  - keyword search returns matching businesses
  - category filtering works
  - empty results show helpful state
  - locale-specific names render correctly

- Business profiles:
  - profile pages load server-rendered content
  - rating, review count, hours, address, phone, and photos display correctly
  - unclaimed listings show claim CTA
  - claimed listings show owner-managed data

- Reviews:
  - authenticated users can submit one review per business
  - review text minimum length is enforced
  - duplicate reviews are blocked or routed to edit
  - owner replies are limited to the claimed owner

- Claims:
  - owner can submit claim request
  - admin can approve/reject claim
  - approved owner can edit only their business

- Media:
  - uploads create moderation-pending photos
  - unapproved photos are not public
  - approved photos appear on listings/reviews

- Admin:
  - admin-only routes reject non-admin users
  - claim and moderation queues are usable on mobile-sized screens

- Launch readiness:
  - homepage, search, and profile pages work on mobile/desktop
  - SEO metadata exists for business profile pages
  - analytics track search, profile view, review submission, claim submission
  - staging and production environments are separated

## Assumptions
- `[PROJECT_DEADLINE]` is not fixed, so the plan uses realistic lean-team timelines.
- `[TEAM_SIZE]` is assumed to be founder plus 2-4 contributors.
- The launch city is Tashkent only.
- The first public launch focuses on 2-3 dense categories, not all business types.
- Consumers are free forever; monetization starts later from business-side premium listings.
- Payments, booking, loyalty, sponsored search, and AI are post-MVP unless the roadmap is revised.
- Google Maps is the provisional maps provider, but final selection depends on Tashkent data-quality verification.
- The current static `mvp-site` is a UX prototype, not the production codebase.
