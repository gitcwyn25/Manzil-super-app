# MANZIL 3.0 — AI Lifestyle Agent (Product North Star)

> **Adoption status (2026-08-05, execution notes — Claude):** Adopted as the product
> north star. It does NOT preempt tonight's web launch on the Stitch "Vibrant
> Marketplace" design (user-approved, in flight). Two conflicts this doc raises are
> resolved as follows unless the user overrides:
>
> 1. **Mobile stack** — doc proposes React Native/Expo; the existing consumer app is
>    Kotlin/Compose (22 tasks, 155 green tests, 4.4MB R8 APK, shipped 2026-08-04).
>    Decision: keep Kotlin/Compose and adopt 3.0 UX concepts natively (Reanimated-class
>    motion is achievable in Compose). An Expo rewrite is a user-level decision with
>    real cost — parked, not adopted.
> 2. **Visual identity** — doc proposes dark-first Obsidian `#0C0D0F` / Gold `#C9A84C` /
>    Cream `#F5F0E6`; the approved web design is light Electric Blue (Vibrant
>    Marketplace). Decision: web ships Vibrant Marketplace now; all styling lands in
>    design tokens so an identity swap later is a token-file change. Obsidian-gold is
>    the leading candidate for the 3.0 unified identity exploration.
>
> Near-term sequence: web live on Vibrant Marketplace → Gurman AI orchestration API
> (intent → search → plan → book) surfaced on the web `/concierge` first → MCP plugin
> (`stitch_local_deal_marketplace/manzil_mcp_plugin_spec.txt`) → mobile 3.0 phases.

---

The most important design decision is this:

> **The AI should not be another feature. Gurman AI should be the operating system of the app.**

Instead of navigating through dozens of tabs, users simply talk to Gurman AI, while widgets, feeds, and cards appear around the conversation.

## Core Principle

```
Everything starts with AI.
Navigation is secondary.
Content appears when needed.
```

Opening the app shows a greeting, one AI input ("What are we planning today?"), and a trending feed — no bottom tab bar, only floating widgets (Nearby, Saved, Booking, Wallet).

## Positioning

> **Manzil isn't a business discovery app.**
> **Manzil is an AI Lifestyle Agent for Uzbekistan.**

Everything else becomes a capability of the AI. The goal isn't to list businesses — it's to complete the user's task. Users think in intents (I need a haircut / dinner / flowers / a birthday / a dentist / a hotel), and the interface revolves around intents, not pages.

The canonical interaction:

```
User: Tomorrow is my mother's birthday. Budget: 3 million UZS. Need everything.
Gurman AI: ✓ Venue for 12 ✓ Cake ✓ Flowers ✓ Taxi ✓ Photographer ✓ Reservation ✓ Reminder ✓ Payment — Everything booked.
```

Manzil compresses Instagram + Telegram + maps + taxi apps + phone calls + payment apps + review sites into one conversation.

## User Journey (mobile 3.0)

1. **Splash** — black background, golden Manzil logo, particle animation, ~2s.
2. **Onboarding** — animated video cards (not slides): "Discover places people actually love" / "AI plans everything: venue, taxi, cake, photography — one conversation" / "Experience Uzbekistan in a completely new way". Glass morphism, card depth.
3. **Registration** — Continue with Apple / Google / Telegram / Email; ask only what's necessary; after login: "What should we call you?"
4. **Permissions** — beautifully explained cards (location, microphone for voice AI, camera, gallery, notifications, contacts-optional), not raw OS popups.
5. **Interests** — Pinterest/TikTok/Spotify-style large cards (Food, Coffee, Nature, Luxury, Sports, Fashion, Travel, Photography, Nightlife, Events, Gaming, Study, Kids, Pets) with pop/expand animations. AI personalization starts immediately.
6. **Home** — no nav bar; floating magnetic widgets; center is an infinite TikTok-style vertical feed of businesses (video, photos, reviews, menus, offers, events); persistent Gurman AI input at the bottom (text + voice + attach), ChatGPT-voice-mode style, never disappears.

## Gurman AI behaviors

Animated states: idle dot, listening waveform, thinking (orbiting dots), searching ("Finding the best places…"), booking ("Calling venue…"), negotiating ("Comparing offers…"), success (confetti). The booking progress animation (tiny Gurman runs → compares prices → calls → negotiates → 🎉 Booked!) replaces spinners.

**AI Planning Screen**: itemized timeline (venue/cake/taxi/photographer/DJ/decorations with prices) against the stated budget, one "Book Everything" button. Conversational modifications ("Move dinner to Friday and make it cheaper") update the whole plan.

## Product Ecosystem — six pillars

