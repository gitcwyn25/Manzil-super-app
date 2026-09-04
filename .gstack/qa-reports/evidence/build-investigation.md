# Production build stall investigation

Date: 2026-09-04

## Symptom

With `NEXT_PUBLIC_USE_MOCK=false`, `npm run build --workspace @manzil/web` compiled successfully, then previously stopped reporting progress at `Generating static pages using 11 workers (0/100)` during the bounded QA window. The configured API was `http://localhost:4000/v1`, and no API process was listening.

## Root cause

Public server-side readers called the global `fetch` directly without an abort deadline. When the API was unavailable, Next's build-time render workers could wait on those reads instead of reaching the existing empty-state fallbacks. The mock-mode build completed, and direct requests to the configured API failed because the local API was not running; this isolated the failure to real-mode network reads rather than React compilation or static-page generation.

## Fix

Added `apps/web/app/lib/fetch-with-timeout.ts`, which aborts server-side reads after 5 seconds while preserving Next cache options. Applied it to public catalogue, homepage, media, list, occasion, waitlist, sitemap, pricing, and legal reads. The direct category and business-list readers now also return safe empty arrays on non-OK responses or exceptions, matching the public empty-state contract. Mutating and authenticated admin POST flows were not changed.

## Regression verification

- `npm run typecheck --workspace @manzil/web`: PASS.
- `npm run lint --workspace @manzil/web`: PASS with 0 errors and the existing 32 warnings.
- Real-mode production build with the API still unavailable: PASS through `Generating static pages using 11 workers (109/109) in 10.2s`, route optimization, and build-trace collection.
- Post-merge direct build verification: `cmd.exe /d /s /c "set NEXT_TELEMETRY_DISABLED=1&& npm run build --workspace @manzil/web > build-merge-validation-2.log 2>&1"` exited `0`; Next compiled in 22.3s, completed TypeScript, generated `109/109` static pages in 7.0s, finalized optimization, and collected build traces.
- The earlier post-merge run appeared to stop at the type-check phase because PowerShell's native stderr pipeline surfaced Sass/Next warnings as `NativeCommandError`; the direct `cmd.exe` run completed normally. This was a logging-wrapper failure, not a production build stall.
- A final rebuild after fixing 10 merge-introduced lint/type errors exited `0`; Next compiled in 21.6s, completed TypeScript in 30.1s, generated `109/109` static pages in 7.4s, and wrote `.next/BUILD_ID` (`aqRGKqffUy1MT4MSaeZZJ`).
- Completed build artifacts included `.next/BUILD_ID`; no build worker processes remained after completion.
- The generated route table confirmed the expected static, dynamic, Gurman redirect, waitlist, sitemap, and robots routes.

The current post-merge build has a verified numeric exit code of `0` and a completed build artifact. The remote feature branch's mobile dependencies and history are retained, while the incoming web-only Gurman presentation files were removed to preserve the approved mobile-only boundary. Remaining warnings are the existing Sass deprecations, middleware-convention notice, and Supabase Edge Runtime compatibility warning.

## Remote feature-branch merge verification

- Resolved the active merge of `origin/feat/frontend-elevation` without dropping its remote history; the web-side resolution keeps `/gurman` and `/concierge` as waitlist redirects and retains the Docs/Trust Center surface.
- `npm run typecheck --workspace @manzil/web`: PASS after the conflict resolution.
- `npm run lint --workspace @manzil/web`: PASS with 0 errors and 32 warnings.
- A fresh production build exited `0`, completed TypeScript, generated `109/109` static pages, finalized optimization, and collected build traces; `.next/BUILD_ID` was `dYFC16D8xAUv7wQA8HMXu`.
- Direct HTTP probes against the completed artifact passed: `/en`, `/uz/discover`, `/uz/docs`, `/uz/business`, and `/uz/waitlist/gurman` returned 200; `/uz/gurman` and `/uz/concierge` returned 308 to `/uz/waitlist/gurman`.
- `npx playwright test tests/e2e/discover.spec.ts --list`: PASS; 6 tests collected. Full browser execution remains blocked by the missing sandbox Chromium executable.

## Release metadata verification

- Created `VERSION` with `0.2.0` and a dated `CHANGELOG.md` for the verified web/mobile integration release.
- Updated the root `package.json`, root `package-lock.json`, and lockfile root workspace entry to `0.2.0`; workspace package versions remain unchanged.
- Restored the complete 24,209-line lockfile before applying the version change; JSON parsing and the retained mobile dependency entries pass validation.
- Final 0.2.0 production build exited `0`, generated `109/109` static pages, and wrote `.next/BUILD_ID` (`nvz1yyBe8TEaETfvVJR6S`).
- Final direct HTTP probes passed: `/en`, `/uz/discover`, `/uz/docs`, `/uz/business`, and `/uz/waitlist/gurman` returned 200; `/uz/gurman` and `/uz/concierge` returned 308 to `/uz/waitlist/gurman`.

## Remaining release gates

- Playwright test collection passes for the selected public Discover smoke file (6 tests), but execution is blocked because the sandbox lacks `chrome-headless-shell.exe`; no browser download was performed.
- Direct HTTP probes against the final production artifact pass: `/en`, `/uz/discover`, and `/uz/waitlist/gurman` return 200; `/uz/gurman` and `/uz/concierge` return 308 to `/uz/waitlist/gurman`.
- The incoming `origin/main` copy of `.github/workflows/deploy-api.yml` was truncated and progressively mis-indented; the last valid branch version was restored unchanged and parsed successfully as YAML. No deployment behavior was added by this merge.
- Local Git staging/commit is still blocked by Windows ACL errors on `.git/index.lock` and `.git/objects`; no push, PR, merge, or deployment was attempted.
