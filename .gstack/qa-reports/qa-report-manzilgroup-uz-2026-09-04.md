# QA Report: Manzil web surfaces

| Field | Value |
|-------|-------|
| **Date** | 2026-09-04 |
| **URL** | `http://localhost:3000/uz` (local QA target) |
| **Branch** | `feat/frontend-elevation` |
| **Commit** | `61df8df3f564b49fd8f65a141ada9f8c66bdee87` (`feat(web): realign Manzil around Discover and mobile Gurman`) |
| **PR** | - |
| **Tier** | Standard |
| **Scope** | Diff-aware public web surfaces: landing, Discover, Business, Docs, Gurman waitlist, and legacy Gurman routes |
| **Duration** | Approximately 35 minutes of active QA and fix verification |
| **Pages visited** | 17 route probes; 5 distinct visual pages |
| **Screenshots** | 6 files (5 distinct views; `initial.png` duplicates the homepage evidence) |
| **Framework** | Next.js 16.2.10, webpack |
| **Index** | [All QA runs](./index.md) |

## Health Score: 89/100

The score improved from an estimated pre-fix baseline of 69/100. The build blocker is resolved locally, but this is not a ship approval because the full Playwright suite and local source commit gate are still incomplete.

| Category | Baseline | Final |
|----------|----------|-------|
| Console | 70 | 100 |
| Links | 85 | 100 |
| Visual | 82 | 88 |
| Functional | 55 | 85 |
| UX | 72 | 86 |
| Performance | 55 | 90 |
| Content | 62 | 90 |
| Accessibility | 78 | 78 |

Weighted final score: `100*.15 + 100*.10 + 88*.10 + 85*.20 + 86*.15 + 90*.10 + 90*.05 + 78*.15 = 88.9`, rounded to 89.

## Top 3 Things to Fix

1. **ISSUE-007: Full browser regression suite is not green evidence yet** - the targeted Discover regression assertions were updated, but the full Playwright run was not completed in this environment.
2. **ISSUE-008: 26 lint warnings remain** - lint is green, but image optimization, hook dependency, and unused-value warnings remain in existing and changed public components.
3. **Release gate: local Git ACL** - source staging/commit is still blocked by Windows permissions on `.git/index.lock` and `.git/objects`; this needs to be cleared before `/ship`.

## Console Health

No browser runtime errors were observed during the verified visual navigation pass after the filter and routing fixes. The local build emitted framework/tooling warnings, recorded separately below. A full automated console crawl was not completed.

| Warning / limitation | Count | First seen |
|-----------------------|-------|------------|
| Next middleware convention deprecation | 1 recurring build/dev warning | local Next startup |
| Sass and Bootstrap deprecation warnings | many, build output | production build |
| Supabase Node API referenced from Edge Runtime bundle | 1 build warning | production build |
| ESLint warnings | 26 | `npm run lint --workspace @manzil/web` |

## Route and Boundary Results

| Route | Result |
|-------|--------|
| `/` | 307 to `/uz` |
| `/uz`, `/ru`, `/en` | 200 |
| `/uz/discover` | 200 |
| `/uz/business` | 200 |
| `/uz/docs` | 200 |
| `/uz/waitlist/gurman` | 200; email field present; city/business fields absent |
| `/uz/waitlist/city` | 200 |
| `/uz/about`, `/uz/trust`, `/uz/legal/privacy`, `/uz/founders`, `/uz/contact`, `/uz/legal/terms` | 200 |
| `/uz/gurman` | 308 to `/uz/waitlist/gurman` |
| `/uz/concierge` | 308 to `/uz/waitlist/gurman` |

The content audit found no rendered live web Gurman chat, app-download claim, unsupported public metric, or legacy web Gurman link on the audited public pages. The Gurman waitlist renders an email field only.

## Summary

| Severity | Count |
|----------|-------|
| Critical | 0 |
| High | 0 open (1 resolved) |
| Medium | 7 |
| Low | 1 |
| **Historical total** | **9 (8 open follow-ups)** |

## Issues

### ISSUE-001: Discover filter navigation triggered a client-side update error

| Field | Value |
|-------|-------|
| **Severity** | medium |
| **Category** | functional / console |
| **URL** | `/uz/discover` |

**Description:** Filter changes performed navigation from inside a React state updater. The Discover interaction could emit a router/update warning and fail to behave predictably.

**Fix:** `marketplace-client.tsx` now computes the next filter state, updates React state, and performs URL navigation outside the state updater.

**Verification:** Category navigation was re-tested and reached `?category=cafes` without the prior update error. Evidence: `screenshots/discover.png`, `screenshots/discover-search.png`.

### ISSUE-002: Discover search did not persist the submitted query

