# 📘 MANZIL USER FLOW BIBLE — v1.0 (charter)

> Captured 2026-08-05. Option B chosen: design the ENTIRE experience first, then
> every screen. The UX Blueprint (doc 10) defines the philosophy; the User Flow
> Bible defines **every action** — the last planning document before building.

## Production-grade flow standard

Not "Home → Business" but:

```
User opens app → Home loads → greeting animates → Nearby widget loads →
AI suggestions appear → For You videos preload → user scrolls →
business video expands → business profile opens → user taps "Ask Gurman" →
AI opens → business context injected → AI answers → booking starts
```

Every flow at this resolution. Every flow becomes: a QA test, a developer build order, a designer animation sequence.

## Contents

1. **Authentication flows** — first launch, returning user, password reset, device change, social login, guest mode, logout.
2. **Discovery flows** — infinite feed, search, nearby, saved, collections, categories, following.
3. **AI flows** — chat, voice, camera, planner, budget planning, multi-step bookings, follow-up, replanning.
4. **Booking flows** — restaurant, barber, hotel, doctor, event, birthday, wedding.
5. **Merchant flows** — registration, verification, calendar, bookings, promotions, analytics.
6. **Social flows** — stories, reviews, videos, followers, comments, collections.
7. **Payment flows** — card, wallet, refund, coupon, split payment.
8. **Error flows** — no internet, AI unavailable, booking failed, payment declined, business closed.

## ADOPTED ADJUSTMENT (user, 2026-08-05): Context-aware persistent AI input

The AI input is always present but never generic — its prompt adapts to context:

- For You feed → "Ask about this place…"
- Business profile → "Book, compare, or ask about this business…"
- Active booking → "Need to change your reservation?"
- Completed plan → "Anything else to add to your plan?"

Persistent AND helpful, because it understands where the user is.

## Implementation order after this document (planning ends)

1. Complete User Flow Bible → 2. Low-fi wireframes → 3. High-fi Figma specs → 4. Mobile implementation → 5. NestJS backend → 6. AI integration → 7. Merchant platform → 8. Beta → 9. Launch.
