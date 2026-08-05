# Anor Web Redesign Implementation Plan

> **⛔ SUPERSEDED 2026-08-05** by [`2026-08-05-vibrant-marketplace-adoption.md`](2026-08-05-vibrant-marketplace-adoption.md) (user decision: Stitch "Vibrant Marketplace" design replaces the Anor identity, the sirly.uz home, and the Groupon discover). Do NOT implement tasks from this file. The Bootstrap/Sass foundation, brand-surface sync, and chrome component structure from Tasks 1/2/4 survive and are re-skinned by the new plan; everything visual here is dead.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the public `(site)` surfaces of `apps/web` on a deeply re-themed Bootstrap 5 foundation in the new "Anor" visual identity, replacing the bespoke Kosmonavtlar CSS page by page.

**Architecture:** Bootstrap 5.3 is compiled from source via Sass so every component inherits Anor tokens at the variable level rather than being overridden after the fact. A new `app/styles/` layer (`_tokens.scss` → `_bootstrap.scss` → `anor.scss`) is imported from the root layout *alongside* the existing `app/globals.css`, which stays in place and is trimmed — never deleted — because the out-of-scope workspace shell resolves classes from it. Pages convert one at a time; each conversion updates its Playwright spec in the same commit.

**Tech Stack:** Next.js App Router (webpack, not Turbopack), React, TypeScript, Bootstrap 5.3 + Sass, `next/font/google` (Unbounded, Golos Text, IBM Plex Mono), framer-motion 11, Playwright.

**Spec:** `docs/superpowers/specs/2026-08-04-anor-web-redesign-design.md` (commits `47f7391`, `5ea0981`).

## Global Constraints

- **Scope:** `(site)` route group only. `(workspace)` dashboard and admin are NOT redesigned, but DO receive the global font swap and Bootstrap reboot (spec §6a) — this is accepted, and verified in Task 13.
- **`app/globals.css` is never deleted.** End state is a trimmed workspace-only stylesheet. Rule *deletion* is the only safe operation; never move or restyle rules in place.
- **Never restyle these shared families** — used by both in-scope funnel and out-of-scope dashboard: `crm-panel`, `crm-form`, `crm-form-grid`, `crm-form-actions`, `crm-auth-panel`, `crm-hint`, `bz-btn-primary`, `bz-btn-ghost`, `empty-state`, `photo-manager__*`, `photo-upload__*`.
- **Palette (exact hex):** Ground `#F8F7F5`, Card `#FFFFFF`, Ink `#231F1A`, Anor `#A8352A`, Leaf `#1F5B43`, Saffron `#E0A63A`, Clay `#6E624F`. Saffron is never text on a light ground.
- **Fonts:** Unbounded (display, weights 500/600), Golos Text (body/UI), IBM Plex Mono (data). Subsets `latin`, `latin-ext`, `cyrillic`, `cyrillic-ext`. CSS variable names stay `--font-display` / `--font-body` / `--font-data` so legacy `globals.css` keeps resolving during coexistence.
- **Locales:** `uz` (default), `ru`, `en`. Every copy key exists in all three. `params` is a Promise: `params: Promise<{ locale: Locale }>` then `const { locale } = await params;`.
- **Copy passed to client components must be plain serializable strings** — `{n}`-style placeholders, never functions (documented at `app/lib/landing-copy.ts:7-12`).
- **Genericness ban-list:** no tracked all-caps eyebrows, no gradient-clip headline text, no glassmorphism, no identical icon-heading-text card grids, no hero big-number metric band. App-download appears exactly once, on home.
- **Motion:** every section renders fully without JS; motion is layered on top. Full `prefers-reduced-motion` alternative.
- **Verification requires data:** run with `NEXT_PUBLIC_USE_MOCK=true` or a seeded API. With it unset, `getHomeFeed` returns `sections: null` (`app/lib/api.ts:206-211`) and home/discover render empty.
- **Commands:** `npm run typecheck --workspace @manzil/web` · `npm run lint --workspace @manzil/web` · `npm run test:e2e` (repo root; auto-builds a production server unless `BASE_URL` is set; `SKIP_AUTH_SETUP=1` skips Clerk-gated specs).
- **Every task ends with typecheck + lint green and a commit.**

## File Structure

**Created:**
- `apps/web/app/styles/_tokens.scss` — all Bootstrap variable overrides + Anor custom properties. No rules, only variables.
- `apps/web/app/styles/_bootstrap.scss` — curated Bootstrap module imports.
- `apps/web/app/styles/anor.scss` — entry point; imports the two above, then the small custom layer (anor rule, arch mask, no-photo tile, chips, sticky action bar, no-JS reveal gate).

**Modified:**
- `apps/web/package.json` — add `bootstrap`, `sass`.
- `apps/web/app/layout.tsx` — font declarations, `anor.scss` import, viewport `themeColor`.
- `apps/web/app/[locale]/layout.tsx` — `<html lang>` correction.
- `apps/web/app/manifest.ts` — `theme_color`.
- `apps/web/app/offline/page.tsx` — inline colours only.
- `apps/web/public/sw.js` — `VERSION` bump.
- `(site)` pages and their components, one task each.
- `tests/e2e/*.spec.ts` — updated alongside the page each asserts on.
- `apps/web/app/globals.css` — trimmed at the end.

---

### Task 1: Sass + Bootstrap foundation and Anor tokens

**Files:**
- Modify: `apps/web/package.json`
- Create: `apps/web/app/styles/_tokens.scss`
- Create: `apps/web/app/styles/_bootstrap.scss`
- Create: `apps/web/app/styles/anor.scss`
- Modify: `apps/web/app/layout.tsx`
- Create: `apps/web/app/[locale]/(site)/_probe/page.tsx` (temporary, deleted in Step 9)

**Interfaces:**
- Produces: CSS custom properties `--anor-ground`, `--anor-card`, `--anor-ink`, `--anor-red`, `--anor-leaf`, `--anor-saffron`, `--anor-clay` on `:root`; Bootstrap utility + component classes themed to Anor; font variables `--font-display`, `--font-body`, `--font-data` (names unchanged from today).
- Consumes: nothing.

- [ ] **Step 1: Install dependencies**

```bash
npm install --workspace @manzil/web bootstrap@^5.3.3 sass@^1.77.0
```

- [ ] **Step 2: Verify the contrast gate before writing tokens**

Run this and confirm every ratio is ≥ 4.5. If any fails, darken that token and record the new hex in the spec before continuing.

```bash
node -e '
const L=h=>{const c=[1,3,5].map(i=>parseInt(h.slice(i,i+2),16)/255).map(v=>v<=0.03928?v/12.92:((v+0.055)/1.055)**2.4);return 0.2126*c[0]+0.7152*c[1]+0.0722*c[2]};
const R=(a,b)=>{const[x,y]=[L(a),L(b)].sort((m,n)=>n-m);return((x+0.05)/(y+0.05)).toFixed(2)};
for (const [n,fg] of [["ink","#231F1A"],["anor","#A8352A"],["leaf","#1F5B43"],["clay","#6E624F"]])
  console.log(n, "on ground", R(fg,"#F8F7F5"), "| on card", R(fg,"#FFFFFF"));
'
```

Expected: every value ≥ 4.5.

- [ ] **Step 3: Write `apps/web/app/styles/_tokens.scss`**

```scss
// Anor design tokens. Bootstrap variable overrides ONLY — no rules in this file.
// Every value here is load-bearing brand; see docs/superpowers/specs/2026-08-04-anor-web-redesign-design.md

$anor-ground:  #f8f7f5;
$anor-card:    #ffffff;
$anor-ink:     #231f1a;
$anor-red:     #a8352a;
$anor-leaf:    #1f5b43;
$anor-saffron: #e0a63a;
$anor-clay:    #6e624f;

// --- Bootstrap theme map ---
$primary:   $anor-red;
$secondary: $anor-leaf;
$success:   $anor-leaf;
$warning:   $anor-saffron;
$danger:    $anor-red;
$dark:      $anor-ink;
$light:     $anor-ground;

$body-bg:               $anor-ground;
$body-color:            $anor-ink;
$body-secondary-color:  $anor-clay;

// Type. Variable names match the existing ones so globals.css keeps resolving
// during page-by-page coexistence.
$font-family-sans-serif: var(--font-body), system-ui, sans-serif;
$font-family-monospace:  var(--font-data), ui-monospace, monospace;
$headings-font-family:   var(--font-display), system-ui, sans-serif;
$headings-font-weight:   600;
$headings-line-height:   1.1;
$body-line-height:       1.55;

// Shape: squarer than Bootstrap's default; Anor is architectural, not bubbly.
$border-radius-sm: .25rem;
$border-radius:    .375rem;
$border-radius-lg: .5rem;
$border-radius-xl: .75rem;

$border-color: rgba($anor-ink, .12);

// Elevation: warm-tinted, never neutral grey.
$box-shadow-sm: 0 1px 2px rgba($anor-ink, .06);
$box-shadow:    0 .5rem 1.5rem rgba($anor-ink, .08);
$box-shadow-lg: 0 1.5rem 3rem rgba($anor-ink, .12);

$link-color:            $anor-red;
$link-hover-color:      shade-color($anor-red, 20%);
$focus-ring-color:      rgba($anor-red, .35);
$focus-ring-width:      .25rem;

$enable-negative-margins: true;
```

