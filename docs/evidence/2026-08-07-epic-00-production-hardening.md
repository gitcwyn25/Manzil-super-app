# Epic 00 — Production Hardening & Technical SEO

**Date:** 2026-08-07 · **Branch:** `feat/frontend-elevation` · **Scope:** `apps/web` (+ two copy strings in `packages/shared`) · **Not touched:** `apps/api` (concurrent workstream), any `.env` or secret.

Companion document: [`TRUST-AUDIT.md`](TRUST-AUDIT.md) — fabricated content, dev artifacts and empty states.

---

## What was measured, and how

Honesty about method matters as much as the numbers.

| Method | What it establishes |
|---|---|
| `curl -sD -` against **live production** (`https://manzil-business.vercel.app`) | The before-state status codes and headers. Real measurements, not assumptions. |
| `curl` against a **local production build** (`next build` + `next start`) | The after-state. Same binary that ships. |
| `grep` over the **served HTML** | Metadata is present in SSR output, not injected after hydration. |
| `find .next/static -name "*.js"` | Bundle bytes. |
| Static source review | Heading structure, alt attributes, ARIA, focus, dead code. |

**Not measured — stated plainly:** no Lighthouse run, no Core Web Vitals, no axe-core run. There is no headless-browser tooling available in this environment, so **no score, LCP, CLS or INP figure is reported**. The performance targets in the epic brief (Lighthouse 95+, LCP <2.5 s) are therefore **unverified**. What is reported below is what was actually measured: HTTP status codes, response content types, HTML contents, and bundle bytes on disk.

One important caveat on the local runs: **the API was unreachable from this machine** (`ECONNREFUSED` against `NEXT_PUBLIC_API_URL`). That turned out to be useful — it is a worst-case backend outage, and it exposed three pages that hard-500'd under it. It does mean `LocalBusiness` JSON-LD on business detail pages could not be verified end-to-end locally; it is verified by construction and by typecheck only.

---

## Before / after — every confirmed finding

