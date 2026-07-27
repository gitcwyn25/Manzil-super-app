# Manzil Design System

> Authoritative. Supersedes the removed `apps/web/DESIGN.md`.

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
| `--dust` | `#5C6C6A` | Secondary text. Must clear 4.5:1 on `--panel`. Darkened from `#6B7C7A`, which measured 3.93:1 on `--panel` and failed AA. |

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
