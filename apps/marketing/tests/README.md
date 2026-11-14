# Local browser smoke verification

These standard Playwright runner tests target the local marketing preview only. They never submit forms or follow customer/business/social links to public browser pages. All external runtime requests are blocked and fail the audit.

Build and start the preview from `apps/marketing` before running the tests:

```powershell
npm run build
npm run preview
```

With an installed Playwright test tool and its Chromium browser, run in another terminal:

```powershell
npx --no-install playwright test --config tests/playwright.config.cjs
```

The test tool is a development dependency. The first review reused the existing tool and cached browser below; the package now also declares Playwright for repeatable clean-checkout tests:

```powershell
$env:MANZIL_PLAYWRIGHT_TEST = (Resolve-Path '../../../manzil-source/gitcwyn25-Manzil-super-app-9dc1fff/node_modules/@playwright/test').Path
$env:MANZIL_CHROMIUM_EXECUTABLE = Join-Path $env:LOCALAPPDATA 'ms-playwright/chromium-1248/chrome-win64/chrome.exe'
node (Join-Path $env:MANZIL_PLAYWRIGHT_TEST 'cli.js') test --config tests/playwright.config.cjs
```

For the Docs/Gurman extension, run the dedicated configuration as well:

```powershell
npx --no-install playwright test --config tests/gurman-waitlist.config.cjs
```

It checks desktop/mobile layout, canonical/noindex/sitemap rules, business and
legacy route continuity, and the plain-anchor waitlist flow with JavaScript
disabled. The CTA test reads the real local 307 response and stops navigation
before the external form is requested. It does not submit a Tally response.
Screenshots and JSON evidence are saved in `docs/gurman-waitlist`.

Set `MANZIL_QA_DIRECTORY` to an absolute review directory when running the
original homepage suite to preserve historical evidence. The dedicated
Docs/Gurman suite always uses its own review directory.

`MANZIL_PREVIEW_URL` optionally changes the default `http://127.0.0.1:4173`. The configuration rejects public hostnames. `MANZIL_PLAYWRIGHT_TEST` and `MANZIL_CHROMIUM_EXECUTABLE` are optional overrides for a separately installed QA tool and browser; ordinary installations need neither.

The three projects cover 375×812, 768×1024 and 1440×900. They check content/asset loading and dimensions, overflow, anchor ownership, customer/business/legal destinations, responsive menu behavior, keyboard focus, Escape/close behavior, reduced-motion visibility, local legal content and runtime/network errors. No external product account flow is tested.

Screenshots are saved in `docs/v3/screenshots` at the repository root. Viewport and full-page captures use the site's supported reduced-motion setting to avoid blank reveal transitions; desktop concept-panel captures support visual inspection. JSON results and browser observations are saved in `docs/v3/evidence`.

The existing Playwright 1.61.1 installation expected Chromium revision 1228, which was absent. The explicitly selected cached revision 1248 launched as Chromium 156.0.8078.4. This browser/client mismatch is a verification limitation; the suite should also run with a matching supported browser in CI before release.