- [ ] **Step 4: Write `apps/web/app/styles/_bootstrap.scss`**

Curated imports only — unused modules are never pulled in.

```scss
@import "bootstrap/scss/functions";
@import "tokens";
@import "bootstrap/scss/variables";
@import "bootstrap/scss/variables-dark";
@import "bootstrap/scss/maps";
@import "bootstrap/scss/mixins";
@import "bootstrap/scss/utilities";

@import "bootstrap/scss/root";
@import "bootstrap/scss/reboot";
@import "bootstrap/scss/type";
@import "bootstrap/scss/images";
@import "bootstrap/scss/containers";
@import "bootstrap/scss/grid";
@import "bootstrap/scss/tables";
@import "bootstrap/scss/forms";
@import "bootstrap/scss/buttons";
@import "bootstrap/scss/transitions";
@import "bootstrap/scss/nav";
@import "bootstrap/scss/navbar";
@import "bootstrap/scss/card";
@import "bootstrap/scss/accordion";
@import "bootstrap/scss/badge";
@import "bootstrap/scss/alert";
@import "bootstrap/scss/close";
@import "bootstrap/scss/modal";
@import "bootstrap/scss/offcanvas";
@import "bootstrap/scss/carousel";
@import "bootstrap/scss/placeholders";

@import "bootstrap/scss/helpers";
@import "bootstrap/scss/utilities/api";
```

- [ ] **Step 5: Write `apps/web/app/styles/anor.scss`**

```scss
@import "bootstrap";

// Anor custom properties, readable from TSX inline styles and legacy rules.
:root {
  --anor-ground:  #{$anor-ground};
  --anor-card:    #{$anor-card};
  --anor-ink:     #{$anor-ink};
  --anor-red:     #{$anor-red};
  --anor-leaf:    #{$anor-leaf};
  --anor-saffron: #{$anor-saffron};
  --anor-clay:    #{$anor-clay};
}

// Numerals are data, not prose.
.anor-num {
  font-family: var(--font-data), ui-monospace, monospace;
  font-variant-numeric: tabular-nums;
}

// Signature: the anor rule — a thin red line with a diamond node. The one
// section-divider device in the system.
.anor-rule {
  display: flex;
  align-items: center;
  gap: .75rem;
  color: $anor-red;

  &::before,
  &::after {
    content: "";
    flex: 1;
    height: 1px;
    background: currentcolor;
    opacity: .4;
  }

  &__node {
    width: .5rem;
    height: .5rem;
    background: currentcolor;
    transform: rotate(45deg);
  }
}

// Signature: arch-cropped photography. The Samarkand arch survives as a photo
// mask, never as a sticker.
.anor-arch {
  border-radius: 50% 50% #{$border-radius} #{$border-radius} / 32% 32% #{$border-radius} #{$border-radius};
  overflow: hidden;

  img { width: 100%; height: 100%; object-fit: cover; }
}

// Dignified at low content: a business with no photo gets a leaf tile with its
// initial, not a broken frame.
.anor-nophoto {
  display: grid;
  place-items: center;
  background: $anor-leaf;
  color: #fff;
  font-family: var(--font-display), system-ui, sans-serif;
  font-size: clamp(1.5rem, 4vw, 2.5rem);
  aspect-ratio: 4 / 3;
}
```

- [ ] **Step 6: Swap fonts and import the stylesheet in `apps/web/app/layout.tsx`**

Replace the three `next/font/google` declarations. Keep the variable names.

```tsx
import { Unbounded, Golos_Text, IBM_Plex_Mono } from "next/font/google";

const display = Unbounded({
  subsets: ["latin", "latin-ext", "cyrillic"],
  weight: ["500", "600"],
  variable: "--font-display",
  display: "swap",
});

const body = Golos_Text({
  subsets: ["latin", "latin-ext", "cyrillic"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
  display: "swap",
});

const data = IBM_Plex_Mono({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500"],
  variable: "--font-data",
  display: "swap",
});
```

Then add the stylesheet import immediately **after** the existing `globals.css` import, so Anor wins on equal specificity:

```tsx
import "./globals.css";
import "./styles/anor.scss";
```

**Note (amended):** since commit `e4d814a`, `app/layout.tsx` also wraps children in `<MotionProvider>` and carries a `<noscript>` style block for `[data-reveal]` elements. Preserve both exactly — only the font declarations and the stylesheet import change in this task.

- [ ] **Step 7: Create the temporary probe page `apps/web/app/[locale]/(site)/_probe/page.tsx`**

```tsx
export default function ProbePage() {
  return (
    <div className="container py-5">
      <h1>Anor probe</h1>
      <p className="text-body-secondary">Golos Text body, Clay secondary.</p>
      <div className="anor-rule my-4"><span className="anor-rule__node" /></div>
      <button type="button" className="btn btn-primary me-2">Primary</button>
      <button type="button" className="btn btn-outline-secondary">Secondary</button>
      <p className="anor-num mt-3">4.8 · 2 480</p>
      <div className="card mt-4" style={{ maxWidth: "20rem" }}>
        <div className="anor-nophoto">C</div>
        <div className="card-body"><h2 className="h5 card-title">Card</h2></div>
      </div>
    </div>
  );
}
```

- [ ] **Step 8: Verify the foundation renders**

```bash
npm run typecheck --workspace @manzil/web
npm run lint --workspace @manzil/web
cd apps/web && NEXT_PUBLIC_USE_MOCK=true npm run dev
```

Open `http://localhost:3000/uz/_probe`. Confirm by eye: headings are Unbounded (wide, geometric), body is Golos Text, the primary button is Anor red `#A8352A`, the ground is `#F8F7F5`, the anor rule shows a red line with a centred diamond, and `4.8 · 2 480` is monospaced with tabular figures. Then confirm existing pages still render: `http://localhost:3000/uz` must still show the old design intact (new fonts, old layout) — nothing unstyled or collapsed.

- [ ] **Step 9: Delete the probe page and commit**

```bash
rm -rf apps/web/app/[locale]/\(site\)/_probe
git add apps/web/package.json apps/web/package-lock.json package-lock.json apps/web/app/styles apps/web/app/layout.tsx
git commit -m "feat(web): Bootstrap 5 + Sass foundation with Anor tokens"
```

---

### Task 2: Brand surface sync (PWA, offline, service worker, html lang)

**Files:**
- Modify: `apps/web/app/layout.tsx` (viewport `themeColor`)
- Modify: `apps/web/app/manifest.ts:24`
- Modify: `apps/web/app/offline/page.tsx`
- Modify: `apps/web/public/sw.js:21`
- Modify: `apps/web/app/[locale]/layout.tsx`
- Test: `tests/e2e/locale-lang.spec.ts` (create)

**Interfaces:**
- Consumes: Anor hex values from Task 1.
- Produces: correct `<html lang>` per locale — required by the Lighthouse ≥ 95 accessibility gate in every later task.

- [ ] **Step 1: Write the failing test `tests/e2e/locale-lang.spec.ts`**

```ts
import { expect, test } from "@playwright/test";

test.describe("html lang matches the URL locale", () => {
  for (const locale of ["uz", "ru", "en"] as const) {
    test(`/${locale} serves lang="${locale}"`, async ({ page }) => {
      await page.goto(`/${locale}`);
      await expect(page.locator("html")).toHaveAttribute("lang", locale);
    });
  }
});
```

- [ ] **Step 2: Run it to confirm it fails**

```bash
SKIP_AUTH_SETUP=1 npx playwright test tests/e2e/locale-lang.spec.ts
```

Expected: `/ru` and `/en` FAIL — both currently serve `lang="uz"`, hard-coded in the root layout. `/uz` passes.

- [ ] **Step 3: Correct the lang attribute in `apps/web/app/[locale]/layout.tsx`**

The root layout cannot know the locale, so the locale layout sets it. Add to the locale layout, after `const { locale } = await params;`:

```tsx
export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return (
    <>
      {/* The root layout renders <html lang="uz"> before the locale is known;
          correct it here so /ru and /en are announced correctly to assistive
          tech and to Lighthouse. */}
      <script
        dangerouslySetInnerHTML={{
          __html: `document.documentElement.lang=${JSON.stringify(locale)}`,
        }}
      />
      <LocaleProviders locale={locale}>{children}</LocaleProviders>
    </>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
SKIP_AUTH_SETUP=1 npx playwright test tests/e2e/locale-lang.spec.ts
```

Expected: all three PASS.

- [ ] **Step 5: Align the three brand colour sources**

In `apps/web/app/layout.tsx`, the viewport export:

```tsx
export const viewport: Viewport = {
  themeColor: "#a8352a",
};
```

In `apps/web/app/manifest.ts`, replace `theme_color: "#0f5b3d"` with:

```ts
    theme_color: "#a8352a",
    background_color: "#f8f7f5",
```

In `apps/web/app/offline/page.tsx`, replace the hard-coded `#52514e` with `#6e624f` and the page background with `#f8f7f5`. Leave it inline-styled — it is precached by the service worker and must not depend on a stylesheet that may not be cached.

- [ ] **Step 6: Bump the service worker version in `apps/web/public/sw.js:21`**

```js
const VERSION = "v2-anor";
```

Without this, returning users keep receiving cached HTML that references retired classes.

- [ ] **Step 7: Verify and commit**

