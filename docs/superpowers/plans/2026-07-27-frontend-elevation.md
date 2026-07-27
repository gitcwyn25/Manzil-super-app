# Manzil Frontend Elevation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Split `apps/web` into a consumer shell and a business workspace shell, put real businesses on the homepage, replace the design system with a new "Kosmonavtlar" direction, and ship a three-topic waitlist.

**Architecture:** One Next.js app, two route groups (`(site)` and `(workspace)`) under `app/[locale]/`, sharing one token layer but diverging in density, motion, and navigation. Styling stays hand-written CSS in `globals.css` — Tailwind is removed, not wired in. The waitlist adds one Prisma model, one Nest controller/repository pair registered flat in `AppModule`, and one parameterised Next route.

**Tech Stack:** Next.js App Router (server components, `--webpack`), React, Clerk, NestJS + Prisma (PostgreSQL), Jest (API), Playwright (e2e), hand-written CSS with custom properties.

## Global Constraints

- **Do not read, cite, or extend `apps/web/DESIGN.md`.** It is superseded by this plan. Task 2 deletes it.
- **No Tailwind.** After Task 1 there is no `tailwind.config.ts`, no `tailwindcss` PostCSS plugin, no `tailwindcss` dependency. Never add utility classes.
- All styling goes in `apps/web/app/globals.css` using the existing class-name conventions (`lp-`, `bz-`, `crm-`, `home-`, `ws-`). Inline `style` props only for dynamic values.
- Trilingual: every user-visible string must exist for `uz`, `ru`, and `en`. `uz` is the fallback.
- Prisma conventions: `String @id @default(cuid())`, camelCase fields, no `@@map`, `///` doc comments that explain *why*, indexes at the bottom of the model.
- API conventions: controllers return `{ data: ... }`, are registered flat in `apps/api/src/modules/app.module.ts` (`controllers` + `providers` arrays — no new Nest module), and carry an explicit throttle decorator from `../security/throttle.config`.
- Route groups `(site)` and `(workspace)` do **not** change URLs. They add one directory level, so every relative import in a moved file gains one `../`.
- Respect `prefers-reduced-motion` on every animation added. Content is visible by default; motion is enhancement.
- Verify each task with `npm run typecheck` from the repo root before committing.

---

## Design Direction: "Kosmonavtlar"

This replaces the previous editorial/heritage direction. It is written here so Task 2 has an exact source.

**Where it comes from.** Manzil means *destination*. The most futuristic thing in its own world is not Silicon Valley — it is the Tashkent Metro: 1970s–80s space-age civic modernism, deep saturated colour fields, anodised metal trim, ribbed concrete, circular medallions, stations literally named for cosmonauts. That is a local futurism, and it is what the palette, type, and signature element are derived from.

**Colour — 6 named values, strict roles.**

| Token | Hex | Role |
|---|---|---|
| `--void` | `#0A1A1E` | Deep vault. Hero bands, workspace rail, inverted sections. |
| `--panel` | `#F1F3F2` | Cool concrete. Primary page surface (NOT cream). |
| `--ceramic` | `#00706B` | Brand teal, brightened for screen. Primary actions, brand. |
| `--signal` | `#4DE1C1` | Lit-sign aqua. **Live/active/now state only** — never decoration. |
| `--brass` | `#C8A24C` | Metal trim. Ratings, one high-intent CTA per page. |
| `--dust` | `#6B7C7A` | Secondary text. Must clear 4.5:1 on `--panel`. |

Two accents with non-overlapping jobs (`--signal` = state, `--brass` = value) is what keeps this off the "dark background, one acid accent" default. The primary surface is light concrete; `--void` appears in bands and the workspace rail, not as the page background.

**Type — 3 roles, chosen for a functional reason.**

- **Display — `Archivo` with the `wdth` axis pushed wide.** Expanded grotesque reads as architectural signage / station nameplate. Set in caps only at section-band scale.
- **Body & UI — `IBM Plex Sans`.** Chosen because Manzil is uz/ru/en: Plex has Latin and Cyrillic drawn as one system, so Uzbek and Russian do not look like two different websites. This is the load-bearing reason, not taste.
- **Data — `IBM Plex Mono`.** Ratings, counts, currency, IDs. Metrically matched to Plex Sans. Tabular figures mandatory in the workspace.

**Layout.** Sections are separated by full-bleed colour-field *bands* (station wall panels), not by whitespace alone. Consumer shell breathes; workspace shell is a fixed rail + dense main at 34px row height.

**Signature — the aperture.** A circular portal (metro medallion / tunnel mouth) that is the one bold element:
- On the consumer hero it is the clip-path through which content arrives, once, on load.
- Its ring is a **live indicator**: it carries `--signal` only when the page is showing live state (businesses open now). Structure encoding truth, not decoration.
- In the workspace it collapses into the sidebar's status ring — same motif, workspace density. That is how a user knows they crossed the boundary, without a banner.

**Motion, per shell.**
- Consumer: `--ease-out: cubic-bezier(.16,1,.3,1)`, 360–700ms, choreographed (stagger a list, rise a headline). Never one uniform fade on every section.
- Workspace: `--ws-speed: 140ms`, transform/opacity only, **no scroll reveals at all**. The contrast between shells is itself the design.
- Aperture: 900ms, once per session. Reduced motion → instant crossfade.

---

## File Structure

**Deleted**
- `apps/web/tailwind.config.ts` — dead config, no directives ever existed.
- `apps/web/DESIGN.md` — superseded by `docs/design-system.md`.

**Created**
- `docs/architecture.md` — records the Tailwind resolution and the shell split.
- `docs/design-system.md` — the authoritative design system (Kosmonavtlar).
- `apps/web/app/[locale]/(site)/layout.tsx` — consumer chrome.
- `apps/web/app/[locale]/(workspace)/layout.tsx` — workspace frame, no consumer chrome.
- `apps/web/app/components/motion/aperture.tsx` — signature element.
- `apps/web/app/components/workspace/ws-skeleton.tsx` — layout-matched loading states.
- `apps/web/app/components/waitlist/waitlist-form.tsx` — client form, all topics.
- `apps/web/app/lib/waitlist-copy.ts` — trilingual copy keyed by topic.
- `apps/web/app/[locale]/(site)/waitlist/[topic]/page.tsx` — one route, three promises.
- `apps/api/src/modules/waitlist/waitlist.controller.ts`
- `apps/api/src/modules/waitlist/waitlist.repository.ts`
- `apps/api/src/modules/waitlist/waitlist.spec.ts`
- `tests/e2e/shell-boundary.spec.ts`
- `tests/e2e/waitlist.spec.ts`

**Modified**
- `apps/web/postcss.config.cjs`, `apps/web/package.json` — drop Tailwind.
- `apps/web/app/layout.tsx` — new fonts, `lang` fix, `themeColor` fix.
- `apps/web/app/globals.css` — new token layer, band system, workspace density layer, aperture.
- `apps/web/app/[locale]/layout.tsx` — reduced to locale validation + providers.
- `apps/web/app/components/site-nav.tsx`, `header.tsx` — nav boundary.
- `apps/web/app/[locale]/(site)/page.tsx` — real businesses on the homepage.
- `apps/web/app/components/home-sections.tsx`, `business-card.tsx` — photo-led cards.
- `apps/web/app/components/crm/crm-sidebar.tsx` — aperture status ring.
- `packages/db/schema.prisma`, `apps/api/src/modules/app.module.ts` — waitlist.

**Moved** (`git mv`, +1 `../` on every relative import)
- Into `(site)`: `page.tsx`, `discover/`, `businesses/`, `lists/`, `occasions/`, `concierge/`, `profile/`, `business/`, `sign-in/`, `sign-up/`.
- Into `(workspace)`: `dashboard/`, `admin/`.

---

### Task 1: Remove Tailwind and record the decision

Tailwind is loaded by `postcss.config.cjs` and configured by `tailwind.config.ts`, but `globals.css` contains zero `@tailwind` directives and the app contains zero real utility classes. It generates nothing. Delete it.

**Files:**
- Delete: `apps/web/tailwind.config.ts`
- Modify: `apps/web/postcss.config.cjs`
- Modify: `apps/web/package.json` (devDependencies)
- Create: `docs/architecture.md`

**Interfaces:**
- Consumes: nothing.
- Produces: a Tailwind-free build. All later tasks author plain CSS in `globals.css`.

- [ ] **Step 1: Prove no utility classes exist**

```bash
cd apps/web && grep -rnoE '\b(flex items-center|justify-between|bg-white|bg-slate-[0-9]|text-slate-[0-9]|rounded-(lg|md|xl)|shadow-(sm|md|lg)|w-full|mt-[0-9]|px-[0-9]|py-[0-9]|gap-[0-9]|text-(xs|sm|base|lg|xl|2xl))\b' app --include=*.tsx
```

Expected: no output. If this prints anything, stop and convert those call sites to named classes first.

- [ ] **Step 2: Delete the config**

```bash
git rm apps/web/tailwind.config.ts
```

- [ ] **Step 3: Drop the PostCSS plugin**

Replace the whole of `apps/web/postcss.config.cjs` with:

```js
// Tailwind was removed: it had no @tailwind directives and generated nothing.
// Autoprefixer stays — globals.css is hand-written and still needs vendor prefixes.
module.exports = {
  plugins: {
    autoprefixer: {},
  },
};
```

- [ ] **Step 4: Drop the dependency**

In `apps/web/package.json`, remove the `"tailwindcss": "^3.4.17",` line from `devDependencies`. Leave `autoprefixer`. Then:

```bash
npm install
```

- [ ] **Step 5: Verify the build still produces CSS**

```bash
npm run build --workspace @manzil/web
```

Expected: PASS. Confirm a CSS chunk is emitted under `apps/web/.next/static/css/`.

- [ ] **Step 6: Write `docs/architecture.md`**

Create it with exactly this content:

