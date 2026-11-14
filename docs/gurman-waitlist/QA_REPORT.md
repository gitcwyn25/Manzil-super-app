# Docs and Gurman verification

14 November 2026, Asia/Tashkent. Candidate: `apps/marketing`, branch
`feat/manzil-docs-gurman-waitlist-v3`, based on preserved V3 `8459925`.
No deployment, integration activation, real submission or production change
was performed by this extension.

## Results

| Check | Result |
| --- | --- |
| Static production build | Passed; corporate root, Docs, Gurman and seven existing documents prerendered. |
| TypeScript | Passed (`npm run typecheck`). |
| ESLint | Passed (`npm run lint`). |
| Vitest | 7 passed in 2 files (`npm test`). |
| Dedicated route/browser suite | 15 passed across 375×812, 768×1024 and 1440×900, including localized waitlist aliases and query stripping. |
| Existing homepage browser suite | 9 passed across the same three viewports. |
| Production-indexing artifact check | Passed locally: Docs retains noindex, stays outside sitemap; Gurman is present in sitemap; root indexing opt-in remains intact; no native form or thanks artifact. |
| Vercel configuration | Configured property definitions validate against the current provider schema. Local HTTP behavior verified; actual new provider rule awaits isolated deployment review. |
| Public destinations | Read-only checks: Tally 200; customer and business bounded redirect chains finish at 200. Authentication and form completion were not exercised. |
| Telegram | Pending verified account/chat access and a real response→message receipt test. |
| Credentials/diff review | No token/private-key patterns found in the targeted new/changed-file scan; `git diff --check` passed. No credentials are used in the frontend. |

Evidence: [route report](evidence/playwright-report.json),
[homepage report](home-regression/evidence/playwright-report.json),
[production static assertions](evidence/production-static.json),
[provider schema scope/result](evidence/vercel-schema.json), and
[live HTTP audit](evidence/live-http.json).

The default noindex build is restored after the local production-mode test.
No indexing setting was changed on a hosting project.

## Browser and visual checks

The suites check responsive layouts without horizontal overflow, working
fragment targets, keyboard focus/menu behavior, reduced motion, correct
canonical/robots/sitemap output, absence of fake forms/success copy, exact 307
Location and no-store caching, existing business/localized mappings, legacy
bookmarks, homepage imagery, legal pages and customer auth destinations.

The final no-JavaScript test follows the plain anchor to the local route,
fetches the real local HTTP response with `maxRedirects: 0`, checks it, then
stops navigation before contacting Tally. No fake response is counted as a
successful form submission. The passing final suite records no external
browser requests, console/runtime errors or failed local assets.

All six [Docs/Gurman screenshots](screenshots) were captured. Mobile Gurman and
desktop Docs were visually inspected: approved three-layer mark plus square,
readable copy, visible CTA, clean spacing and no clipping. The original homepage
suite captures current regression screenshots locally; its report is included
without changing historical `docs/v3` evidence.

The supplied computer/browser bridge was unavailable (no native pipe or
browser access host). Thus interactive manual browser operation could not be
performed. Standard repository Playwright checks and direct screenshot review
were used; interactive owner acceptance remains outstanding.

The available Playwright 1.61.1 runner expects Chromium revision 1228. The cached
revision 1248 runs Chromium 156.0.8078.4. Automated results are real, but this
version mismatch limits support claims; rerun with the runner's matching
installed browser in CI before release. No accessibility/performance score is
inferred from these checks.

## Integration and scope limits

No Tally owner access, Make scenario, Telegram bot connection or intended chat
was verified. Public HTTP 200 establishes reachability only. Field mapping,
Tally storage, exactly-one Telegram receipt and completion settings are all
pending. Follow [TELEGRAM_SETUP.md](TELEGRAM_SETUP.md); do not claim notifications
work before its test passes.

The audit found existing production pages and routing that differ from the
repository. Unsupported claims and unconditional thanks copy exist there;
this candidate corrects those patterns only in source, and was not published.
The Tally owner must inspect any completion redirect before an approved release
because this candidate intentionally omits the optional thanks page.

The root homepage section source, brand geometry, customer/business packages,
authentication, backend, schemas and production services are unchanged by this
extension. Existing waitlist backend source is retained. Review/Discover
retirement and DNS remain untouched. See [AUDIT.md](AUDIT.md) for current host
evidence and branch provenance, and [PR_DESCRIPTION.md](PR_DESCRIPTION.md) for
approval and rollback instructions.
