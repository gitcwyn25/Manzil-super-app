# Manzil V3 corporate frontend

This package imports the owner's downloaded Lovable design as a standalone
TanStack Start/React frontend. It retains the approved dark/cream editorial
design, typography and three-layer Manzil symbol, and integrates the four
supplied concept illustrations. The corporate site invites visitors into the
existing customer app and business portal; it does not implement those products.

The review branch is `feat/manzil-v3-lovable` in `SEO/manzil-v3-review`, based on
`gitcwyn25/Manzil-super-app`'s default `feat/faq-gurman-video` baseline
`9dc1fff8e4bb19f59ed9cc1eeee90ee9d17f1057`. The original source download is
`SEO/Landing page`; its files and the separate existing product checkout are
preserved. Source provenance is in the repository's
[preflight](../../docs/v3/PREFLIGHT.md). Preview/PR publication and actual QA
status are recorded in [the review documents](../../docs/v3/PR_DESCRIPTION.md)
and [QA report](../../docs/v3/QA_REPORT.md).

## Local development and verification

Use Node.js 22.12 or later and npm. This independently deployed package is not
listed in the monorepo root's explicit workspaces. Run commands here, rather
than using the root's backend/database build:

```powershell
cd apps/marketing
npm ci
npm run dev
```

Build and review the actual static output:

```powershell
npm run build
npm run preview
```

The preview serves `http://127.0.0.1:4173`. The build prerenders eight pages to
`dist/client` and adds the sitemap, robots policy and static 404. Deploy only
`dist/client`; no runtime server, database or auth/API secret is required.
Build-time SSR output is not part of the deployed frontend.

```powershell
npm run typecheck
npm run lint
npm test
npx --no-install playwright test --config tests/playwright.config.cjs
```

The browser tests require Playwright's supported Chromium installation and a
running local preview. See [tests/README.md](tests/README.md) for the tested
viewports, optional cached-browser overrides, evidence paths and observed
browser/tool version limitation. The tests block external browser requests and
never submit customer or waitlist forms. Build/type/lint/unit/browser outcomes
and actual performance/accessibility audit results are in the QA report.

## Structure and maintenance

| Location | Responsibility |
| --- | --- |
| `src/routes/index.tsx` | Corporate route, metadata and section composition. |
| `src/routes/en.$.tsx` | Retained owned English company/legal routes and waitlist redirect. |
| `src/components/marketing/` | Original marketing layout, responsive header/footer, concept figures and document renderer. |
| `src/components/brand/ManzilMark.tsx` | Approved vector geometry; preserve three layers and square. |
| `src/styles.css` | Original semantic design tokens and responsive typography. |
| `src/lib/links.ts` | Customer/business/legal/social/waitlist destinations and safe app return paths. |
| `src/content/` | Existing owned Markdown documents, preserved byte-for-byte with visible draft/source notices. |
| `public/images/`, `public/fonts/` | Owned optimized runtime assets and font licenses. |
| `source-assets/` | Original photo and concept masters, excluded from the static output. |
| `vercel.json` | Static hosting configuration, safe route aliases and security headers. |
| `scripts/finalize-static.mjs` | Static 404, sitemap and explicit indexing-mode handling. |

TanStack tooling generates `src/routeTree.gen.ts`; do not edit or format it by
hand. Keep policy source files out of automatic formatting so their provenance
hashes remain meaningful. See [PHOTOGRAPHY.md](PHOTOGRAPHY.md),
[the asset inventory](../../docs/v3/ASSET_INVENTORY.md) and
[legal provenance](../../docs/v3/LEGAL_CONTENT_PROVENANCE.md) before replacing
assets or source text. Local photo/font preparation helpers are optional
maintenance tools, not network dependencies of the build or runtime.

## External products and route continuity

Customer registration and login go to the existing
`https://app.manzilgroup.uz/auth` route with the verified `mode`/relative `next`
query parameters. All For Businesses links target
`https://business.manzilgroup.uz`. That portal was confirmed paused with HTTP
503 during preflight; a healthy destination or approved interim treatment is a
release gate, not a frontend status claim.

The existing Gurman waitlist remains at the verified owned alias
`https://manzil-business.vercel.app/en/waitlist/gurman`, keeping its original
form and API together. Both the route loader and static host/preview config
preserve `/en/waitlist/gurman` as a temporary redirect. Preserve that old
deployment, alias and API until its flow is intentionally migrated.

Existing `/en/privacy`, `/en/terms` and `/en/review-rules` URLs permanently
redirect to the retained `/en/legal/*` documents; `/en`, `/uz` and `/ru` redirect
to the new corporate root. Other localized, founder and indexed legacy routes
require the explicit release plan. No Review/Discover standalone frontend is
imported into this package.

## Indexing and release ownership

Review builds default to `noindex, nofollow` and `robots.txt` disallows crawling.
The local preview always sends a noindex header. After the owner approves the
reviewed release, production indexing must be enabled explicitly at build time
with `MANZIL_INDEXING=production`; otherwise production would remain blocked
from indexing. Do not change this setting merely to improve a preview SEO score.

Current corporate production belongs to Vercel project `manzil-web` in team
`manzil-group`. Its verified immutable rollback deployment is recorded in
[RELEASE_PLAN.md](../../docs/v3/RELEASE_PLAN.md); provider metadata did not include
a production Git SHA. A new V3 preview does not replace that deployment.

No production cutover, DNS/domain reassignment, old-host shutdown or shared
service deletion is authorized by this package's creation. The owner must review
the code, preview and verification evidence and explicitly approve release.
Follow the release plan; retain customer/business products, shared auth/API,
databases and Discover's persistent storage. Create a launch report only after
a real approved release has been verified.
