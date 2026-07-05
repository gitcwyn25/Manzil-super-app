# Design

## Theme

Light, paper-adjacent but not cream — a near-neutral warm off-white with the brand's own teal tint, not a warm-beige default. Committed **teal + gold** identity (preserved from the shipped brand and the logo). Editorial + architectural: big confident display type, generous fluid spacing, the Uzbek arch as a structural device. High contrast, precise, unmistakably local.

## Color

OKLCH-anchored, teal-committed. Preserve existing brand values; refine neutrals off warm-default.

- `--ink` #14201f — near-black with a teal undertone (primary text, logo-black).
- `--surface` #f6f7f5 — off-white, faint cool-neutral (NOT cream).
- `--surface-2` #eef1ee — raised panels.
- `--primary` (teal) #005454 · `--primary-bright` #0f6e6e — navigation, primary actions, brand.
- `--gold` #c6a35a (logo gold) / `--gold-bright` #feb300 — accents, the inner-arch device, ratings. Used sparingly.
- `--terracotta` #a84305 — tertiary heritage accent, rare.
- `--muted` #4b5654 — secondary text (verify ≥4.5:1 on surface).
- `--line` rgb(20 32 31 / 0.12) — hairlines (full borders only; never side-stripes).

Contrast: body ink on surface ≈ 13:1; muted on surface ≥ 4.6:1; gold reserved for large/decorative, not body.

## Typography

Contrast axis (serif display + geometric sans), not a two-sans reflex pair.

- **Display** — `Libre Caslon Display` (serif): hero + section headlines. Institutional, architectural, high-contrast — reads "monument / plaque / heritage," fits Manzil = destination. (Not on the reflex-reject list.)
- **UI / labels** — `Geist`: nav, buttons, small labels, numerals (tabular).
- **Body / prose** — `Inter`: paragraphs, descriptions (existing committed body font).
- Scale: fluid `clamp()`, ≥1.25 ratio, display max ~clamp(40px, 6vw, 84px). Letter-spacing floor −0.02em on display. `text-wrap: balance` on h1–h3, `pretty` on prose. Body 62–72ch.

## Motion

Purposeful, exponential ease-out (no bounce). Choreographed reveals that fit what they reveal (stagger a list, rise a headline) — never one uniform fade on every section. **Content is visible by default; reveals are enhancement** (JS-gated start state + timeout fallback + reduced-motion crossfade). The arch device animates on hero load once, not on every scroll.

## Layout

Fluid `clamp()` spacing that breathes; vary rhythm (generous section gaps, tight groups). Asymmetric hero (type-led, arch device off-axis). Avoid identical card grids — use editorial two-column splits, a real 3-step sequence where order carries meaning, and `repeat(auto-fit, minmax(280px,1fr))` only where cards are genuinely the right affordance. Semantic z-index scale. Max content width ~1200px; hero can go wider.

## Components

- **Arch device** — SVG nested portal (black outer + gold inner), used as the hero backdrop and as section top-caps. The brand's load-bearing motif.
- **Buttons** — teal solid (primary), hairline ghost (secondary), gold reserved for one high-intent CTA per page.
- **Section headline** — Libre Caslon display, no all-caps eyebrow above it (the eyebrow trope is banned); lead with the headline, support with one line of Inter.
- **App download** — a single decisive block (store badges), appearing once site-wide, not repeated per page + footer.
