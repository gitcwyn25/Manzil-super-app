# Mobile Design Research - July 2026

These notes summarize the design direction for Manzil's Android consumer app as of 2026-07-25.

## Primary Direction

Manzil should feel like a premium local guide, not a generic directory. The app should combine clear Android-native structure with rich place content: photos, ratings, neighborhood cues, opening status, prices, and trusted local signals.

## Current Mobile Design Signals

### 1. Adaptive Android is now table stakes

Google's current Android guidance pushes apps to adapt by window size, posture, density, and font scale rather than assuming one phone shape. For Manzil, this means:

- Design phone screens first, but define tablet/foldable behavior early.
- Use bottom navigation on phones and consider navigation rail or two-pane layouts on larger windows.
- Keep search results, business detail, and concierge flows usable in landscape and multi-window.
- Avoid fixed-height layouts that break when text size increases.

Sources:
- https://developer.android.com/develop/adaptive-apps/guides/get-started-with-adaptive-apps
- https://developer.android.com/develop/adaptive-apps/guides/adaptive-dos-and-donts
- https://android-developers.googleblog.com/2026/05/android-adaptive-development-ecosystem.html

### 2. Material 3 Expressive favors clear hierarchy plus motion

Material 3 Expressive points toward more personal, fluid, glanceable Android interfaces. For Manzil, use this carefully:

- Let color and shape highlight high-value actions, not every card.
- Use lively microinteractions for search, filters, saved places, and concierge responses.
- Keep business cards calm and readable because people compare many listings at once.
- Use dynamic color only if it does not weaken the Manzil teal/gold brand.

Sources:
- https://blog.google/products-and-platforms/platforms/android/material-3-expressive-android-wearos-launch/
- https://android-developers.googleblog.com/2025/10/material-3-adaptive-120-is-stable.html

### 3. AI should be a utility, not the whole interface

For consumer local discovery, AI works best when it compresses choices:

- "Where should I go now?" with location, hours, budget, and mood.
- Summary blocks on business pages based on reviews and facts.
- Smart filters such as family-friendly, quiet, halal, late-night, or good for meetings.
- Suggested itineraries for tourists and locals.

The main app must still work as a fast manual directory.

### 4. Trust beats novelty

Consumer platforms win when people believe the content. Prioritize:

- Review count and recency.
- Verified business status.
- Real place photos.
- Open/closed state.
- Distance and neighborhood.
- Clear report/correction paths.
- Transparent sponsored placements when monetization starts.

### 5. Android-specific polish

- Back behavior must feel predictable across tabs, stacks, sheets, and modals.
- Search should keep state when users move between list, map, filters, and detail.
- Bottom sheets are ideal for filters, quick business previews, and map result cards.
- Use haptics sparingly for saved places, review submission, and important confirmations.
- Keep tap targets at least 48dp and preserve safe-area spacing.

## Design Watchlist

- Adaptive layouts for foldables and tablets.
- Material 3 Expressive component styling.
- Map/list hybrid discovery patterns.
- Voice and AI-assisted search.
- Offline/lightweight saved lists for travelers.
- Review quality signals and anti-spam UX.

## Immediate Next Design Work

1. Define the first five core screens: Home, Search, Business Detail, Review Flow, Profile/Saved.
2. Create low-fidelity wireframes for Android phone.
3. Define empty, loading, error, and permission states.
4. Map adaptive behavior for foldable/tablet widths.
5. Convert shared brand tokens into React Native theme tokens.