```markdown
# Architecture decisions

## Styling: hand-written CSS, no Tailwind (2026-07-27)

`apps/web` styles are hand-written in `app/globals.css` (~6.5k lines) against a
custom-property token layer. Tailwind was previously half-installed: a
`tailwind.config.ts` and a `tailwindcss` PostCSS plugin existed, but
`globals.css` never contained `@tailwind` directives and no file in the app ever
used a utility class. It emitted nothing.

Resolved by removing it entirely rather than wiring it in. Adopting it would have
meant two styling systems cascading against each other across 6.5k lines of
existing CSS for no delivery gain. **Do not add utility classes.** New styles go
in `globals.css` using the existing namespaces (`lp-`, `bz-`, `crm-`, `home-`,
`ws-`).

## Shell split: `(site)` vs `(workspace)` (2026-07-27)

`app/[locale]/layout.tsx` used to render the consumer header, mobile nav, and
footer around *every* route — including `/dashboard` and `/admin`. A business
owner saw consumer chrome and a CRM sidebar at the same time, and "Dashboard"
appeared in the consumer mobile nav for visitors who had no business.

The app is now split into two route groups under `app/[locale]/`:

- `(site)` — consumer and marketing surfaces. Header, mobile nav, footer.
  Editorial density, choreographed motion.
- `(workspace)` — `/dashboard/*` and `/admin`. No consumer chrome. Fixed rail,
  34px rows, 140ms transitions, no scroll reveals.

Route groups do not change URLs. Both shells share one token layer, so the split
is in density and interaction pattern, not brand. The design system is
`docs/design-system.md`.
```

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "chore(web): remove dead Tailwind config, document styling decision"
```

---

### Task 2: Install the Kosmonavtlar token layer

**Files:**
- Delete: `apps/web/DESIGN.md`
- Create: `docs/design-system.md`
- Modify: `apps/web/app/layout.tsx`
- Modify: `apps/web/app/globals.css` (`:root` block, lines 7–68)

**Interfaces:**
- Consumes: nothing.
- Produces: CSS custom properties `--void --panel --ceramic --signal --brass --dust --font-display --font-body --font-data --ease-out --ws-speed`, plus compatibility aliases so the existing 6.5k lines keep rendering. Every later task uses these names.

- [ ] **Step 1: Write `docs/design-system.md`**

Copy the entire "Design Direction: Kosmonavtlar" section from this plan (from the `## Design Direction` heading through the motion table) into `docs/design-system.md`, with `# Manzil Design System` as the top-level heading. Add this line directly under the heading:

```markdown
> Authoritative. Supersedes the removed `apps/web/DESIGN.md`.
```

- [ ] **Step 2: Delete the superseded doc**

```bash
git rm apps/web/DESIGN.md
```

- [ ] **Step 3: Swap the fonts**

In `apps/web/app/layout.tsx`, replace the import on line 4 and the four font constants (lines 7–28) with:

```tsx
import { Archivo, IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";

// Expanded grotesque: reads as station signage, not as a startup headline face.
const display = Archivo({
  subsets: ["latin"],
  axes: ["wdth"],
  variable: "--font-display"
});

// Latin and Cyrillic drawn as one system. Manzil ships uz/ru/en, and a body face
// without matched Cyrillic makes the Russian site look like a different product.
const body = IBM_Plex_Sans({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body"
});

// Metrically matched to Plex Sans. Ratings, counts, currency, IDs.
const data = IBM_Plex_Mono({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500"],
  variable: "--font-data"
});
```

- [ ] **Step 4: Apply them, and fix two latent bugs on the same element**

Replace the `<html>` opening tag (lines 60–64) with:

```tsx
      <html
        lang="uz"
        className={`${display.variable} ${body.variable} ${data.variable}`}
        suppressHydrationWarning
      >
```

Then fix `themeColor` on line 52 — `#0f5b3d` is a green that matches nothing in the app:

```tsx
export const viewport: Viewport = {
  themeColor: "#00706B",
  width: "device-width",
  initialScale: 1
};
```

`lang="uz"` is hardcoded here for all locales. The root layout cannot read the
locale param, so leave it and add this comment above the `<html>` tag:

```tsx
        {/* lang is corrected per-locale by app/[locale]/layout.tsx, which sets
            document.documentElement.lang — the root layout has no locale param. */}
```

- [ ] **Step 5: Replace the token block**

In `apps/web/app/globals.css`, replace lines 7–68 (the entire `:root { ... }` block, from `:root {` through the closing brace after `--speed-slow`) with:

```css
:root {
  /* ---- Kosmonavtlar palette. See docs/design-system.md.
         Two accents with non-overlapping jobs: --signal is state (live/active/
         now) and --brass is value (ratings, one CTA). Never swap them. ---- */
  --void: #0a1a1e;
  --panel: #f1f3f2;
  --ceramic: #00706b;
  --signal: #4de1c1;
  --brass: #c8a24c;
  --dust: #6b7c7a;

  /* Derived surfaces */
  --surface: var(--panel);
  --surface-low: #e9ecea;
  --surface-card: #ffffff;
  --surface-high: #dfe3e1;
  --inverse-surface: var(--void);
  --text: #0d1a1c;
  --muted: var(--dust);
  --outline: #c2cbc9;
  --line: rgb(13 26 28 / 0.12);

  /* Brand aliases retained by name so existing rules keep resolving */
  --primary: var(--ceramic);
  --primary-bright: #0a8f88;
  --primary-ghost: rgb(0 112 107 / 0.08);
  --gold: var(--brass);
  --error: #ba1a1a;
  --success: #1b7f4e;

  /* Fonts — semantic names. Compatibility aliases below keep the existing
     6.5k lines of rules working until they are renamed. */
  --font-inter: var(--font-body);
  --font-geist: var(--font-body);
  --font-geist-mono: var(--font-data);
  --font-serif: var(--font-display);

  /* Elevation */
  --shadow: 0 24px 60px -18px rgb(10 26 30 / 0.22);
  --soft-shadow: 0 4px 20px rgb(10 26 30 / 0.06);
  --hover-shadow: 0 30px 70px -22px rgb(10 26 30 / 0.3);
  --ring: 0 0 0 4px rgb(0 112 107 / 0.16);

  /* Shape */
  --radius-sm: 10px;
  --radius-md: 16px;
  --radius-lg: 24px;
  --radius-xl: 32px;

  /* Motion — consumer shell */
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-spring: cubic-bezier(0.22, 1, 0.36, 1);
  --speed-fast: 180ms;
  --speed-med: 360ms;
  --speed-slow: 700ms;

  /* Motion — workspace shell. Deliberately ~2.5x faster; the density contrast
     between shells is the design, not an oversight. */
  --ws-speed: 140ms;
  --ws-row: 34px;
  --ws-line: rgb(13 26 28 / 0.08);
}
```

- [ ] **Step 6: Set the body face and background band**

Replace the `body { ... }` rule (was lines 80–92) with:

```css
body {
  margin: 0;
  min-height: 100dvh;
  background: var(--panel);
  color: var(--text);
  font-family: var(--font-body), system-ui, sans-serif;
  line-height: 1.55;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
}

/* Display face: expanded axis, tight tracking, caps at band scale only. */
h1,
h2,
h3 {
  font-family: var(--font-display), system-ui, sans-serif;
  font-variation-settings: "wdth" 112;
  letter-spacing: -0.02em;
  text-wrap: balance;
}

/* Numerals are data, not prose. */
.rating-badge,
.home-card__rating,
.ws-num {
  font-family: var(--font-data), ui-monospace, monospace;
  font-variant-numeric: tabular-nums;
}
```

The two decorative radial gradients in the old `body` rule are dropped — the new
direction uses colour-field bands (Task 7), not ambient page glow.

- [ ] **Step 7: Verify contrast and render**

```bash
npm run dev --workspace @manzil/web
```

Open `http://localhost:3000/en`. Confirm: the page background is cool concrete (not cream), headlines render in Archivo, body renders in Plex Sans. Check `--dust` (`#6B7C7A`) on `--panel` (`#F1F3F2`) in DevTools' contrast checker — it must be ≥ 4.5:1. If it fails, darken `--dust` to `#5C6C6A` and re-check.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat(web): install Kosmonavtlar token layer, retire DESIGN.md"
```

---

### Task 3: Split the shells with route groups

Today `app/[locale]/layout.tsx` wraps every route — including `/dashboard` and `/admin` — in `Header` + `MobileNav` + `Footer`, and `dashboard/layout.tsx` nests a CRM sidebar inside that. Owners get consumer chrome and a workspace sidebar simultaneously.

**Files:**
- Modify: `apps/web/app/[locale]/layout.tsx`
- Create: `apps/web/app/[locale]/(site)/layout.tsx`
- Create: `apps/web/app/[locale]/(workspace)/layout.tsx`
- Move: 10 consumer route dirs into `(site)`, 2 workspace route dirs into `(workspace)`

**Interfaces:**
- Consumes: `--ws-*` tokens from Task 2.
- Produces: `data-shell="site"` and `data-shell="workspace"` attributes on the shell roots. Task 5's CSS layer and Task 9 both scope to `[data-shell="workspace"]`.

- [ ] **Step 1: Create the route groups and move consumer routes**

```bash
cd apps/web/app/\[locale\]
mkdir -p "(site)" "(workspace)"
git mv page.tsx "(site)/page.tsx"
for d in discover businesses lists occasions concierge profile business sign-in sign-up; do git mv "$d" "(site)/$d"; done
for d in dashboard admin; do git mv "$d" "(workspace)/$d"; done
```

- [ ] **Step 2: Reduce the locale layout to validation and providers**

Replace the whole of `apps/web/app/[locale]/layout.tsx` with:

```tsx
import { isLocale, type Locale } from "@manzil/shared";
import { notFound } from "next/navigation";
import { LocaleProviders } from "../components/locale-providers";

export function generateStaticParams() {
  return [{ locale: "uz" }, { locale: "ru" }, { locale: "en" }];
}

/**
 * Locale gate only. Chrome belongs to the shell layouts: (site) renders the
 * consumer header/nav/footer, (workspace) renders none of it. Putting chrome
 * here is what previously gave business owners a consumer header on /dashboard.
 */
export default async function LocaleLayout({
  children,
  params
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  return <LocaleProviders locale={locale as Locale}>{children}</LocaleProviders>;
}
```

- [ ] **Step 3: Create the consumer shell**

Create `apps/web/app/[locale]/(site)/layout.tsx`:

```tsx
import type { Locale } from "@manzil/shared";
import { Footer } from "../../components/footer";
import { Header } from "../../components/header";
import { MobileNav } from "../../components/mobile-nav";

/**
 * Consumer and marketing surfaces. Full chrome, editorial density.
 * The locale is already validated by app/[locale]/layout.tsx.
 */
export default async function SiteLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;

  return (
    <div className="site-root" data-shell="site">
      <Header locale={locale} />
      <main>{children}</main>
      <MobileNav locale={locale} />
      <Footer locale={locale} />
    </div>
  );
}
```

- [ ] **Step 4: Create the workspace shell**

Create `apps/web/app/[locale]/(workspace)/layout.tsx`:

```tsx
import type { Locale } from "@manzil/shared";

/**
 * Business workspace frame. Deliberately renders no consumer header, mobile nav,
 * or footer — a workspace that carries marketing chrome reads as a page rather
 * than a tool. Per-section navigation is owned by the nested layouts:
 * dashboard/layout.tsx renders the CRM rail, admin renders its own.
 *
 * data-shell drives the density layer in globals.css (34px rows, 140ms
 * transitions, no scroll reveals).
 */
export default async function WorkspaceLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: Locale }>;
}) {
  await params;

  return (
    <div className="ws-root" data-shell="workspace">
      {children}
    </div>
  );
}
```

- [ ] **Step 5: Fix the import depth in every moved file**

Every moved file gained one directory level, so each relative import into `app/` needs one more `../`. From `apps/web`:

```bash
grep -rn 'from "\.\./' "app/[locale]/(site)" "app/[locale]/(workspace)" --include=*.tsx | head -40
```

For each hit, add one `../` to the specifier. Example: in `(site)/page.tsx`, `from "../components/audience-features"` becomes `from "../../components/audience-features"`; in `(site)/businesses/[slug]/page.tsx`, `from "../../../components/..."` becomes `from "../../../../components/..."`.

- [ ] **Step 6: Verify the moves compile**

```bash
npm run typecheck --workspace @manzil/web
```

Expected: PASS with zero errors. Any `Cannot find module '../...'` is a missed `../` from Step 5.

- [ ] **Step 7: Write the boundary test**

Create `tests/e2e/shell-boundary.spec.ts`:

```ts
import { expect, test } from "@playwright/test";