```bash
npm run typecheck --workspace @manzil/web
npm run lint --workspace @manzil/web
SKIP_AUTH_SETUP=1 npx playwright test tests/e2e/locale-lang.spec.ts
git add apps/web/app/layout.tsx apps/web/app/manifest.ts apps/web/app/offline/page.tsx apps/web/public/sw.js apps/web/app/\[locale\]/layout.tsx tests/e2e/locale-lang.spec.ts
git commit -m "fix(web): per-locale html lang, Anor PWA colours, sw version bump"
```

---

### Task 3: Legacy token bridge and no-JS regression guard

**AMENDED 2026-08-05:** commit `e4d814a` migrated reveals from the CSS `.reveal`/`.is-shown` system to Framer Motion (`app/components/motion/presets.ts` + `motion-provider.tsx`; `data-reveal` attribute + a `<noscript>` rule in `app/layout.tsx` keeps content visible without JS). The old plan step "port the `html.js .reveal` gate into Sass" is obsolete — the gate no longer exists in `globals.css`. What remains: the token bridge, and an e2e guard that the `<noscript>` mechanism actually delivers the spec's "renders fully without JS" requirement.

**Files:**
- Modify: `apps/web/app/styles/anor.scss`
- Test: `tests/e2e/no-js.spec.ts` (create)

**Interfaces:**
- Produces: `--error` / `--primary` custom properties in the Anor layer. MUST exist before any page conversion deletes the `:root` token block from `globals.css`.
- Consumes: Task 1 tokens; the `data-reveal` convention from commit `e4d814a`.

**Why this task exists:** `review-form.tsx:261` and `claim-form.tsx:92` read `var(--error)` and `var(--primary)` from inline styles, defined only at `globals.css:46,50`. And the spec requires every section to render fully without JS — with Framer Motion inlining `opacity:0` at SSR, the `<noscript>` override in `app/layout.tsx` is the only thing standing between a no-JS visitor and blank sections, so it needs a regression test.

- [ ] **Step 1: Write the test `tests/e2e/no-js.spec.ts`**

```ts
import { expect, test } from "@playwright/test";

test.use({ javaScriptEnabled: false });

test("home content is visible without JavaScript", async ({ page }) => {
  await page.goto("/uz");
  await expect(page.locator("h1").first()).toBeVisible();
  // Framer Motion SSRs reveals with inline opacity:0; the <noscript> rule in
  // app/layout.tsx must force them visible when JS never runs.
  const hidden = await page.locator("[data-reveal]").evaluateAll(
    (els) => els.filter((el) => getComputedStyle(el).opacity === "0").length,
  );
  expect(hidden).toBe(0);
});
```

- [ ] **Step 2: Run it — it must pass on the current tree**

```bash
SKIP_AUTH_SETUP=1 npx playwright test tests/e2e/no-js.spec.ts
```

Expected: PASS (the `<noscript>` rule from `e4d814a` already covers it). This test is the regression guard — it must keep passing through every later task. If it FAILS here, the noscript mechanism is broken and must be fixed before any page converts.

- [ ] **Step 3: Bridge the legacy tokens into `apps/web/app/styles/anor.scss`**

Append:

```scss
// Bridged from globals.css so page conversions can delete the originals.
// review-form.tsx:261 and claim-form.tsx:92 read these from inline styles.
:root {
  --error:   #ba1a1a;
  --primary: #{$anor-red};
}
```

- [ ] **Step 4: Verify and commit**

```bash
npm run typecheck --workspace @manzil/web
SKIP_AUTH_SETUP=1 npx playwright test tests/e2e/no-js.spec.ts
git add apps/web/app/styles/anor.scss tests/e2e/no-js.spec.ts
git commit -m "feat(web): legacy token bridge and no-JS reveal regression guard"
```

---

### Task 4: Site chrome — header, nav, footer, mobile nav

**Files:**
- Modify: `apps/web/app/components/header.tsx`
- Modify: `apps/web/app/components/site-nav.tsx`
- Modify: `apps/web/app/components/mobile-nav.tsx`
- Modify: `apps/web/app/components/footer.tsx`
- Modify: `apps/web/app/components/locale-switcher.tsx`
- Create: `apps/web/app/components/bootstrap-offcanvas.tsx`
- Test: `tests/e2e/shell-boundary.spec.ts` (modify)

**Interfaces:**
- Consumes: Anor tokens and Bootstrap classes from Task 1.
- Produces: `<BootstrapOffcanvas id, title, children>` — a `"use client"` wrapper that dynamically imports Bootstrap's offcanvas JS. Reused by later tasks for modals and accordions via the same dynamic-import pattern.
- **Preserves (asserted by e2e):** `nav.desktop-nav`, `nav.mobile-nav`, `[data-shell="site"]`, exactly one `<footer>` on site pages, zero of all of these on `/dashboard`. English desktop nav must contain `Discover` and must NOT contain `Dashboard`.

**Why chrome converts first:** it renders on every `(site)` page. Converting it first means unconverted pages temporarily carry Anor chrome over legacy bodies — visually mixed but never broken. The reverse order would leave every converted page wearing legacy chrome, which is worse and lasts longer.

- [ ] **Step 1: Create the Bootstrap JS wrapper `apps/web/app/components/bootstrap-offcanvas.tsx`**

No `react-bootstrap` dependency; the bundled dynamic import satisfies the existing `script-src 'self'` CSP.

```tsx
"use client";

import { useEffect, useRef } from "react";

type Props = {
  id: string;
  title: string;
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
};

export function BootstrapOffcanvas({ id, title, open, onClose, children }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let instance: { show: () => void; hide: () => void; dispose: () => void } | null = null;
    let cancelled = false;

    void import("bootstrap/js/dist/offcanvas").then(({ default: Offcanvas }) => {
      if (cancelled || !ref.current) return;
      instance = new Offcanvas(ref.current);
      el.addEventListener("hidden.bs.offcanvas", onClose);
      if (open) instance.show();
    });

    return () => {
      cancelled = true;
      el.removeEventListener("hidden.bs.offcanvas", onClose);
      instance?.dispose();
    };
  }, [open, onClose]);

  return (
    <div ref={ref} className="offcanvas offcanvas-end" tabIndex={-1} id={id} aria-labelledby={`${id}-label`}>
      <div className="offcanvas-header">
        <h2 className="offcanvas-title h5" id={`${id}-label`}>{title}</h2>
        <button type="button" className="btn-close" data-bs-dismiss="offcanvas" aria-label="Close" />
      </div>
      <div className="offcanvas-body">{children}</div>
    </div>
  );
}
```

- [ ] **Step 2: Rebuild the header on Bootstrap's navbar**

In `apps/web/app/components/header.tsx`, replace the legacy markup. Keep `nav.desktop-nav` as a class on the nav element — the e2e suite selects on it.

```tsx
<header className="border-bottom" style={{ background: "var(--anor-card)" }}>
  <div className="container d-flex align-items-center justify-content-between py-3">
    <Link href={`/${locale}`} className="navbar-brand fw-semibold m-0" style={{ fontFamily: "var(--font-display)" }}>
      Manzil<span style={{ color: "var(--anor-red)" }}>.</span>
    </Link>

    <nav className="desktop-nav d-none d-lg-flex align-items-center gap-4" aria-label={copy.navLabel}>
      <Link className="nav-link p-0" href={`/${locale}`}>{copy.home}</Link>
      <Link className="nav-link p-0" href={`/${locale}/discover`}>{copy.discover}</Link>
      <Link className="nav-link p-0" href={`/${locale}/business`}>{copy.forBusiness}</Link>
    </nav>

    <div className="d-flex align-items-center gap-2">
      <LocaleSwitcher locale={locale} />
      <HeaderAuth locale={locale} />
      <Link className="btn btn-primary btn-sm" href={`/${locale}/business/register`}>{copy.start}</Link>
    </div>
  </div>
</header>
```

- [ ] **Step 3: Rebuild the footer on Bootstrap's grid**

In `apps/web/app/components/footer.tsx`, keep the single `<footer>` element (e2e counts it) and the Ink ground. Telegram stays prominent — owners live in Telegram, not email.

```tsx
<footer className="mt-5 py-5" style={{ background: "var(--anor-ink)", color: "var(--anor-ground)" }}>
  <div className="container">
    <div className="row g-4">
      <div className="col-12 col-lg-4">
        <p className="h5 mb-2" style={{ fontFamily: "var(--font-display)" }}>Manzil</p>
        <p className="small opacity-75 mb-0">{copy.tagline}</p>
      </div>
      <div className="col-6 col-lg-2">
        <h2 className="text-uppercase small opacity-75 mb-3">{copy.product}</h2>
        <ul className="list-unstyled d-grid gap-2 small mb-0">{/* product links */}</ul>
      </div>
      <div className="col-6 col-lg-2">
        <h2 className="text-uppercase small opacity-75 mb-3">{copy.apps}</h2>
        <ul className="list-unstyled d-grid gap-2 small mb-0">{/* app links */}</ul>
      </div>
      <div className="col-12 col-lg-4">
        <h2 className="text-uppercase small opacity-75 mb-3">{copy.contact}</h2>
        <ul className="list-unstyled d-grid gap-2 small mb-0">{/* phones, @manzilbiz_bot, email */}</ul>
      </div>
    </div>
    <p className="small opacity-50 mt-4 mb-0">{copy.rights}</p>
  </div>
</footer>
```

