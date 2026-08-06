# Epic 07 — Hybrid Retrieval & Intelligence Platform (RAG 2.0)

> QUEUED behind Epic 06. NOT "vector search + GPT". No LLM, no natural language, no embeddings implementation. Structured intelligence only.

MISSION: Given structured intent ("quiet restaurant for my parents tonight"), gather ALL relevant knowledge before reasoning. Output = structured context package, never explanations.

**Seven retrieval engines,** identical contracts (`search() · lookup() · hydrate() · score() · explain()`): Knowledge Graph, Memory, Feature Store, Business, Marketplace, Workspace, Semantic (contract-only — future vector DB).

**HybridRetrievalService:** receive query → determine engines → parallel retrieval → merge → dedupe → normalize scores → ranked retrieval package.

**QueryPlanner:** structured intent → retrieval plan (which engines, what order).

**Context Package contains exactly:** businesses, services, experiences, workspace, preferences, mission context, knowledge nodes, feature values, related customers, campaigns, availability, alternative candidates.

**Retrieval Ranking Engine:** per-entity retrievalScore, semanticScore, graphScore, memoryScore, featureScore, distanceScore, availabilityScore, freshnessScore, businessTrustScore, overallScore + reason codes.

**Configurable filter pipeline** (never hardcoded): distance, budget, availability, status, category, workspace, time, language, accessibility, family/pet friendly, open-now, verified-only, premium-only(internal).

**Lazy hydration:** minimal load → expand on demand (summary → services → reviews → campaigns → media → analytics).

**Cache:** L1 memory, L2 Redis (contract — gated on M1 provisioning), L3 persistent contract. Every result: cacheStatus, freshness, generatedAt.

**Semantic provider contracts** (no implementation): one interface satisfied by pgvector/Pinecone/Qdrant/Weaviate/Milvus/OpenSearch.

**Observability:** retrievalId, workspaceId, customerId, queryId, enginesUsed, executionTime, entitiesRetrieved, cacheHits/Misses, rankingTime, hydrationTime.

**Failure handling:** engine failure → continue with rest; responses carry warnings, partialResults, failedEngines.

**Testing:** unit, contract, integration, ranking, failure, performance.

**Documentation:** architecture/sequence/pipeline diagrams, provider contracts, ranking + cache docs, developer guide, extension guide.

**ADR-006 — Retrieval First (write as part of this epic; event-sourcing renumbers to ADR-007):** retrieval is LLM-independent · every engine replaceable · vector search optional, never mandatory · structured knowledge outranks semantic similarity · memory outranks embeddings · workspace context outranks generic recommendations · retrieval returns structured data only.

**Target flow:** User request → Intent → Hybrid Retrieval (07) → Reasoning (08) → Decision Engine → Tool Orchestrator → LLM (09) → response.

Gates: typecheck + full jest green incl. new tests. Never push.
