# Genesis Record v1.0 — Vibrant Marketplace Web Launch (v1.0 of the organization)

> **This document records what actually shipped, not what was planned.**

**Status: COMPLETE — live-verified 2026-08-06 22:4x WAST.**

## Organization Identity (founding principles)

Manzil sells confidence, not information. · Every screen leads somewhere. · **Discover. Plan. Experience.** · The Workspace is the center. · Evidence over opinion.

## Release

| Field | Value |
|---|---|
| Release | Foundation v1.0 (Vibrant Marketplace web) |
| Date | 2026-08-06 |
| Git commit | `fb5af55` on main (fast-forward f8b4aa2..fb5af55, 143 files, +20,486 −2,112) |
| Git tag | `design-foundation-v1.0` (created AFTER live verification, pushed) |
| Build ID | Vercel `dpl` manzil-adx3jxe31 (production, ● Ready, created 22:28:17) |
| Design system version | Vibrant Marketplace v1.0 — `_tokens.scss` @ 824a1a7 + kit @ fbd4eae + `$vm-cat-grad-*` @ b18467b |
| Product Bible version | v1.3 (Appendices A–C) |
| ADR count | 4 accepted (001 Tool Orchestrator · 002 Bootstrap-not-Tailwind · 003 Hanken+Golos · 004 RN/Expo mobile), 1 queued (005 event sourcing) |
| Platform | Web — Next.js 16, Bootstrap 5.3 Sass, apps/web |
| Environment | Vercel production (manzil-business.vercel.app) ← Railway API /v1 (health: ok, database up) |

## Engineering Fingerprint

| Field | Value |
|---|---|
| Repository state at release commit | Clean (verified before merge) |
| Outstanding staged changes | 0 |
| TODOs accepted into release | 0 (`TODO\|FIXME\|HACK` grep across apps/web/app: zero) |
| Unreleased commits on main | 0 (fast-forward push; branches in sync) |

## Dependency Snapshot (major runtime)

| Dependency | Version |
|---|---|
| Next.js | 16.2.10 |
| React | 19.2.7 |
| Bootstrap | 5.3.8 |
| Sass | 1.102.0 |
| Node (build) | 24.13.0 |
| Railway API | /v1 (health-verified; cache "memory" — Redis unprovisioned in prod, see risks) |
| Database schema | Prisma 6.19.3, 37 models; **migration drift documented** (see risks) |
| Expo | reference only — mobile track starts post-retro (ADR-004) |

## Product Capability Matrix

| Capability | Status |
|---|---|
| Discover (flagship) | ✅ Shipped — planner hero, category bento, filtered results, real data |
| Home | ✅ Shipped — green hero brand moment, bento grid, D10 degradations live |
| Business profiles + reviews | ✅ Shipped — hero gallery, experience feed, review form/helpful/claims all wired |
| Registration + auth | ✅ Shipped — SplitAuthShell, Clerk appearance bridge, contract selectors preserved |
| Workspace (merchant dashboard) | ✅ Shipped — 9 routes in VM, real CRM data, honest-data contracts in code |
| Concierge (Gurman chat) | ✅ Shipped (grounded single-turn) — package panel deferred honestly |
| Occasions, lists, profile, waitlist, business landing/plans/pricing | ✅ Re-skinned (token tier; profile page is mock-data island — see limitations) |
| Bookings (consumer) | Deferred — no booking engine (ADR-001 consequence; owner-recorded intake exists in CRM) |
| Payments (consumer) | Deferred (Stripe business subscriptions exist server-side) |
| Package builder / Voice / Stories / Social | Deferred (mobile 3.0 + Expand phase) |

## Risk Register (handoff into Milestone 1)

1. **Sparse production dataset** (2 businesses, 0 featured) — degradation states are the launch-day UI (by design, verified live).
2. **Prisma migration drift** — schema tables exist in no migration (WaitlistSignup, AdminNotification, Stripe columns, AdminUser credentials); production was `prisma db push`-ed. A fresh environment cannot be built from migrations alone. Needs a consolidation migration.
3. **Redis unprovisioned in production** — cache + rate-limit buckets are per-process memory (reset on deploy, not shared across replicas).
4. **Booking orchestration not implemented** — "book" promises stay honest until the Tool Orchestrator's booking tool exists (6-10 weeks estimated).
5. **globals.css legacy system (6.5k lines) still standing** — VM wins by cascade, not deletion; documented drift risk for a cleanup milestone.

## Gates

