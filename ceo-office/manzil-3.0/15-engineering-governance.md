# 🛡️ MANZIL 3.0 — Engineering Governance (v1.0)

> Captured 2026-08-05. The corpus has shifted from ideas to **governance**: once a
> principle enters the Bible and the implementation order is fixed, designers and
> engineers don't reinterpret the vision every sprint. These rules prevent silent
> drift as parallel work progresses.

## 1. Architecture Decision Records (ADRs)

Every significant technical decision gets an ADR (status, reason, alternatives, decision). Log lives at `docs/adr/` in the repo. Seeded 2026-08-05 with ADR-001 (Tool Orchestrator), ADR-002 (Bootstrap-not-Tailwind for web), ADR-003 (Hanken + Golos Cyrillic strategy).

## 2. Design Tokens Frozen Early

No team invents spacing, colors, radii, or animation timings. Everything references a token (`color.surface.primary`, `space.16`, `radius.large`, `motion.fast`, `shadow.level2`). Disciplined tokens = cheap redesigns forever. *(Already binding on web: adoption plan D2/D12; foundation task enforces.)*

## 3. Feature Flags From Day One

`AI_ENABLED · STORIES_ENABLED · BOOKINGS_V2 · VOICE_ASSISTANT · PAYMENTS · SMART_PLAN_WORKSPACE · VIDEO_FEED` — deploy unfinished capabilities safely, no long-lived branches.

## 4. North Star Metric

> **Completed Experiences per Monthly Active User (CE/MAU)**

A completed experience = booked barber, completed birthday plan, attended reservation, finished hotel stay, other verified plan. Aligns every team on meaningful outcomes, not engagement for its own sake. Pairs with "Manzil sells confidence, not information."

## 5. Tool Orchestrator Is a Platform, Not an AI Feature

Manzil's operating system. Eventual tool surface: Business Search, Booking, Payments, Calendar, Maps, Messaging, Notifications, Reviews, Recommendations, Weather, Availability, Merchant Analytics. Any future AI model uses the same tool contracts with zero business-logic changes.

## 6. Validate the Smart Plan Workspace Before Building Around It

Prototype + user-test four questions: Do users understand it quickly? Do they return to an existing plan instead of starting over? Do they share plans? Does it reduce steps to organize an event? Four yeses = durable differentiator.

## ⭐ ADOPTED EVOLUTION (user, 2026-08-05): Workspace → Timeline

Not a checklist — a **timeline** users revisit before, during, and after the event:

```
Birthday — Saturday
10:00 Invite friends ✔ · 11:30 Cake confirmed ✔ · 13:00 Taxi reserved ✔
15:00 Venue deposit paid ✔ · 18:00 Dinner reservation · 21:00 Photo memories
Next day: leave review · Next year: duplicate this experience
```

Natural, non-intrusive hooks for reminders, updates, and post-event engagement. (Extends the Experience Platform, doc 13.)

## v1.1 amendments (2026-08-05, adopted)

- **ADR bar:** write an ADR only when a decision is hard to reverse, affects multiple teams, changes public interfaces, infrastructure, security, or product philosophy. Everything else is implementation notes.
- **AI audit shape:** every Gurman action logs `{principal: gurman-ai, action, resource, result, userApproval}` — the RBAC-principal choice (ADR-001) exists to make this trivial and to future-proof more autonomous capabilities.
- **Supporting metrics** under CE/MAU: **TTFCE** (time to first completed experience), **PCR** (plan completion rate), **RAR** (recommendation acceptance rate) — they explain *why* the north star moves.
- **Workspace Timeline is a domain model, not a UI feature.** It has become the object the product revolves around; model it as its own entity with its own lifecycle.
- **Queued ADR-004 (write when Workspace implementation begins):** how timelines are recorded — full event sourcing vs append-only activity log. Immutable events (Workspace Created → Venue Added → Budget Updated → Guest Invited → Booking Confirmed → …) make history, collaboration, notifications, undo, and analytics cheap later. Decision deferred to implementation start, deliberately.
- **Scope discipline:** critical path is Foundation → component kit → web launch → WOW Flow → Workspace prototype/validation → Tool Orchestrator capabilities for it. Everything else justifies its place on that path before getting engineering attention.
- **Review mode from here:** tangible artifacts only — screenshots, interactive prototypes, build logs, user feedback, implementation decisions.

## v1.2 amendments (2026-08-05, adopted — final pre-implementation set)

- **The repository is the product.** Source-of-truth hierarchy: Product Bible → ADRs → source code → running product. Code and docs must never silently drift — update one or the other, deliberately.
- **Main stays deployable.** Every commit to `main` is deployable; incomplete features hide behind routing, flags, permissions, or UI guards. No long-lived branches accumulating weeks of work.
- **Evidence discipline.** `docs/evidence/` captures each milestone: screenshot, build number, commit SHA, performance snapshot, user feedback, decision made, follow-ups. The record of *why* the product evolved — feeds investor updates, retros, onboarding.
- **Foundation freeze.** When the Foundation layer lands, it is FROZEN as a versioned dependency (git tag `design-foundation-v1.0`). It evolves only through intentional versions (v1.1, v1.2…), never ad hoc per-screen tweaks. Screens adapt to the Foundation, not vice versa.
- **Advisor role shift:** from planner to design/architecture reviewer — reviewing screenshots, wireframes, mobile architecture, APIs, AI flows, edge cases, performance, accessibility; challenging assumptions with user-testing evidence.

## After the web build is green

Shift entirely to **Epic 1: WOW Flow** — treat that flow as if it were the entire product. Every animation, transition, copy choice, AI interaction, and loading state polished until exceptional. Install → first meaningful planned experience with confidence and near-zero friction = the core of Manzil validated.
