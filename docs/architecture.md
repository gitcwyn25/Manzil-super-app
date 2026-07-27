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
