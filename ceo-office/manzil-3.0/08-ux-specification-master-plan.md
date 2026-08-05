# 🧭 MANZIL MASTER PLAN & UX SPECIFICATION — v1.0

> Captured 2026-08-05. **Planning stops here** (user decision): Phase 0 documentation
> is complete; every subsequent deliverable is a production artifact. Think in
> **user journeys**, not screens — the product revolves around goals.

## The Master Plan

```
Phase 0 ✓ Product Bible · IA · AI Bible · Tech Architecture · Design System · Component Library · Screen Bible
Phase 1   UX Specification
Phase 2   Wireframes
Phase 3   High-Fidelity UI
Phase 4   Interactive Prototype
Phase 5   Development
Phase 6   Beta Testing
Phase 7   Launch
```

## Canonical Journeys

1. **Discovery-led:** open app → discover → watch video → ask AI → book → pay → review → share story.
2. **AI-led event:** open app → talk to AI → birthday → budget → compare packages → book everything → receive reminders → complete event.
3. **Intent-led service:** need haircut → voice input → nearby → compare → book → navigate → review.

**Every journey specifies:** user goal, business goal, AI role, required data, required permissions, edge cases, offline behavior, accessibility, analytics, success criteria.

## Product States

Every feature defines ALL states. A Business Profile alone: loading, loaded, offline, business closed, no reviews, fully booked, temporarily closed, new business, verified, premium, sponsored, favorite, visited, not visited — each with its own UI.

## Motion Map

Every transition planned (splash → logo builds → fade → onboarding → card slides → registration → home), down to micro-interactions (press → scale 98% → haptic → glow → success).

## AI Journey — the project manager, not a chatbot

Birthday → asks 3 questions → searches → compares → negotiates → books → creates timeline → adds reminders → sends invitations. **The user sees progress, not raw AI output.**

## Business Journey

Register → verification → profile setup → media upload → receive bookings → analytics → respond to reviews → promotions → growth insights.

## ADOPTED DIFFERENTIATOR (user, 2026-08-05): Smart Plan Workspace

The AI doesn't produce a single answer — it creates a **living plan**:

```
Birthday ──────────────
Venue ✓   Cake ✓   Taxi ⏳   Flowers ⏳   Photographer ✓   Music ⏳
Budget: 2.6M / 3.0M UZS          [Continue Planning]
```

The plan updates over time; friends can join; businesses confirm; the AI revises. The workspace is the center of every complex task. *(Web seed: the deferred package-panel slot on `/concierge` is exactly where this lands once the Gurman package API ships.)*

## Development Order (epics)

1. **Foundation** — splash, onboarding, login, permissions, interests
2. **AI** — persistent input, conversation, voice, AI planning
3. **Discovery** — For You feed, Nearby, search, collections
4. **Business** — profiles, stories, reviews, menus, events
5. **Booking** — availability, booking, payments, receipts, reminders
6. **Social** — user profiles, stories, followers, collections
7. **Merchant** — dashboard, analytics, promotions, team management

## Next Deliverables (in order — tangible artifacts only)

1. Complete user flows (every tap, gesture, transition)
2. Low-fidelity wireframes for all core journeys
3. High-fidelity Figma-ready screen specifications
4. Production-ready mobile design system
5. Feature-by-feature implementation

Planning has reached diminishing returns; the highest-value work is turning strategy into flows, reusable UI, and working software to test with users.
