# Epic 15 — Manzil Business Operating System

> QUEUED after Epic 14. **Numbering reconciliation:** the one-line "Epic 13 — Business OS" stub in [epic-12](epic-12-platform-ecosystem.md) is ABSORBED into this full mission; Epic 13 is retired as a separate epic, Epic 14 (Autonomous Marketplace) stands. Executes docs [17](../17-business-organization-architecture.md), [18](../18-business-platform-bible-charter.md), [19](../19-pricing-and-acquisition.md).

## Framing: Manzil is seven companies sharing one platform

Consumer super app · Business CRM · AI company (Gurman) · Marketplace · Advertising network · Payments platform · Data & intelligence company. Epic 15 builds company #2 properly.

## Vision

Today a restaurant runs on POS + Telegram + Excel + Instagram + Google Maps + CRM + a booking app + a marketing tool. **Tomorrow a business owner spends an entire workday inside Manzil without opening another management system.**

## Modules

Dashboard · CRM · customers · reservations · workspace requests · staff · branches · inventory · menus · pricing · promotions · loyalty · campaigns · AI copilot · analytics · finance · reviews · reputation · documents · notifications · integrations · settings.

**Organization hierarchy:** Organization → Business → Branch → Department → Employee. Multiple businesses per organization; users in multiple organizations; organization AND branch switching.

**Customer 360°:** identity, preferences, visit history, workspace history, average spend, favorite categories, birthday, family members, reviews, lifetime value, AI summary, risk score, loyalty level, campaign history.

**AI Copilot (ask, don't hunt dashboards):** "Why did reservations fall this week?" → "Friday reservations −18%. Reasons: rain, two competitor campaigns, response time up. Recommendation: family dinner campaign Friday evening." Business summaries, customer summaries, revenue insights, forecasting, operational suggestions.

**Campaign builder:** birthday / student / lunch / weekend / rainy-day / tourist / family — AI suggests audience, budget, expected reach, expected bookings, ROI.

**Promotion engine (beyond discounts):** bundles, coupons, loyalty rewards, referrals, first visit, happy hour, limited offers, inventory-triggered, weather-triggered.

**Also:** reputation management (reviews/stories/mentions/photos/ratings/sentiment, AI-summarized) · staff (schedules, roles, permissions, attendance, performance, tasks) · inventory (restaurants, hotels, salons, clinics) · finance (revenue, refunds, payments, invoices, taxes, cash flow, forecasts) · branch management (shared CRM + analytics, separate inventory + staff) · analytics across every KPI family · AI forecasting (busy hours, inventory demand, revenue, churn, staffing, campaign success) · documents (contracts, invoices, menus, certificates, licenses, insurance) · notification center · audit logs.

**Tests:** unit, integration, permission, analytics, forecasting, organization, performance. **Docs:** architecture, organization model, CRM guide, branch model, campaign engine, analytics, sequence diagrams, permission matrix.

## Binding execution constraints (orchestrator-added)

1. **Migrate, don't fork:** a working CRM already exists (`apps/api/src/modules/crm/` — registration, announcements, packages, booking intake, customers, segments, campaigns). Epic 15 evolves it into the organization-aware model; it does not build a parallel CRM.
2. **Organization migration is the hard part:** today's model is user→business with `claimedByUserId`. Introducing Organization/Branch/Department/Employee is a schema migration with a data backfill — sequence it explicitly, and it lands only after M1 drift reconciliation.
3. Finance/inventory modules must not fabricate figures: anything without a real data source renders honest empty states (D7 applies platform-wide).
4. AI Copilot consumes the Epic 06/08/10 surfaces — one intelligence, two voices. No separate business AI.

## Success

Manzil provides a complete Business OS capable of replacing multiple standalone tools while integrating natively with Gurman AI and the collaborative Workspace platform.

## After Epic 15

All foundational pillars exist (consumer experience · AI platform · collaborative workspaces · marketplace · integration ecosystem · business OS). Future work shifts to scale, internationalization, advanced payments, logistics, compliance, and industry-specific modules — not new core architecture.
