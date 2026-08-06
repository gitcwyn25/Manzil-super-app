# Epic 04 — Knowledge Graph Implementation

> QUEUED behind Epic 03. Implements against Epic 03's frozen contracts. No conversational AI, no GPT, no embeddings.

MISSION: Implement the Manzil Knowledge Graph — the single source of truth for Gurman.

**Entities connected:** Business, Service, Category, Experience, Workspace, Customer, Campaign, Review, Story, Booking, Organization, Location, Neighborhood, Staff, Event.

**Relationships:** Business→provides→Service · Business→belongs_to→Category · Business→located_in→Neighborhood · Business→participates_in→Experience · Customer→visited→Business · Customer→booked→Service · Workspace→contains→Experience · Business→recommends→Business · Service→supports→Experience · Review→describes→Business · Campaign→promotes→Business · Story→references→Business. Every relationship carries: confidence, source, createdAt, updatedAt.

**Implement:** graph repositories, entity services, relationship services, traversal interfaces, validation, caching contracts.

**Produce:** graph architecture diagrams, repository documentation, domain model, ERD, sequence diagrams.

**Execution constraints (orchestrator-added, binding):**
- Projection-first: derive relational edges from existing Prisma data (source: "relational", confidence 1.0) — Business→Category from categoryId, Customer→visited from CustomerVisit, Review→describes from businessId, etc. Story edges are contract-only (no Story model exists — do NOT invent one).
- Explicit/inferred edges need storage: define a generic `GraphRelationship` Prisma model + hand-written migration SQL, but DO NOT apply or commit the migration as applied — the M1 drift-reconciliation is a precondition; mark the migration file clearly as gated on M1.
- Async/event/job discipline per corpus doc 23 (jobs like RebuildKnowledgeGraphJob; events via EventPublisher contracts).
- Gates: apps/api typecheck + existing jest suite green. Commit per repo convention; never push.
