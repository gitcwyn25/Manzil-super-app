# 👥 MANZIL — Collaborative Workspace (Multiplayer Planning, v1.0)

> Captured 2026-08-07. Potentially the biggest differentiator: **planning is multiplayer**, but almost every platform assumes one person books. Friends decide where to eat, couples plan weekends, families choose hotels, colleagues organize lunch, groups vote on venues, travelers argue over itineraries.

## Object model shift

Not `User → Workspace → Booking` but the **Workspace as the central object**:

```
Workspace
  ├── Owner
  ├── Members
  ├── Guests
  ├── AI (Gurman)
  └── Businesses
```

Evolved chain: `Workspace → Participants → Businesses → Offers → Negotiations → Bookings → Experience`.

## ⭐ BINDING DESIGN PRINCIPLE: solo is the default

A user must be able to create a Workspace and complete everything alone with **zero extra friction**. Collaboration is optional and additive: start alone → invite anyone at any time → Gurman shifts seamlessly from assistant to mediator. Manzil must work identically well for one coffee and for a wedding with dozens of participants.

## Gurman as moderator, not assistant

With multiple voices ("Italian" / "no Italian" / "outdoor seating" / "under $20"), Gurman reconciles rather than obeys the last speaker — returning options satisfying the *set* of constraints and naming which ones it satisfied.

**Capabilities this unlocks:**

- **Voting** — 👍 like · 👎 skip · ⭐ favorite · 🤔 maybe, aggregated per candidate; the AI observes the tally as signal.
- **Explained replacement** — rejections carry reasons ("too expensive", "too far"), so a replacement states what it *kept* (outdoor), *removed* (expensive), and *added* (rooftop, live music). Reuses Epic 08's Replacement Engine + reason codes.
- **Constraint negotiation** — conflicting budgets ($70 / $25 / $40) surface as a detected conflict with a proposed compromise, not a silent averaging.
- **Availability matching** — intersect everyone's dates/times → the slot that actually works for all.
- **Location optimization** — a true meeting point minimizing everyone's travel, not "nearest to me".
- **Preference aggregation** — merge member profiles (coffee lover · vegetarian · luxury · no seafood) into a group constraint set (Tier-2 Preference Context per member, merged at reasoning time).
- **Decision history** — rejected options and *why* (too loud, too expensive, no parking) become learning signals (Epic 10).
- **Live collaboration** — Google-Docs-style presence: who is editing, who added guests, who changed the date, who voted.

## Business side: richer than a reservation

A business receives the Workspace intent — "birthday · 7 guests · $250 budget · 7 PM preferred · cake · balloons · parking" — and can **propose** rather than merely accept: rooftop instead of live music (+$30), cake included, free decorations. The Workspace updates in real time; Gurman becomes an active negotiator, returning a confirmed composite ("can host 7, Saturday 7 PM, cake included, parking, 10% discount, owner confirmed").

## Lifecycle amendment

**Discover → Collaborate → Plan → Book → Experience → Remember.** "Collaborate" is the stage where people collectively shape the experience *before* any booking exists.

## Dependencies

Sits on the Workspace Timeline (domain model, Epic 03 contracts), the Reasoning Engine's constraint/replacement machinery (Epic 08), memory tiers per participant (Epic 05), and — for real-time presence — the WebSocket/notification infrastructure queued at M5. Implementation follows the booking engine (M6); the multi-participant data model should be designed into the Workspace tables from their first migration rather than retrofitted.