Note: `footer.tsx:54` links to `/{locale}/admin`, which currently resolves to nothing (the page is deleted; only untracked components exist). Leave the link exactly as-is — restoring the admin route is out of scope.

- [ ] **Step 4: Convert the mobile nav, keeping its selector**

In `apps/web/app/components/mobile-nav.tsx`, keep `nav.mobile-nav` as the root class and rebuild the interior with Bootstrap utilities. Use `BootstrapOffcanvas` for the expanded menu.

- [ ] **Step 5: Run the shell-boundary spec to find what broke**

```bash
SKIP_AUTH_SETUP=1 npx playwright test tests/e2e/shell-boundary.spec.ts
```

Expected: any failure here is a real regression in the structural contract, not a cosmetic diff. The spec asserts `nav.desktop-nav` and `nav.mobile-nav` exist on site pages, `[data-shell='site']` is present on site and absent on `/dashboard`, `/en/dashboard` has zero `<footer>`, English desktop nav contains `Discover` and neither nav contains `Dashboard`. Fix the markup until all pass — do NOT relax the assertions.

- [ ] **Step 6: Verify visually at three widths**

Run the dev server with `NEXT_PUBLIC_USE_MOCK=true` and screenshot `/uz`, `/ru`, `/en` at 390, 768 and 1440 px. Confirm: no horizontal overflow at 390 px; the longest locale's nav labels do not wrap or clip (Unbounded is a wide face — this is the recurring risk); the offcanvas opens and closes on mobile.

- [ ] **Step 7: Commit**

```bash
git add apps/web/app/components/header.tsx apps/web/app/components/site-nav.tsx apps/web/app/components/mobile-nav.tsx apps/web/app/components/footer.tsx apps/web/app/components/locale-switcher.tsx apps/web/app/components/bootstrap-offcanvas.tsx tests/e2e/shell-boundary.spec.ts
git commit -m "feat(web): rebuild site chrome on Bootstrap in the Anor identity"
```

---

### Task 5: Home page — sirly.uz look-alike

**AMENDED 2026-08-05 (user decision):** the home page is a full visual look-alike of https://sirly.uz/ — its exact section shape AND its visual dress (deep-green gradients, lime accents, pill buttons, wave dividers, floating phone mockup). All OTHER pages keep the Anor palette; this two-world split is deliberate and user-approved. The green skin is therefore SCOPED to the home page via a `.sh` wrapper class — it must not leak into shared chrome or other routes.

**NORMATIVE REFERENCE (user-approved 2026-08-05):** `.superpowers/sdd/2026-08-04-anor-web-redesign/task-5-reference.html` — a complete user-approved HTML preview of the target design. The delivered home page must visually match this file's rendered output: same band sequence, same colors, same copy (uz — translate faithfully for ru/en), same phone-mockup composition, same wave shapes, same FAQ items. Where this file and the prose below disagree, the reference file wins. Differences that MUST be applied on top of the reference: production fonts (Unbounded display / Golos Text body / IBM Plex Mono data — already wired in layout.tsx), real business data from `getHomeFeed(locale)` in the phone cards and stats (not the placeholder names/counts), real product screenshot in the B2B band if one exists in `public/` (else keep a neutral placeholder block), animations via anime.js per Step 6 (the reference's inline IntersectionObserver/CSS-keyframe JS is preview-only — do not copy it), and Next.js/Bootstrap idioms (Link, next/image where photos exist, container/row/col where they fit naturally under the `.sh` skin).

**EXECUTION ORDER (user priority 2026-08-05):** this task runs immediately after Task 4 (chrome), BEFORE Task 3 and Tasks 6+. The no-JS contract still binds (hidden states from JS only); Task 3's guard test lands afterwards and must pass without changes to this task's output.

**Reference constants (measured from sirly.uz in a real browser on 2026-08-05):**
- Deep green `#04483F`, mid green `#0a6b5e`; band background: `linear-gradient(135deg, #04483F, #0a6b5e, #04483F)`.
- Lime accent `#A1DD41` — used for highlighted headline phrases, stat numbers (weight 900), and inline text highlights on green. Never used on white backgrounds for text (fails contrast); on white, use deep green.
- H1/H2 on bands: 60px bold (Bootstrap `display-*` classes with the Unbounded display font); the oversized offer headline is 96px weight 900 (`display-1`).
- Buttons: fully-rounded pills (`border-radius: 50rem`), deep-green fill with white text on light, lime fill `#A1DD41` with deep-green text on green bands.
- Store badges: transparent with 1px white border, rounded, white text, on the green hero.
- Wave dividers: full-width SVG, `viewBox="0 0 1440 120"`, height ~120px, filling with the color of the adjacent band (white wave over green band edge and vice versa).
- FAQ: Bootstrap accordion restyled — 12px radius items, white cards on a white→gray-50 gradient section.
- Band rhythm: alternating white / green-gradient full-bleed sections, `py-16/py-24`-scale padding (use Bootstrap `py-5` + a `.sh-band` padding rule).

**Files:**
- Modify: `apps/web/app/[locale]/(site)/page.tsx`
- Modify: `apps/web/app/lib/landing-copy.ts`
- Rewrite: `apps/web/app/components/hero-businesses.tsx` → becomes the phone-mockup hero component (keep the filename; it still renders the hero businesses — now inside a phone frame)
- Modify: `apps/web/app/components/home-sections.tsx`
- Modify: `apps/web/app/components/audience-features.tsx`
- Modify: `apps/web/app/components/store-badges.tsx` (add an `onDark` variant: transparent, white border/text)
- Create: `apps/web/app/styles/_home-sirly.scss` (imported from `anor.scss` after the existing partials)
- Create: `apps/web/app/components/home-motion.tsx` (client-only anime.js primitives — see the animation step)
- Test: `tests/e2e/discover.spec.ts` (assertions on `.home-sections`, `.home-card__rating`, `.home-category.is-empty`)

**Interfaces:**
- Consumes: chrome from Task 4 (nav + footer stay site-wide Anor chrome — the sirly skin begins below the nav and ends above the footer); `getHomeFeed(locale)` from `app/lib/api.ts` — data fetching is unchanged.
- Produces: `getLandingCopy(locale): LandingCopy` extended with the section keys below. Task 6 reuses `LandingCopy` for `/business`.
- **Preserves (asserted by e2e):** `.home-sections` (now wraps the band sequence), `.home-card` and `.home-card__rating` (now on the business cards INSIDE the phone mockup; rating text must never match `/^0\.0\s*★/` — keep the reviewCount guard). `.home-category` / `.home-category.is-empty`: the category rail is CUT from the home page in this design; update `tests/e2e/discover.spec.ts` in the same commit — move/keep the `is-empty → /business/register` href assertion onto the offer-band CTA (`.sh-offer .btn`), and state the reason in the commit body. Never delete an assertion without a replacement.

