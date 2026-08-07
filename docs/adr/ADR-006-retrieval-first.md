# ADR-006 — Retrieval First

**Status:** Accepted · **Date:** 2026-08-07 · **Epic:** 07 (Hybrid Retrieval) · **Supersedes:** nothing · **Related:** [ADR-005](ADR-005-intelligence-platform.md), ADR-007 (Deterministic Reasoning), ADR-008 (LLM as Replaceable Interface)

## Context

The industry default for "AI search" is embeddings plus a language model: chunk the corpus, embed it, retrieve by cosine similarity, hand the results to an LLM. That pipeline makes the vector store load-bearing — the quality ceiling is set by an embedding model, and swapping it means re-indexing everything.

Manzil's data is not an undifferentiated corpus. It is a knowledge graph with typed edges, six tiers of memory with explicit retrieval priority, a feature store with provenance on every derived fact, and a workspace that states what the user is *currently trying to do*. Reducing that to a similarity score discards the structure that makes the answer correct.

There is also a practical constraint: at current data volume (~2 businesses) an embedding index would be noise, and a vector store is infrastructure nobody has provisioned. Committing to one now would mean choosing a vendor before there is any evidence about what the workload looks like.

## Decision

**Retrieval is a first-class layer beneath reasoning, and it is not built on embeddings.**

Seven engines implement one identical contract — `search · lookup · hydrate · score · explain`:

| Engine | Source |
|---|---|
| Knowledge Graph | Epic 04 projections and edges |
| Memory | Epic 05, six tiers |
| Feature Store | Epic 06 derived facts |
| Business | catalogue rows |
| Marketplace | Epic 06 summaries |
| Workspace | current mission and plan |
| **Semantic** | **contract only — no implementation** |

The pipeline fans out across engines in parallel, merges, dedupes, ranks, and assembles a context package honouring the frozen `CONTEXT_ASSEMBLY_PRIORITY` and `RETRIEVAL_PRIORITY` constants, with truncation recorded rather than silent.

### Binding principles

1. **Retrieval is LLM-independent.** It returns structured data, never prose. Nothing in this layer knows an LLM exists.
2. **Every engine is replaceable.** One contract, seven implementations, no engine special-cased in the pipeline.
3. **Vector search is optional, never mandatory.** The Semantic engine ships as an interface that pgvector, Qdrant, Pinecone, Weaviate, Milvus, or OpenSearch could each satisfy, with no implementation and an honest unavailable outcome at runtime.
4. **Structured knowledge outranks semantic similarity.** A typed edge is better evidence than a nearby vector.
5. **Memory outranks embeddings.** What this user told us beats what the corpus resembles.
6. **Workspace context outranks generic recommendations.** What they are doing right now beats what people like them tend to want.
7. **Engines without data return typed insufficient-data outcomes** (Epic 03 error taxonomy), never fabricated results — the Epic 06 evidence-floor discipline applies here too.

## Consequences

**Good.** The interface is settled before any vendor exists to bias it — when a vector store is eventually chosen, it is an implementation decision against a fixed contract, not an architectural one. The platform is useful at two businesses and at two hundred thousand, because structured retrieval degrades gracefully where similarity search simply has nothing to compare. Ranking stays inspectable, which is what makes ADR-007's deterministic reasoning and the "Why wasn't I recommended?" surface possible at all.

**Costs.** Seven engines is more code than one similarity query, and genuinely fuzzy natural-language matching is unavailable until the Semantic engine is implemented. Priority constants must be maintained deliberately rather than emerging from a model.

**Accepted risk.** If Manzil later needs semantic matching at scale, the Semantic engine must be implemented and its results merged into a ranking that currently assumes structured evidence dominates. The contract is designed for that; the ranking weights will need revisiting with real data.

## Alternatives rejected

- **Embeddings-first RAG** — makes the vector store load-bearing, discards typed structure, and needs a corpus that does not exist yet.
- **Single search service** — one query path over a denormalised index; loses per-source provenance and makes "explain why" impossible.
- **Defer retrieval until the LLM layer** — would let prompt construction become the de facto retrieval policy, which is exactly the coupling ADR-008 exists to prevent.
