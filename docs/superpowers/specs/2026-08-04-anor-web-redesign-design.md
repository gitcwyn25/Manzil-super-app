# Anor — Public Web Redesign on Bootstrap 5

**Date:** 2026-08-04
**Scope:** `apps/web` public marketing + consumer site (the `(site)` route group)
**Status:** Approved by user (direction, palette/type revision, page plan, edge cases, testing)

## Decision summary

| Decision | Choice |
| --- | --- |
| Foundation | Bootstrap 5.3 + Sass, deeply re-themed at the variable level |
| Identity | Full reinvention — new palette, type, and motif ("Anor" direction) |
| Scope | Public site only: home, business funnel, discover, business detail, lists, occasions, concierge, auth, waitlist, profile. Dashboard and admin shells untouched. |
| Content | Keep pages; restructure sections + rewrite copy where the funnel is weak |
| Logo | The "Manzil." wordmark stays (brand decision, out of scope) |

## 1. Technical foundation

- Add `bootstrap@^5.3` and `sass` to `apps/web`.
- New `app/styles/`:
  - `_tokens.scss` — every Bootstrap variable override (`$primary`, `$body-bg`, `$font-family-base`, `$border-radius`, `$box-shadow`, breakpoints kept stock).
  - `_bootstrap.scss` — curated module imports only: functions, variables, maps, mixins, root, reboot, type, grid, containers, navbar, nav, card, badge, buttons, forms (incl. floating labels + validation), offcanvas, accordion, modal, carousel, table, utilities API. Unused modules are not imported.
  - `anor.scss` — the small custom layer: anor rule divider, arch photo mask, no-photo tile, chips, sticky action bar. Target: a few hundred lines.
- Theming happens in Sass variables so every Bootstrap component renders on-brand from birth — no `!important` overrides against `.btn-primary` etc.
- `framer-motion` (already a dependency) remains the choreography layer.
- The existing `app/globals.css` (~7.9k lines) is retired **per page as pages are converted**; deleted only when the last `(site)` page is converted. `(workspace)` dashboard and admin keep their current CSS (out of scope). Any `.crm-`/`.ws-` rules that `(site)` pages don't use stay untouched until the final deletion pass, which must verify the workspace shell still resolves every class it uses.
- Fonts move to `next/font/google` (see §2). The old Archivo/IBM Plex Sans display/body pairing is removed with the last converted page.

## 2. The Anor design language

Named for the pomegranate — the recurring fruit of Uzbek hospitality. Warmth lives in the accents and the photography; the ground is light and modern.

### Palette

| Token | Hex | Role |
| --- | --- | --- |
| Ground | `#F8F7F5` | Page background — cool near-white, warm-leaning |
| Card | `#FFFFFF` | Card and panel surfaces |
| Ink | `#231F1A` | Text; footer and inverted band ground |
| Anor | `#A8352A` | Primary — CTAs, links, active states |
| Leaf | `#1F5B43` | Secondary — success, "open now" state, secondary buttons |
| Saffron | `#E0A63A` | Ratings and at most one high-intent highlight per page. Never body text on light ground — fills and stars only. |
| Clay | `#6E624F` | Muted/secondary text |

Contrast (computed, WCAG relative-luminance): Anor on Ground ≈ 6.1:1 ✓, on Card ≈ 6.5:1 ✓. Clay was originally `#8A7B66`, which measured ≈ 3.8:1 on Ground and failed AA; darkened to `#6E624F` (≈ 5.6:1 on Ground, ≈ 6.0:1 on Card). Re-verify in-browser during implementation; any further token change must re-clear 4.5:1.

### Type

All faces have first-class Cyrillic so uz/ru/en read as one site:

- **Display — Unbounded** (weights 500–600 only). Signage-like, fits a brand named "destination". It is a wide face: every headline is `clamp()`-sized and verified against the longest locale string (acceptance check per page).
- **Body/UI — Golos Text.** Latin and Cyrillic drawn as one system.
- **Data — IBM Plex Mono** (retained). Ratings, counts, prices; `tabular-nums` mandatory.

Loaded via `next/font/google` with subsets `latin`, `latin-ext`, `cyrillic`, `cyrillic-ext`.

### Signature motifs

- **Anor rule** — a thin pomegranate-red line with a small diamond node; the single section-divider device.
- **Arch-cropped photography** — the Samarkand arch survives as a photo mask on hero/collection imagery, not as a logo sticker. Real places, warm light, editorial crops.
- **No-photo default** — flat Leaf tile with the business initial set in Unbounded. Dignified at low content; the site never looks broken.

### Motion

- 300–600 ms ease-out; staggered card entrances; one hero reveal per session.
- Every section fully renders without JS; motion is layered on top, never a visibility gate.
- Full `prefers-reduced-motion` alternative (instant states, no reveals).

