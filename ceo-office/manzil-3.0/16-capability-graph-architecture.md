# 🧠 MANZIL — Capability Graph & Decision Engine Architecture (v1.0)

> Captured 2026-08-06. Post-launch (Expand-phase) backend architecture extending
> ADR-001's Tool Orchestrator with its internal decomposition. First
> implementation ADR lands when capability-engine work begins. **Does not affect
> the in-flight web launch.**

## The Fundamental Shift

Businesses are not listings — they are **Experience Providers** exposing structured **capabilities**. The platform stops thinking in business listings and starts thinking in what each provider can actually do.

```text
Restaurant: cuisine=Italian · capacity=150 · birthday_friendly=YES · private_rooms=3 ·
projector=YES · cake_allowed=YES · parking=YES · kids_area=NO · avg_stay=2h ·
price=$$ · noise=medium · reservation=required · outdoor=YES · wheelchair=YES
```

Reviews tell humans stories; capabilities let Gurman **reason**: "Replace the venue" → read current venue's satisfied constraints (capacity ≥ 80, parking, private room, outdoor, $$) → query providers satisfying them → return 3 scored alternatives (97% / 94% / 91% fit against the current plan), not random restaurants.

## Why booking sites fail

They model `search → business → book` (linear). Users think in constraints and missions: "somewhere for 18 people" · "halal" · "quiet" · "replace the restaurant but keep everything else." That is a different problem — a **decision engine**, not a directory.

## Capability Graph (per provider)

Venue example: capacity, parking, indoor/outdoor, decoration, lighting, music, generator, stage, smoking, alcohol, halal, prayer room, child area, wheelchair, opening hours, time slots, booking rules. Not reviews — capabilities.

## Mission-based Discovery

Discovery sections are **missions, not categories**: Nearby · Trending · New · Hidden Gems · Perfect for You · Birthday Ready · Coffee · Weekend · Romantic · Family · Late Night · Student Budget · Luxury · Outdoor · Open Now. One infinite mixed feed (story → restaurant → video → event → collection → creator → package → AI recommendation), TikTok × Pinterest × Maps.

## Business Page = "Can this place solve my problem?"

Perfect For (birthday ✓ anniversary ✓ family ✓ business dinner ✓ date night ✓) · Capabilities grid · Available Today slots · then stories/videos/reviews/menu/AI suggestions.

## AI Profile per business (not user-visible)

Generated from reviews + menu + photos + owner data + attributes + feedback; stored; read instantly by Gurman: "Italian. Great for birthdays. Average group 6–20. Fast service. Private room. Excellent desserts. Busy weekends. **Weak parking.** Kids welcome. Outdoor in summer."

## Structured review extraction

Review text becomes signals: "Parking was terrible" → `parking_score -1`; "Staff handled birthday perfectly" → `birthday_service +1`. The capability graph gets richer with every review.

## Two search engines

Normal search ("Pizza") and AI search ("I need somewhere for 25 people under $300 tonight") are different engines.

## The architectural rule: Gurman never searches listings

```text
USER → Gurman AI → Tool Orchestrator →
  Capability Engine · Availability Engine · Ranking Engine · Booking Engine
    → Business Knowledge Graph
      → Business Profile · Capabilities · Reviews & Signals
        → Stories · Menu · Photos · Hours · Pricing · Owner Data
```

The AI never manually filters businesses; it asks specialized services. Recommendations arrive with reasoning attached (feeds the Confidence Indicator).

## Positioning

Most discovery platforms are lists of businesses; most AI assistants are chat interfaces. **Manzil is a decision engine** — structured knowledge + Gurman reasoning lets users build, replace, optimize, and book complete experiences with confidence. Direct continuation of: Discover → Plan → Experience · Workspace at the center · Manzil sells confidence, not information.

## Sequencing

Expand phase, after web Genesis + mobile foundation. Implementation order will follow evidence: capability schema on the existing NestJS API → structured review extraction → ranking → availability → booking engine (all as Tool Orchestrator tools; each significant step gets its ADR).
