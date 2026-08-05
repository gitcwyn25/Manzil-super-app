# ADR-001: Tool Orchestrator between Gurman AI and all platform services

**Date:** 2026-08-05 · **Status:** Accepted

## Context

Gurman AI needs to search, plan, book, and coordinate across platform services. The naive approach lets the AI call internal services directly.

## Decision

Introduce a Tool Orchestrator layer. The AI never communicates directly with internal services; it requests actions through defined tool contracts (Search, Booking, Calendar, Payment, Notification, Maps, Review, Merchant, …). The orchestrator is a platform capability, not an AI feature: human-facing code and the AI share the same capability interfaces, and the AI is a first-class RBAC principal with least privilege.

## Reasons

- Model independence: swap AI providers without rewriting business logic.
- Security and auditability: every AI action is permission-checked and logged.
- Extensibility: new verticals (travel, healthcare, education) are new tools, not redesigns.
- External face: the MCP plugin spec (`ceo-office/stitch_local_deal_marketplace/manzil_mcp_plugin_spec.txt`) exposes the same tools to third-party agents.

## Alternatives considered

AI calling services directly — rejected (tight coupling to one model's tool-use idioms, no unified audit path, per-service auth sprawl).

## Consequences

`/v1/gurman/ask` on the existing NestJS API is the orchestrator's seed. The booking engine ships as a tool behind this layer before any "book everything" promise appears in UI copy.