/**
 * The shell split is structural, so it is asserted structurally: the consumer
 * chrome must be absent from the workspace, and the workspace rail must be
 * absent from consumer pages. A banner would satisfy neither.
 */
test.describe("shell boundary", () => {
  test("consumer pages render the site shell", async ({ page }) => {
    await page.goto("/en");
    await expect(page.locator('[data-shell="site"]')).toBeVisible();
    await expect(page.locator('[data-shell="workspace"]')).toHaveCount(0);
  });

  test("discover renders the site shell", async ({ page }) => {
    await page.goto("/en/discover");
    await expect(page.locator('[data-shell="site"]')).toBeVisible();
    await expect(page.locator("nav.mobile-nav")).toHaveCount(1);
  });

  test("the workspace renders no consumer chrome", async ({ page }) => {
    await page.goto("/en/dashboard");
    await expect(page.locator('[data-shell="workspace"]')).toBeVisible();
    await expect(page.locator('[data-shell="site"]')).toHaveCount(0);
    await expect(page.locator("nav.mobile-nav")).toHaveCount(0);
    await expect(page.locator("footer")).toHaveCount(0);
  });
});
```

- [ ] **Step 8: Run it**

```bash
npx playwright test tests/e2e/shell-boundary.spec.ts
```

Expected: 3 passed. `/dashboard` renders the signed-out `crm-auth-panel` for an
anonymous visitor — that is fine, the assertions are about chrome, not content.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "refactor(web): split consumer and workspace shells into route groups"
```

---

### Task 4: Fix the navigation boundary

`site-nav.tsx` lists `dashboard` as the third consumer link — so every visitor, signed in or not, sees "Dashboard" in the desktop nav and the mobile bottom bar. `header.tsx` also hardcodes a `/dashboard` CTA. Consumers have no dashboard; owners need an explicit way in.

**Files:**
- Modify: `apps/web/app/components/site-nav.tsx`
- Modify: `apps/web/app/components/header.tsx`
- Modify: `apps/web/app/components/header-auth.tsx`
- Modify: `apps/web/app/globals.css`

**Interfaces:**
- Consumes: `data-shell` from Task 3.
- Produces: `WorkspaceSwitch` exported from `header-auth.tsx`; the workspace rail in Task 5 links back with the same vocabulary.

- [ ] **Step 1: Replace the consumer nav links**

In `apps/web/app/components/site-nav.tsx`, replace the `links` array (lines 8–13) with:

```tsx
// Consumer navigation only. "Dashboard" is deliberately absent: a visitor with
// no business has nothing there, and the workspace is reached through the
// signed-in switch in the header instead.
const links = [
  { key: "home" as const, href: (locale: Locale) => `/${locale}` },
  { key: "discover" as const, href: (locale: Locale) => `/${locale}/discover` },
  { key: "forBusiness" as const, href: (locale: Locale) => `/${locale}/business` }
];
```

- [ ] **Step 2: Replace the mobile nav links and icon**

In the same file, replace `mobileLinks` (lines 67–71) with:

```tsx
  const mobileLinks = [
    { key: "home" as const, href: `/${locale}`, label: copy.nav.home },
    { key: "discover" as const, href: `/${locale}/discover`, label: copy.nav.discover },
    { key: "forBusiness" as const, href: `/${locale}/business`, label: copy.nav.forBusiness }
  ];
```

Then in the `mobileIcons` record, replace the `dashboard` entry with a `discover` entry (a magnifier reads the action; the dashboard grid did not):

```tsx
  discover: (
    <svg aria-hidden="true" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  ),
```

- [ ] **Step 3: Add the `discover` copy key**

`copy.nav` comes from `getBusinessCopy` in `apps/web/app/lib/business-copy.ts`. Open it, find the `nav` object for each of `uz`, `ru`, `en`, and add a `discover` key alongside the existing `home` / `forBusiness` / `dashboard`:

- `uz`: `discover: "Kashf eting"`
- `ru`: `discover: "Найти"`
- `en`: `discover: "Discover"`

Leave `dashboard` in place — the switch in Step 4 still uses it.

- [ ] **Step 4: Add the signed-in workspace switch**

Replace the whole of `apps/web/app/components/header-auth.tsx` with:

```tsx
"use client";

import { UserButton, useAuth } from "@clerk/nextjs";
import type { Locale } from "@manzil/shared";
import { getUiCopy } from "@manzil/shared";
import { getBusinessCopy } from "../lib/business-copy";

export function HeaderAuth({ locale }: { locale: Locale }) {
  const copy = getUiCopy(locale);
  const { isSignedIn } = useAuth();

  if (isSignedIn) {
    return <UserButton />;
  }

  return <a className="header-signin" href={`/${locale}/sign-in`}>{copy.nav.signIn}</a>;
}

/**
 * The one way from the consumer site into the workspace. Rendered only when
 * signed in: an anonymous visitor has no workspace, and /dashboard already
 * handles the signed-in-but-no-business case with a register prompt.
 */
export function WorkspaceSwitch({ locale }: { locale: Locale }) {
  const { isSignedIn } = useAuth();
  const copy = getBusinessCopy(locale);

  if (!isSignedIn) {
    return null;
  }

  return (
    <a className="header-switch" href={`/${locale}/dashboard`}>
      <span aria-hidden="true" className="header-switch__ring" />
      {copy.nav.dashboard}
    </a>
  );
}
```

- [ ] **Step 5: Wire it into the header**

In `apps/web/app/components/header.tsx`, change the import on line 3 and the actions block (lines 19–23):

```tsx
import { HeaderAuth, WorkspaceSwitch } from "./header-auth";
```

```tsx
      <div className="header-actions">
        <LocaleSwitcher locale={locale} />
        <WorkspaceSwitch locale={locale} />
        <HeaderAuth locale={locale} />
        <a className="header-cta" href={`/${locale}/business/register`}>{copy.cta}</a>
      </div>
```

The CTA now points at registration, not `/dashboard` — the header CTA is a
conversion action for people who do not yet have a business.

- [ ] **Step 6: Style the switch**

Append to `apps/web/app/globals.css`:

```css
/* ---- Workspace switch: the visible seam between the two shells ---- */
.header-switch {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 7px 14px;
  border: 1px solid var(--line);
  border-radius: 999px;
  color: var(--text);
  font-size: 0.86rem;
  font-weight: 500;
  transition: border-color var(--speed-fast) var(--ease-out),
    background var(--speed-fast) var(--ease-out);
}

.header-switch:hover {
  border-color: var(--ceramic);
  background: var(--primary-ghost);
}

/* The aperture motif at its smallest: a ring that marks "another mode exists". */
.header-switch__ring {
  width: 9px;
  height: 9px;
  border: 2px solid var(--ceramic);
  border-radius: 50%;
}

@media (max-width: 720px) {
  .header-switch {
    display: none;
  }
}
```

- [ ] **Step 7: Extend the boundary test**

Append to `tests/e2e/shell-boundary.spec.ts`:

```ts
test("the consumer nav offers no dashboard link", async ({ page }) => {
  await page.goto("/en");
  await expect(page.locator("nav.desktop-nav")).not.toContainText("Dashboard");
  await expect(page.locator("nav.mobile-nav")).not.toContainText("Dashboard");
  await expect(page.locator("nav.desktop-nav")).toContainText("Discover");
});
```

- [ ] **Step 8: Run and commit**

```bash
npx playwright test tests/e2e/shell-boundary.spec.ts
npm run typecheck --workspace @manzil/web
git add -A
git commit -m "feat(web): consumer nav drops dashboard, adds signed-in workspace switch"
```

Expected: 4 passed, typecheck clean.

---

### Task 5: Build the workspace density layer

**Files:**
- Modify: `apps/web/app/globals.css`
- Modify: `apps/web/app/components/crm/crm-sidebar.tsx`

**Interfaces:**
- Consumes: `data-shell="workspace"` (Task 3), `--ws-speed` / `--ws-row` / `--ws-line` (Task 2).
- Produces: the `.ws-` namespace and the `[data-shell="workspace"]` scope. Task 9 styles pages inside it.

- [ ] **Step 1: Add the density layer**

Append to `apps/web/app/globals.css`:

