# ADR-002: Bootstrap 5.3 Sass expresses the Vibrant Marketplace design; no Tailwind

**Date:** 2026-08-05 · **Status:** Accepted

## Context

The user-approved Stitch "Vibrant Marketplace" export is Tailwind-CDN HTML. The web app (apps/web) is built on Bootstrap 5.3 compiled from Sass with token-level variable overrides (established across the Anor foundation work and retained through the design pivot).

## Decision

The Stitch design is re-expressed through Bootstrap Sass variable overrides plus a small custom-property/utility layer (`_tokens.scss` → `vibrant.scss`). Tailwind is not introduced. Stitch `code.html` files are structure references only; rendered `screen.png` files are the visual truth.

## Reasons

- A mid-flight framework migration would risk every already-converted page for zero user-visible gain.
- Token-level theming keeps future identity swaps (e.g. obsidian/gold unification with mobile 3.0) a token-file change.
- Strict CSP (self-hosted only) already prohibits the export's CDN dependencies regardless.

## Alternatives considered

Adopt Tailwind alongside Bootstrap — rejected (two utility systems, doubled bundle and mental load); full Tailwind migration — rejected (weeks of churn mid-launch).

## Consequences

Implementers translate Tailwind utilities to Bootstrap idioms per the foundation token mapping (`.superpowers/sdd/2026-08-05-vibrant-marketplace/review-foundation.json`).
