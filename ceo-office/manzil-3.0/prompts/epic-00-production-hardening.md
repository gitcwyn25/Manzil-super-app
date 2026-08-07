# Epic 00 — Production Hardening & Technical SEO

> **P0 EMERGENCY — feature development frozen until this ships.** No new features. Purpose: make the live site production-grade across SEO, AI discoverability, accessibility, metadata, performance, and security. Numbered 00 because it precedes everything already queued.

## Verified evidence (measured against production 2026-08-07, not assumed)

| Check | Result |
|---|---|
| `/robots.txt` · `/sitemap.xml` · `/llms.txt` · `/favicon.ico` | **HTTP 500** — server errors, not 404s. Root cause almost certainly the locale middleware intercepting non-locale paths. **Most severe finding.** |
| `<title>` on `/uz` (home) | Serves the **business page's** title ("Manzil Business \| Biznesingizni Manzil'da boshqaring") — wrong page identity |
| canonical tags | 0 across all pages |
| Open Graph / Twitter cards | 0 across all pages |
| JSON-LD structured data | 0 across all pages |
| hreflang | 0 across all pages |
| `<html lang>` | `lang="uz"` served for `/ru` and `/en` (SSR); corrected client-side by an inline script — pre-existing architecture limitation (root layout has no locale segment) |
| 404 status | correct (404 returned) |
| business detail metadata | working (title + description present) — so the metadata layer partly functions |

## Scope

**1. Technical SEO** — unique title + meta description per route · canonical · hreflang (uz/ru/en) · sitemap.xml · robots.txt · llms.txt · Open Graph · Twitter cards · favicon package · manifest verification · breadcrumb schema.

**2. Structured data** — Organization · Website · SearchAction · LocalBusiness (business pages: rating, reviews, geo, hours, address, logo, images, phone) · BreadcrumbList · FAQ where applicable.

**3. AI SEO (as important as Google SEO in 2026)** — llms.txt, AI-friendly robots directives, AI-readable metadata, entity-consistent naming, knowledge-graph readiness.

**4. Accessibility (WCAG AA)** — exactly one H1 per page · heading hierarchy · alt attributes · ARIA labels · keyboard navigation · visible focus indicators · contrast · landmarks.

**5. Performance** — bundle audit, route-level code splitting, remove unused JS, font/image optimization, prefetch + caching strategy. Targets: Lighthouse 95+, LCP <2.5s, CLS <0.05, INP <200ms.

**6. Production** — custom 404 AND 500/error pages · metadata verified in the *generated HTML* (not client-only) · valid sitemap/robots · correct language attributes · zero console errors · zero hydration warnings.

**7. Security headers** — CSP (already present, verify), HSTS, X-Frame-Options, Referrer-Policy, Permissions-Policy, X-Content-Type-Options, CSRF review, source-map handling for production.

## Acceptance criteria (nothing merges until all green)

No duplicate titles · no duplicate descriptions · one H1 per page · valid structured data · valid sitemap · valid robots · llms.txt present · correct canonicals · correct hreflang · no console errors · Lighthouse >95 · zero broken internal links · zero a11y blockers · zero missing alt attributes · OG images render · favicon everywhere · custom 404 + 500 · bundle within budget · no hydration warnings.

## Deliverables

Working implementation · before/after Lighthouse comparison · bundle analysis · metadata audit · structured-data validation · accessibility report · technical SEO report · list of every issue fixed · production verification checklist — committed as evidence under `docs/evidence/`.

## Binding constraints

1. **Fix the 500s first** — they are the highest-severity item and likely one middleware fix that resolves four endpoints.
2. Do not touch `apps/api` (Epic 06 is building there concurrently).
3. Honest-data rules still apply: structured data must reflect real business data, never invented ratings/hours.
4. The `<html lang>` SSR limitation may require restructuring the locale layout — if the fix is larger than this epic, document it precisely rather than half-fixing it.