```css
/* ============================================================
   Workspace density layer.
   Scoped to [data-shell="workspace"] so it can never leak onto
   consumer pages. Same tokens as the site shell — the difference
   is density and speed, not brand.
   ============================================================ */

[data-shell="workspace"] {
  --radius-md: 8px;
  --radius-lg: 12px;
  background: var(--surface-card);
  font-size: 0.9rem;
}

/* Editorial display scale is wrong for a tool: cap it hard and hand
   everything small back to the body face. */
[data-shell="workspace"] h1 {
  font-size: 1.4rem;
  font-variation-settings: "wdth" 100;
  letter-spacing: -0.01em;
}

[data-shell="workspace"] h2 {
  font-size: 1.1rem;
  font-variation-settings: "wdth" 100;
}

[data-shell="workspace"] h3,
[data-shell="workspace"] h4 {
  font-family: var(--font-body), system-ui, sans-serif;
  font-size: 0.95rem;
  font-weight: 600;
}

/* Every figure in the workspace is scannable in a column. */
[data-shell="workspace"] td,
[data-shell="workspace"] .ws-num,
[data-shell="workspace"] .crm-stat-value {
  font-family: var(--font-data), ui-monospace, monospace;
  font-variant-numeric: tabular-nums;
}

/* Scroll reveals are a marketing device. In a tool they delay the data. */
[data-shell="workspace"] .reveal,
[data-shell="workspace"] [class*="reveal"] {
  opacity: 1 !important;
  transform: none !important;
  transition: none !important;
}

[data-shell="workspace"] * {
  scroll-behavior: auto;
}

/* ---- Rows ---- */
.ws-table {
  width: 100%;
  border-collapse: collapse;
}

.ws-table th {
  padding: 0 12px;
  height: 30px;
  border-bottom: 1px solid var(--line);
  color: var(--dust);
  font-size: 0.74rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-align: left;
  text-transform: uppercase;
}

.ws-table td {
  height: var(--ws-row);
  padding: 0 12px;
  border-bottom: 1px solid var(--ws-line);
}

.ws-table tbody tr {
  transition: background var(--ws-speed) linear;
}

.ws-table tbody tr:hover {
  background: var(--primary-ghost);
}

/* ---- Live state. --signal appears here and nowhere else. ---- */
.ws-live {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--ceramic);
  font-size: 0.78rem;
}

.ws-live::before {
  content: "";
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--signal);
  box-shadow: 0 0 0 3px rgb(77 225 193 / 0.25);
}

/* ---- Rail ---- */
.crm-shell {
  display: grid;
  grid-template-columns: 232px 1fr;
  min-height: 100dvh;
}

.crm-sidebar {
  position: sticky;
  top: 0;
  height: 100dvh;
  padding: 20px 14px;
  background: var(--void);
  color: #dfe7e5;
}

.crm-sidebar a {
  display: block;
  padding: 7px 10px;
  border-radius: var(--radius-md);
  color: #a9bab7;
  font-size: 0.88rem;
  transition: background var(--ws-speed) linear, color var(--ws-speed) linear;
}

.crm-sidebar a:hover {
  background: rgb(255 255 255 / 0.06);
  color: #fff;
}

.crm-sidebar a.active {
  background: rgb(0 112 107 / 0.4);
  color: #fff;
}

.crm-main {
  padding: 24px 28px 64px;
  min-width: 0;
}

/* The aperture, collapsed. Same ring as the header switch, now the workspace's
   own identity mark — this is how the user knows they crossed the boundary. */
.crm-sidebar__ring {
  width: 26px;
  height: 26px;
  border: 2px solid var(--signal);
  border-radius: 50%;
  flex: none;
}

.crm-sidebar__brand {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 22px;
  color: #fff;
  font-family: var(--font-display), system-ui, sans-serif;
  font-variation-settings: "wdth" 112;
  font-size: 1.05rem;
}

@media (max-width: 860px) {
  .crm-shell {
    grid-template-columns: 1fr;
  }

  .crm-sidebar {
    position: static;
    height: auto;
  }

  .crm-main {
    padding: 16px 14px 48px;
  }
}
```

- [ ] **Step 2: Give the rail its aperture ring**

Open `apps/web/app/components/crm/crm-sidebar.tsx`. Find the element that renders `businessName` at the top of the sidebar and wrap it so the ring sits beside it:

```tsx
      <div className="crm-sidebar__brand">
        <span aria-hidden="true" className="crm-sidebar__ring" />
        <span>{businessName}</span>
      </div>
```

Keep the existing `businessSlug`, `planLabel`, `viewPublicLabel`, and `upgradeLabel` markup below it unchanged.

- [ ] **Step 3: Verify by eye**

```bash
npm run dev --workspace @manzil/web
```

Sign in as a business owner and open `/en/dashboard`. Confirm: dark rail with an aqua ring, no consumer header or footer, rows are tight, nothing fades in on scroll. Then open `/en/discover` and confirm the consumer shell still breathes and still reveals on scroll.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat(web): workspace density layer scoped to the workspace shell"
```

---

### Task 6: Build the aperture

The signature element. One bold thing; everything around it stays quiet.

**Files:**
- Create: `apps/web/app/components/motion/aperture.tsx`
- Modify: `apps/web/app/globals.css`

**Interfaces:**
- Consumes: `--void`, `--signal`, `--brass`, `--ceramic`.
- Produces: `<Aperture live={boolean} label={string} />`. Task 7 places it in the homepage hero.

- [ ] **Step 1: Write the component**

Create `apps/web/app/components/motion/aperture.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";

/**
 * The aperture — Manzil's signature element.
 *
 * A metro-medallion portal that content arrives through, once, on load. Its ring
 * is not decoration: it carries --signal only when `live` is true (businesses
 * open right now), so the brightest thing on the page is always a true statement
 * about the data. If nothing is live, the ring stays brass and still.
 *
 * Runs once per mount. Reduced motion gets the final state immediately.
 */
export function Aperture({
  live = false,
  label
}: {
  live?: boolean;
  label?: string;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduced) {
      setOpen(true);
      return;
    }

    const id = window.requestAnimationFrame(() => setOpen(true));
    return () => window.cancelAnimationFrame(id);
  }, []);

  return (
    <div
      className={`aperture${open ? " is-open" : ""}${live ? " is-live" : ""}`}
      data-label={label}
    >
      <svg aria-hidden="true" viewBox="0 0 240 240" className="aperture__svg">
        <circle className="aperture__ring" cx="120" cy="120" r="112" />
        <circle className="aperture__ring aperture__ring--inner" cx="120" cy="120" r="88" />
      </svg>
      {label ? <span className="aperture__label">{label}</span> : null}
    </div>
  );
}
```

- [ ] **Step 2: Style it**

Append to `apps/web/app/globals.css`:

```css
/* ============================================================
   Aperture — the signature element. See docs/design-system.md.
   ============================================================ */

.aperture {
  position: relative;
  display: grid;
  place-items: center;
  width: clamp(180px, 26vw, 300px);
  aspect-ratio: 1;
}

.aperture__svg {
  width: 100%;
  height: 100%;
  overflow: visible;
  fill: none;
  transform: rotate(-90deg);
}

.aperture__ring {
  stroke: var(--brass);
  stroke-width: 2;
  stroke-dasharray: 704;
  stroke-dashoffset: 704;
  transition: stroke-dashoffset 900ms var(--ease-out), stroke 300ms linear;
}

.aperture__ring--inner {
  stroke-width: 1;
  stroke-dasharray: 553;
  stroke-dashoffset: 553;
  opacity: 0.5;
  transition-delay: 140ms;
}

.aperture.is-open .aperture__ring {
  stroke-dashoffset: 0;
}

/* --signal only when the data is actually live. */
.aperture.is-live .aperture__ring {
  stroke: var(--signal);
  filter: drop-shadow(0 0 10px rgb(77 225 193 / 0.45));
}

.aperture__label {
  position: absolute;
  max-width: 62%;
  color: var(--dust);
  font-family: var(--font-data), ui-monospace, monospace;
  font-size: 0.74rem;
  letter-spacing: 0.06em;
  text-align: center;
  text-transform: uppercase;
}

.aperture.is-live .aperture__label {
  color: var(--ceramic);
}

@media (prefers-reduced-motion: reduce) {
  .aperture__ring {
    transition: none;
    stroke-dashoffset: 0;
  }
}
```

- [ ] **Step 3: Confirm both states render**

Temporarily render `<Aperture live label="3 open now" />` and `<Aperture label="closed" />` side by side in `(site)/page.tsx`. Run the dev server, confirm the rings draw on load, that the `live` one is aqua with a glow and the other is brass and still. Then remove the temporary markup — Task 7 places it properly.

- [ ] **Step 4: Commit**

```bash
git add apps/web/app/components/motion/aperture.tsx apps/web/app/globals.css
git commit -m "feat(web): aperture signature element with live-state ring"
```

---

### Task 7: Put real businesses on the homepage

This is the headline gap. `(site)/page.tsx` is hero + features + app download — **zero businesses**. Meanwhile `HomeSections` (featured / just-joined / categories, backed by the real `GET /home` endpoint) is fully built and rendered only on `/discover`, and `home-card` is a bare text link with no photo.

**Files:**
- Modify: `apps/web/app/[locale]/(site)/page.tsx`
- Modify: `apps/web/app/components/home-sections.tsx`
- Modify: `apps/web/app/globals.css`

**Interfaces:**
- Consumes: `getHomeFeed` from `app/lib/api.ts` (returns `{ sections: HomeSections | null }`, already falls back to mock and self-hides when empty); `<Aperture />` from Task 6.
- Produces: nothing downstream.

- [ ] **Step 1: Render the feed on the homepage**

In `apps/web/app/[locale]/(site)/page.tsx`, add these imports:

```tsx
import { Aperture } from "../../components/motion/aperture";
import { HomeSections } from "../../components/home-sections";
import { getHomeFeed } from "../../lib/api";
```

Then fetch the feed alongside the copy:

```tsx
  const { locale } = await params;
  const copy = getLandingCopy(locale);
  const feed = await getHomeFeed(locale);
  const liveCount = feed.sections?.justJoined.length ?? 0;
```

- [ ] **Step 2: Put the aperture in the hero and the businesses directly under it**

Replace the hero `<section className="lp-hero">` block and insert a new section immediately after it:

```tsx
      <section className="lp-hero">
        <ScenicBackdrop />
        <div className="lp-hero-content">
          <h1 className="lp-title">
            <span className="lp-title-line">{copy.titleLine1}</span>
            <span className="lp-title-line delay">{copy.titleLine2}</span>
          </h1>
          <p className="lp-sub">{copy.subtitle}</p>
          <a className="lp-cta" href={`/${locale}/discover`}>{copy.cta}</a>
        </div>
        <div className="lp-hero-aperture">
          <Aperture live={liveCount > 0} label={copy.badge} />
        </div>
      </section>

      {/* Businesses come before the marketing copy. A directory whose homepage
          shows no businesses is asking visitors to take the directory on faith. */}
      {feed.sections ? (
        <section className="lp-band lp-band--businesses">
          <HomeSections locale={locale} sections={feed.sections} />
        </section>
      ) : null}
