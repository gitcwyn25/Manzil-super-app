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
- `npm run lint --workspace @manzil/web`: PASS with 0 errors and the existing 26 warnings.
- Real-mode production build with the API still unavailable: PASS through `Generating static pages using 11 workers (109/109) in 10.2s`, route optimization, and build-trace collection.
- Completed build artifacts included `.next/BUILD_ID`; no build worker processes remained after completion.
- The generated route table confirmed the expected static, dynamic, Gurman redirect, waitlist, sitemap, and robots routes.

The Strawberry shell did not expose a separate numeric exit code for this long-running command, but the Next build reached its normal final route/build-trace output and left a completed build artifact with no active build processes.

## Remaining release gates

The full Playwright suite has not been completed in this environment. Local Git staging/commit is still blocked by Windows ACL errors on `.git/index.lock` and `.git/objects`; no push, PR, merge, or deployment was attempted.
