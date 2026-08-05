# Vibrant Marketplace Adoption — Web Redesign Execution Plan

**Date:** 2026-08-05 · **Branch:** feat/frontend-elevation · **Status:** EXECUTING
**Supersedes:** `2026-08-04-anor-web-redesign.md` (Anor identity, sirly.uz home, Groupon discover — all dead; Tasks 1/2/4 infrastructure survives re-skinned).

## Normative sources (in priority order)

1. `ceo-office/stitch_local_deal_marketplace/<screen>/screen.png` — rendered PNGs are visual truth (they override DESIGN.md's token sheet where they disagree, e.g. card radius).
2. `ceo-office/stitch_local_deal_marketplace/vibrant_marketplace/DESIGN.md` — token sheet + prose.
3. `.superpowers/sdd/2026-08-05-vibrant-marketplace/review-*.json` — per-screen implementation specs, foundation token mapping, critic reconciliation, API mapping (12-agent review, 2026-08-05). Implementers read their own spec file; the critic and api-map files bind ALL tasks.

## Decision log (user delegated; locked 2026-08-05)

| # | Decision |
|---|----------|
| D1 | Footer: LIGHT palette (surface-container-lowest, outline-variant top border) with the EXISTING 4-column anatomy, dynamic © year, admin entry. Foundation's dark inverse-surface footer mapping demoted to unused. |
| D2 | Card radius 12px (`$card-border-radius: .75rem`), inputs 8px, modals 24px. PNGs override DESIGN.md's 16px sheet value. |
| D3 | Rating accent: tertiary-orange star, one canonical `RatingLine` everywhere. `reviewCount===0` → localized "New", never "0.0 ★". |
| D4 | Fonts: Hanken Grotesk (latin) + Golos Text (cyrillic companion) via next/font, stack `"Hanken Grotesk","Golos Text",system-ui,...` — deterministic Cyrillic for ru/uz-cyr, self-hosted, CSP-clean. IBM Plex Mono dropped; `--font-data` aliases to the sans stack. |
| D5 | Nav links: **Discover · Concierge · Events(→/occasions) · For Business** + LocaleSwitcher (mandatory, role name "Language") + Clerk auth (ghost Sign In + solid pill CTA). "Categories"/"Reviews" dropped. One header incl. lg+ search pill (→ /{locale}/discover?q=); existing offcanvas mobile nav restyled; NO bottom tab bar. |
| D6 | Home hero stays GREEN (secondary-green gradient + mint, per approved PNG) as the deliberate homepage brand moment; blue-first everywhere else. |
| D7 | Commerce honesty: NO fabricated deals/prices/discounts anywhere. One shared rule: deal/savings UI renders nothing when the datum is absent; `priceTier` glyph is the only price signal. 3-segment price filter ($ $$ $$$). |
| D8 | AI copy stance: aspirational energy, honest claims (Gurman AI recommends from real reviews; no booking promises). Concierge package panel DEFERRED behind a real API extension; "AI Matched 98%" reworded to grounded copy. |
| D9 | Home sections: AudienceFeatures becomes the AI-concierge feature trio; StoreBadges dropped from home (app unlaunched — no fake store links). |
| D10 | Dataset degradation is a launch requirement: prod has 2 businesses, 0 featured, 3/5 empty categories. Every grid defines its 0/1/2-item state; featured slot falls back `featured[0] ?? justJoined[0]`; trust stat (totalBusinesses) gated behind ≥20. |
| D11 | Distance/geolocation cut (Permissions-Policy disables it) — district shown instead; sorts: Recommended + Highest Rated only, client-side; Load More = client-side chunking. |
| D12 | All Stitch external resources banned (Tailwind/Three.js CDNs, Google fonts/icons, googleusercontent images): self-hosted fonts, ~30-glyph inline-SVG icon set, /public statics, coverPhotoUrl pipeline. |
| D13 | Old design removal: `anor.scss` + Anor token partials deleted in Foundation; old plan doc banner-superseded; task-5/9 reference HTMLs remain as history only. |
| D14 | Workspace: shell-boundary contract binds (zero `<footer>`/`nav.mobile-nav` under /dashboard); restyle the 8 REAL routes; 140ms motion budget in workspace, consumer Reveal entrances stay consumer-only. |

## Execution DAG

```
F  Foundation (tokens, fonts, chrome re-skin, anor removal)        [sequential]
K  Shared component kit + icon set + i18n helpers                  [after F]
── then parallel tracks (file-disjoint per critic) ──
A1 Discover (both states)        → A2 Home (reuses A1's cards)     [chain]
B  Business details /businesses/[slug]                             [parallel]
C  Register + sign-in/sign-up (SplitAuthShell)                     [parallel]
D1 Workspace shell → D2 overview ∥ D3 packages ∥ D4 announcements → D5 sweep
E  Concierge chat re-skin (honest states, package panel deferred)  [parallel]
S  Site sweep: /business landing+plans+pricing, lists, occasions,
   profile, waitlist                                               [after A2]
Q  QA + deploy: local build, critical e2e, Vercel env verify,
   push→deploy, live probes (main loop, not an agent)
```

Gates per task: `npm run typecheck` + `npm run lint` in apps/web; `next build` runs once at Q (disk/RAM constraint). Each agent stages ONLY its own files, retries `git commit` on index.lock contention. Push happens only at Q.

## Launch checklist (Q)

1. `next build` green locally.
2. Critical e2e: shell-boundary, discover, locale-lang, registration, waitlist (fast subset; full suite is post-launch).
3. Vercel env: `NEXT_PUBLIC_API_URL=https://manzil-api-production.up.railway.app/v1` (WITH /v1) + `NEXT_PUBLIC_USE_MOCK=false` — verify via `vercel env ls`, add if missing (else prod silently renders mock).
4. Merge → main, push (carries undeployed f8b4aa2); if the git trigger flakes again, `vercel deploy --prod` via CLI.
5. Probe live: / /discover /businesses/* /concierge in uz/ru/en — real API data present, no Anor leakage, health of /v1 confirmed from the page.

## Backlog (non-blocking, post-launch)

- API extensions that un-degrade screens: HomeCard.description, deals/featured entity, business website + structured hours, review-photos join, search pagination + server filters, CrmStats deltas, Gurman package endpoint (unlocks concierge panel + "Book Everything").
- MCP event-planner plugin (`manzil_mcp_plugin_spec.txt`) after the Gurman package endpoint exists.
- Full Playwright suite + tri-locale screenshot matrix + reduced-motion audit.
- Icon regen + sw.js VERSION bump ship with Foundation; PWA installed-chrome check at Q.
- Dependabot Next.js `--webpack` break: parked; webpack→turbopack is a separate decision.
- MANZIL 3.0 mobile design-system phase (`ceo-office/manzil-3.0-design-prompt.md`).
