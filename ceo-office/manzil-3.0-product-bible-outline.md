# MANZIL Product Bible — Outline (Mobile 3.0 Track)

> **Status (2026-08-05):** Captured as the structure for the 3.0 design-system phase.
> Companion to [manzil-3.0-vision.md](manzil-3.0-vision.md) and
> [manzil-3.0-design-prompt.md](manzil-3.0-design-prompt.md). The web launch in
> flight tonight is unaffected; this governs the next phase.
>
> **Strategic amendment adopted (user, 2026-08-05):** the TikTok-style "For You"
> feed is important but NOT the product's identity. The experience is structured
> around THREE continuously available surfaces:
> 1. **Gurman AI** — the primary way users accomplish tasks,
> 2. **For You** — discovery/inspiration (videos, stories, recommendations),
> 3. **Nearby** — live location-aware layer (businesses, offers, events around you).
> Feed inspires, map grounds, AI completes tasks — purposeful, not addictive.

A living 500+ page design & engineering specification — the single source of truth for designers, developers, AI tools, and future team members. This is how Apple/Airbnb/Uber/Linear/Spotify/Revolut/Stripe/Notion build: design system first, screens second.

## Volume 1 — Product Strategy
Vision · Mission · Values · Target market · Competitor analysis · Personas · User problems · User journey · Business model · Growth strategy · Monetization · AI strategy · Future roadmap.

## Volume 2 — Brand Identity
Logo rules · Color system · Typography · Iconography · Illustration style · Photography style · Video style · Voice & tone · Brand personality · Marketing assets.

## Volume 3 — Design System (the "Manzil HIG")
**Foundations:** spacing, grid, margins, corner radius, elevation, opacity, blur, glass effects, motion, shadows, transitions, haptics, accessibility.
**Colors:** 100+ semantic tokens — not just palette but roles: primary/hover/pressed/disabled, background/surface/surface-elevated/surface-glass, border/divider, success/warning/danger, **AI states (AI Thinking / AI Speaking / AI Booking)**, online/offline, verified, premium, sponsored, discount, popular, new, trending.
**Typography:** Display XL/L · Heading XL/L/M · Title · Subtitle · Body · Caption · Label · Button · Micro — every weight, size, spacing.

## Volume 4 — Component Library (~250 components)
**Buttons:** primary, secondary, ghost, glass, floating, AI, booking, payment.
**Cards:** business, restaurant, hotel, doctor, AI suggestion, package, story, video, review, booking.
**Inputs:** text, voice, search, chat, OTP, password, location, budget, date, time, people, price range, category.
**Navigation:** floating widgets, expandable widgets, bottom AI, context menu, drawer, quick actions, search overlay, modal sheets.

## Volume 5 — Motion System (60+ patterns)
Page enter (scale/blur/fade/depth) · business card (expand/zoom/background blur/shared element) · AI thinking (particles/orbit/glow/pulse/wave/gradient/energy ring) · booking sequence (Searching → Comparing → Negotiating → Booked, fully animated).

## Volume 6 — Screen Library (~180–250 screens)
Splash, onboarding, permissions, registration, login, OTP, interests, home, For You, search, map, business, review, booking, checkout, payment, wallet, notifications, stories, profile, settings, AI conversation, history, favorites, collections, rewards, merchant profile, merchant dashboard, admin — everything.

## Volume 7 — AI Experience
How Gurman AI behaves in every state: thinking, searching, talking, calling, booking, planning, comparing, negotiating, learning, remembering — plus voice, avatar, animation, memory, emotion, context.

## Volume 8 — Copywriting
Every word in the app, human-first ("We couldn't reach the restaurant. Let's try again." — never "Error / Retry"). Trilingual uz/ru/en.

## Volume 9 — Developer System
Per component: name, purpose, props, states, animations, spacing, accessibility, performance, API, examples. Developers never guess.

## Volume 10 — Design Tokens
Everything as code: `color.primary`, `spacing.md`, `radius.large`, `shadow.card`, `animation.spring.medium`, `typography.headingXL`. Design and code stay synchronized.

## Volume 11 — AI Prompts
Every production prompt: business recommendation, birthday planning, wedding planning, restaurant search, taxi booking, hotel booking, review summarization, fraud detection, photo moderation, translation, voice assistant.

## Volume 12 — Future Features
AR indoor navigation (malls/airports) · multi-city AI trip planning · shared family accounts · event invitations & RSVP · smart loyalty · wearables · smart-home triggers.

## Development Phases

| Phase | Scope |
| ----- | ----- |
| 0 — Foundation | Product strategy, information architecture, brand identity, design system |
| 1 — Consumer MVP | Onboarding, auth, interests, AI-first home, discovery feed, business profiles, reviews, basic bookings |
| 2 — Merchant Platform | Merchant onboarding, dashboard, booking management, promotions, analytics |
| 3 — AI Agent | Multi-step planning, package builder, voice, persistent context, automated booking workflows |
| 4 — Platform | Payments, loyalty, social, notifications, advanced analytics, third-party integrations |
