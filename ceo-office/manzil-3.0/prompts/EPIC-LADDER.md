# Manzil Epic Ladder — canonical numbering

> **This file is the single source of truth for epic numbering.** Numbering shifted twice during planning (Business OS moved 13 → 15; Autonomous Marketplace moved 14 → 16). Any epic reference elsewhere that conflicts with this table is stale — fix it here first, then downstream.

| # | Epic | Status | Mission file |
|---|---|---|---|
| 03 | AI Platform Foundation (six-layer contracts + Patch A-G) | ✅ **SHIPPED** `13744ba` + `b752fad` | — (executed) |
| 04 | Knowledge Graph | 🔄 **IN FLIGHT** | [epic-04](epic-04-knowledge-graph.md) |
| 05 | Memory Engine | queued | [epic-05](epic-05-memory-engine.md) |
| 06 | Marketplace Intelligence | queued | [epic-06](epic-06-marketplace-intelligence.md) |
| 07 | Hybrid Retrieval (RAG 2.0) | queued | [epic-07](epic-07-hybrid-retrieval.md) |
| 08 | Reasoning & Decision Engine | queued | [epic-08](epic-08-reasoning-engine.md) |
| 09 | Conversational Platform (LLM boundary) | queued | [epic-09](epic-09-conversational-platform.md) |
| 10 | Learning, Evaluation & Optimization | queued | [epic-10](epic-10-learning-evaluation.md) |
| 11 | Collaborative Workspace Platform | queued | [epic-11](epic-11-collaborative-workspace.md) |
| 12 | Platform & Ecosystem (connectors, plugins, partners) | queued | [epic-12](epic-12-platform-ecosystem.md) |
| 13 | **Marketplace Operating System** | queued | [epic-13](epic-13-marketplace-os.md) |
| 14 | **Experience Commerce Platform** | queued | [epic-14](epic-14-experience-commerce.md) |
| 15 | **Business Operating System** | queued | [epic-15](epic-15-business-os.md) |
| 16 | **Experience Intelligence & Learning System** (the learning brain) | queued | [epic-16](epic-16-experience-intelligence.md) |
| 17 | **Product Experience System (PXS)** — feedback/state framework, web track | queued | [epic-17](epic-17-product-experience-system.md) |
| 18 | **API Idempotency & Mutation Integrity** — pairs with 17; fixes duplicate-record root cause | queued | [epic-18](epic-18-api-idempotency.md) |
| 19 | Autonomous Marketplace (AI negotiation, ecosystem self-optimization) | outline only | *(largely absorbed into 13's forecasting + 10's evaluation; write when reached)* |

**Ordering rationale:** ecosystem intelligence (13) precedes experience commerce (14) precedes per-business tooling (15) — each consumes the previous rather than reinventing it. Architecture ends at 16; beyond that is product capability on a mature platform.

## Parallel infrastructure track (not epics — see `docs/evidence/2026-08-06-status-report.md`)

M1 platform hygiene (migration drift, Redis, indexes) → M3 mobile design foundation → M4 WOW Flow 02A/B/C → M5 notifications → M6 booking engine → M7 payments. **Several epics are gated on these** (11 on M5, 13 on M6, 14 on M7); the gates are stated in each mission file.

## ADR assignments

001 Tool Orchestrator · 002 Bootstrap-not-Tailwind · 003 Hanken+Golos · 004 RN/Expo mobile · 005 Intelligence Platform · 006 Retrieval First (epic 07) · 007 Deterministic Reasoning (epic 08) · 008 LLM as Replaceable Interface (epic 09) · 009 Evidence-Driven Intelligence (epic 10) · 010 Event sourcing vs activity log (queued, workspace implementation).