**Section order — mirror sirly.uz exactly, Manzil content in each slot (all copy trilingual, uz source of truth; keep Manzil's plain official voice — no emoji, no ":)", no invented claims):**
1. **Hero** — green gradient band. Left: H1 with ONE phrase highlighted in lime (uz: headline about finding the city's best places, the highlighted phrase being the value hook), subline with 1-2 lime-highlighted key words, two store badges (`onDark` variant). Right: floating phone mockup — rounded device frame, notch + "9:41" status bar, a search input mock, then 2-3 REAL business cards from `getHomeFeed` (photo, name, mono rating, district) with `.home-card` / `.home-card__rating` classes. White wave divider at the bottom edge.
2. **White band — "Nega aynan Manzil?"** — lead paragraph + three benefits (verified reviews, real business data, free for users). Deep-green headline accents.
3. **Green band — explainer** — what Manzil is (the city's businesses, one platform); photo right, wave top and bottom.
4. **White band — "Qanday ishlaydi? " + 3 steps** — numbered circles (deep-green circle, white numeral): for owners: claim → verify → manage (the spec's how-it-works content in sirly's step form).
5. **Green band — platform stats** — three oversized lime numbers, weight 900 (businesses · reviews · districts) with white labels, from the same platform data the current page uses. This replaces sirly's ecology stats slot.
6. **White band — "Biznesingiz bormi? Manzil'ga qo'shiling!"** — owner pitch: product screenshot + short feature list + deep-green pill CTA to `/business`.
7. **Green band — oversized offer** — `display-1` (96px-scale) weight-900 white/lime headline for the honest Manzil equivalent of sirly's "0% komissiya": the Free plan ("BEPUL BOSHLANG" family), lime pill CTA to `/{locale}/business/register` carrying class `sh-offer`-scoped `.btn` (see preserved-assertions note).
8. **FAQ accordion** — Bootstrap accordion, 12px radius, 5-6 real questions (what is Manzil, how do reviews work, how to claim a business, is it free, which cities) on white→gray gradient.
9. **Footer** — the shared Task 4 footer, unchanged.

- [ ] **Step 1: Create `apps/web/app/styles/_home-sirly.scss` and import it from `anor.scss`**

Scoped skin — nothing outside `.sh` may change appearance:

```scss
// sirly.uz look-alike skin, scoped to the home page (user decision 2026-08-05).
// Constants measured from the reference site; do not reuse outside .sh.
.sh {
  --sh-deep: #04483f;
  --sh-mid: #0a6b5e;
  --sh-lime: #a1dd41;

  .sh-band {
    background: linear-gradient(135deg, var(--sh-deep), var(--sh-mid), var(--sh-deep));
    color: #fff;
    padding-block: 6rem;
  }
  .sh-band--light { background: #fff; color: var(--bs-body-color); padding-block: 6rem; }
  .sh-accent { color: var(--sh-lime); }
  .sh-band--light .sh-accent { color: var(--sh-deep); }

  .sh-pill {
    border-radius: 50rem;
    font-weight: 500;
    padding: 0.625rem 1.5rem;
  }
  .sh-band .btn-primary {
    @extend .sh-pill;
    background: var(--sh-lime); border-color: var(--sh-lime); color: var(--sh-deep);
  }
  .sh-band--light .btn-primary,
  .sh-faq ~ * .btn-primary {
    @extend .sh-pill;
    background: var(--sh-deep); border-color: var(--sh-deep); color: #fff;
  }

  .sh-wave { display: block; width: 100%; height: 120px; }

  .sh-stat { color: var(--sh-lime); font-weight: 900; }

  .sh-phone {
    border-radius: 2.5rem; background: #fff; border: 10px solid #101314;
    box-shadow: 0 40px 80px -30px rgb(0 0 0 / 0.5);
    transform: rotate(-2deg);
  }

  .sh-step-num {
    width: 2.5rem; height: 2.5rem; border-radius: 50%;
    background: var(--sh-deep); color: #fff;
    display: inline-flex; align-items: center; justify-content: center; font-weight: 700;
  }

  .accordion-item { border-radius: 12px; overflow: hidden; }
}
```

- [ ] **Step 2: Extend `apps/web/app/lib/landing-copy.ts`**

Follow the file's existing pattern exactly (exported type, `Record<string, LandingCopy>`, getter with `?? landing.uz`; plain serializable strings only). New keys:

```ts
export type LandingCopy = {
  // ...existing keys retained...
  heroTitlePre: string;      // text before the lime phrase
  heroTitleAccent: string;   // the lime-highlighted phrase
  heroTitlePost: string;     // text after (may be empty)
  heroSubline: string;       // 1-2 sentence subline; markers not needed — accent words split out:
  heroSublineAccents: string[]; // words within heroSubline to wrap in .sh-accent
  whyTitle: string;
  whyLead: string;
  whyPoints: { title: string; body: string }[];   // exactly 3
  explainerTitle: string;
  explainerBody: string;
  howTitle: string;
  howSteps: { title: string; body: string }[];    // exactly 3
  statsTitle: string;
  statLabels: { businesses: string; reviews: string; districts: string };
  b2bTitle: string;
  b2bBody: string;
  b2bCta: string;
  offerKicker: string;
  offerTitle: string;        // the oversized line
  offerCta: string;
  faqTitle: string;
  faqItems: { q: string; a: string }[];           // 5-6
};
```

All three locales, uz first and authoritative.

- [ ] **Step 3: Rebuild `page.tsx` as the band sequence**

Wrap everything in `<div className="sh home-sections">`. Bands as `<section>` elements alternating `sh-band--light` / `sh-band`, wave SVGs between them (inline JSX, `viewBox="0 0 1440 120"`, `preserveAspectRatio="none"`, a single soft path, `fill` = the adjacent band's color, `aria-hidden`). Hero example:

```tsx
<section className="sh-band position-relative overflow-hidden pb-0">
  <div className="container">
    <div className="row align-items-center g-5 pb-5">
      <div className="col-12 col-lg-6">
        <h1 className="display-3 fw-bold">
          {copy.heroTitlePre} <span className="sh-accent">{copy.heroTitleAccent}</span> {copy.heroTitlePost}
        </h1>
        <p className="lead mt-3 mb-4">{renderWithAccents(copy.heroSubline, copy.heroSublineAccents)}</p>
        <StoreBadges onDark />
      </div>
      <div className="col-12 col-lg-6">
        <HeroBusinesses items={feed.featured} locale={locale} />  {/* the phone mockup */}
      </div>
    </div>
  </div>
  <svg className="sh-wave" viewBox="0 0 1440 120" preserveAspectRatio="none" aria-hidden="true">
    <path d="M0 60 C360 120 720 0 1080 40 C1260 60 1380 80 1440 70 L1440 120 L0 120 Z" fill="#fff" />
  </svg>
</section>
```

`renderWithAccents` is a small local helper that splits the subline on each accent phrase and wraps matches in `<span className="sh-accent">`; keep it in `page.tsx`.

- [ ] **Step 4: Rewrite `hero-businesses.tsx` as the phone mockup**

Device frame (`.sh-phone`), fake status bar with "9:41", a disabled search input mock, then map the top 2-3 feed businesses to compact cards keeping the class contract: `home-card` on the card, `home-card__rating` on the mono rating, and the existing reviewCount guard (omit rating entirely when 0). Photos via existing image URL fields with `<Image>`. No new data fetching.

- [ ] **Step 5: Repurpose `home-sections.tsx` and `audience-features.tsx`**

`home-sections.tsx` renders bands 2-5 (why / explainer / steps / stats) from `LandingCopy` + the feed counts; `audience-features.tsx` renders band 6 (B2B pitch) — delete the pastel bento entirely. `store-badges.tsx` gains the `onDark` prop (transparent, `border border-white`, white text, rounded pill).

- [ ] **Step 6: Animate the home page with anime.js (`home-motion.tsx`)**

**AMENDED 2026-08-05 (user decision):** home-page animations use **anime.js v4** (`animejs@^4.5.0`, already installed in `@manzil/web`, commit `28de3bd`) — NOT Framer Motion. Framer Motion's `Reveal` stays for the rest of the site; do not import `Reveal`/`RevealStagger` on the home page. anime.js v4 API (NOT the v3 `anime({...})` default export — v4 is named exports):

```tsx
"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { animate, onScroll, stagger, utils } from "animejs";

const REDUCED = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Count-up for the stats band: 0 → value when the band scrolls into view. */
export function CountUp({ value, className }: { value: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (REDUCED()) { el.textContent = String(value); return; }
    const counter = { n: 0 };
    const anim = animate(counter, {
      n: value,
      duration: 1400,
      ease: "outQuart",
      autoplay: onScroll({ target: el, enter: "bottom top+=85%", once: true }),
      onUpdate: () => { el.textContent = String(Math.round(counter.n)); },
    });
    return () => anim.revert();
  }, [value]);
  return <span ref={ref} className={className}>0</span>;
}

/** Scroll-triggered rise-in for band content; direct children stagger. */
export function ScrollIn({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || REDUCED()) return;
    const targets = el.children.length > 1 ? [...el.children] : [el];
    utils.set(targets, { opacity: 0, translateY: 28 });
    const anim = animate(targets, {
      opacity: 1,
      translateY: 0,
      duration: 700,
      delay: stagger(90),
      ease: "outQuart",
      autoplay: onScroll({ target: el, enter: "bottom top+=88%", once: true }),
    });
    return () => anim.revert();
  }, []);
  return <div ref={ref} className={className} data-reveal="">{children}</div>;
}

/** Endless gentle float for the hero phone mockup. */
export function FloatLoop({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || REDUCED()) return;
    const anim = animate(el, {
      translateY: [-8, 8],
      duration: 3200,
      ease: "inOutSine",
      alternate: true,
      loop: true,
    });
    return () => anim.revert();
  }, []);
  return <div ref={ref} className={className}>{children}</div>;
}
```

Usage: stats band numbers become `<CountUp value={counts.businesses} className="sh-stat display-4" />` etc.; wrap each band's inner container in `<ScrollIn>`; wrap the phone mockup in `<FloatLoop>`. Rules: initial hidden state is set from JS only (`utils.set` inside the effect), NEVER in CSS/SSR markup — the server-rendered page must be fully visible without JS (this is what keeps the Task 3 no-JS guard green; the `data-reveal` attribute on `ScrollIn` keeps the noscript override applicable as belt-and-braces). `prefers-reduced-motion` short-circuits to the final state. Keep all three primitives in the one `home-motion.tsx` file.

- [ ] **Step 7: Run the affected specs**

```bash
SKIP_AUTH_SETUP=1 npx playwright test tests/e2e/discover.spec.ts tests/e2e/no-js.spec.ts tests/e2e/shell-boundary.spec.ts
```

Expected: PASS after the sanctioned spec update from the Interfaces note (category-rail assertions → offer-band CTA). Never delete an assertion without a replacement; explain the move in the commit body.

- [ ] **Step 8: Verify visually, all locales and widths**

Screenshot `/uz`, `/ru`, `/en` at 390, 768, 1440. Check: no horizontal overflow at 390 (the rotated phone mockup is the likely offender — clamp with `overflow-hidden` on the hero, not the page); lime only ever on green; Russian strings (longest) don't clip the 96px offer line — let it wrap, don't shrink-to-fit; the green skin appears on NO other route (spot-check `/uz/discover`). Also verify with JS disabled that every band's content is fully visible (anime.js sets hidden states from JS only, so no-JS must render everything).

- [ ] **Step 9: Commit**

```bash
git add apps/web/app/\[locale\]/\(site\)/page.tsx apps/web/app/lib/landing-copy.ts apps/web/app/components/hero-businesses.tsx apps/web/app/components/home-sections.tsx apps/web/app/components/audience-features.tsx apps/web/app/components/store-badges.tsx apps/web/app/components/home-motion.tsx apps/web/app/styles/_home-sirly.scss apps/web/app/styles/anor.scss tests/e2e/discover.spec.ts
git commit -m "feat(web): rebuild home as a sirly.uz look-alike (scoped green skin, anime.js motion)"
```

---

### Task 6: Business landing `/business`

**Files:**
- Modify: `apps/web/app/[locale]/(site)/business/page.tsx`
- Modify: `apps/web/app/components/business/mockups.tsx`
- Modify: `apps/web/app/lib/business-copy.ts`

**Interfaces:**
- Consumes: `LandingCopy` shape conventions from Task 5; `AnimatedCounter` from `app/components/motion/animated-counter.tsx` (imported at line 2, rendered at line 175 in the stats band — it is NOT unused).
- Produces: an FAQ accordion pattern (Bootstrap `accordion`, no JS import needed — it works from data attributes once the CSS module is compiled) reused by Task 7.

- [ ] **Step 1: Extend `apps/web/app/lib/business-copy.ts`**

Follow the file's existing pattern (`const copy = { uz, ru, en }`, `export type BusinessCopy = (typeof copy)["uz"]`, `getBusinessCopy(locale)`). Add `faq: { q: string; a: string }[]` and `testimonial: { quote: string; name: string; business: string }`. Write all three locales.

- [ ] **Step 2: Rebuild the page sections**

Owner deep-dive order: hero → feature detail sections (alternating media rows) → stats band retaining `AnimatedCounter` → owner testimonial as a quoted editorial block → FAQ accordion → full register CTA.

```tsx
<div className="accordion accordion-flush" id="business-faq">
  {copy.faq.map((item, i) => (
    <div className="accordion-item" key={item.q}>
      <h3 className="accordion-header">
        <button
          className={`accordion-button${i === 0 ? "" : " collapsed"}`}
          type="button"
          data-bs-toggle="collapse"
          data-bs-target={`#faq-${i}`}
          aria-expanded={i === 0}
          aria-controls={`faq-${i}`}
        >
          {item.q}
        </button>
      </h3>
      <div id={`faq-${i}`} className={`accordion-collapse collapse${i === 0 ? " show" : ""}`} data-bs-parent="#business-faq">
        <div className="accordion-body text-body-secondary">{item.a}</div>
      </div>
    </div>
  ))}
</div>
```

- [ ] **Step 3: Load Bootstrap's collapse JS**

The accordion needs `bootstrap/js/dist/collapse`. Add a tiny client component `apps/web/app/components/bootstrap-collapse.tsx` that imports it on mount, and render it once on this page:

```tsx
"use client";
import { useEffect } from "react";

export function BootstrapCollapse() {
  useEffect(() => { void import("bootstrap/js/dist/collapse"); }, []);
  return null;
}
```

- [ ] **Step 4: Verify**

```bash
npm run typecheck --workspace @manzil/web
npm run lint --workspace @manzil/web
```

Then in the browser at `/uz/business`: the accordion expands and collapses, the stats band counts up, and reduced-motion disables the count animation.

- [ ] **Step 5: Commit**

```bash
git add apps/web/app/\[locale\]/\(site\)/business/page.tsx apps/web/app/components/business/mockups.tsx apps/web/app/components/bootstrap-collapse.tsx apps/web/app/lib/business-copy.ts
git commit -m "feat(web): rebuild the business landing in the Anor identity"
```

---

### Task 7: Pricing and plans

**Files:**
- Modify: `apps/web/app/[locale]/(site)/business/pricing/page.tsx`
- Modify: `apps/web/app/[locale]/(site)/business/plans/page.tsx`
- Modify: `apps/web/app/components/crm/plan-submit.tsx`

**Interfaces:**
- Consumes: FAQ accordion pattern and `BootstrapCollapse` from Task 6.
- Constraint: `plan-submit.tsx` uses `bz-btn-primary`, shared with the out-of-scope dashboard. Add Bootstrap classes alongside; do NOT alter the `bz-btn-primary` rule in `globals.css`.

- [ ] **Step 1: Build the comparison table on Bootstrap's table**

```tsx
<div className="table-responsive">
  <table className="table align-middle">
    <caption className="visually-hidden">{copy.pricingTableCaption}</caption>
    <thead>
      <tr>
        <th scope="col">{copy.feature}</th>
        {plans.map((p) => <th scope="col" key={p.id}>{p.name}</th>)}
      </tr>
    </thead>
    <tbody>
      {rows.map((row) => (
        <tr key={row.key}>
          <th scope="row" className="fw-normal">{row.label}</th>
          {plans.map((p) => (
            <td key={p.id} className="anor-num">{row.values[p.id]}</td>
          ))}
        </tr>
      ))}
    </tbody>
  </table>
</div>
```

The wrapper must be `table-responsive` — the table is wide and the page body must never scroll horizontally at 390 px.

- [ ] **Step 2: Apply the same treatment to `/business/plans`**

Same table, rendered in the authenticated context. Keep the existing server action wiring in `plan-submit.tsx` untouched; only classes change.

- [ ] **Step 3: Verify at 390 px**

Confirm the table scrolls inside its own container and the page body does not.

- [ ] **Step 4: Commit**

```bash
git add apps/web/app/\[locale\]/\(site\)/business/pricing/page.tsx apps/web/app/\[locale\]/\(site\)/business/plans/page.tsx apps/web/app/components/crm/plan-submit.tsx
git commit -m "feat(web): rebuild pricing and plans on Bootstrap tables"
```

---

### Task 8: Registration and photos

**Files:**
- Modify: `apps/web/app/[locale]/(site)/business/register/page.tsx`
- Modify: `apps/web/app/[locale]/(site)/business/register/photos/page.tsx`
- Modify: `apps/web/app/components/claim-form.tsx`
- Test: `tests/e2e/registration.spec.ts`

**Interfaces:**
- Consumes: Anor form theming from Task 1 (`$focus-ring-color`, validation colours).
- **Behavioural invariants that MUST survive (asserted by e2e):** `details.crm-terms-doc` and `.crm-terms-body` elements; `input[name='acceptedTerms']` required and **unchecked by default**; `input[name='acceptedTermsVersion']` value pinned to the seeded terms version; `input[name='name']`, `input[name='email']`, `input[name='businessName']`; the submit must POST to a URL containing `/crm/register`.
- Constraint: `BusinessPhotoManager` and `PhotoUpload` are also rendered by the out-of-scope `dashboard/settings/page.tsx`. Changing their markup restyles that page too — acceptable per spec §6a, but screenshot `/dashboard/settings` in Task 13 to confirm nothing breaks.

- [ ] **Step 1: Convert the form to Bootstrap floating labels**

```tsx
<div className="form-floating mb-3">
  <input
    type="text"
    className={`form-control${errors.businessName ? " is-invalid" : ""}`}
    id="businessName"
    name="businessName"
    placeholder={copy.businessName}
    required
  />
  <label htmlFor="businessName">{copy.businessName}</label>
  {errors.businessName ? <div className="invalid-feedback">{errors.businessName}</div> : null}
</div>
```

`form-floating` requires the `placeholder` attribute to be present — without it the label does not float. Validation colours come from `$danger` (Anor) and `$success` (Leaf), already set in `_tokens.scss`.

- [ ] **Step 2: Preserve the terms block exactly**

Keep `<details class="crm-terms-doc">` and `.crm-terms-body` as elements and class names. Keep the checkbox unchecked by default and the hidden version input pinned. Wrap the checkbox in Bootstrap's `form-check` without renaming anything:

```tsx
<div className="form-check mb-3">
  <input className="form-check-input" type="checkbox" id="acceptedTerms" name="acceptedTerms" required />
  <label className="form-check-label" htmlFor="acceptedTerms">{copy.acceptTerms}</label>
</div>
<input type="hidden" name="acceptedTermsVersion" value={termsVersion} />
```

- [ ] **Step 3: Add visible step progress**

Three steps: details → plan → photos. Render as a simple ordered list with the current step marked `aria-current="step"`. No new dependency.

- [ ] **Step 4: Keep the file-input accept whitelist**

The photos step's `input[type='file']` must keep an `accept` containing `image/jpeg` and `image/png` and must NOT contain `svg`. This is asserted by e2e and is a security boundary, not a preference.

- [ ] **Step 5: Run the registration spec**

```bash
npx playwright test tests/e2e/registration.spec.ts
```

This spec needs Clerk auth, so it cannot run under `SKIP_AUTH_SETUP=1`. If Clerk keys are unavailable locally, run the full suite in CI instead and confirm there before merging.

- [ ] **Step 6: Commit**

```bash
git add apps/web/app/\[locale\]/\(site\)/business/register apps/web/app/components/claim-form.tsx tests/e2e/registration.spec.ts
git commit -m "feat(web): rebuild registration on Bootstrap forms"
```

---

### Task 9: Discover — Groupon look-alike

**AMENDED 2026-08-05 (user decision):** the Discover page is a full look-alike of groupon.com's shape, per the user-approved preview. **NORMATIVE REFERENCE:** `.superpowers/sdd/2026-08-04-anor-web-redesign/task-9-reference.html` — where it and the prose below disagree, the reference wins. Execution order: Task 9 runs right after Task 5 (home), before Tasks 3/6/7/8.

Key mappings (all already in the product's data model):
- Header search bar (rounded, 📍 Toshkent location chip, green submit) + horizontal category nav: implemented INSIDE the discover page as a sticky block under the global Task 4 chrome — do NOT modify the shared nav for this.
- Promo tiles row: the top 3 community lists (`/lists` data) as gradient banner tiles.
- Deal cards: photo top with badge overlay (−N% from an ACTIVE discount announcement; "YANGI" for businesses created recently; "MASHHUR" for top-rated), ♥ save button (existing saved-businesses feature; Clerk-gated like elsewhere), small `category · district` line, bold name, address + distance (when geolocation granted), green stars + mono rating + review count, then either strikethrough old→new price (discount announcements carrying prices) or `$` price-tier + "Hozir ochiq" where structured hours allow — otherwise omit the open pill (the LiveStatus mock remains CUT per the original Task 9 note).
- "Trend joylar" horizontal scroll row + "Barcha joylar" grid with district/sort selects; "Barchasini ko'rish ›" links.
- Colors: white ground, deep green `#04483f`/mid `#0a6b5e` for stars/prices/CTAs, lime `#A1DD41` badges — the chrome family, NOT anor-red (user direction: match Groupon's green-on-white feel with Manzil's own greens).
- **Data caveat (implementer must verify first):** check whether the businesses list DTO from `@manzil/shared` exposes active discount announcements. If not: ship cards without the strikethrough price row (badge-only where derivable), record the API gap in the ledger as a follow-up — do not block on API changes and do not invent discount data.

The original Task 9 prose below remains for its non-visual requirements (URL-driven state, skeletons, designed empty state, e2e class contracts) and is superseded on visuals by the reference.

### Task 9 (original): Discover

**Files:**
- Modify: `apps/web/app/[locale]/(site)/discover/page.tsx`
- Modify: `apps/web/app/components/search-controls.tsx`
- Modify: `apps/web/app/components/business-card.tsx`
- Modify: `apps/web/app/components/gurman-hero.tsx`
- Test: `tests/e2e/discover.spec.ts`

**Interfaces:**
- Consumes: chrome from Task 4; `getUiCopy(locale)` from `@manzil/shared` (already used inside `search-controls.tsx:19`).
- **Preserves (asserted by e2e):** `.gurman-hero`, `.gurman-hero__badge` (must contain the text `Gurman AI`), `.gurman-hero__cta`; `/uz/discover?q=osh` must render **zero** `.gurman-hero` and **zero** `.home-sections` — search replaces the browse state.
- **CUT from this task:** the open-now toggle and the live status pill. `LiveStatus` is hardcoded mock data in `packages/shared/src/platform-data.ts`; the API exposes no `liveStatus` field and `business.hours` is free-form, so both would be inert in production. `live-status-pill.tsx` is left untouched.

- [ ] **Step 1: Build the sticky filter bar**

Category chips, district select, sort select. State stays URL-driven exactly as today — only markup changes.

```tsx
<div className="sticky-top py-3" style={{ background: "var(--anor-ground)", top: 0, zIndex: 1020 }}>
  <div className="container">
    <div className="d-flex flex-wrap align-items-center gap-2">
      {categories.map((c) => (
        <Link
          key={c.slug}
          href={hrefFor({ category: c.slug })}
          className={`btn btn-sm ${c.slug === active ? "btn-primary" : "btn-outline-secondary"}`}
        >
          {c.name}
        </Link>
      ))}
    </div>
  </div>
</div>
```

- [ ] **Step 2: Rebuild the result card**

Arch-topped photo, mono rating, price band, distance when geolocation is granted. Businesses with no photo get `.anor-nophoto` with the initial — never a broken frame.

```tsx
<article className="card h-100">
  <div className="ratio ratio-4x3">
    {photo
      ? <Image className="anor-arch" src={photo} alt="" fill sizes="(max-width: 768px) 100vw, 33vw" />
      : <div className="anor-nophoto">{business.name.charAt(0)}</div>}
  </div>
  <div className="card-body">
    <h3 className="h6 card-title mb-1">{business.name}</h3>
    <p className="small text-body-secondary mb-2">{business.district}</p>
    {business.reviewCount > 0 ? (
      <p className="anor-num small mb-0">{business.avgRating.toFixed(1)} ★ · {business.reviewCount}</p>
    ) : null}
  </div>
</article>
```

The rating is omitted entirely when `reviewCount` is 0 — the e2e suite asserts no card ever renders `0.0 ★`.

- [ ] **Step 3: Add the district rail (desktop right column)**

Reserve a `col-lg-3` rail sized for a future map pane. Ship it as a district navigator — a plain list of districts with counts. No fake map, no new map dependency; a Mapbox pane can drop into the same column later without relayout.

- [ ] **Step 4: Add skeletons and a designed empty state**

Use Bootstrap's `placeholder-glow` for loading cards. The empty state gets a heading, one explanatory line, and a link to broaden the search — not a bare "no results".

- [ ] **Step 5: Run the discover spec**

```bash
SKIP_AUTH_SETUP=1 npx playwright test tests/e2e/discover.spec.ts
```

Expected: PASS, including the search-state assertion that `?q=osh` renders zero `.gurman-hero` and zero `.home-sections`.

- [ ] **Step 6: Commit**

```bash
git add apps/web/app/\[locale\]/\(site\)/discover/page.tsx apps/web/app/components/search-controls.tsx apps/web/app/components/business-card.tsx apps/web/app/components/gurman-hero.tsx tests/e2e/discover.spec.ts
git commit -m "feat(web): rebuild discover in the Anor identity"
```

---

### Task 10: Business detail

**Files:**
- Modify: `apps/web/app/[locale]/(site)/businesses/[slug]/page.tsx`
- Modify: `apps/web/app/components/review-list.tsx`
- Modify: `apps/web/app/components/review-form.tsx`
- Modify: `apps/web/app/components/ai-summary-block.tsx`
- Modify: `apps/web/app/components/helpful-button.tsx`
- Create: `apps/web/app/components/gallery-lightbox.tsx`
- Test: `tests/e2e/reviews.spec.ts`

**Interfaces:**
- Consumes: `BootstrapOffcanvas` dynamic-import pattern from Task 4 (same approach, `bootstrap/js/dist/modal` and `bootstrap/js/dist/carousel`).
- **Behavioural invariants that MUST survive (asserted by e2e):** `form.review-form`; `textarea[name='text']` keeps native `minLength={20}`; `p.form-note`; `article.review-card` and `.review-card--empty`; `.helpful-button`; the review submit POSTs to a URL containing `/reviews`; the uz success note must contain `qabul qilindi` and must NOT contain `Sharhni yuborib bo'lmadi` or `Internet aloqasini tekshirib`.
- Note: `review-form.tsx:261` sets `style={{ color: error ? "var(--error)" : "var(--primary)" }}`. Both tokens now come from the Anor layer (Task 3), so this keeps working.

- [ ] **Step 1: Build the gallery mosaic**

One large image plus four tiles; a "show all" button opens a Bootstrap modal containing a carousel.

```tsx
"use client";

import { useEffect, useRef } from "react";

export function GalleryLightbox({ photos, label }: { photos: string[]; label: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    void Promise.all([
      import("bootstrap/js/dist/modal"),
      import("bootstrap/js/dist/carousel"),
    ]);
  }, []);

  return (
    <div className="modal fade" ref={ref} id="gallery" tabIndex={-1} aria-labelledby="gallery-label" aria-hidden="true">
      <div className="modal-dialog modal-xl modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h2 className="modal-title h6" id="gallery-label">{label}</h2>
            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close" />
          </div>
          <div className="modal-body p-0">
            <div id="gallery-carousel" className="carousel slide">
              <div className="carousel-inner">
                {photos.map((src, i) => (
                  <div className={`carousel-item${i === 0 ? " active" : ""}`} key={src}>
                    <img src={src} className="d-block w-100" alt="" />
                  </div>
                ))}
              </div>
              <button className="carousel-control-prev" type="button" data-bs-target="#gallery-carousel" data-bs-slide="prev">
                <span className="carousel-control-prev-icon" aria-hidden="true" />
                <span className="visually-hidden">Previous</span>
              </button>
              <button className="carousel-control-next" type="button" data-bs-target="#gallery-carousel" data-bs-slide="next">
                <span className="carousel-control-next-icon" aria-hidden="true" />
                <span className="visually-hidden">Next</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Add the sticky action card and mobile action bar**

Desktop: a `col-lg-4` sticky card with call · Telegram · directions · save, plus hours. Mobile: the same actions in a fixed bottom bar. Both render server-side; no JS required to see them.

- [ ] **Step 3: Rebuild the review summary**

A large mono average, a star row, and distribution bars built from Bootstrap's `progress` component. Owner replies get a visually distinct indented block. Keep `article.review-card`, `.review-card--empty`, `.helpful-button`.

- [ ] **Step 4: Set the Gurman AI summary as a quoted editorial block**

Style `ai-summary-block.tsx` as a `blockquote` with the anor rule above it. Keep the existing attribution.

- [ ] **Step 5: Preserve the review form contract**

Keep `form.review-form` and `textarea[name='text'] minLength={20}` — the native validation is asserted. Convert the surrounding layout to Bootstrap; keep `p.form-note` for the status line.

- [ ] **Step 6: Run the reviews spec**

```bash
npx playwright test tests/e2e/reviews.spec.ts
```

Clerk-gated, and it depends on the submission spec having run first (the suite runs single-worker and ordered). Run the full suite rather than this file alone if it fails in isolation.

- [ ] **Step 7: Commit**

```bash
git add apps/web/app/\[locale\]/\(site\)/businesses apps/web/app/components/review-list.tsx apps/web/app/components/review-form.tsx apps/web/app/components/ai-summary-block.tsx apps/web/app/components/helpful-button.tsx apps/web/app/components/gallery-lightbox.tsx tests/e2e/reviews.spec.ts
git commit -m "feat(web): rebuild business detail in the Anor identity"
```

---

### Task 11: Long-tail pages on one shared template

**Files:**
- Create: `apps/web/app/components/page-header.tsx`
- Modify: `apps/web/app/[locale]/(site)/lists/page.tsx`, `lists/[slug]/page.tsx`
- Modify: `apps/web/app/[locale]/(site)/occasions/page.tsx`, `occasions/[slug]/page.tsx`
- Modify: `apps/web/app/[locale]/(site)/concierge/page.tsx`
- Modify: `apps/web/app/[locale]/(site)/profile/page.tsx`
- Modify: `apps/web/app/[locale]/(site)/waitlist/[topic]/page.tsx`
- Modify: `apps/web/app/components/community-list-card.tsx`, `occasion-rail.tsx`, `discover-user-card.tsx`, `concierge-chat.tsx`, `waitlist/waitlist-form.tsx`
- Test: `tests/e2e/waitlist.spec.ts`

**Interfaces:**
- Produces: `<PageHeader title, description />` — used by all seven pages. Nothing bespoke; these pages get a shared minimal treatment so the effort concentrates on home, the funnel, discover and detail.
- **Preserves (asserted by e2e):** `.wl-submit`, `.wl-done`; the `/en/waitlist/city` h1 must contain `Tashkent`; `.wl-done` must contain `number`; `select[name='city']` must have option `Buxoro` on the city topic and be absent on the gurman topic; `/en/waitlist/spaceship` must 404.
- Note: the map gave two contradictory accounts of how `WaitlistForm` receives `API_BASE_URL` (prop vs. self-import). Read the file before editing and follow what is actually there.

- [ ] **Step 1: Create the shared header**

```tsx
export function PageHeader({ title, description }: { title: string; description?: string }) {
  return (
    <header className="container pt-5 pb-4">
      <h1 className="display-6 mb-2">{title}</h1>
      {description ? <p className="lead text-body-secondary mb-0">{description}</p> : null}
      <div className="anor-rule mt-4"><span className="anor-rule__node" /></div>
    </header>
  );
}
```

- [ ] **Step 2: Apply it to all seven pages**

Each page: `PageHeader`, then standard Bootstrap cards or a grid. Remove the ad-hoc inline `marginTop` styles at `occasions/[slug]/page.tsx:39`, `lists/[slug]/page.tsx:34` and `search-controls.tsx:40` — Bootstrap spacing utilities replace them.

- [ ] **Step 3: Restyle the concierge chat without changing behaviour**

`concierge-chat.tsx` keeps its existing state and submission logic. Only classes change: Bootstrap `form-control` on the input, `btn btn-primary` on send, cards for messages.

- [ ] **Step 4: Restyle the waitlist form, preserving its selectors**

Keep `.wl-submit` on the submit button and `.wl-done` on the success block. Keep `select[name='city']` and its options exactly as they are per topic.

- [ ] **Step 5: Run the waitlist spec**

```bash
SKIP_AUTH_SETUP=1 npx playwright test tests/e2e/waitlist.spec.ts
```

Expected: PASS, including the `/en/waitlist/spaceship` 404 case.

- [ ] **Step 6: Commit**

```bash
git add apps/web/app/components/page-header.tsx apps/web/app/\[locale\]/\(site\)/lists apps/web/app/\[locale\]/\(site\)/occasions apps/web/app/\[locale\]/\(site\)/concierge apps/web/app/\[locale\]/\(site\)/profile apps/web/app/\[locale\]/\(site\)/waitlist apps/web/app/components/community-list-card.tsx apps/web/app/components/occasion-rail.tsx apps/web/app/components/discover-user-card.tsx apps/web/app/components/concierge-chat.tsx apps/web/app/components/waitlist/waitlist-form.tsx tests/e2e/waitlist.spec.ts
git commit -m "feat(web): shared Anor template for the long-tail pages"
```

---

### Task 12: Clerk auth pages

**Files:**
- Modify: `apps/web/app/[locale]/(site)/sign-in/[[...sign-in]]/page.tsx`
- Modify: `apps/web/app/[locale]/(site)/sign-up/[[...sign-up]]/page.tsx`

**Interfaces:**
- Consumes: Anor hex values from Task 1.

- [ ] **Step 1: Theme Clerk via the `appearance` prop**

```tsx
<SignIn
  appearance={{
    variables: {
      colorPrimary: "#a8352a",
      colorBackground: "#ffffff",
      colorText: "#231f1a",
      colorTextSecondary: "#6e624f",
      colorDanger: "#a8352a",
      borderRadius: "0.375rem",
      fontFamily: "var(--font-body), system-ui, sans-serif",
    },
    elements: {
      card: "shadow-sm",
      headerTitle: "h4",
    },
  }}
/>
```

- [ ] **Step 2: Verify both pages render themed in all three locales, then commit**

```bash
git add apps/web/app/\[locale\]/\(site\)/sign-in apps/web/app/\[locale\]/\(site\)/sign-up
git commit -m "feat(web): theme Clerk auth pages to Anor"
```

---

### Task 13: Trim globals.css and verify the whole surface

**Files:**
- Modify: `apps/web/app/globals.css`
- Modify: `apps/web/public/sw.js` (second `VERSION` bump)
- Create: `docs/superpowers/plans/anor-verification-report.md`

**Interfaces:**
- Consumes: every prior task.
- **Constraint: `globals.css` is trimmed, never deleted.** The workspace shell still resolves from it, and `app/components/charts/charts.css` (workspace-only, 33 hardcoded hex colours) exists separately.

- [ ] **Step 1: Enumerate every class the workspace still resolves**

```bash
grep -rhoE 'className="[^"]+"' apps/web/app/\[locale\]/\(workspace\) apps/web/app/components/crm apps/web/app/components/workspace apps/web/app/components/admin \
  | sed 's/className="//; s/"$//' | tr ' ' '\n' | sort -u > /tmp/workspace-classes.txt
wc -l /tmp/workspace-classes.txt
```

- [ ] **Step 2: Delete only rules whose selectors appear nowhere in that list and nowhere in `(site)`**

Rule **deletion** is the only safe operation. Never move or edit a rule in place: `.business-card` is defined at `globals.css:1038`, restated at `:1224`, and redefined again at `:7270+`, where the later block deliberately overrides the earlier ones. The workspace density layer at `:6917-6989` overrides generic selectors by specificity and must survive intact.

Explicitly **keep**: `crm-*`, `bz-btn-*`, `empty-state`, `photo-manager__*`, `photo-upload__*`, `[data-shell="workspace"]` block, and the `:root` token block.

- [ ] **Step 3: Bump the service worker version again**

```js
const VERSION = "v3-anor-trim";
```

- [ ] **Step 4: Run the full gate**

```bash
npm run typecheck --workspace @manzil/web
npm run lint --workspace @manzil/web
npm run test:e2e
```

Expected: all green. The suite builds a production server and runs single-worker; budget for the full build plus the `packages/shared` prebuild.

- [ ] **Step 5: Screenshot every surface, including the out-of-scope dashboard**

At 390, 768 and 1440 px, in all three locales for the site pages:

Site — `/`, `/business`, `/business/pricing`, `/business/register`, `/discover`, `/businesses/<slug>`, `/lists`, `/occasions`, `/concierge`, `/profile`, `/waitlist/city`, `/sign-in`, `/offline`.

Workspace (regression only, English) — `/dashboard`, `/dashboard/settings`, `/dashboard/bookings`.

The workspace shots exist to review the accepted reboot and font bleed from spec §6a. Confirm nothing collapsed, no control lost its affordance, and no text became unreadable. Record findings in the verification report.

- [ ] **Step 6: Run Lighthouse**

Accessibility ≥ 95 on `/uz`, `/uz/discover`, and one business detail page. The per-locale `<html lang>` fix from Task 2 is a prerequisite.

- [ ] **Step 7: Write the verification report and commit**

Record: pages converted, e2e status, Lighthouse scores, the workspace bleed assessment, and any rules deliberately left in `globals.css` with the reason.

```bash
git add apps/web/app/globals.css apps/web/public/sw.js docs/superpowers/plans/anor-verification-report.md
git commit -m "chore(web): trim globals.css to the workspace surface and verify Anor rollout"
```

---

## Deferred (explicitly not in this plan)

- Open-now filter and live status pill — blocked on the API exposing structured hours (`business.hours` is a free-form string today).
- Real map pane on discover — the `col-lg-3` rail is reserved for it.
- Workspace dashboard and admin console redesign.
- Restoring the `/{locale}/admin` route that `footer.tsx:54` links to.
