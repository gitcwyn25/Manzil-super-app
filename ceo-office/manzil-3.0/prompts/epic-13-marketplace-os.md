# Epic 13 — Marketplace Operating System (MOS)

> QUEUED after Epic 12. **Deliberately before the Business OS:** the Business OS serves individual businesses; the MOS serves the whole ecosystem. Gurman, the Workspace, and recommendations all depend on marketplace intelligence — building MOS first means the Business OS *consumes* demand forecasts, trust scores, campaign suggestions, and capacity insights instead of reinventing them per module.

## Vision

Passive marketplaces are `Customer → Business → Booking`. Manzil is an **active** one: `Customers → Workspaces → Marketplace Intelligence → Businesses → AI → Offers → Negotiation → Bookings`. The marketplace itself becomes intelligent — a living ecosystem managing businesses, customers, workspaces, supply, demand, prices, availability, reputation, geography, campaigns, AI, and trust.

## Implement

Supply engine · demand engine · matching engine · capacity engine · availability engine · dynamic ranking engine · marketplace trust engine · reputation engine · fraud detection contracts · offer engine · negotiation engine · promotion engine · campaign recommendation engine · marketplace analytics · health engine · liquidity engine · gap detection engine · geographic intelligence · marketplace events · KPIs · governance · policies.

Plus: business visibility · category management · tag system · quality scoring · verification · featured logic · sponsored logic · audits · moderation.

**AI:** demand/supply/capacity forecasting, recommendation + marketplace optimization, gap detection, business suggestions, campaign suggestions.

**Key engines in detail:**
- **Supply** — businesses, branches, services, capacity, schedules, availability, pricing, quality, popularity (real-time).
- **Demand** — searches, workspace requests, bookings, cancellations, reviews, seasonality, trending requests, location demand.
- **Matching** — replaces `search → results` with `demand → matching → candidates → ranking → negotiation → recommendation`.
- **Capacity** — the marketplace understands seats/rooms/appointments booked vs free.
- **Liquidity + gap detection** — "500 birthday requests vs 30 capable restaurants" = shortage; "no halal breakfast in district X"; "too many barbershops, low utilization". Extremely valuable signal.
- **Dynamic promotions** — the marketplace suggests campaigns (rain tomorrow → coffee campaign; low bookings today → lunch discount) rather than waiting for owners.
- **Trust + reputation graph** — every actor (customer, business, employee, partner, AI, workspace, offer) accrues trust from acceptance, cancellation, response speed, complaints, repeat customers, refunds, verification, consistency.
- **Fraud** — fake reviews, spam, fake bookings, fake businesses, duplicate accounts, bots, coupon and payment abuse.
- **AI Marketplace Director** — the platform asks itself "why are restaurant bookings falling?" and answers from evidence (rain, school holidays, competitor campaign, road closure).

**Marketplace events (all event-driven):** BusinessCreated → CapacityChanged → OfferPublished → BookingCreated → ReviewAdded → TrustUpdated → RankingUpdated.

**KPIs (not page views):** liquidity, supply coverage, demand satisfaction, recommendation acceptance, booking success, offer competition, business + customer retention, workspace completion, revenue per category.

**Tests:** unit, integration, marketplace, matching, ranking, capacity, trust, fraud, performance. **Docs:** architecture, marketplace lifecycle, supply/demand models, matching engine, events, KPIs, governance, sequence diagrams.

## Binding execution constraints (orchestrator-added)

1. **No fabricated marketplace data** — with a sparse catalog, liquidity/gap/forecast outputs return typed `insufficientData` (Epic 03 error taxonomy). A marketplace that invents demand curves is worse than one that admits it lacks them.
2. Capacity/availability depend on the M6 booking engine's Availability/TimeSlot model — ship the contracts and the engines that work on real data; gate the rest honestly.
3. Reuses Epic 04 (graph), 06 (intelligence), 08 (ranking/policies), 10 (evaluation). Trust engine extends Epic 03's trust contracts rather than forking them.
4. Sponsored/featured logic must obey the Decision Engine's policy caps — marketplace monetization never overrides the best recommendation (Product Bible: confidence, not information).

## Success

Manzil operates as a self-aware marketplace: balancing supply and demand, optimizing recommendations, measuring ecosystem health, and providing AI-driven marketplace intelligence **without relying on fabricated data**.