### Genericness ban-list (carried over from PRODUCT.md, still binding)

No tracked all-caps eyebrows above sections; no gradient-clip headline text; no glassmorphism; no identical icon-heading-text card grids; no hero big-number metric band; the app-download moment appears exactly once — the home-page band — and is not repeated as bands or badge rows on any other page.

## 3. Pages

### Home `/`

1. **Nav** — Bootstrap navbar: wordmark left; Home / Discover / For business; right: language switcher, Kirish, one Anor "Boshlash" button. Offcanvas menu on mobile.
2. **Hero** — split. Left: Unbounded headline; one plain-language subline that names the owner value (replaces the empty "yagona platforma" line); primary CTA **Boshlash** (register). One ask per fold — consumers get a quiet text link to the app section. Right: arch-cropped photo collage of real Tashkent places. Small inline proof line in Plex Mono (businesses · reviews · districts) — inline text, not a band.
3. **How it works** — three numbered editorial rows for owners: claim → verify → manage. Replaces "Biz asosini qurdik" (reads as an empty-launch admission).
4. **Product proof** — the four features (listing management, review replies, announcements, analytics) as alternating media rows with real product screenshots in device frames. The pastel bento grid — including the off-brand violet card — is removed.
5. **Pricing teaser** — Free / Pro / Max as three cards with honest one-liners; link to full pricing.
6. **App moment** — one decisive band: arch-masked photo + store badges. Appears nowhere else on the page.
7. **Footer** — Ink ground; product / apps / contact columns; Telegram bot prominent (owners live in Telegram).

### Business funnel

- **`/business`** — owner deep-dive: feature detail sections, owner testimonial, FAQ accordion (Bootstrap), full register CTA.
- **`/business/pricing`** — full plan comparison table (Bootstrap table) + FAQ.
- **`/business/plans`** — same table treatment in the authenticated context.
- **`/business/register` (+ `/photos`)** — Bootstrap forms with floating labels, visible step progress, validation states in Anor (error) / Leaf (valid).

### Discover `/discover` — flagship, app-like

- Sticky filter bar: category chips, district, **open-now toggle**, sort; URL-driven state.
- Rich result cards: photo (arch-top), live open/closed pill (existing `live-status-pill` logic restyled Leaf), mono rating, price band, distance when geolocation granted.
- Desktop layout reserves a right rail sized for a future map pane. v1 ships the rail as a district-navigator panel — no fake map, no new map dependency; a Mapbox pane can drop in later without relayout.
- Skeleton loading states; designed empty state (no results).

### Business detail `/businesses/[slug]` — stronger

- Full-bleed gallery mosaic: 1 large + 4 tiles; "show all" opens a lightbox carousel (Bootstrap modal + carousel).
- Sticky action card (desktop right rail) / bottom action bar (mobile): call · Telegram · directions · save, with open/closed status and hours.
- Reviews: rating summary block (large mono number + distribution bars), visually distinct owner replies, helpful votes.
- Gurman AI summary set as a quoted editorial block.

### Long tail — one shared minimal template

`/lists`, `/lists/[slug]`, `/occasions`, `/occasions/[slug]`, `/concierge`, `/waitlist/[topic]`, `/profile` share: plain page header (title + one-line description), standard Anor cards/grid, nothing bespoke. Concierge keeps its chat behavior, restyled with stock components.

### Auth

Clerk sign-in/sign-up themed via the `appearance` prop mapped to Anor tokens.

## 4. Copy rules

Where copy is rewritten (hero, how-it-works, feature rows, pricing one-liners): uz-first, plain and official, no emoji, one ask per fold. New copy drafted in all three locales together so layouts are tested against the longest variant. Final uz/ru/en wording gets user sign-off during implementation, page by page.

## 5. Edge cases & accessibility

- **No-photo businesses** → Leaf tile default (§2).
- **Trilingual stress** — every headline/nav/button verified against the longest of uz/ru/en; explicit per-page acceptance check because Unbounded is wide.
- **Contrast** — gate in §2; saffron never text on light ground.
- **Reduced motion** — instant alternative for every reveal; pages fully render without JS.
- **Loading/empty** — skeletons on discover and detail; designed empty states (no results, no reviews yet).

## 6. Testing & verification

- Existing web test suite, typecheck, and lint stay green throughout; conversion is page-by-page so each chunk is verifiable.
- Playwright smoke per redesigned page: renders in all 3 locales; no horizontal overflow at 390 px; nav and primary CTA present.
- Visual verification: Chrome DevTools screenshots at 390 / 768 / 1440 per page before a page is called done.
- Lighthouse accessibility ≥ 95 on home, discover, and business detail.

## 7. Out of scope

- `(workspace)` dashboard shell and admin console styling.
- Logo/wordmark changes.
- Real map integration on discover (rail is reserved for it).
- Native apps (Android app has its own design system).