| Gate | Result |
|---|---|
| Production build | ✅ exit 0 (twice: dev-env and prod-env builds) |
| Typecheck | ✅ clean (`tsc --noEmit`; earlier failure was a concurrent-build race, resolved) |
| Lint | ✅ 0 errors, 7 accepted warnings (pre-existing `<img>` covers-pipeline pattern) |
| Critical e2e subset | ✅ 17/17 runnable passed locally; 2 waitlist failures root-caused to localhost-origin CORS (documented waiver) then **closed: 10/10 passed against production origin** incl. both waived specs + full discover suite |
| Bundle | 1.9MB JS chunks + 440KB CSS on disk (all routes, uncompressed); route manifest healthy (see build log) |
| Performance snapshot | NOT MEASURED (formal profiling deferred; production pages 51-53KB HTML, ISR 30-300s on consumer surfaces) |
| Accessibility | Structural checks in micro-reviews (focus recipes, reduced-motion, labels via kit); formal audit NOT MEASURED — post-launch task |
| Console errors at startup | None observed during e2e runs (17 specs, zero unexpected-console assertions tripped) |

## Metrics

| Metric | Value |
|---|---|
| Architecture drift | **Detected: 1 · Merged: 0 · Resolved before launch: 1** (Discover category gradients minted in-screen → promoted to token layer, `b18467b`) |
| Component reuse ratio | 58 kit usages ÷ 10 new screen-domain components ≈ **5.8** |
| Design-system adoption | 25 of ~70 non-kit components import the kit directly; all 24 routes consume kit-styled primitives via 13 vm/ components + token layer |
| Onboarding complexity baseline (mobile WOW v1.2) | 12 screens · 3 permissions (+1 optional) · target < 90s (taps measured at hi-fi) |
| Discovery → Planning conversion | Instrumentation status: NOT WIRED — event taxonomy defined (frozen contract), analytics wiring is backlog |

## Integration sweep (five passes)

| Pass | Result |
|---|---|
| 1 Visual consistency | ✅ via 13 micro-reviews + zero hardcoded colors fleet-wide after A1's fix |
| 2 Component consistency | ✅ one icon source held (extensions via vm/icons.tsx only), no duplicate cards, domain ownership pattern (home/, discover/, workspace/) |
| 3 Product language | ✅ per-locale census across landing-copy/crm-copy/ui-copy; 1 fix (ru "Избранное"→"Выбор Manzil", Saved-concept collision); bron/buyurtma verified as distinct concepts |
| 4 Interaction | ✅ e2e welds all preserved (verified by inspection agent + passing suite); no-JS forms (GET filters, POST waitlist) verified |
| 5 Product philosophy | ✅ honesty pattern in 6 independent tracks ("omitted, not faked" ×3, deferred panel, no fake badges, no fake trends); every screen leads somewhere (empty states are invitations) |

## Verification

| Check | Result |
|---|---|
| Live probe /uz /ru /en | ✅ 200 ×3, VM classes rendering, real API data (real slugs present, 0 mock names) |
| html lang | uz/ru/en SSR shows lang="uz" + pre-paint inline-script correction — **pre-existing architecture** (root layout has no locale segment), documented in code, inherited not regressed |
| Real API data | ✅ NEXT_PUBLIC_USE_MOCK=false verified in Vercel env AND by live content |
| Production e2e | ✅ 10/10 (waitlist + discover suites against manzil-business.vercel.app) |
| Screenshot set | ✅ 8 captures: home/discover/business-detail/ru-home × 390px/1440px (this directory) |

## Implementation Ledger (commits, all micro-reviewed)

| Task | Commit | Review |
|---|---|---|
| F Foundation | 824a1a7 | ✅ |
| K Component kit | fbd4eae | ✅ |
| D1 Workspace shell | 56fd0bc | ✅ |
| E Concierge | 7ccb57b | ✅ |
| B Business details | 589605c | ✅ |
| C Auth/registration | cdae370 | ✅ |
| A1 Discover (flagship) | de3bfc7 + b18467b | ✅ drift resolved |
| D2 Dashboard overview | fe1a899 | ✅ |
| A2 Home | 036e31c | ✅ |
| D3 Packages | 4ea2a1c | ✅ |
| D4 Announcements | 8486152 | ✅ |
| D5 Workspace sweep | 27dccdb | ✅ |
| S Site sweep | 535046b | ✅ |
| Language fix | fb5af55 | ✅ |

Fleet totals: 13 tasks, 2.57M agent tokens, 916 tool uses, 0 unresolved errors (2 infra-caused agent restarts, no lost work).

## Cultural narrative (the four behaviors)

Truth over appearance (missing data documented, never fabricated — 6 independent tracks) · Foundation first (missing visuals promoted to tokens) · Domain ownership (components by domain, not by page) · Kit protection (shared primitives extended only through sanctioned paths). **Prefer truthful software over visually complete software.**

## Known limitations

Deals/prices absent (no API entity — priceTier only) · concierge package panel deferred · profile page renders mock social data (token-remapped only) · two pricing sources coexist (real /plans on landing, mock tiers on /business/pricing) · full Playwright matrix + formal a11y/perf audits post-launch · stale saas.spec.ts (pre-redesign, superseded by tests/e2e) · html lang SSR limitation (above).

## Next milestone

Milestone 0 Retrospective → Validate (observe usage, wire analytics events) → mobile design foundation (RN/Expo, ADR-004) → `design-foundation-mobile-v1.0` → Prompt 02A/B/C.
