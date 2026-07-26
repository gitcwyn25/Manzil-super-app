# Android Design

This folder is the design office for the Manzil Android consumer app.

The production code lives in [apps/mobile](../../../apps/mobile/). This folder holds the product design direction, research notes, screen plans, and Android-specific UX decisions before they become implementation work.

## Current Goal

Build a consumer platform for local discovery in Uzbekistan: find trusted places, compare options quickly, read useful reviews, and get AI help when search is too slow.

## Design Pillars

- Local trust first: ratings, verification, real photos, review counts, open status, and neighborhood context should be visible before decorative UI.
- Fast discovery: home, search, filters, map/list switching, and saved places must be reachable with low friction.
- Android-native feel: respect Material 3 patterns, system back behavior, safe areas, dynamic type, accessibility, and predictable bottom navigation.
- Adaptive from day one: phone is the main surface, but layouts should not break on foldables, tablets, landscape, or multi-window.
- Uzbek-first localization: Uzbek Latin and Cyrillic text can be longer than English labels, so components must flex and wrap cleanly.

## Starter Documents

- [research-notes-2026-07.md](research-notes-2026-07.md): current mobile design research and Android direction.
- [screen-map.md](screen-map.md): first consumer app screen inventory and priorities.

## Source Design System

Use the brand rules from [marketing-office/brand-identity/manzil_design_system/DESIGN.md](../../../marketing-office/brand-identity/manzil_design_system/DESIGN.md), especially:

- Deep teal as the primary action/navigation color.
- Warm gold for ratings, verification, and rare high-priority actions.
- Off-white surfaces with white cards for local-business content.
- Geist/Inter typography where supported by the mobile stack.

## Implementation Notes

- App stack: Expo, React Native, React Navigation, Zustand, Clerk, shared Manzil copy/types.
- Android app code: [apps/mobile](../../../apps/mobile/).
- Before code changes, check the versioned Expo docs noted in [apps/mobile/AGENTS.md](../../../apps/mobile/AGENTS.md).