```

The hero CTA moves from `/dashboard` to `/discover` — the consumer landing page
should not send consumers into the business workspace. The `lp-pill` link is
dropped; the aperture now carries that badge text.

- [ ] **Step 3: Give home cards a photo**

In `apps/web/app/components/home-sections.tsx`, replace the `Card` function with:

```tsx
function Card({ business, locale, text }: { business: HomeCard; locale: Locale; text: SectionCopy }) {
  return (
    <a className="home-card" href={`/${locale}/businesses/${business.slug}`}>
      <span className="home-card__photo" aria-hidden="true">
        <span className="home-card__initial">{business.name.charAt(0)}</span>
      </span>
      <span className="home-card__text">
        <span className="home-card__name">{business.name}</span>
        <span className="home-card__meta">
          {categoryName(business.category, locale)} · {business.district}
        </span>
        <span className="home-card__rating">
          {/* A brand-new business has no rating. Showing "0.0 ★" would read as a
              bad rating rather than an absent one. */}
          {business.reviewCount > 0
            ? `${business.avgRating.toFixed(1)} ★ (${business.reviewCount})`
            : text.noRating}
        </span>
      </span>
    </a>
  );
}
```

The initial-in-a-tile is a deliberate placeholder until the media-upload path
supplies real photos; it gives the card a stable visual anchor and a consistent
height instead of a wall of text links.

- [ ] **Step 4: Style the band and the cards**

Append to `apps/web/app/globals.css`:

```css
/* ---- Colour-field bands: sections are wall panels, not whitespace ---- */
.lp-band {
  padding: clamp(56px, 8vw, 104px) clamp(20px, 5vw, 56px);
}

.lp-band--businesses {
  background: var(--surface-card);
  border-top: 1px solid var(--line);
  border-bottom: 1px solid var(--line);
}

.lp-hero-aperture {
  position: absolute;
  right: clamp(16px, 6vw, 90px);
  bottom: clamp(24px, 8vw, 80px);
  pointer-events: none;
}

@media (max-width: 860px) {
  .lp-hero-aperture {
    display: none;
  }
}

/* ---- Home cards ---- */
.home-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 14px;
}

.home-card {
  display: grid;
  grid-template-columns: 56px 1fr;
  gap: 14px;
  align-items: center;
  padding: 12px;
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
  background: var(--surface-card);
  transition: transform var(--speed-fast) var(--ease-out),
    border-color var(--speed-fast) var(--ease-out),
    box-shadow var(--speed-fast) var(--ease-out);
}

.home-card:hover {
  transform: translateY(-2px);
  border-color: var(--ceramic);
  box-shadow: var(--soft-shadow);
}

.home-card__photo {
  display: grid;
  place-items: center;
  width: 56px;
  height: 56px;
  border-radius: var(--radius-sm);
  background: linear-gradient(150deg, var(--void), var(--ceramic));
  color: #fff;
  font-family: var(--font-display), system-ui, sans-serif;
  font-size: 1.4rem;
  font-variation-settings: "wdth" 112;
}

.home-card__text {
  display: grid;
  gap: 2px;
  min-width: 0;
}

.home-card__name {
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.home-card__meta {
  color: var(--dust);
  font-size: 0.82rem;
}

.home-card__rating {
  color: var(--brass);
  font-size: 0.82rem;
}

@media (prefers-reduced-motion: reduce) {
  .home-card {
    transition: none;
  }

  .home-card:hover {
    transform: none;
  }
}
```

- [ ] **Step 5: Assert businesses reach the homepage**

Append to `tests/e2e/shell-boundary.spec.ts`:

```ts
/**
 * Written to pass against a near-empty database: when the feed has no
 * businesses HomeSections self-hides, so the assertion is that the homepage
 * either shows the section or shows nothing — never a broken empty shelf.
 */
test("the homepage surfaces real businesses when any exist", async ({ page }) => {
  await page.goto("/en");
  const sections = page.locator(".home-sections");

  if ((await sections.count()) > 0) {
    await expect(sections).toBeVisible();
    await expect(page.locator(".home-card, .home-category").first()).toBeVisible();
  }
});
```

- [ ] **Step 6: Run and commit**

```bash
npx playwright test tests/e2e/shell-boundary.spec.ts
npm run typecheck --workspace @manzil/web
git add -A
git commit -m "feat(web): surface real businesses on the homepage above marketing copy"
```

---

### Task 8: Craft the high-traffic consumer interactions

Search, category selection, and business-card hover are the three actions consumers take most. They currently have default affordances.

**Files:**
- Modify: `apps/web/app/globals.css`
- Modify: `apps/web/app/components/business-card.tsx`

**Interfaces:**
- Consumes: tokens from Task 2.
- Produces: nothing downstream.

- [ ] **Step 1: Mark the card's live state with `--signal`**

In `apps/web/app/components/business-card.tsx`, the `live-badge` wrapper currently renders whenever `business.liveStatus` exists. Add the state hook so CSS can reach it:

```tsx
          {business.liveStatus ? (
            <span className="live-badge is-live">
              <LiveStatusPill compact locale={locale} status={business.liveStatus} />
            </span>
          ) : (
            <span className="status-chip">{business.tags[0]}</span>
          )}
```

- [ ] **Step 2: Add the interaction styles**

Append to `apps/web/app/globals.css`:

```css
/* ============================================================
   High-traffic consumer interactions.
   Transform/opacity only — these run on every card in a grid.
   ============================================================ */

/* ---- Search: the field itself signals focus, no layout shift ---- */
.search-controls input[type="search"],
.search-controls input[type="text"] {
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
  padding: 12px 16px;
  background: var(--surface-card);
  transition: border-color var(--speed-fast) var(--ease-out),
    box-shadow var(--speed-fast) var(--ease-out);
}

.search-controls input:focus-visible {
  border-color: var(--ceramic);
  box-shadow: var(--ring);
  outline: none;
}

/* ---- Category chips: the selected one is filled, not merely outlined ---- */
.search-controls a,
.search-controls button {
  border-radius: 999px;
  transition: background var(--speed-fast) var(--ease-out),
    color var(--speed-fast) var(--ease-out),
    border-color var(--speed-fast) var(--ease-out);
}

.search-controls a.active,
.search-controls button.active,
.segmented-control button.active {
  background: var(--ceramic);
  border-color: var(--ceramic);
  color: #fff;
}

/* ---- Business card: one lift, one photo scale, nothing else ---- */
.business-card {
  transition: transform var(--speed-med) var(--ease-out),
    box-shadow var(--speed-med) var(--ease-out);
  will-change: transform;
}

.business-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--hover-shadow);
}

.business-card .business-photo {
  overflow: hidden;
}

.business-card .business-photo.photo-block {
  transition: transform var(--speed-slow) var(--ease-out);
}

.business-card:hover .business-photo.photo-block {
  transform: scale(1.04);
}

.business-card:focus-within {
  box-shadow: var(--ring);
}

/* Rating is value: brass, tabular. */
.business-card .rating-badge {
  color: var(--brass);
  font-variant-numeric: tabular-nums;
}

/* Live is state: signal, and only here. */
.live-badge.is-live::before {
  content: "";
  display: inline-block;
  width: 6px;
  height: 6px;
  margin-right: 6px;
  border-radius: 50%;
  background: var(--signal);
  box-shadow: 0 0 0 3px rgb(77 225 193 / 0.3);
}

@media (prefers-reduced-motion: reduce) {
  .business-card,
  .business-card .business-photo.photo-block {
    transition: none;
  }

  .business-card:hover {
    transform: none;
  }

  .business-card:hover .business-photo.photo-block {
    transform: none;
  }
}
```

- [ ] **Step 3: Check specificity against the existing rules**

`globals.css` already styles `.business-photo.photo-block` and
`.business-card:hover .business-photo.photo-block` around lines 1203–1229. The new
rules are appended after, so they win at equal specificity. Load `/en/discover`
in the dev server and confirm in DevTools that the new `transform: scale(1.04)`
is the winning declaration and the old one is struck through. If an older rule
still wins, delete the older declaration rather than adding `!important`.

- [ ] **Step 4: Verify keyboard and reduced motion**

With the dev server running on `/en/discover`: tab through the cards and confirm a visible focus ring on each. Then in DevTools → Rendering → "Emulate prefers-reduced-motion: reduce" and confirm hover produces no movement.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(web): craft search, category, and card interactions"
```

---

### Task 9: Bring the workspace pages up to the density standard

The dashboard, CRM, and admin screens are functionally complete but were built inside the consumer shell. Now that Task 5 provides the density layer, the pages need to use it.

**Files:**
- Create: `apps/web/app/components/workspace/ws-skeleton.tsx`
- Modify: `apps/web/app/[locale]/(workspace)/dashboard/customers/page.tsx`
- Modify: `apps/web/app/[locale]/(workspace)/dashboard/reviews/page.tsx`
- Modify: `apps/web/app/[locale]/(workspace)/dashboard/analytics/page.tsx`
- Modify: `apps/web/app/[locale]/(workspace)/admin/page.tsx`

**Interfaces:**
- Consumes: `.ws-table`, `.ws-num`, `.ws-live` (Task 5).
- Produces: `<WsSkeleton rows={number} cols={number} />`.

- [ ] **Step 1: Write the skeleton**

Create `apps/web/app/components/workspace/ws-skeleton.tsx`:

```tsx
/**
 * Loading state that matches the final table exactly — same row height, same
 * column count. A spinner of a different shape guarantees a layout shift when
 * the data lands; a matched skeleton means the page never moves.
 */
export function WsSkeleton({ rows = 8, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <table aria-hidden="true" className="ws-table ws-skeleton">
      <tbody>
        {Array.from({ length: rows }, (_, r) => (
          <tr key={r}>
            {Array.from({ length: cols }, (_, c) => (
              <td key={c}>
                <span className="ws-skeleton__bar" />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

- [ ] **Step 2: Style it**

Append to `apps/web/app/globals.css`:

```css
.ws-skeleton__bar {
  display: block;
  height: 10px;
  border-radius: 3px;
  background: linear-gradient(90deg, var(--surface-low), var(--surface-high), var(--surface-low));
  background-size: 200% 100%;
  animation: ws-shimmer 1.2s linear infinite;
}

