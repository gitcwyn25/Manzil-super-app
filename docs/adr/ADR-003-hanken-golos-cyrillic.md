# ADR-003: Hanken Grotesk + Golos Text as the web font stack (Cyrillic strategy)

**Date:** 2026-08-05 · **Status:** Accepted

## Context

The Vibrant Marketplace design system specifies Hanken Grotesk for all typography. Hanken Grotesk ships no Cyrillic glyphs; the site is trilingual (uz/ru/en) and Russian is entirely Cyrillic. An unhandled fallback would silently render ru in system-ui, breaking the one-system-across-locales property.

## Decision

Load both fonts via next/font (self-hosted at build, CSP-clean): Hanken Grotesk (latin; 400–800) and Golos Text (cyrillic + latin; 400–700). Font stack: `"Hanken Grotesk", "Golos Text", system-ui, …` — Latin resolves from Hanken, Cyrillic falls through to Golos deterministically. Existing CSS variable names (`--font-sans`, `--font-display`, `--font-data`) are retained as aliases so no consumer breaks; IBM Plex Mono is dropped.

## Reasons

- Deterministic Cyrillic rendering on every platform instead of the system-ui lottery.
- Golos Text was already in the product (prior body font): visually compatible grotesk, excellent Cyrillic, zero new licensing.
- Self-hosting via next/font satisfies the strict `font-src 'self'` CSP.

## Alternatives considered

Accept system-ui fallback for ru — rejected (breaks design uniformity for a third of the audience). Self-host a custom Cyrillic cut of Hanken — rejected (no official cut exists; forking a font is unjustified maintenance).

## Consequences

ru/uz-Cyrillic text renders in Golos Text; latin text in Hanken Grotesk. Reviewers should check mixed-script lines (e.g. brand names in Latin inside Russian sentences) for weight harmony.
