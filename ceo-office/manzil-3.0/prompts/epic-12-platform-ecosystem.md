# Epic 12 — Manzil Platform & Ecosystem

> QUEUED after Epic 11. Transforms Manzil from an application into a **platform**: businesses, partners, and developers integrate safely through secure, versioned contracts. API-first. **The LLM never calls external services directly — every integration executes through the Tool Orchestrator.**

## Why

Today `Customer → Gurman → Business`. Future: the Workspace connects AI, businesses, and third parties — payments, calendar, maps, hotels, delivery, CRM, loyalty — through one governed platform. Restaurants publish live table availability/menus/pricing/events; hotels room inventory; organizers ticket inventory and seating; taxis ETA and pricing; calendars (Google/Apple/Outlook); messaging (Telegram/WhatsApp/email/SMS); payments (Click, Payme, Uzum, Visa/Mastercard, Apple/Google Pay).

## Implement

Integration platform · plugin framework · connector registry · connector SDK · API gateway contracts · webhook framework · event subscriptions · OAuth provider framework · partner registry · marketplace registry · developer portal contracts · API key management · webhook verification · versioned APIs · partner permissions · rate-limiting contracts · usage metering · billing contracts · integration audit logs · secrets abstraction · sandbox environment · connector health monitoring · retry policies · circuit breakers · idempotency contracts · API version negotiation · deprecation policies.

**Connector types:** calendar, payments, messaging, navigation, CRM, POS, reservation systems, hotel PMS, restaurant POS, inventory, delivery, maps, identity, analytics, storage, video, voice.

**Plugin types:** business tools, AI tools, reporting, marketing, loyalty, CRM/recommendation/workspace/booking/payment extensions.

**Developer platform:** plugin manifest, permissions, versioning, signing, validation, lifecycle, health, metrics, marketplace contracts.

**Security:** OAuth2, OIDC, API keys, JWT, scopes, permission matrix, audit logs, encryption contracts, secret rotation, webhook signature verification.

**Rate limiting:** per user / business / workspace / partner / API key. **Observability:** connector latency + failures, webhook delivery, API usage, plugin errors, partner health.

**Tests:** unit, integration, security, performance, plugin validation, webhook, rate limit, contract. **Docs:** architecture, connector guide, plugin SDK, webhook guide, partner guide, API versioning, security guide, sequence diagrams, extension guide.

## Binding execution constraints (orchestrator-added)

1. **Redis is a hard prerequisite** for real rate limiting and metering (currently unprovisioned — M1). Contracts ship regardless; the enforcement path must degrade honestly and say so.
2. The existing MCP plugin spec (`ceo-office/stitch_local_deal_marketplace/manzil_mcp_plugin_spec.txt`) is this platform's **agent-facing face** — implement it as a connector/plugin surface here rather than as a separate system.
3. Partner-facing APIs are versioned from day one with a written deprecation policy; no unversioned public surface ever ships.
4. Every connector is replaceable, versioned, observable, and governed — the success criteria are the acceptance tests.

## Success

External platforms integrate with Manzil **without modifying the core platform**.

---

## Remaining ladder (architecture ends at 14)

- **Epic 13 — Business OS:** full CRM, ERP-lite, marketing automation, loyalty, analytics, campaigns, AI Copilot for businesses (executes docs 17-19: Organization → Brand → Locations, Build/Operate/Grow, roles/permissions, unified inbox, marketing hub).
- **Epic 14 — Autonomous Marketplace:** demand forecasting, dynamic recommendations, AI-assisted negotiations, business optimization, marketplace health, fraud detection.

Beyond 14 the work is product capability on a mature platform, not foundational architecture.
