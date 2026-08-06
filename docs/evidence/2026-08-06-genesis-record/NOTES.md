# Genesis Record — Vibrant Marketplace Web Launch (v1.0 of the organization)

**Status: IN PREPARATION — fields fill as gates execute. Nothing below is final until the deploy verifies live.**

## Release

| Field | Value |
|---|---|
| Release | Foundation v1.0 (Vibrant Marketplace web) |
| Date | (fill at gate) |
| Git commit | (fill: merge commit on main) |
| Git tag | design-foundation-v1.0 (created only after live verification) |
| Build ID | (fill: Vercel deployment id) |
| Design system version | Vibrant Marketplace v1.0 (tokens `_tokens.scss` @ 824a1a7 + kit @ fbd4eae + `$vm-cat-grad-*` @ b18467b) |
| Product Bible version | v1.3 (Appendices A–C) |
| ADR count | 4 accepted (001 Tool Orchestrator · 002 Bootstrap-not-Tailwind · 003 Hanken+Golos · 004 RN/Expo mobile), 1 queued (005 event sourcing) |
| Platform | Web — Next.js 16, Bootstrap 5.3 Sass, apps/web |
| Environment | Vercel production (manzil-business.vercel.app) ← Railway API /v1 |

## Gates

| Gate | Result |
|---|---|
| Production build | (fill) |
| Typecheck | (fill) |
| Lint | (fill) |
| Critical e2e subset (shell-boundary, discover, locale-lang, registration, waitlist) | (fill) |
| Bundle size | (fill) |
| Performance snapshot | (fill) |
| Accessibility summary | (fill) |
| Console errors at startup | (fill) |

## Metrics

| Metric | Value |
|---|---|
| Architecture drift | Detected: 1 (Discover category gradients minted in-screen) · Merged: 0 · Resolved before launch: 1 (`b18467b`, promoted to token layer) |
| Component reuse ratio | (fill: kit usages ÷ new component definitions across screen tracks) |
| Onboarding complexity baseline (mobile WOW, from wireframes v1.2) | Screens: 12 · Permissions: 3 (+1 optional) · Target completion < 90s · taps/decisions measured at hi-fi |
| Discovery → Planning conversion | Instrumentation status: (fill — event taxonomy defined, wiring TBD) |

## Integration sweep (five passes)

| Pass | Result |
|---|---|
| 1 Visual consistency | (fill) |
| 2 Component consistency | (fill) |
| 3 Product language (per-locale glossary) | (fill) |
| 4 Interaction | (fill) |
| 5 Product philosophy | (fill) |

## Verification

| Check | Result |
|---|---|
| Live probe /uz | (fill) |
| Live probe /ru | (fill) |
| Live probe /en | (fill) |
| Real API data on live pages (0-featured degradation visible & graceful) | (fill) |
| Vercel env | ✅ Verified 2026-08-06: NEXT_PUBLIC_API_URL=railway/v1 · NEXT_PUBLIC_USE_MOCK=false |
| Screenshot set | (fill: paths) |

## Fleet ledger (implementation commits, all micro-reviewed)

| Task | Commit | Review |
|---|---|---|
| F Foundation | 824a1a7 | ✅ approved |
| K Component kit | fbd4eae | ✅ approved |
| D1 Workspace shell | 56fd0bc | ✅ approved |
| E Concierge | 7ccb57b | ✅ approved |
| B Business details | 589605c | ✅ approved |
| C Auth/registration | cdae370 | ✅ approved |
| A1 Discover (flagship) | de3bfc7 (+fix b18467b) | ✅ approved, drift resolved |
| D2 Dashboard overview | fe1a899 | ✅ approved |
| A2 Home | (fill) | |
| D3 Packages | (fill) | |
| D4 Announcements | (fill) | |
| D5 Workspace sweep | (fill) | |
| S Site sweep | (fill) | |

## Known limitations

(fill at gate — expected: deals/prices absent pending API entities; concierge package panel deferred; near-empty dataset degradations active; full Playwright matrix post-launch)

## Next milestone

Milestone 0 Retrospective → mobile design foundation (RN/Expo, ADR-004) → `design-foundation-mobile-v1.0` → Prompt 02A.