@keyframes ws-shimmer {
  to {
    background-position: -200% 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .ws-skeleton__bar {
    animation: none;
  }
}
```

- [ ] **Step 3: Convert the customer list to a workspace table**

Open `apps/web/app/[locale]/(workspace)/dashboard/customers/page.tsx`. Wherever the customer list renders as cards or a bare list, convert it to:

```tsx
      <table className="ws-table">
        <thead>
          <tr>
            <th>{copy.customers.name}</th>
            <th>{copy.customers.visits}</th>
            <th>{copy.customers.lastVisit}</th>
            <th>{copy.customers.spend}</th>
          </tr>
        </thead>
        <tbody>
          {customers.map((customer) => (
            <tr key={customer.id}>
              <td>
                <a href={`/${locale}/dashboard/customers/${customer.id}`}>
                  {customer.name ?? customer.phone}
                </a>
              </td>
              <td className="ws-num">{customer.visitCount}</td>
              <td className="ws-num">
                {customer.lastVisitAt
                  ? new Date(customer.lastVisitAt).toLocaleDateString(locale)
                  : "—"}
              </td>
              <td className="ws-num">{customer.totalSpend}</td>
            </tr>
          ))}
        </tbody>
      </table>
```

Use the copy keys that already exist in `apps/web/app/lib/crm-copy.ts`. If a key is missing, add it to all three locales there rather than hardcoding a string.

- [ ] **Step 4: Do the same for reviews and admin**

Apply the same `ws-table` / `ws-num` treatment to the list rendering in
`dashboard/reviews/page.tsx` and `admin/page.tsx`. In `dashboard/analytics/page.tsx`,
add `className="ws-num"` to every rendered figure. Do not restructure the data
fetching — this is a presentation pass only.

- [ ] **Step 5: Strip consumer reveals from workspace pages**

```bash
cd apps/web && grep -rn "Reveal\|RevealStagger" "app/[locale]/(workspace)"
```

Remove every `<Reveal>` / `<RevealStagger>` wrapper found, keeping the children. The CSS in Task 5 neutralises them, but leaving them ships dead client components into the workspace bundle.

- [ ] **Step 6: Verify**

```bash
npm run typecheck --workspace @manzil/web
npm run dev --workspace @manzil/web
```

Open `/en/dashboard/customers`. Confirm: rows are 34px, figures are monospaced and right-comparable down the column, hovering a row tints it instantly, nothing fades in.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat(web): bring dashboard, CRM, and admin to workspace density"
```

---

### Task 10: Waitlist schema and API

Three topics, one system: new-city expansion, Gurman AI early access, and the premium business tier. A `topic` discriminator keeps it one model, one endpoint, and three concrete promises.

**Files:**
- Modify: `packages/db/schema.prisma`
- Create: `apps/api/src/modules/waitlist/waitlist.repository.ts`
- Create: `apps/api/src/modules/waitlist/waitlist.controller.ts`
- Create: `apps/api/src/modules/waitlist/waitlist.spec.ts`
- Modify: `apps/api/src/modules/app.module.ts`

**Interfaces:**
- Consumes: `PrismaService` from `../prisma.service`, `ThrottleSearch` from `../security/throttle.config`.
- Produces: `POST /waitlist` accepting `{ topic, email, locale, city?, businessName? }` and returning `{ data: { ok: true, position: number } }`; `GET /waitlist/count?topic=&city=` returning `{ data: { count: number } }`. Task 11 calls both.

- [ ] **Step 1: Add the model**

Append to `packages/db/schema.prisma`:

```prisma
enum WaitlistTopic {
  city
  gurman
  pro
}

model WaitlistSignup {
  id           String        @id @default(cuid())
  topic        WaitlistTopic
  email        String
  locale       String        @default("uz")
  /// Only set for topic=city. The whole point of the city waitlist is knowing
  /// which city to open next, so a signup without one carries no information.
  city         String?
  /// Only set for topic=pro, and only when the signup came from an owner who
  /// already has a business.
  businessName String?
  /// Which page the signup came from, for attribution.
  source       String?
  createdAt    DateTime      @default(now())

  /// One signup per email per topic. A person re-submitting the Gurman form
  /// should not create a second queue entry and jump their own position.
  @@unique([topic, email])
  @@index([topic, createdAt])
  @@index([topic, city])
}
```

- [ ] **Step 2: Generate and migrate**

```bash
npm run db:generate
npm run db:migrate -- --name waitlist_signup
```

Expected: a new migration directory under `packages/db/prisma/migrations/`, and `WaitlistSignup` available on the Prisma client.

- [ ] **Step 3: Write the failing test**

Create `apps/api/src/modules/waitlist/waitlist.spec.ts`:

```ts
import { BadRequestException } from "@nestjs/common";
import { WaitlistController } from "./waitlist.controller";
import type { WaitlistRepository } from "./waitlist.repository";

function makeRepo(overrides: Partial<WaitlistRepository> = {}) {
  return {
    join: jest.fn().mockResolvedValue({ position: 7 }),
    count: jest.fn().mockResolvedValue(42),
    ...overrides
  } as unknown as WaitlistRepository;
}

describe("WaitlistController", () => {
  it("rejects an unknown topic", async () => {
    const controller = new WaitlistController(makeRepo());

    await expect(
      controller.join({ topic: "spaceship", email: "a@b.com", locale: "en" })
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("rejects a malformed email", async () => {
    const controller = new WaitlistController(makeRepo());

    await expect(
      controller.join({ topic: "gurman", email: "not-an-email", locale: "en" })
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("requires a city for the city topic", async () => {
    const controller = new WaitlistController(makeRepo());

    await expect(
      controller.join({ topic: "city", email: "a@b.com", locale: "en" })
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("accepts a valid city signup and returns its position", async () => {
    const repo = makeRepo();
    const controller = new WaitlistController(repo);

    const result = await controller.join({
      topic: "city",
      email: "A@B.com",
      locale: "en",
      city: "Bukhara"
    });

    expect(result).toEqual({ data: { ok: true, position: 7 } });
    // Stored lowercase so the unique constraint actually deduplicates.
    expect(repo.join).toHaveBeenCalledWith(
      expect.objectContaining({ email: "a@b.com", city: "Bukhara", topic: "city" })
    );
  });

  it("ignores a city sent with a non-city topic", async () => {
    const repo = makeRepo();
    const controller = new WaitlistController(repo);

    await controller.join({ topic: "gurman", email: "a@b.com", locale: "en", city: "Bukhara" });

    expect(repo.join).toHaveBeenCalledWith(expect.objectContaining({ city: null }));
  });

  it("counts signups for a topic", async () => {
    const repo = makeRepo();
    const controller = new WaitlistController(repo);

    expect(await controller.count("city", "Bukhara")).toEqual({ data: { count: 42 } });
    expect(repo.count).toHaveBeenCalledWith("city", "Bukhara");
  });
});
```

- [ ] **Step 4: Run it and watch it fail**

```bash
npm run test --workspace @manzil/api -- waitlist
```

Expected: FAIL — `Cannot find module './waitlist.controller'`.

- [ ] **Step 5: Write the repository**

Create `apps/api/src/modules/waitlist/waitlist.repository.ts`:

```ts
import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma.service";

export type WaitlistTopicName = "city" | "gurman" | "pro";

export type WaitlistJoinInput = {
  topic: WaitlistTopicName;
  email: string;
  locale: string;
  city: string | null;
  businessName: string | null;
  source: string | null;
};

@Injectable()
export class WaitlistRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Idempotent by (topic, email): re-submitting returns the existing entry
   * rather than creating a second one, so a double-click cannot push someone
   * behind themselves.
   */
  async join(input: WaitlistJoinInput): Promise<{ position: number }> {
    const signup = await this.prisma.waitlistSignup.upsert({
      where: { topic_email: { topic: input.topic, email: input.email } },
      update: {
        locale: input.locale,
        city: input.city,
        businessName: input.businessName
      },
      create: {
        topic: input.topic,
        email: input.email,
        locale: input.locale,
        city: input.city,
        businessName: input.businessName,
        source: input.source
      }
    });

    const position = await this.prisma.waitlistSignup.count({
      where: {
        topic: input.topic,
        ...(input.city ? { city: input.city } : {}),
        createdAt: { lte: signup.createdAt }
      }
    });

    return { position };
  }

  async count(topic: WaitlistTopicName, city?: string): Promise<number> {
    return this.prisma.waitlistSignup.count({
      where: { topic, ...(city ? { city } : {}) }
    });
  }
}
```

- [ ] **Step 6: Write the controller**

Create `apps/api/src/modules/waitlist/waitlist.controller.ts`:

```ts
import { BadRequestException, Body, Controller, Get, Post, Query } from "@nestjs/common";
import { ThrottleSearch } from "../security/throttle.config";
import { WaitlistRepository, type WaitlistTopicName } from "./waitlist.repository";

const TOPICS: WaitlistTopicName[] = ["city", "gurman", "pro"];
const LOCALES = ["uz", "ru", "en"];
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export type JoinBody = {
  topic?: string;
  email?: string;
  locale?: string;
  city?: string;
  businessName?: string;
  source?: string;
};

function isTopic(value: unknown): value is WaitlistTopicName {
  return typeof value === "string" && TOPICS.includes(value as WaitlistTopicName);
}

@Controller("waitlist")
export class WaitlistController {
  constructor(private readonly waitlist: WaitlistRepository) {}

  /** Public capture for the three waitlist topics. Unauthenticated by design. */
  @Post()
  @ThrottleSearch()
  async join(@Body() body: JoinBody) {
    if (!isTopic(body.topic)) {
      throw new BadRequestException("Unknown waitlist topic");
    }

    const email = (body.email ?? "").trim().toLowerCase();

    if (!EMAIL.test(email)) {
      throw new BadRequestException("Enter a valid email address");
    }

    // A city signup with no city cannot answer the question the city waitlist
    // exists to answer, so it is rejected rather than stored as noise.
    const city = body.topic === "city" ? (body.city ?? "").trim() : "";

    if (body.topic === "city" && city.length === 0) {
      throw new BadRequestException("Choose a city");
    }

    const { position } = await this.waitlist.join({
      topic: body.topic,
      email,
      locale: LOCALES.includes(body.locale ?? "") ? (body.locale as string) : "uz",
      city: city.length > 0 ? city : null,
      businessName: body.topic === "pro" ? (body.businessName ?? "").trim() || null : null,
      source: body.source ?? null
    });

    return { data: { ok: true, position } };
  }

  /** Public signup count, used to show real demand on the waitlist page. */
  @Get("count")
  @ThrottleSearch()
  async count(@Query("topic") topic?: string, @Query("city") city?: string) {
    if (!isTopic(topic)) {
      throw new BadRequestException("Unknown waitlist topic");
    }

    return { data: { count: await this.waitlist.count(topic, city?.trim() || undefined) } };
  }
}
```

- [ ] **Step 7: Run the tests**

```bash
npm run test --workspace @manzil/api -- waitlist
```

Expected: 6 passed.

- [ ] **Step 8: Register it flat in `AppModule`**

In `apps/api/src/modules/app.module.ts` add the import beside the other module imports:

```ts
import { WaitlistController } from "./waitlist/waitlist.controller";
import { WaitlistRepository } from "./waitlist/waitlist.repository";
```

Add `WaitlistController` to the end of the `controllers` array and `WaitlistRepository` to the end of the `providers` array. Do **not** create a Nest module — this codebase registers controllers and repositories flat.

- [ ] **Step 9: Verify the API boots and typechecks**

```bash
npm run typecheck --workspace @manzil/api
npm run start:dev --workspace @manzil/api
```

Then in a second shell:

```bash
curl -s -X POST localhost:3001/waitlist -H 'content-type: application/json' \
  -d '{"topic":"city","email":"test@example.com","locale":"en","city":"Bukhara"}'
```

Expected: `{"data":{"ok":true,"position":1}}`. Repeat the same call and confirm the position does not change.

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "feat(api): waitlist capture for city, gurman, and pro topics"
```

---

### Task 11: Waitlist pages

One route, three concrete promises. Generic "join our waitlist" copy would make the page feel as templated as generic visuals do.

**Files:**
- Create: `apps/web/app/lib/waitlist-copy.ts`
- Create: `apps/web/app/components/waitlist/waitlist-form.tsx`
- Create: `apps/web/app/[locale]/(site)/waitlist/[topic]/page.tsx`
- Modify: `apps/web/app/globals.css`

**Interfaces:**
- Consumes: `POST /waitlist` and `GET /waitlist/count` (Task 10); `API_BASE_URL` from `app/lib/api-base-url.ts`; `<Aperture />` (Task 6).
- Produces: `getWaitlistCopy(topic, locale)`; routes `/{locale}/waitlist/city|gurman|pro`.

- [ ] **Step 1: Write the copy module**

Create `apps/web/app/lib/waitlist-copy.ts`:

```ts
import type { Locale } from "@manzil/shared";

export const WAITLIST_TOPICS = ["city", "gurman", "pro"] as const;
export type WaitlistTopic = (typeof WAITLIST_TOPICS)[number];

export function isWaitlistTopic(value: string): value is WaitlistTopic {
  return (WAITLIST_TOPICS as readonly string[]).includes(value);
}

export type WaitlistCopy = {
  title: string;
  lead: string;
  emailLabel: string;
  cityLabel?: string;
  businessLabel?: string;
  submit: string;
  successTitle: string;
  successBody: (position: number) => string;
  countLabel: (count: number) => string;
  errorGeneric: string;
};

const CITY_OPTIONS = ["Samarqand", "Buxoro", "Namangan", "Andijon", "Farg'ona", "Nukus", "Qarshi"];

export const WAITLIST_CITIES = CITY_OPTIONS;

/**
 * Each topic states one specific thing Manzil will do and when. Vague copy makes
 * a page feel templated in exactly the way vague visuals do, so none of these
 * say "join our waitlist".
 */
const COPY: Record<WaitlistTopic, Record<string, WaitlistCopy>> = {
  city: {
    uz: {
      title: "Manzil hozircha faqat Toshkentda",
      lead: "Keyingi shahar — eng ko'p so'ralgani. Shahringizni tanlang, ochilganda birinchi bo'lib xabar beramiz.",
      emailLabel: "Email",
      cityLabel: "Shahar",
      submit: "Shahrimni so'rash",
      successTitle: "Ovozingiz hisobga olindi",
      successBody: (position) => `Siz bu shahar bo'yicha ${position}-o'rindasiz.`,
      countLabel: (count) => `${count} kishi so'radi`,
      errorGeneric: "Yuborib bo'lmadi. Qaytadan urinib ko'ring."
    },
    ru: {
      title: "Manzil пока работает только в Ташкенте",
      lead: "Следующий город — тот, который просят чаще всего. Выберите свой, и мы напишем первым, когда откроемся.",
      emailLabel: "Email",
      cityLabel: "Город",
      submit: "Запросить мой город",
      successTitle: "Голос засчитан",
      successBody: (position) => `Вы ${position}-й по этому городу.`,
      countLabel: (count) => `${count} человек уже попросили`,
      errorGeneric: "Не удалось отправить. Попробуйте ещё раз."
    },
    en: {
      title: "Manzil is only in Tashkent so far",
      lead: "The next city is the one people ask for most. Pick yours and we'll write to you first when it opens.",
      emailLabel: "Email",
      cityLabel: "City",
      submit: "Request my city",
      successTitle: "Your vote is counted",
      successBody: (position) => `You're number ${position} for this city.`,
      countLabel: (count) => `${count} people have asked`,
      errorGeneric: "That didn't send. Try again."
    }
  },
  gurman: {
    uz: {
      title: "Gurman avval kichik guruhga javob beradi",
      lead: "Gurman AI haqiqiy sharhlar asosida joy tavsiya qiladi. Sifatni ushlab turish uchun navbat bilan ochamiz.",
      emailLabel: "Email",
      submit: "Navbatga qo'shilish",
      successTitle: "Navbatdasiz",
      successBody: (position) => `Navbatda ${position}-o'rindasiz.`,
      countLabel: (count) => `Navbatda ${count} kishi`,
      errorGeneric: "Yuborib bo'lmadi. Qaytadan urinib ko'ring."
    },
    ru: {
      title: "Сначала Gurman отвечает небольшой группе",
      lead: "Gurman AI подбирает места по реальным отзывам. Мы открываем доступ очередями, чтобы держать качество.",
      emailLabel: "Email",
      submit: "Встать в очередь",
      successTitle: "Вы в очереди",
      successBody: (position) => `Вы ${position}-й в очереди.`,
      countLabel: (count) => `${count} человек в очереди`,
      errorGeneric: "Не удалось отправить. Попробуйте ещё раз."
    },
    en: {
      title: "Gurman answers a small group first",
      lead: "Gurman AI recommends places from real reviews. We open access in batches to keep the answers good.",
      emailLabel: "Email",
      submit: "Join the queue",
      successTitle: "You're in the queue",
      successBody: (position) => `You're number ${position} in line.`,
      countLabel: (count) => `${count} people waiting`,
      errorGeneric: "That didn't send. Try again."
    }
  },
  pro: {
    uz: {
      title: "Manzil Pro birinchi guruh uchun ochiladi",
      lead: "Kengaytirilgan CRM, kampaniyalar va tahlil. Birinchi guruhga kirgan bizneslar narxni bir yilga qulflaydi.",
      emailLabel: "Email",
      businessLabel: "Biznes nomi",
      submit: "Birinchi guruhga yozilish",
      successTitle: "Ro'yxatdasiz",
      successBody: (position) => `Siz ${position}-o'rindasiz.`,
      countLabel: (count) => `${count} biznes yozildi`,
      errorGeneric: "Yuborib bo'lmadi. Qaytadan urinib ko'ring."
    },
    ru: {
      title: "Manzil Pro откроется для первой группы",
      lead: "Расширенный CRM, кампании и аналитика. Бизнесы из первой группы фиксируют цену на год.",
      emailLabel: "Email",
      businessLabel: "Название бизнеса",
      submit: "Записаться в первую группу",
      successTitle: "Вы в списке",
      successBody: (position) => `Вы ${position}-й в списке.`,
      countLabel: (count) => `${count} бизнесов записались`,
      errorGeneric: "Не удалось отправить. Попробуйте ещё раз."
    },
    en: {
      title: "Manzil Pro opens to a first cohort",
      lead: "Deeper CRM, campaigns, and analytics. Businesses in the first cohort lock their price for a year.",
      emailLabel: "Email",
      businessLabel: "Business name",
      submit: "Join the first cohort",
      successTitle: "You're on the list",
      successBody: (position) => `You're number ${position} on the list.`,
      countLabel: (count) => `${count} businesses signed up`,
      errorGeneric: "That didn't send. Try again."
    }
  }
};

export function getWaitlistCopy(topic: WaitlistTopic, locale: Locale): WaitlistCopy {
  const byLocale = COPY[topic];
  return byLocale[locale] ?? byLocale.uz;
}
```

- [ ] **Step 2: Write the form**

Create `apps/web/app/components/waitlist/waitlist-form.tsx`:

```tsx
"use client";

import type { Locale } from "@manzil/shared";
import { useState } from "react";
import { API_BASE_URL } from "../../lib/api-base-url";
import { WAITLIST_CITIES, getWaitlistCopy, type WaitlistTopic } from "../../lib/waitlist-copy";

export function WaitlistForm({
  topic,
  locale
}: {
  topic: WaitlistTopic;
  locale: Locale;
}) {
  const copy = getWaitlistCopy(topic, locale);
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const [position, setPosition] = useState(0);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // Read the form before any await: the event target is detached afterwards.
    const form = new FormData(event.currentTarget);
    setState("sending");
    setError("");

    try {
      const response = await fetch(`${API_BASE_URL}/waitlist`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          topic,
          locale,
          email: form.get("email"),
          city: form.get("city"),
          businessName: form.get("businessName"),
          source: `web:${topic}`
        })
      });

      const payload = await response.json();

      if (!response.ok) {
        setError(payload?.message ?? copy.errorGeneric);
        setState("idle");
        return;
      }

      setPosition(payload.data.position);
      setState("done");
    } catch {
      setError(copy.errorGeneric);
      setState("idle");
    }
  }

  if (state === "done") {
    return (
      <div className="wl-done" role="status">
        <h2>{copy.successTitle}</h2>
        <p>{copy.successBody(position)}</p>
      </div>
    );
  }

  return (
    <form className="wl-form" onSubmit={submit}>
      {topic === "city" ? (
        <label className="wl-field">
          <span>{copy.cityLabel}</span>
          <select name="city" required>
            {WAITLIST_CITIES.map((city) => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>
        </label>
      ) : null}

      {topic === "pro" ? (
        <label className="wl-field">
          <span>{copy.businessLabel}</span>
          <input name="businessName" type="text" />
        </label>
      ) : null}

      <label className="wl-field">
        <span>{copy.emailLabel}</span>
        <input autoComplete="email" name="email" required type="email" />
      </label>

      {error ? <p className="wl-error">{error}</p> : null}

      <button className="wl-submit" disabled={state === "sending"} type="submit">
        {copy.submit}
      </button>
    </form>
  );
}
```

- [ ] **Step 3: Write the page**

Create `apps/web/app/[locale]/(site)/waitlist/[topic]/page.tsx`:

```tsx
import type { Locale } from "@manzil/shared";
import { notFound } from "next/navigation";
import { Aperture } from "../../../../components/motion/aperture";
import { WaitlistForm } from "../../../../components/waitlist/waitlist-form";
import { API_BASE_URL } from "../../../../lib/api-base-url";
import { getWaitlistCopy, isWaitlistTopic, WAITLIST_TOPICS } from "../../../../lib/waitlist-copy";

export function generateStaticParams() {
  return WAITLIST_TOPICS.map((topic) => ({ topic }));
}

/** Real demand, not a fabricated counter. Renders nothing if the call fails. */
async function getCount(topic: string): Promise<number | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/waitlist/count?topic=${topic}`, {
      next: { revalidate: 300 }
    });

    if (!response.ok) {
      return null;
    }

    return (await response.json()).data.count as number;
  } catch {
    return null;
  }
}

export default async function WaitlistPage({
  params
}: {
  params: Promise<{ locale: Locale; topic: string }>;
}) {
  const { locale, topic } = await params;

  if (!isWaitlistTopic(topic)) {
    notFound();
  }

  const copy = getWaitlistCopy(topic, locale);
  const count = await getCount(topic);

  return (
    <section className="wl-page">
      <div className="wl-copy">
        <h1>{copy.title}</h1>
        <p className="wl-lead">{copy.lead}</p>
        {count !== null && count > 0 ? (
          <p className="wl-count">{copy.countLabel(count)}</p>
        ) : null}
        <WaitlistForm locale={locale} topic={topic} />
      </div>
      <div className="wl-aperture">
        <Aperture live={count !== null && count > 0} />
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Style it**

Append to `apps/web/app/globals.css`:

```css
/* ---- Waitlist ---- */
.wl-page {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: clamp(24px, 6vw, 72px);
  align-items: center;
  max-width: 1000px;
  margin: 0 auto;
  padding: clamp(48px, 9vw, 112px) clamp(20px, 5vw, 40px);
}

.wl-copy h1 {
  font-size: clamp(1.9rem, 4.4vw, 3rem);
  margin: 0 0 14px;
}

.wl-lead {
  max-width: 46ch;
  color: var(--dust);
  font-size: 1.05rem;
}

.wl-count {
  display: inline-block;
  margin: 18px 0 0;
  color: var(--ceramic);
  font-family: var(--font-data), ui-monospace, monospace;
  font-size: 0.82rem;
  letter-spacing: 0.04em;
}

.wl-form {
  display: grid;
  gap: 14px;
  max-width: 420px;
  margin-top: 26px;
}

.wl-field {
  display: grid;
  gap: 6px;
}

.wl-field > span {
  color: var(--dust);
  font-size: 0.8rem;
  font-weight: 500;
}

.wl-field input,
.wl-field select {
  padding: 12px 14px;
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
  background: var(--surface-card);
  transition: border-color var(--speed-fast) var(--ease-out);
}

.wl-field input:focus-visible,
.wl-field select:focus-visible {
  border-color: var(--ceramic);
  box-shadow: var(--ring);
  outline: none;
}

.wl-submit {
  padding: 13px 22px;
  border: none;
  border-radius: var(--radius-md);
  background: var(--ceramic);
  color: #fff;
  font-weight: 600;
  cursor: pointer;
  transition: background var(--speed-fast) var(--ease-out);
}

.wl-submit:hover:not(:disabled) {
  background: var(--primary-bright);
}

.wl-submit:disabled {
  opacity: 0.6;
  cursor: default;
}

.wl-error {
  margin: 0;
  color: var(--error);
  font-size: 0.86rem;
}

.wl-done h2 {
  margin: 0 0 8px;
}

.wl-done p {
  color: var(--dust);
}

@media (max-width: 860px) {
  .wl-page {
    grid-template-columns: 1fr;
  }

  .wl-aperture {
    display: none;
  }
}
```

- [ ] **Step 5: Verify all three render**

```bash
npm run typecheck --workspace @manzil/web
npm run dev --workspace @manzil/web
```

Visit `/en/waitlist/city`, `/en/waitlist/gurman`, `/en/waitlist/pro`, and `/en/waitlist/nonsense`. Expected: the first three render with topic-specific copy and the right fields (city → select, pro → business name, gurman → email only); the fourth is a 404.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(web): waitlist pages for city, gurman, and pro"
```

---

### Task 12: Waitlist entry points and end-to-end coverage

A waitlist nothing links to collects nothing.

**Files:**
- Modify: `apps/web/app/components/footer.tsx`
- Modify: `apps/web/app/components/home-sections.tsx`
- Modify: `apps/web/app/[locale]/(site)/business/pricing/page.tsx`
- Create: `tests/e2e/waitlist.spec.ts`

**Interfaces:**
- Consumes: the routes from Task 11.
- Produces: nothing downstream.

- [ ] **Step 1: Link the city waitlist from the footer**

In `apps/web/app/components/footer.tsx`, add a link beside the existing `dashboard` entry:

```tsx
          <a href={`/${locale}/waitlist/city`}>{copy.footer.otherCities}</a>
```

Add `otherCities` to the `footer` object for all three locales in `apps/web/app/lib/business-copy.ts`:

- `uz`: `otherCities: "Boshqa shaharlar"`
- `ru`: `otherCities: "Другие города"`
- `en`: `otherCities: "Other cities"`

- [ ] **Step 2: Link the Gurman waitlist from the discover hero**

`GurmanHero` on `/discover` links to `/concierge`. Leave that CTA alone and add a secondary link under it in `apps/web/app/components/gurman-hero.tsx`:

```tsx
      <a className="gurman-hero__secondary" href={`/${locale}/waitlist/gurman`}>
        {copy.waitlistCta}
      </a>
```

Add `waitlistCta` to `GurmanHeroCopy` in `apps/web/app/[locale]/(site)/discover/page.tsx` and to `GurmanHeroCopy` in `gurman-hero.tsx`, with:

- `uz`: `waitlistCta: "Erta kirish uchun navbat"`
- `ru`: `waitlistCta: "В очередь на ранний доступ"`
- `en`: `waitlistCta: "Join the early-access queue"`

The hero also needs `locale` in scope; it already receives `copy` with a
`ctaHref` built from the locale, so pass `locale` as a second prop and thread it
through the component signature.

- [ ] **Step 3: Link the Pro waitlist from pricing**

In `apps/web/app/[locale]/(site)/business/pricing/page.tsx`, add below the plan grid:

```tsx
      <p className="bz-pricing-waitlist">
        <a href={`/${locale}/waitlist/pro`}>Manzil Pro →</a>
      </p>
```

- [ ] **Step 4: Write the e2e spec**

Create `tests/e2e/waitlist.spec.ts`:

```ts
import { expect, test } from "@playwright/test";

/**
 * Uses a unique address per run so the (topic, email) unique constraint does
 * not make a second run assert against a stale position.
 */
function uniqueEmail() {
  return `wl-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.com`;
}

test.describe("waitlist", () => {
  test("city signup asks for a city and confirms a position", async ({ page }) => {
    await page.goto("/en/waitlist/city");

    await expect(page.getByRole("heading", { level: 1 })).toContainText("Tashkent");
    await page.selectOption('select[name="city"]', "Buxoro");
    await page.fill('input[name="email"]', uniqueEmail());
    await page.click(".wl-submit");

    await expect(page.locator(".wl-done")).toBeVisible();
    await expect(page.locator(".wl-done")).toContainText("number");
  });

  test("gurman signup takes only an email", async ({ page }) => {
    await page.goto("/en/waitlist/gurman");

    await expect(page.locator('select[name="city"]')).toHaveCount(0);
    await page.fill('input[name="email"]', uniqueEmail());
    await page.click(".wl-submit");

    await expect(page.locator(".wl-done")).toBeVisible();
  });

  test("pro signup offers a business name field", async ({ page }) => {
    await page.goto("/en/waitlist/pro");

    await expect(page.locator('input[name="businessName"]')).toBeVisible();
  });

  test("an unknown topic 404s", async ({ page }) => {
    const response = await page.goto("/en/waitlist/spaceship");
    expect(response?.status()).toBe(404);
  });

  test("a bad email is rejected without leaving the page", async ({ page }) => {
    await page.goto("/en/waitlist/gurman");
    await page.fill('input[name="email"]', "nope");
    await page.click(".wl-submit");

    await expect(page.locator(".wl-done")).toHaveCount(0);
  });
});
```

- [ ] **Step 5: Run it**

```bash
npx playwright test tests/e2e/waitlist.spec.ts
```

Expected: 5 passed. This needs the API running — start it with `npm run dev:api` first if the suite is not already configured to boot it.

- [ ] **Step 6: Full verification**

```bash
npm run typecheck
npm run lint
npm run test --workspace @manzil/api
npx playwright test
```

Expected: all clean. Fix anything that is not before committing.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat(web): waitlist entry points and end-to-end coverage"
```

---

## Self-Review

**Spec coverage**

| Requirement | Task |
|---|---|
| §0 Tailwind resolved explicitly, documented | 1 |
| §1 Research pass, design plan, self-critique | Design Direction section + 2 |
| §2 Two shells, one token layer, structural not banner | 3, 4, 5 |
| §3 Consumer elevation, motion, business prominence, micro-interactions | 6, 7, 8 |
| §4 Business shell functional-first, Stripe/Linear density | 5, 9 |
| §5 Waitlist with a concrete purpose | 10, 11, 12 |
| `docs/architecture.md` updated | 1 |
| Design system documented rather than left undocumented | 2 |

**Deviations from the original brief, and why**

1. **`DESIGN.md` is deleted, not extended.** The brief said to read and extend it; the follow-up instruction was not to use it. Task 2 replaces it with `docs/design-system.md` so two contradictory design documents do not half-exist — the same failure mode the brief flags for Tailwind.
2. **No prior landing-page plan exists.** The brief refers to `docs/superpowers/plans/...landing-page...`; `docs/superpowers/plans/` contains only the CRM M0 and Gurman plans. The "Just Joined / category grid / featured" sections referenced there are already **built** (`home-sections.tsx`, `GET /home`) but rendered only on `/discover`. Task 7 moves them onto the homepage rather than building them again.
3. **`docs/architecture.md` did not exist.** Task 1 creates it.
4. **The waitlist covers all three purposes**, per the answered question, via one `topic` discriminator rather than three separate features.
5. **Teal is retained as the brand anchor** even though the design system is new — the shipped logo and app icon are teal. Changing it is a brand decision outside this plan's scope.

**Type consistency check**

- `WaitlistTopicName` (API, `waitlist.repository.ts`) and `WaitlistTopic` (web, `waitlist-copy.ts`) are separate declarations with identical members `"city" | "gurman" | "pro"`, matching the `WaitlistTopic` Prisma enum. Intentional — the web app does not import from the API.
- `WaitlistRepository.join` takes `WaitlistJoinInput` and returns `{ position: number }` in Task 10; the controller and its test both use that shape.
- `Aperture` is declared in Task 6 as `{ live?: boolean; label?: string }` and called that way in Tasks 7 and 11.
- `WsSkeleton` is declared in Task 9 as `{ rows?: number; cols?: number }`.
- `WorkspaceSwitch` is declared in Task 4 as `{ locale: Locale }` and consumed in `header.tsx` in the same task.
- CSS tokens defined in Task 2 (`--void --panel --ceramic --signal --brass --dust --ws-speed --ws-row --ws-line`) are the only custom properties referenced in Tasks 4–11.