| Field | Value |
|-------|-------|
| **Severity** | medium |
| **Category** | functional |
| **URL** | `/uz/discover` |

**Description:** The search submit handler read stale state, so the submitted query could be missing from the URL.

**Fix:** The hero now passes the submitted input to the callback, which writes `?q=coffee` (or the submitted value) before category changes.

**Verification:** Search for `coffee` was re-tested and produced `/uz/discover?q=coffee`; applying the cafe category preserved the query and added `category=cafes`.

### ISSUE-003: Legacy web Gurman routes were dead ends

| Field | Value |
|-------|-------|
| **Severity** | medium |
| **Category** | links / functional |
| **URL** | `/uz/gurman`, `/uz/concierge` |

**Description:** The approved product boundary removes web chat. Leaving old routes absent or pointing at stale UI would create a broken public promise.

**Fix:** Both localized routes now return a permanent 308 redirect to the mobile Gurman waitlist. The business-profile CTA also points to the waitlist.

**Verification:** Both routes returned 308 with `Location: /uz/waitlist/gurman`.

### ISSUE-004: Discover cards presented unsupported status and fallback data

| Field | Value |
|-------|-------|
| **Severity** | medium |
| **Category** | content / functional |
| **URL** | `/uz/discover` |

**Description:** Cards used blanket Verified/Open claims and fallback rating, review-count, district, price, and recommendation values when the record did not provide them. That conflicts with the approved public-truth policy.

**Fix:** Cards now distinguish claimed/founding profiles, render live status only when supplied, omit unknown values, and use neutral new-profile copy instead of invented metrics.

**Verification:** Re-tested in the Discover visual pass and content audit.

### ISSUE-005: Public pages overpromised Gurman, downloads, metrics, and customer proof

| Field | Value |
|-------|-------|
| **Severity** | medium |
| **Category** | content / UX |
| **URL** | `/uz`, `/uz/business`, `/uz/docs` |

**Description:** Rendered copy repeated the removed web concierge, app-download badges, unsupported performance metrics, and testimonial/adoption claims.

**Fix:** Public copy now describes Manzil as the directory and business portal, labels illustrative previews, removes fake metrics and badges, and presents Gurman as a mobile product under construction with a waitlist.

**Verification:** The content audit returned false for live chat, app-download claims, unsupported metrics, and legacy web Gurman links on all audited public pages. Evidence: `screenshots/homepage.png`, `screenshots/business.png`, `screenshots/docs.png`.

### ISSUE-006: Gurman waitlist did not match the mobile-only boundary

| Field | Value |
|-------|-------|
| **Severity** | medium |
| **Category** | functional / content |
| **URL** | `/uz/waitlist/gurman` |

**Description:** The mobile-only Gurman launch needs an email-first waitlist, not a fake web chat or unrelated city/business intake fields.

**Fix:** Added localized Gurman waitlist copy, removed the public count for this topic, and verified that only the email field is present.

**Verification:** Route returned 200; email field was present and city/business fields were absent. No test submission was sent.

### ISSUE-007: Existing Discover E2E assertion encoded the removed product direction

| Field | Value |
|-------|-------|
| **Severity** | medium |
| **Category** | functional / test |
| **URL** | `tests/e2e/discover.spec.ts` |

**Description:** The test expected an active Gurman hero on Discover even though the approved direction removes web Gurman.

**Fix:** Replaced the stale assertion with the new boundary assertion and added URL-sync coverage for search and category filters.

**Verification:** Test source was updated. The complete Playwright suite was not completed in this environment, so this remains targeted-test evidence rather than a full-suite pass.

### ISSUE-008: QA changes introduced lint blockers

| Field | Value |
|-------|-------|
| **Severity** | low |
| **Category** | console / code quality |
| **URL** | public component files and `apps/web/next.config.ts` |

**Description:** The content changes left unescaped apostrophes in JSX and a forbidden `require()` call in the Next config.

**Fix:** Escaped JSX apostrophes and replaced the config `require()` usage with a path expression.

**Verification:** `npm run lint --workspace @manzil/web` passes with 0 errors and 26 warnings.

### ISSUE-009: Production build stalled on unavailable API reads — resolved

| Field | Value |
|-------|-------|
| **Severity** | high → resolved |
| **Category** | performance / release |
| **URL** | `npm run build --workspace @manzil/web` |

**Description:** With `NEXT_PUBLIC_USE_MOCK=false` and the configured `http://localhost:4000/v1` API unavailable, public server-side reads called `fetch` without an abort deadline. Next build workers waited on those reads instead of reaching the existing empty-state fallbacks. Mock mode completed, isolating the failure to real-mode network reads rather than compilation or route generation.

