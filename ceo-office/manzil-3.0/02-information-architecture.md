# 🗺️ MANZIL INFORMATION ARCHITECTURE — v1.0

> Captured 2026-08-05. Defines every major area of the application, how users move
> between them, and how Gurman AI is integrated into every journey. IA before
> screens: decide **what exists**, then **how it looks**.

## Core Navigation Philosophy

No traditional bottom navigation bar. Navigation is built around three permanent surfaces:

1. **Gurman AI** (persistent)
2. **For You** (discovery)
3. **Nearby** (context-aware)

Everything else appears as floating widgets, contextual chips, search overlays, or profile shortcuts.

**ADOPTED REFINEMENT (user, 2026-08-05):** Home, For You, and Nearby are NOT separate destinations — they are three interchangeable **modes of one adaptive home experience**, switched by segmented control or horizontal gesture, sharing one layout and the persistent AI input:
- **Discover** — personalized videos, stories, trending, recommendations
- **Explore Nearby** — live map with contextual suggestions and local offers
- **Plan with AI** — the conversational workspace where Gurman AI completes tasks

Feed inspires · map grounds · AI completes. Cohesion over context-switching.

## Application Map

```
Launch ─ Splash → Onboarding → Registration/Login → Permissions → Interests → AI Personalization → Home
```

## HOME (adaptive)
Greeting · AI input · smart widgets · upcoming plans · For You feed · Nearby · trending · saved collections · Continue Planning. Layout adapts to behavior and time of day.

## GURMAN AI
Chat · voice · image search · live camera · planner · package builder · booking assistant · AI memory · history · suggested actions.

## DISCOVERY (For You)
Videos · stories · photos · promotions · events · nearby · trending · following · recommended. Every item supports: Save · Share · Ask AI · Book · View Business.

## SEARCH (AI-assisted, unified)
Businesses · categories · services · events · users · collections · saved searches · voice search.

## NEARBY
Interactive map · list view · open now · deals · popular · recently opened · friends visited · AI suggestions.

## BUSINESS PROFILE
Cover · stories · gallery · videos · AI summary · services · menu · availability · reviews · events · offers · contact · directions · booking · similar places.

## BOOKINGS
Upcoming · active · completed · cancelled · AI plans · packages · tickets · receipts.

## AI PLANNER
Birthday · wedding · date night · business meeting · weekend trip · family day · graduation · travel · custom plan. Every planner can include multiple businesses and services.

## SOCIAL (Community)
Feed · stories · short videos · reviews · collections · followers · following · comments · likes · mentions.

## USER PROFILE
Overview · stories · posts · reviews · saved · collections · achievements · followers · following · activity · settings · privacy.

## MERCHANT EXPERIENCE
Dashboard · business profile · bookings · calendar · orders · analytics · promotions · messages · reviews · team · payments · settings.

## SETTINGS
Account · AI preferences · notifications · privacy · security · language · appearance · accessibility · payments · connected accounts · help · about.

## NOTIFICATIONS
Bookings · AI suggestions · stories · followers · reviews · promotions · system · reminders.

## WALLET
Payment methods · transactions · refunds · gift cards · rewards · coupons.

## ADMIN PLATFORM
User management · business verification · moderation · reports · categories · analytics · promotions · payments · AI monitoring · platform settings.

## Global Overlays (available almost anywhere)
AI quick prompt · voice input · search · share · save · booking summary · mini player (stories/videos) · floating Nearby widget · notification center.

## Cross-Cutting Principles
Every feature: reachable through Gurman AI · deep-linkable · respects accessibility settings · maintains state across sessions · degrades gracefully on slow networks · minimizes taps to task completion.

## Navigation Goals (canonical tasks)
Find and book a restaurant · schedule a barber appointment · plan a birthday with multiple services · discover nearby experiences · save places · share experiences · manage bookings and payments · ask Gurman AI for help at any point.

## Next document
🧠 AI & User Journey Bible → [03-ai-user-journey-bible.md](03-ai-user-journey-bible.md)
