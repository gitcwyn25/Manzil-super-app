# Epic 05 — Gurman Memory Engine Implementation

> QUEUED behind Epic 04. Never store conversations — structured knowledge only. No LLM, no prompts, no chat history.

MISSION: Implement the six memory tiers as working services against Epic 03's contracts.

**Tiers:** MissionContext, PreferenceContext, RelationshipContext, WorkspaceTimeline, BusinessContext, MarketplaceContext. Every memory object: confidence, source, expires, priority, createdAt, updatedAt.

**Implement:** memory repositories, retrieval, expiration, updates, conflict resolution, priority ordering.

**Retrieval order (canonical for the engine):** WorkspaceTimeline → Mission → Relationship → Preference → Business → Marketplace.

**Produce:** memory architecture, sequence diagrams, repository contracts, documentation.

**Execution constraints (orchestrator-added, binding):**
- Record the retrieval-order refinement (Relationship between Mission and Preference) as AI Bible v1.4 amendment — Bible and typed constant must be identical.
- Storage: memory rows need a Prisma model (`MemoryObject` generic, tier-discriminated) + migration gated on M1 exactly like Epic 04's (write SQL, mark gated, don't apply). Until M1, an in-memory + cache-backed repository implementation keeps the engine testable — honest about persistence status.
- Updates flow through jobs (UpdateCustomerMemoryJob) and events per doc 23. Idempotent.
- Gates: typecheck + jest green. Never push.