**Fix:** Added `apps/web/app/lib/fetch-with-timeout.ts`, a 5-second abort guard that preserves Next cache options, and applied it to public catalogue, homepage, media, list, occasion, waitlist, sitemap, pricing, and legal reads. Category and business-list readers also now return safe empty arrays on non-OK responses or exceptions. Mutating and authenticated admin POST flows were not changed.

**Verification:** The real-mode build was rerun with the API still unavailable and completed static generation at `109/109` in 10.2 seconds, then completed route optimization and build-trace collection. A `.next/BUILD_ID` was present and no build worker processes remained. Evidence: `evidence/build-investigation.md` and `evidence/build-stall.log`.

**Status:** Resolved locally. Full Playwright completion, local Git staging/commit, and external release steps remain separate gates.

## Fixes Applied

| Issue | Fix Status | Commit | Files Changed |
|-------|-----------|--------|---------------|
| ISSUE-001 | verified | uncommitted; Git ACL blocked | `apps/web/app/components/discover/marketplace-client.tsx` |
| ISSUE-002 | verified | uncommitted; Git ACL blocked | `apps/web/app/components/discover/discover-hero.tsx`, `marketplace-client.tsx` |
| ISSUE-003 | verified | uncommitted; Git ACL blocked | localized `gurman` and `concierge` route files; business profile CTA |
| ISSUE-004 | verified | uncommitted; Git ACL blocked | `marketplace-card.tsx`, filter labels |
| ISSUE-005 | verified | uncommitted; Git ACL blocked | landing, footer, business, SEO, and shared copy |
| ISSUE-006 | verified | uncommitted; Git ACL blocked | waitlist copy and topic page |
| ISSUE-007 | best-effort | uncommitted; Git ACL blocked | `tests/e2e/discover.spec.ts` |
| ISSUE-008 | verified | uncommitted; Git ACL blocked | `business-hero-01.tsx`, `footer.tsx`, `clever-waitlist-card.tsx`, `next.config.ts` |
| ISSUE-009 | verified | uncommitted; Git ACL blocked | `fetch-with-timeout.ts`, public server-read helpers, waitlist, sitemap, legal, and plans |

## Evidence

- `screenshots/initial.png` - initial homepage evidence.
- `screenshots/homepage.png` - homepage after the public-truth and mobile Gurman boundary changes.
- `screenshots/discover.png` - Discover surface.
- `screenshots/discover-search.png` - Discover search/category URL regression evidence.
- `screenshots/business.png` - short business surface with illustrative dashboard labels.
- `screenshots/docs.png` - Docs/Trust Center surface.
- `evidence/route-probe.json` - route status probe.
- `evidence/content-audit.json` - final rendered-content boundary audit.
- `evidence/build-stall.log` - earlier build stall evidence.
- `evidence/build-investigation.md` - root cause, timeout fix, and real-mode build verification.

## Validation Commands

| Check | Result |
|-------|--------|
| `npm run typecheck --workspace @manzil/web` | PASS |
| `npm run lint --workspace @manzil/web` | PASS with 26 warnings, 0 errors |
| `git diff --check` | PASS when evaluated with Windows CRLF handling; raw default mode reports CRLF on the changed `next.config.ts` line |
| Route probe | PASS for expected 200/307/308 statuses |
| Rendered content boundary audit | PASS |
| Manual browser visual pass | PASS for the five captured public surfaces |
| Production build | PASS: real mode reached `109/109` static pages, route optimization, and build-trace collection with API unavailable |
| Full Playwright suite | NOT RUN TO COMPLETION |

## Ship Readiness

| Metric | Value |
|--------|-------|
| Health score | 69 baseline -> 89 final |
| Issues found | 9 |
| Fixes applied | 9 (verified: 8, best-effort: 1, reverted: 0) |
| Deferred | 0 high-severity blockers; full Playwright and commit gates remain |
| Local source commit | blocked by sandbox Git ACL (`.git/index.lock` / `.git/objects`) |
| Push / PR / deploy | not performed |

**PR Summary:** "QA found 9 issues, fixed 9, health score 69 -> 89; production build now completes with the API unavailable, while the full Playwright and local commit gates remain."

## Isolation Note

The nested Android worktree was not reset, deleted, or committed. The parent repository still reports its intentional nested-worktree marker. The earlier stash attempt was blocked by a Windows `.git/worktrees/android-consumer-app/index.lock` ACL; a reversible backup exists at `C:\Users\nuobe\Strawberry\default\sessions\7d822565-9ab6-41bf-8b7d-f831edebb4c4\nested-android-worktree-backup`.

No external push, PR creation, merge, deployment, or waitlist submission was performed.
