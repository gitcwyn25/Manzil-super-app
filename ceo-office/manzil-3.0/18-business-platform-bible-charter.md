# 🏗️ MANZIL — Business Platform Bible (charter, v1.0)

> Captured 2026-08-06. Businesses don't register a listing — they **build a digital business inside Manzil**; the listing is the public face of a richer workspace. Business-side trilogy mirrors the consumer side: **Build → Operate → Grow**.

## Three tabs

- **BUILD** — organization, locations, services, staff, photos, verification, availability, pricing, policies.
- **OPERATE** — today's bookings, calendar, customers, workspace, messages, reviews, tasks, AI assistant.
- **GROW** — stories, campaigns, announcements, ads, analytics, loyalty, segments, AI insights.

## Visual direction

Linear × Notion × Stripe Dashboard × Apple × Meta Business Suite: soft surfaces, whitespace, calm typography, color reserved for actions/status, charts only when they aid decisions. Premium workspace, not a 2015 admin panel. Sidebar: Overview · Workspace · Bookings · Customers · Business · Marketing · Analytics · Team · Settings.

## Workspace = homepage

Attention-first, not metrics-first: Today (bookings/reviews/messages/scheduled campaign/AI suggestion) → Upcoming timeline → Tasks (respond to review, approve story, confirm booking). Owners open Manzil to know **what needs attention now**.

## Security architecture

Organization-based, not account-based: identity → organization membership → role → permissions → resource access; cross-organization access impossible by design; least privilege; audit log on sensitive actions (role changes, refunds, campaign publish, verification); session management with revocation; 2FA (recommended owners, required above risk threshold); secrets never client-side; encryption in transit + sensitive-at-rest.

## Progressive onboarding (import-first, AI-assisted)

Step 1 phone+OTP → Step 2 name/category/city → Step 3 **AI imports** (Google/Instagram/Facebook/website/maps; owner confirms, doesn't type) → Step 4 logo → Step 5 publish. Everything else = "Complete your profile 17%" with per-item gains (+hours 4%, +menu 8%, +photos 5%, +phone 6%, +staff 10%). Never block. Verification stages: Published → Verified (identity/phone/address/tax) → Premium Verified (support, advanced analytics, credits).

## Business Quality Engine (internal)

Information · media · response rate · review quality · availability · verification · bookings · **AI confidence** → drives recommendations ("improve photos", "add menu", "respond faster").

## AI Copilot (contextual, not a corner chatbot)

Negative review → "Draft a response?" · Empty Tuesday → "Create a promotion?" · Declining bookings → "See possible causes?" Attached to the current task.

## Notifications (typed)

Operational · customer · marketing · system · AI — different colors, priorities, delivery rules. Campaign builder: goal → audience → budget → duration → AI generates images/copy/timing → owner reviews and publishes.

## Long-term architecture

Consumer platform (Discover/Plan/Experience/Gurman) ∥ Business platform (Build/Operate/Grow/Business AI) on shared Platform Services (identity, organizations, CRM, marketing, booking, payments, analytics, notifications, search, AI platform, Tool Orchestrator).

## Deliverable when this phase begins

A Business Platform Bible at consumer-corpus rigor: domain model · role/permission matrix · onboarding flow · CRM architecture · marketing architecture · workspace UI · security architecture · API + event model.