| # | Finding (verified in production, 2026-08-07) | Before | After | Verified by |
|---|---|---|---|---|
| 1 | `/robots.txt` | **HTTP 500** (`x-matched-path: /500`) | **200** `text/plain`, 262 lines | `curl` vs built output |
| 2 | `/sitemap.xml` | **HTTP 500** | **200** `application/xml`, 10.8 KB, hreflang per URL | `curl` |
| 3 | `/llms.txt` | **HTTP 500** | **200** `text/plain`, 3.0 KB | `curl` |
| 4 | `/favicon.ico` | **HTTP 500** | **200** `image/x-icon`, 2 609 B, 16/32/48 multi-size | `curl` + ICO header parse |
| 5 | *Any* unknown top-level path (`/xyz`) | **HTTP 500** | **307 → `/uz/xyz` → 404** | `curl` |
| 6 | `<title>` on `/uz` | `Manzil Business \| Biznesingizni Manzil'da boshqaring` (the **business page's** title) | `Manzil — Toshkentdagi joylarni Gurman AI bilan toping` | HTML grep |
| 7 | Duplicate titles across routes | Every route without its own metadata shared one title | 9 routes × 3 locales, all distinct | HTML grep |
| 8 | Canonical tags | **0** | Present on every route, absolute, production origin | HTML grep |
| 9 | hreflang | **0** | `uz` / `ru` / `en` / `x-default` on every route, plus in the sitemap | HTML grep |
| 10 | Open Graph | **0** | `og:title`, `og:description`, `og:url`, `og:site_name`, `og:locale` + alternates, `og:type`, `og:image` (1200×630) | HTML grep |
| 11 | Twitter cards | **0** | `summary_large_image` + title/description/image | HTML grep |
| 12 | JSON-LD | **0** | `Organization`, `WebSite`, `SearchAction` site-wide; `BreadcrumbList` on sub-pages; `LocalBusiness`+`AggregateRating`+`Review` on business detail; `ItemList` on list/occasion detail | HTML grep |
| 13 | `<html lang>` on `/ru`, `/en` (SSR) | `lang="uz"`, corrected client-side by an inline script | `lang="ru"` / `lang="en"` **in the server HTML** | `curl \| head -c 300` |
| 14 | Custom 404 | Next default | Branded, trilingual, one `<h1>`, links home; still returns 404 | `curl` status + body |
| 15 | Custom 500 | None | `global-error.tsx` + in-shell `(site)/error.tsx`, both report to Sentry | source + build |
| 16 | 404 status code | correct | unchanged — still correct | `curl` |
| 17 | Business-detail metadata | working (title + description) | extended: canonical, hreflang, OG, Twitter, LocalBusiness JSON-LD | source + typecheck |
| 18 | `/uz/discover`, `/uz/lists`, `/uz/occasions` under API outage | **HTTP 500**, `TypeError: fetch failed` | **200** with a converting empty state | `curl` with API down |

---

## Root cause of the 500s

The mission brief guessed "the locale middleware intercepting non-locale paths". That was close, but the actual mechanism is the **`/[locale]` dynamic route segment**, and the distinction matters because it explains why `/favicon.ico` also failed — that path is *excluded* from the middleware matcher (`ico` is in the extension exclusion list), so middleware never ran for it.

**The chain:**

1. No route existed for `/robots.txt`, `/sitemap.xml`, `/llms.txt` or `/favicon.ico` — confirmed against the pre-change build's route manifest, which lists none of them.
2. With no static route to match, Next fell through to the only thing that could match a single top-level segment: **`app/[locale]/`**, binding `locale = "robots.txt"`.
3. `app/[locale]/layout.tsx` calls `notFound()` for a non-locale value.
4. `/[locale]` is an **ISR route** (`revalidate: 1m`, `generateStaticParams` for uz/ru/en only). On Vercel, an uncached dynamic param whose layout not-founds cannot be served from that path, and the platform serves its **`/500`** instead.

**The evidence that pins it — the same code, two runtimes:**

```
production (Vercel)            local `next start`, identical commit
/robots.txt  → 500             /robots.txt  → 404
/xyz         → 500             /xyz         → 404
```

Any unknown top-level path failed, not just those four — `/xyz` returned 500 in production. That is the signature of a dynamic-segment fallthrough, not of a middleware bug specific to four filenames. The 500-vs-404 difference is purely the ISR/serverless runtime; both are wrong, and neither is the required 200.

**The fix is layered, so no single mistake can reintroduce it:**

1. **Real routes** — `app/robots.ts`, `app/sitemap.ts`, `app/llms.txt/route.ts`, `public/favicon.ico`. Static routes and public files both take precedence over a dynamic segment, so these four paths never reach `[locale]` again. Confirmed in the build manifest: `○ /robots.txt`, `○ /sitemap.xml`, `○ /llms.txt`.
2. **A locale guard in middleware** — anything not locale-prefixed and not a known root path or file-like request is redirected to `/uz…`. `[locale]` now only ever receives a real locale, so a *future* unrouted path degrades to a 404 page rather than a 500.
3. **The crawler entry points skip the Supabase session refresh.** `updateSession()` was running `supabase.auth.getUser()` on `/robots.txt` and `/sitemap.xml` — a third-party network call in front of the two files a crawler fetches first. A Supabase outage would have been sufficient, on its own, to 5xx robots.txt. That is precisely the failure shape being removed here, and a 5xx on robots.txt can make a crawler back off the entire host.

---

## `<html lang>` — assessed and fixed, not deferred

The brief flagged this as possibly larger than the epic. It was contained, so it was fixed properly rather than half-fixed.

**Was:** `app/layout.tsx` owned `<html lang="uz">` and has no locale segment, so `/ru` and `/en` were served to crawlers and assistive technology as Uzbek. An inline `<script>` patched `documentElement.lang` after parse — which only ever helped visitors who run JavaScript.

**Now:** `<html>`/`<body>` live in `app/components/document-shell.tsx`, rendered by `app/[locale]/layout.tsx` — the first layout that knows the locale. The root layout is a pass-through. Verified in the served HTML: `<html class="…" lang="ru">`.

**Cost of the restructure**, all handled: fonts moved to `app/fonts.ts` (a `next/font` loader must be module-scope, and two documents outside `[locale]` need the same CSS variables); `ClerkProvider` moved one segment down, keeping its position relative to `<html>`; `app/offline/page.tsx` and `app/not-found.tsx` render the shell themselves. The inline lang-patching script is **deleted** — one fewer inline script per page. `LocaleLangSync` is kept, now doing only what it is genuinely needed for: client-side (soft) locale switches, where the document is not re-parsed.

No static generation was lost — `/[locale]`, `/[locale]/business/pricing`, `/[locale]/concierge` and `/[locale]/waitlist/[topic]` still prerender, same as before.

---

## Structured data

Every field is read from real API data or is a stable fact about the product.

| Schema | Where | Notes |
|---|---|---|
| `Organization` | every page | Logo, `areaServed: Tashkent`, `knowsLanguage: [uz, ru, en]`, contact details **already published in the site footer**. `sameAs` lists only the Telegram bot the company actually operates. |
| `WebSite` + `SearchAction` | every page | Target is `/{locale}/discover?q={search_term_string}` — a route that genuinely reads `?q=` server-side, so the action resolves to a working page. |
| `BreadcrumbList` | discover, concierge, lists, occasions, business, pricing, and all three detail pages | Built from route keys, so a trail label and its URL cannot disagree. |
| `LocalBusiness` | business detail | Real name, description, street address, `priceRange` from the real tier. `geo` and `telephone` only when present. |
| `AggregateRating` | business detail | **Only when `reviewCount > 0` and `avgRating > 0`.** |
| `Review` | business detail | Real reviews, max 10, unrated ones filtered out. |
| `ItemList` | list detail, occasion detail | Real curated collections. |

**Deliberately omitted, with reasons** — this is the part that matters:

- **`openingHours`** — the API stores hours as one free-form string (`"09:00–23:00, dam olish kunlari 10:00 dan"`). Parsing that into a day/time schema is guesswork, and a wrong schedule sends someone to a closed door. Omitted rather than guessed.
- **`FAQPage`** — no FAQ content exists in the product. None was invented to earn the rich result.
- **`Event`** — "Occasions" are categories (birthday, date night), not events with dates and venues.
- **District in `PostalAddress`** — schema.org has no district field that fits Tashkent's administrative subdivisions; `addressLocality` is the city. The district is on the page, just not misfiled in the markup.

---

## AI discoverability

`/llms.txt` follows the llmstxt.org convention and states the product's limits explicitly: **not a booking platform, not a delivery service, not available outside Tashkent, no published mobile app.** An answer engine repeating an accurate limitation costs far less than one repeating an overclaim.

`robots.txt` **explicitly allows 19 AI crawlers** (GPTBot, OAI-SearchBot, ClaudeBot, Claude-User, Claude-SearchBot, PerplexityBot, Google-Extended, Applebot-Extended, CCBot, Amazonbot, meta-externalagent, DuckAssistBot, YandexBot, …). The content is public either way; blocking them would remove Manzil from AI answers without protecting anything. Authenticated and personal surfaces are disallowed for **every** agent: `/api/`, `/monitoring`, `/*/dashboard`, `/*/admin`, `/*/profile`, `/*/sign-in`, `/*/sign-up`, `/*/business/register`, `/*/business/plans`, `/offline`.

Indexing discipline: the workspace layout carries `noindex` as belt-and-braces; auth-gated routes carry it per-route; **filtered discover URLs are `noindex, follow`** — the `?q=`/`?category=`/`?price=` space is combinatorial and would burn crawl budget on near-duplicates, while the outbound links to business pages remain exactly what should be crawled.

---

## Two metadata bugs caught by verifying the built output

Both were invisible in source review and only appeared when grepping the served HTML. Worth recording because they are easy to reintroduce:

1. **`robots: undefined` silently overrode the root layout.** `pageMetadata` returned an explicit `robots: undefined` for indexable pages, which *overrides* rather than inherits — dropping `max-image-preview: large` and `max-snippet: -1` from every page. Fixed with a conditional spread; the served HTML now shows `index, follow` on indexable routes.
2. **`og:image` was missing entirely.** Next only auto-attaches a file-based `opengraph-image` to segments that do not declare their own `openGraph` object — and every route here declares one (for `og:url` and locale alternates). The image is now referenced explicitly, with width, height and alt. Verified present on `/uz` and `/ru/discover`.

There is also a **localhost guard** on the canonical origin. `NEXT_PUBLIC_APP_URL` is `http://localhost:3000` in local env and is inlined at build time; a production build that picked it up would ship `<link rel="canonical" href="http://localhost:3000/…">` on every page — worse than no canonical, because it actively declares the real pages duplicates of an unreachable host. A localhost origin is now honoured only outside production, falling back to `VERCEL_PROJECT_PRODUCTION_URL` and then the production literal. Verified: the built output emits `https://manzil-business.vercel.app/...` despite localhost being in the local env.

---

## Accessibility

Static review (no axe-core available — see the method note above).

**Verified correct:**

- **Exactly one `<h1>` per rendered page.** Four files contain two `<h1>` tags each (`business/plans`, `business/register`, `business/register/photos`, `dashboard/layout`); all four are mutually exclusive early-return branches (signed-out vs signed-in), so only one ever renders. Checked each.
- **No missing `alt`.** All eight `<img>` elements carry `alt`; the decorative ones use `alt=""` correctly.
- Landmarks (`<header>`, `<main>`, `<nav aria-label>`, `<aside>`, `<footer>`) present in the site shell.
- Save button carries `aria-pressed` and has a styled pressed state.
- `prefers-reduced-motion` handled in the stylesheets; `<noscript>` fallback reveals content when JS is off.

**Improved here:**

- 404 and 500 pages have a proper `<h1>` and a working keyboard-reachable action, instead of Next's unstyled defaults.
- The offline page's Russian and English paragraphs now carry `lang="ru"` / `lang="en"`, so a screen reader switches voice instead of reading Cyrillic with an Uzbek voice.
- `<html lang>` correct in SSR for all three locales (finding 13) — the single largest a11y win here, since it drives screen-reader pronunciation for every page.
- Every new empty state is a real link, not a dead end.

**Not done:** no keyboard-navigation walkthrough, no contrast measurement, no screen-reader pass. These need a browser and are not claimed.

---

## Performance

**Measured — bundle bytes on disk:**

| | Before | After | Δ |
|---|---|---|---|
| Client JS (`.next/static/chunks`) | 1 782.7 KB / 63 files | 1 796.8 KB / 70 files | **+14.1 KB (+0.8 %)** |
| CSS | 434.6 KB | 435.2 KB | +0.6 KB |
| Largest chunk | 455.3 KB | 455.3 KB | unchanged |

The +14 KB buys the 404/500 boundaries and the localized-not-found client component. JSON-LD, robots, sitemap and llms.txt are **server-only and add zero client JS** — `JsonLd` is a server component precisely so the graph is in the HTML crawlers receive rather than injected after hydration.

Two small wins not visible in the totals: one inline `<script>` per page removed (the lang patch), and ~11 KB of source deleted (`audience-samples.ts` + `audience-features.tsx`).

**Also shipped:** `robots.txt`/`sitemap.xml`/`llms.txt` get `s-maxage=86400, stale-while-revalidate=604800`, so a crawler never waits on a cold render for the files it fetches first.

**Not measured, not claimed:** Lighthouse, LCP, CLS, INP, TTFB, hydration warnings (needs a browser console), real-device rendering.

**Known and not addressed** (deliberate, out of scope for a P0 SEO/trust sprint): the largest chunk is 455 KB and total CSS is 435 KB, which is heavy. Bootstrap plus the custom SCSS layer is the likely bulk. Four unused components remain in the tree (`store-badges`, `hero-businesses`, `occasion-rail`, `feed-card`); they are tree-shaken from the client bundle but still clutter source. Eight `<img>` elements are raw rather than `next/image` (7 lint warnings, pre-existing). Each deserves its own measured pass rather than a blind change here.

---

## Security headers

CSP was already present and correct; it was reviewed, not rewritten. Added:

| Header | Value | Why |
|---|---|---|
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` | Was absent. Vercel terminates TLS for every deployment, so there is no plaintext origin to lock out. |
| `X-Frame-Options` | `SAMEORIGIN` | Fallback for scanners and browsers that only read the legacy header; deliberately agrees with the existing CSP `frame-ancestors 'self'` rather than conflicting. |
| `X-XSS-Protection` | `0` | Explicitly disabled. The legacy auditor is removed from current browsers and its heuristics were themselves exploitable; CSP is the real defence. |
| `Permissions-Policy` | added `interest-cohort=()`, `browsing-topics=()` | Opt out of ad-topic inference. |
| `X-DNS-Prefetch-Control` | `on` | |
| `poweredByHeader: false` | | The framework version is free reconnaissance for CVE fingerprinting; nothing reads it. |
| `productionBrowserSourceMaps: false` | | Explicit rather than relying on the default. Sentry uploads maps at build and deletes them from the bundle, so traces stay readable in monitoring without being readable in devtools. |

**Reviewed, no change needed:** `.gitignore` covers `.env*`; `git ls-files` shows **no tracked secrets**; `seed-admin-credentials.ts` is tracked but reads credentials from a gitignored root `.env` with no fallback values — correct by design. JSON-LD injection is safe: `JSON.stringify` plus `<` escaping means a business name or review body containing `</script>` cannot break out.

**Reported, not modified — per instruction:** Clerk **development** keys appear to be in use in production. Dev instances carry Clerk's dev-mode banners, relaxed session security and strict rate limits. No `.env` file was read for values or modified. This needs an operator to swap the keys before launch.

---

## Fixed vs deferred

**Fixed (this change):** all four 500 routes · the 500 on every unknown path · wrong home-page title · unique title + description per route × 3 locales · canonical · hreflang + `x-default` · sitemap with per-URL hreflang · robots.txt with AI-crawler policy · llms.txt · Open Graph + Twitter cards + generated 1200×630 OG image · favicon package · `<html lang>` in SSR · Organization/WebSite/SearchAction/BreadcrumbList/LocalBusiness/AggregateRating/Review/ItemList · custom 404 and 500 · Sentry reporting from error boundaries · security headers · three pages that 500'd under API outage · the two metadata bugs found in the built output · plus everything in [`TRUST-AUDIT.md`](TRUST-AUDIT.md).

**Deferred, with reasons:**

| Deferred | Reason |
|---|---|
| Lighthouse / CWV numbers | No headless browser in this environment. Reported honestly rather than estimated. |
| CSS and largest-chunk reduction | 435 KB CSS and a 455 KB chunk are real, but need a measured pass with a bundle analyser. Blind cutting during a P0 SEO/trust sprint risks visual regressions. |
| `<img>` → `next/image` (8 sites) | Pre-existing; changes image loading and CSP surface. Wants its own change with visual verification. |
| Removing 4 unused components | No fabricated content in them (unlike the two that were deleted); removing them widens the diff without a trust or bundle benefit. |
| `"Hours not listed"` at source | Lives in `apps/api`, owned by a concurrent workstream. Mitigated in web. |
| Duplicate listing, `"Kitob, Toshkent"`, Verified-on-unclaimed | Catalogue/API data problems. The web gate for Verified is already correct (`status === "claimed"`); hiding data bugs in the view layer would mask them. |
| Footer `/{locale}/admin` link (404s) | Another workstream's entry point; deleting it would break their landing. It now 404s properly instead of 500-ing. |
| Clerk production keys | Environment configuration. Reported, not modified. |

---

## Gates

Run sequentially on a quiet tree, from `apps/web`:

```
npm run typecheck   → PASS   tsc --noEmit, 0 errors
npm run lint        → PASS   eslint ., 0 errors, 7 warnings
                             (all 7 pre-existing @next/next/no-img-element)
npm run build       → PASS   next build --webpack, 76 static pages generated
```

Post-build verification against the **built** output (`next start`, not dev):

- `/robots.txt` `/sitemap.xml` `/llms.txt` `/favicon.ico` `/opengraph-image` → **200** with correct content types
- `/xyz` → **307 → `/uz/xyz` → 404**
- `<html lang>` = `uz` / `ru` / `en` on the three locale homes, **in the server HTML**
- 9 routes × 3 locales: all titles distinct
- canonical + 4 hreflang links + full OG/Twitter block + `og:image` present, all absolute on the production origin
- JSON-LD `@type` values present in the HTML
- `/uz/discover`, `/uz/lists`, `/uz/occasions` → **200** with the API unreachable (previously 500)
