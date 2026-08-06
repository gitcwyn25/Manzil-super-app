# ⚙️ MANZIL — AI Architecture Amendment (permanent principles, v1.0)

> Captured 2026-08-06, adopted before Epic 03 completion. These are permanent AI
> principles: the intelligence platform must scale EventEmitter → BullMQ →
> distributed infrastructure **without rewriting business logic**.

1. **Event abstraction** — in-process domain events APPROVED as the temporary bus, but no module depends on EventEmitter directly: `EventPublisher`/`EventSubscriber` interfaces; the implementation is swappable (EventEmitter today, BullMQ tomorrow, Kafka if ever).
2. **Async intelligence chains, always** — BusinessCreated → BusinessSummaryRequested → BusinessSummaryCompleted → KnowledgeGraphUpdated → MemoryUpdated → RecommendationsInvalidated — even while every step runs in one process. Never synchronous intelligence chains.
3. **Event versioning** — every domain event: eventId, eventType, eventVersion, timestamp, aggregateId, correlationId, causationId, payload. Future migrations depend on this envelope.
4. **Idempotency** — every intelligence operation executed twice yields the identical result.
5. **AI Jobs** — intelligence services are never called directly; everything is a Job (SummarizeBusinessJob, UpdateCustomerMemoryJob, RebuildKnowledgeGraphJob, InferRelationshipsJob, RefreshBusinessHealthJob, GenerateRecommendationsJob). Today's executor is in-process; BullMQ later changes only the executor.
6. **Event Store contracts** (contracts only) — every intelligence event replayable; future event sourcing stays possible (pairs with queued ADR on timeline recording).
7. **Module surface** — every AI module exposes Command API + Query API + Events. Implementation never leaks.
8. **Metrics from day one** — execution time, failures, retries, queue delay, and freshness (summary/memory/knowledge/recommendation) as typed contracts → future dashboards.
9. **AI Context IDs** — every recommendation carries workspaceId, customerId, businessIds consulted, memoryIds consulted, reasoningSessionId. Debuggability is a feature.
10. **The LLM boundary** — any future provider receives ONLY {context, reasoning, candidate results, explanation data}. Never raw entities, repositories, or ORM models.

## ⭐ AI Feature Store (first-class component, CTO addition)

The canonical repository of **derived facts**, computed once and reused everywhere (search ranking, recommendations, Gurman, dashboards, targeting, analytics):

- **Business:** popularity, trust, family score, luxury score, average visit time, peak hour, noise, price stability.
- **Customer:** budget preference, travel radius, cuisine ranking, activity pattern, weekend behavior, birthday probability.
- **Neighborhood:** morning/night activity, parking availability, family friendliness, walkability, demand trend.

First-class alongside the Knowledge Graph and Memory Engine — the piece separating an intelligent platform from a chatbot.

## Revised epic ladder

03 AI Foundation → **03.5 Domain Event Infrastructure** → 04 Knowledge Graph → 05 Memory Engine → 06 Marketplace Intelligence → 07 RAG → 08 Reasoning → 09 LLM → 10 Autonomous Intelligence. Everything depends on events; without event architecture the modules couple.
