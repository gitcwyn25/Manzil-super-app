# Manzil — Comprehensive Engineering Status Report

**Date:** 2026-08-06 · Evidence-based: 3-agent deep inspection (`.superpowers/sdd/2026-08-06-status-inspection/`) + Genesis Record v1.0 + live production. Percentages are measured against the corpus-defined V1 platform (Product Bible §24 MVP + authorized roadmap through the Tool Orchestrator), not against the full 3-year vision.

## 1. Completion by Area

| Area | % | Basis |
|---|---|---|
| **Overall (V1 platform)** | **~35%** | Weighted: web shipped, backend half-built, mobile embryonic, AI seeded, business platform unstarted |
| Web | 85% | All 24 routes live in Vibrant Marketplace on production (Genesis v1.0). Missing: profile page real data (4 mock functions), deals/pricing entities, concierge package panel, analytics event wiring, formal a11y/perf audits, 6.5k-line legacy CSS cleanup |
| Mobile | 8% | apps/mobile is a 7-screen Expo prototype predating ADR-004 (react-navigation, not Expo Router). Everything real is ahead: mobile design foundation → WOW Flow (12 screens) → epics 2-7. Kotlin app frozen on a worktree branch as reference |
| Backend | 45% | **Strong:** CRM/workspace (most complete feature — registration, announcements, packages, owner booking intake with race-safe completion→Customer→loyalty tx, segments, consent-gated campaigns), media (presigned R2/Supabase, moderation, cover invariant), reviews+trust (helpful votes, verified-visit via booking link, moderation), Clerk auth + scrypt admin console with RBAC+audit, Stripe billing, legal/contracts, Gurman seed. **Missing:** consumer booking (0 endpoints), consumer payments (Payment table never written; Payme/Click enum-only), user notifications (0 endpoints, no scheduler — campaigns fire only on manual click), stories (nothing), search engine (cached ILIKE, no geo/typo/autocomplete), capability graph, team/verification/OTP/feature-flag routes (tables exist, no controllers) |
| Database | 60% | 37 models, genuinely good quality (deliberate uniques, sound cascades, decent hot-path indexes). **Critical:** schema/migration drift — 5 table/column families exist in no migration (prod was `db push`-ed); fresh envs can't build from migrations. Gaps: 10 missing table families (Availability/TimeSlot, Notification, Story, Capability, Conversation, Favorite, Refund ledger…), no index on ownership columns, no trigram index for search, no geo index, `city` hardcoded "Tashkent" in one mapper |
| AI | 15% | Working grounded single-turn seed (`/v1/gurman/ask`: claude-sonnet-5 pinned, whole-catalog retrieval with vector threshold documented, post-cache grounding, fail-closed, throttled). Frozen contracts (memory tiers, retrieval priority, Intent→Constraints→Plan→Action). **Epic 03 (Intelligence Platform interfaces) in progress right now.** No memory, no tools, no multi-turn (Epic 04+) |
| Booking Engine | 5% | Owner-recorded intake + status machine only. No availability model, no slots, no conflict detection, no consumer flow. Estimate: 6-10 weeks (availability model + race safety are the hard 60%) |
| Tool Orchestrator | 5% | ADR-001 + seed endpoint + contracts being typed in Epic 03. Meaningful only after capability schema + booking exist (nothing to call except ILIKE today). Estimate: 6-10 weeks when its dependencies exist |
| MCP | 0% | Spec only (`manzil_mcp_plugin_spec.txt`); external face of the orchestrator, sequenced after it |
| Admin Panel | 70% | apps/admin functional (Next 16 + Clerk + AdminUser RBAC via /v1/console/* with audit log; analytics/audit/businesses/categories/legal/plans/reviews/users). **No deploy pipeline exists**; web-side (workspace)/admin directory is empty; admin API functions in web are consumed by no route |
| Testing | 40% | 23 API jest specs; 7 aligned e2e specs (welds verified, passing against production); contract tests in shared. Missing: web unit tests, full Playwright matrix, load/security/a11y automation; one stale spec (saas.spec.ts) to retire |
| Infrastructure | 55% | **Good:** Railway staged CI (staging → smoke test → production → rollback script), Vercel CI for web, db-migrate workflow, Sentry, docker-compose dev stack. **Missing:** Redis in production (cache:"memory" — rate limits reset per deploy), admin deployment, migration-drift CI check, web staging env, monitoring depth. Dead config: azure template, empty infra/oracle |

## 2. Current Web Status

**Completed (all live on production):** home, discover (browse + filtered), businesses/[slug], concierge, sign-in/up, business/register(+photos), 9 dashboard routes + shell, business landing/plans/pricing, lists(+slug), occasions(+slug), profile, waitlist — 13 fully rebuilt routes + 10 token-tier re-skins. Kit: 13 vm/ primitives + domain components (home/, discover/, workspace/). **APIs connected (real):** home feed, categories, search, business detail, photos/covers, occasions, lists, mine, review create/reply/helpful, claims, visit ping, CRM suite (announcements, packages, stats, customers, bookings, analytics), plans, legal, gurman ask, waitlist. **Still mocked:** achievements, user profile, discoverable users, social activities, concierge prompt chips, subscription tiers on /business/pricing (real /plans coexists — consolidation task), home-feed occasions/lists rows. **Static/dynamic:** SSG locale shells + ISR consumer surfaces (30-300s) + 13 force-dynamic auth surfaces.

## 3. Deployment ETA (single developer)

| Milestone | ETA |
|---|---|
| Production build · Deployment · Public URL | ✅ **DONE — live today** (manzil-business.vercel.app, Genesis v1.0) |
| Stable demo | ✅ Now (live; honest near-empty-data states) |
| Beta (one district: seeded businesses, booking v1, notifications v1, mobile WOW TestFlight/APK) | ~3-4 months |
| MVP per Product Bible §24 (consumer bookings, notifications, merchant ops, admin deployed) | ~4-6 months |
| Production-ready platform (local payments certified, orchestrator v1, capability graph v1, mobile in stores) | ~8-12 months (payments add 2-6 weeks *elapsed* certification time that cannot be coded around) |

## 4. Backend Review — summarized

NestJS 11 monolith (21 controllers, thin repositories, global v1 prefix, helmet, allowlist CORS, validated DTOs, Redis-fallback throttling, Sentry, Railway Docker deploy with staged CI + smoke + rollback). Auth: Clerk (roles from local DB), fail-closed dev headers, scrypt+HMAC admin console with per-handler permissions and transactional audit. Full endpoint inventory, feature-by-feature status, and broken-suspects list: `inspect-backend-db.json`. Notable code-quality: transaction/idempotency discipline is high (unique constraints as invariants, race-safe completion, signature-verified webhooks). Broken/inconsistent: search shows suspended businesses while Gurman hides them; free `chooseSubscription` may bypass payment gating (confirm); campaign delivery is a stub without Telegram/SMS env; no scheduler exists platform-wide.

## 5. Database Review — summarized

Keep Supabase Postgres + Prisma (right size, good schema). **Before new feature work:** (1) drift-reconciliation migration via `prisma migrate diff`, restore migrate-deploy as truth; (2) provision Redis; (3) ownership + pg_trgm indexes (or adopt Meilisearch); (4) PostGIS before "nearby"; (5) partial unique index for single-cover; (6) Availability/TimeSlot + payment-event ledger when booking/payments start; (7) delete apps/backend. Full table/relationship/index analysis: `inspect-backend-db.json → schemaReview`.

## 6. Functionality Audit

| Feature | Status |
|---|---|
| Authentication (consumer/owner/admin) | ✅ Completed |
| Web onboarding/registration | ✅ Completed |
| Discovery | ✅ Completed (web) — search engine upgrade pending |
| Business profiles | ✅ Completed (web+API) |
| Reviews + trust | ✅ Completed (v1: votes, verified-visit, moderation) |
| Workspace/CRM | ✅ Completed (v1) — campaign delivery + scheduler pending |
| Media | ✅ Completed |
| Billing (Stripe, business) | ✅ Completed |
| Legal/contracts | ✅ Completed |
| Gurman AI | 🟡 Partial (grounded single-turn seed; Epic 03 architecture in flight) |
| Bookings | 🟡 Partial (owner intake only; no consumer flow) |
| Search | 🟡 Partial (basic ILIKE) |
| Admin | 🟡 Partial (functional, undeployed) |
| Analytics | 🟡 Partial (funnel events + owner dashboards; product analytics unwired) |
| Localization | 🟡 Partial (trilingual web complete; SSR html-lang limitation documented) |
| Notifications | 🔴 Minimal (admin-only) |
| Payments (consumer/local) | 🔴 Not started |
| Stories / social | 🔴 Not started |
| Mobile 3.0 | 🔴 Not started (prototype exists) |
| Capability graph / Experience graph | 🔴 Not started (contracts in Epic 03) |

## 7. README

Rewritten by dedicated agent from inspection evidence (separate commit; investor/engineer/contributor grade, evidence-linked, no fabricated claims).

## 8. Final Roadmap (milestones)

| # | Milestone | Goal | Deliverables | Est. | Dependencies | Risk | Done when |
|---|---|---|---|---|---|---|---|
| M1 | **Platform Hygiene** | Repo/infra truth | Drift-reconciliation migration + CI check; Redis in prod; ownership+trgm indexes; delete apps/backend; retire stale spec; admin deploy pipeline; gate-sequencing rule | 1-2 wk | none | Low | Fresh env builds from migrations; health reports redis; admin has a URL |
| M2 | **Intelligence Platform (Epic 03)** | AI OS contracts | intelligence/ module (12 contract groups), ADR-005, docs v1.1/v1.3, diagrams | days (in flight) | none | Low | tsc green, ADR merged |
| M3 | **Mobile Design Foundation** | RN/Expo foundation | Expo app reboot (Expo Router per ADR-004), obsidian/gold tokens, primitives, `design-foundation-mobile-v1.0` tag | 2-3 wk | M2 not required | Med (new stack) | Foundation gates + tag |
| M4 | **WOW Flow 02A→02C** | First-time experience | 12 screens per wireframes v1.2, guest mode, contextual permissions, real auth vs existing backend | 3-4 wk | M3 | Med | DoD per prompt; DoS after beta users |
| M5 | **Notifications v1** | First async platform capability | Notification/DeviceToken/preferences models+API, in-app feed, Telegram bot, SMS provider, BullMQ scheduler (unlocks campaign delivery) | 3-5 wk | M1 (Redis) | Med | Campaigns actually deliver; reminders fire |
| M6 | **Booking Engine v1** | Consumer bookings | Availability/TimeSlot models, owner calendar, public slot search, book/cancel/reschedule, conflict safety, CRM pipeline integration | 6-10 wk | M1, M5 | **High** (concurrency, timezone) | e2e booking on production; no double-booking under race tests |
| M7 | **Payments v1 (local)** | Real UZS revenue | Payme+Click callbacks, idempotent ledger+refunds, certification | 4-8 wk eng + 2-6 wk elapsed cert | M6 | **High** (external cert) | First real charge + refund reconciled |
| M8 | **Capability Graph v1 + Gurman Epic 04** | Decision engine | Capability schema+editing+backfill, review-signal extraction, multi-turn Gurman with memory + first 3 tools via orchestrator | 8-12 wk | M2, M6 | High | "Replace the venue" works with explanations |
| M9 | **Business Platform (Build/Operate/Grow)** | Org-centric CRM | Organizations/roles/permissions, unified inbox, marketing hub v1 per docs 17-19 | 8-12 wk | M5-M7 | Med | Org switcher live; Business Platform Bible executed |

Sequencing honest total: **~6-8 months** of focused solo work to M7, matching the backend inspector's independent estimate. Parallelizable where marked; every milestone opens with an Engineering Budget + DoR per governance v1.6.