1. **Discovery** — useful-content "For You" feed (TikTok/Xiaohongshu): watch → save → ask AI → book.
2. **Gurman AI** — the competitive advantage: itineraries, event planning, budget optimization, multi-business booking, comparison, negotiation assistance, reminders, conversational edits.
3. **Social layer** — profiles, followers, saved/visited, reviews, stories, short videos, collections; businesses gain authentic visibility via UGC.
4. **Business Operating System** — SaaS dashboard: bookings, reservations, analytics, promotions, messages, AI-generated replies, campaigns, occupancy calendar, revenue, review management.
5. **Marketplace** — beyond restaurants: taxis, photographers, florists, decorators, DJs, makeup artists, hotels, doctors, mechanics, lawyers, tutors. Anything bookable becomes bookable.
6. **AI Workspace** — saved living plans (Birthday, Vacation, Wedding, Business trip, Weekend) the AI remembers and updates.

## Business pages

Instagram meets Airbnb: large cover video, stories, highlights, menu, reviews, map, events, offers, booking, chat, AI summary ("Why people love it: ✔ amazing steak ✔ fast service ✔ quiet ✔ great for dates"). Reviews are AI-summarized ("95% recommend"), pros/cons, photo/video/voice reviews.

## User profile

Instagram-style: header, level/explorer gamification, stats (places, reviews, followers, following), badges (Food Expert, Coffee Hunter, Traveler), visited-cities map, collections, bookings, stories, achievements.

## Visual style (3.0 candidate identity)

Dark mode first. Obsidian Black `#0C0D0F`, Gold `#C9A84C`, Cream `#F5F0E6`. Glass cards, blur, 28px radii, huge spacing, floating shadows, Dynamic-Island-style animations, micro-interactions everywhere.

**Motion**: spring transitions, shared elements, liquid morphing buttons, card stacking, floating/magnetic widgets, haptics, hero transitions, AI typing with particles, video crossfades, parallax, context-aware blur.

## Suggested technology stack (mobile 3.0 proposal)

React Native + Expo (Expo Router, Reanimated 4 + Gesture Handler + Moti, FlashList, Expo Video, Mapbox/Google Maps) — **see adoption note: Kotlin/Compose retained for now.**
Backend: NestJS, PostgreSQL, Meilisearch, Redis + WebSockets, AI orchestration with MCP tools, service-oriented so new verticals (healthcare, travel, education) slot in without redesign:

```
App → NestJS API Gateway → Redis → AI Agent → Booking / Payment / Notification services → PostgreSQL / Meilisearch / Object Storage / Analytics
```

## Development roadmap (mobile 3.0)

| Phase | Goal |
| ----- | ---- |
| 1 | Design system, onboarding, authentication, permissions, interests |
| 2 | AI-first home screen, floating widgets, TikTok-style business feed |
| 3 | Business profiles, stories, reviews, user profiles |
| 4 | Gurman AI planner, package generation, booking workflow |
| 5 | Payments, loyalty, notifications, analytics, performance optimization |

## Revenue model

| Revenue | Description |
| ------- | ----------- |
| Booking commission | Percentage on completed reservations |
| Sponsored placement | Paid visibility, clearly labeled |
| Premium business subscriptions | Analytics, CRM, AI tools, promotions |
| AI Concierge subscription | Unlimited advanced planning |
| Local advertising | Contextual ads in discovery |
| Payment processing | Small transaction fee |
| Gift cards | Digital gift experiences |
| Event packages | Curated bundles (birthday, wedding, travel) |

## Long-term AI vision

Proactive, not reactive: "Your passport expires in two months." / "You usually get a haircut every four weeks — book the same barber?" / "Traffic is heavy, leave 20 minutes earlier." / "The café you liked has 20% off today."

## Differentiators to add

- **Collaborative planning** — friends vote on venues, split payments, co-edit plans.
- **Smart collections** — AI auto-groups saved places ("Date Night", "Study Cafés", "Weekend Trips").
- **Explainable recommendations** — show *why* ("matches your budget", "quiet", "visited by 4 friends").
- **AI-generated itineraries** — half/full-day plans with travel time built in.
- **Context memory** — "same place as last time", "my usual barber".
- **Trust & authenticity** — verified reviews, fraud detection, clear sponsored labels.
- **Offline resilience** — cache bookings, maps, saved plans.

## Three-year roadmap

| Stage | Objective |
| ----- | --------- |
| Year 1 | One city: AI planning, discovery feed, business profiles, reviews, bookings. Relentless PMF focus. |
| Year 2 | Expand across Uzbekistan: business subscriptions, loyalty, collaborative planning, richer AI automation. |
| Year 3 | Regional AI lifestyle platform: travel, healthcare, education, government services, cross-border — Gurman AI stays the central interface. |

## Build process

1. Product strategy → 2. Complete UX system → 3. System architecture → 4. Modular implementation → 5. Business platform → 6. Launch & growth. Treat it as a **product design system first**, so hundreds of screens stay coherent.
