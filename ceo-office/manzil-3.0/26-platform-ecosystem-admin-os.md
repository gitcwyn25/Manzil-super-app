# 🏛 MANZIL — Four Products, One Platform (+ Admin OS)

> Captured 2026-08-07. **Structural reframe: Manzil is not one website.** It is four connected products sharing one backend, one identity service, and one intelligence layer — the separation Airbnb, Uber, DoorDash, Stripe, Shopify and Notion all converged on. Public users never see internal tooling; internal teams never work inside the consumer app.

```
                 Public Marketplace
        Discover · Gurman · Business pages
         Reviews · Stories · Booking
                        │
        ┌───────────────┼───────────────┐
        ▼               ▼               ▼
   Business OS      Admin OS       AI Platform
      (CRM)        (Operations)      (Brain)
        └───────────────┼───────────────┘
                        ▼
              Shared API + Database
```

| # | Product | Audience | Status |
|---|---|---|---|
| 1 | **Marketplace** | consumers | live (v1.0), narrative rebuild queued (corpus 25) |
| 2 | **Business OS** | business owners | CRM shipped; full OS = Epic 15 |
| 3 | **Admin OS** | Manzil employees only | **new — Epics A01-A12 below** |
| 4 | **AI Platform** | internal (powers all three) | Epics 03-05 shipped, 06-10 in progress |

## Admin OS — the company's own operating system

Feel: **Stripe Internal × Notion × Linear × Metabase × HubSpot.** Not flashy. Information-dense, very fast, dark, professional, almost no marketing colour.

**20 modules:** executive dashboard · business management · user & identity · finance · legal · support · moderation · marketing · analytics · product analytics · **AI control center** · knowledge-graph explorer · event store · feature store · experiment center · city expansion · operations · security center · employee workspace · investor room.

**Highlights that don't exist in off-the-shelf tools:**
- **AI Control Center** — LLM cost, latency, cache hit rate, prompt success, RAG quality, memory hits, retrieval quality, hallucination rate, tool failures, job queues, embedding count, knowledge freshness. *Nobody builds this well.*
- **Knowledge Graph Explorer** — visual graph of businesses, users, cities, categories, relationships, memories, events, recommendation paths (React Flow).
- **Event Store** — every event ever: search, replay, export, debug.
- **City Expansion** — waitlists, business density, population, partners, launch-readiness score.
- **Analytics that explain, not chart** — not "Revenue $52,000" but "Revenue +12%, mainly wedding bookings; most growth Yunusobod; largest decline coffee shops; recommend ads in Mirzo Ulug'bek."
- **Company memory** — every decision, meeting, roadmap, experiment, deployment, bug, customer interview, searchable. Ask "why did we change pricing?" and get an answer.
- **Internal Gurman** — same brain, employee-facing: "show all unresolved security issues", "summarize last month's marketing", "which businesses are likely to churn?"

## Epic ladder A01-A12

| Epic | Scope |
|---|---|
| **A01** | Foundation — routing, auth, RBAC, layout, nav shell, audit logging, dark theme, design-system integration, module architecture. No business logic. |
| **A02** | Executive dashboard — KPIs, alerts, AI health, finance, growth, deploys. **Every metric from a real API or an explicit "No data available".** |
| **A03** | Business management — verification, ownership, claims, moderation, lifecycle states, contracts, subscriptions, documents |
| **A04** | User & identity — roles, permissions, organizations, sessions, audit history, recovery, risk monitoring |
| **A05** | Finance OS — subscriptions, invoices, payments, refunds, revenue reporting, tax, budgeting, cash flow, export |
| **A06** | Legal & compliance — document management, policy versioning, consent tracking, deletion requests, case management, audit evidence |
| **A07** | Moderation & trust — reviews, stories, businesses, media, fraud, spam, appeals, trust scoring |
| **A08** | Marketing & growth — campaigns, SEO monitoring, referrals, promos, notifications, landing pages, funnels |
| **A09** | Product analytics — funnels, retention, cohorts, search analytics, booking analytics, AI usage, feature adoption |
| **A10** | AI Control Center — providers, cost, latency, RAG performance, retrieval quality, prompt success, memory, queues, model health |
| **A11** | Knowledge Graph Explorer — interactive graph over businesses, users, relationships, events, memories, recommendation paths |
| **A12** | Operations & security — infra monitoring, deployments, API health, queues, logs, security dashboards, incidents |

## Stack & URL architecture

Frontend: Next.js · React · Bootstrap (same design system) · TanStack Table · Recharts/ECharts · React Flow. Backend: NestJS · PostgreSQL · Redis · BullMQ · Event Store · OpenSearch (later). Auth: Clerk Organizations · RBAC · 2FA · session management.

```
manzil.app           marketplace
business.manzil.app  Business OS
admin.manzil.app     Admin OS
ai.manzil.app        AI platform
api.manzil.app       shared backend
```

Monorepo: `apps/{web,mobile,business,admin,workspace,docs,api}` — one identity service and API, separate navigation, permissions, and design language per app.

## ⭐ SEQUENCING DECISION (agreed): Admin OS is built LAST

1. Finish the public marketplace (launch-ready)
2. Finish Business OS (businesses can actually operate)
3. Finish the AI Platform (Gurman becomes a real advantage)
4. **Then** Admin OS

Rationale: Admin OS must have meaningful data to manage from day one, or it becomes an elaborate dashboard over an early-stage product with almost no operational activity. **This is doubly true today** — with two listings and one waitlist signup, every Admin OS screen would render the "No data available" state it is required to render, and A02's honesty rule would make that visible on every panel.

**Endgame:** Manzil is not a website. Customers discover, plan, book, experience, and remember; businesses operate, market, understand, and grow; the team runs the company itself — and Gurman is the intelligence layer connecting all three.
