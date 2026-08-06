# ADR-005: Intelligence Platform — six isolated layers, contracts before providers

**Date:** 2026-08-06 · **Status:** Accepted

> Renumbering note: governance v1.1 had queued "ADR-005" for the
> Workspace-timeline recording decision (event sourcing vs append-only log).
> That decision keeps its trigger (write when Workspace implementation
> begins) and becomes **ADR-010** — ADR-006–009 are reserved for the epic
> ladder (006 Retrieval First, 007 Deterministic Reasoning, 008 LLM as
> Replaceable Interface, 009 Evidence-Driven Intelligence; see governance
> v1.1 queue note). This ADR takes the 005 slot because the intelligence
> architecture landed first.

## Context

Manzil's AI (corpus docs 03, 16, 21, 22, 23) is a decision engine, not a
chatbot: the moat is structured knowledge, and the LLM is the last ~20% —
presentation. Before any provider integration exists, the platform needs an
architecture that makes the wrong system impossible to build by accident:
an LLM that decides, memory that stores chat, recommendations that cannot
explain themselves, business policy scattered through services.

## Decision

Build the Intelligence Platform as **six isolated layers**, shipped
interfaces-first in `apps/api/src/modules/intelligence/` (Epic 03,
contracts only — no algorithms, storage, or SDKs):

1. **Raw marketplace data** (existing Prisma layer)
2. **Marketplace Intelligence** — generated facts, stored profiles, the AI
   Feature Store (derived facts computed once, reused everywhere), trust
3. **Knowledge Graph** — 15 entity kinds behind one uniform 6-field node
   contract, typed extensible edges
4. **Memory Engine** — six tiers of structured knowledge (never chat), with
   the AI-Bible v1.2 retrieval priority as a typed constant
5. **Reasoning** — Decision Engine (centralized policy as data), ranking,
   explanation, and ten reasoning service interfaces; **the only layer that
   decides**
6. **Conversation** — a sealed boundary: the future LLM receives exactly
   `{context, reasoning, candidateResults, explanationData}` and returns
   narration; no type in that envelope can carry a raw entity, repository,
   or ORM model

Cross-cutting, per the doc-23 amendment (permanent principles):

- **Event architecture:** an in-process domain-event bus is APPROVED as the
  temporary transport, but only behind `EventPublisher`/`EventSubscriber`/
  `EventStoreContract` interfaces with a versioned envelope (eventId,
  eventType, eventVersion, timestamp, aggregateId, correlationId,
  causationId, payload). Scale path EventEmitter → BullMQ → distributed
  changes bindings, never business logic. Intelligence chains are
  async-only, always.
- **AI Jobs:** intelligence is never invoked directly — every operation is
  an idempotent `IntelligenceJob` behind a swappable `JobExecutor`.
- **Structural guarantees:** every `Recommendation` requires an
  `Explanation` (non-empty factors), a `RecommendationTrace` (scored reason
  codes, consulted counts, policies applied, execution time), and an
  `AiDecisionContext` (workspace, customer, businesses and memories
  consulted, reasoning session id). Unexplained or untraceable
  recommendations do not compile.
- **Lower layers never import higher layers**; wiring happens only through
  injection tokens; `IntelligenceModule` ships provider-empty.

## Alternatives considered

- **LLM-wrapper** ("ChatGPT with businesses"): prompt an LLM over the
  catalog and let it choose. Rejected — decisions become unauditable and
  unexplainable, quality is capped by the model rather than by our data,
  every provider switch is a rewrite, and the moat (structured knowledge)
  never gets built.
- **Immediate RAG build**: start with embeddings/vector retrieval now.
  Rejected for sequencing, not merit — RAG is Epic 04 (formally: 07 on the
  revised ladder) and, per doc 22, arrives as *specialized* RAG on top of
  these contracts; building retrieval before the knowledge shapes exist
  would freeze today's ad-hoc shapes into the embedding pipeline.
- **Direct EventEmitter / direct service calls** for the pipeline:
  rejected — couples modules to a transport and to synchronous chains,
  making the BullMQ/distributed migration a rewrite instead of a rebinding.

## Consequences

- Epic 03.5 (Domain Event Infrastructure) implements the in-process bus
  behind the shipped contracts; revised ladder: 03 → 03.5 → 04 Knowledge
  Graph → 05 Memory → 06 Marketplace Intelligence → 07 RAG → 08 Reasoning →
  09 LLM → 10 Autonomous Intelligence.
- Engines implement existing interfaces and bind existing tokens; consumers
  (including the Gurman seed's eventual migration) never change signatures.
- The event-sourcing decision for Workspace timelines is deferred to
  ADR-010, unchanged in trigger; the event-store contract here keeps full
  replay possible either way.
- One intelligence, two voices: owner-facing analytics contracts are
  projections of the same surface consumer recommendations use — a separate
  analytics AI is architecturally excluded.

## Amendment: contracts patch A–G (2026-08-06, post-CTO-review)

Applied on top of the accepted architecture, contracts only:

- **A — CapabilityRegistry** (L6 boundary; deliberate: capabilities compose
  tools, permissions, flags, and memory across the whole stack, and placing
  them lower would invert the import direction): every AI capability is
  data — `{id, name, description, requiredTools, requiredKnowledge,
  requiredPermissions, requiredBusinessData, requiredCustomerData,
  requiredMemory, requiredFeatureFlags, status}` — seeded with eight typed
  entries (PlanBirthday, FindCoffee, ReplaceRestaurant, BookHotel,
  BuildWorkspace, RecommendGifts, GenerateItinerary, CompareBusinesses),
  all `planned`.
- **B — IntentRegistry** (L5): `Intent.kind` now comes from an open
  registry (ten seed intents); the IntentAnalyzer classifies into whatever
  the registry declares and owns no intent list.
- **C — ToolManifest**: the Tool Orchestrator contract is manifest-based —
  tools self-describe permissions, entities, timeout, retry, cost, and
  availability; feasibility is checkable at plan time.
- **D — domain-language.ts** (core): the single typed vocabulary — 21
  concepts, one canonical term/type each (reservation ≠ booking, mission ≠
  mission_context ≠ plan spelled out), plus canonical id aliases.
- **E — AI error taxonomy** (core): ten typed failure causes replace
  free-form error strings; jobs and metrics now carry
  `IntelligenceErrorKind`, and `retryable` is a mandatory judgment.
- **F — cost contracts** (core): `InferenceBudget` (tokens, latency, cost,
  cache eligibility, priority) required on every reasoning `*Request`
  contract.
- **G — ContextWindowManager** (L6, interface only): priority-ordered,
  budget-aware context assembly (Workspace → Memory → Knowledge → Business
  → History → Conversation → Summaries → LLM) with explicit, auditable
  truncation.
