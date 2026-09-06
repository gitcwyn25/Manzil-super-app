# Manzil Epic Ladder — canonical numbering

> **This file is the single source of truth for epic numbering and execution grouping.** Numbering shifted twice during planning (Business OS moved 13 → 15; Autonomous Marketplace moved 14 → 16). Any epic reference elsewhere that conflicts with this table is stale — fix it here first, then downstream.

The two tracks run in parallel. Neither track blocks the other. The only shared integration contract is the public Gurman API/interface: Gurman V0 (Track 1) and Epics 07–09 (Track 2) MUST write to the same interface so V0 remains available as a fallback when the full stack is ready.

## Track 1 — Trust & Launch Track (foydalanuvchi tomon)

**Execution order:** 00 → 00A → 19 → 18 → 00B → 00G → **Gurman V0 (new, created by Prompt C)** → 00C → 00D → 00E → 00F → 00H

| # | Epic | Track | Depends-on-track | Status | Mission file |
|---|---|---:|---|---|---|
| 00 | Production Hardening & Technical SEO | 1 | — | queued | [epic-00-production-hardening](epic-00-production-hardening.md) |
| 00A | Truth & Trust Audit | 1 | 1 | in flight | [epic-00-web2-narrative-suite](epic-00-web2-narrative-suite.md) |
| 18 | API Idempotency & Mutation Integrity — pairs with 17; fixes duplicate-record root cause | 1 | 1 | queued | [epic-18-api-idempotency](epic-18-api-idempotency.md) |
| 19 | Business Feed — connects Workspace publishing to the public storefront | 1 | 1; no dependency on Track 2 Epics 04–06 | NEXT (moved up from position 19 — see rationale in epic-19-business-feed-storefront.md addendum) | [epic-19-business-feed-storefront](epic-19-business-feed-storefront.md) |
| 00B | Explain Manzil (the landing rewrite) | 1 | 1 | queued | [epic-00-web2-narrative-suite](epic-00-web2-narrative-suite.md) |
| 00G | Empty states become sales | 1 | 1 | queued | [epic-00-web2-narrative-suite](epic-00-web2-narrative-suite.md) |
| Gurman V0 | Lightweight, honest Gurman planner; public API-compatible fallback | 1 | 1 + 2 (shared interface; non-blocking) | Prompt C | **new section — Prompt C** |
| 00C | Gurman Showcase (interactive, not connected to an LLM) | 1 | 1 | queued | [epic-00-web2-narrative-suite](epic-00-web2-narrative-suite.md) |
| 00D | `/experience-os` | 1 | 1 | queued | [epic-00-web2-narrative-suite](epic-00-web2-narrative-suite.md) |
| 00E | Business acquisition landing | 1 | 1 | queued | [epic-00-web2-narrative-suite](epic-00-web2-narrative-suite.md) |
| 00F | Trust Center | 1 | 1 | queued | [epic-00-web2-narrative-suite](epic-00-web2-narrative-suite.md) |
| 00H | The “wow” factor | 1 | 1 | queued | [epic-00-web2-narrative-suite](epic-00-web2-narrative-suite.md) |

### Track 1 launch gate — CTO

Do **not** launch until all of the following are true (the authoritative gate from `epic-00-web2-narrative-suite.md`):

- Site explains Manzil in <10s.
- Gurman completes ≥1 real end-to-end planning workflow.
- There are 100–300 verified businesses with accurate data.
- Trust issues are resolved: fabricated metrics, production auth keys, SEO, legal pages, and duplicate data.
- Owners can onboard, manage listings, and see genuine CRM value.

Epic 19 may consume Track 2’s Epic 06 summarizers when available; before then it MUST degrade honestly with `insufficientData`, without blocking the Track 1 launch gate.

## Track 2 — Deep Architecture Track (fon)

**Execution order:** 04 → 05 → 06 → 07 → 08 → 09 → 10 → 15 → 13 → 11 → 14 → 12 → 16 → 17 → 20

| # | Epic | Track | Depends-on-track | Status | Mission file |
|---|---|---:|---|---|---|
| 04 | Knowledge Graph | 2 | 2 | in flight | [epic-04-knowledge-graph](epic-04-knowledge-graph.md) |
| 05 | Memory Engine | 2 | 2 | queued | [epic-05-memory-engine](epic-05-memory-engine.md) |
| 06 | Marketplace Intelligence | 2 | 2 | queued | [epic-06-marketplace-intelligence](epic-06-marketplace-intelligence.md) |
| 07 | Hybrid Retrieval (RAG 2.0) | 2 | 2 + 1 (shared interface; non-blocking) | queued | [epic-07-hybrid-retrieval](epic-07-hybrid-retrieval.md) |
| 08 | Reasoning & Decision Engine | 2 | 2 + 1 (shared interface; non-blocking) | queued | [epic-08-reasoning-engine](epic-08-reasoning-engine.md) |
| 09 | Conversational Platform (LLM boundary) | 2 | 2 + 1 (shared interface; non-blocking) | queued | [epic-09-conversational-platform](epic-09-conversational-platform.md) |
| 10 | Learning, Evaluation & Optimization | 2 | 2 | queued | [epic-10-learning-evaluation](epic-10-learning-evaluation.md) |
| 15 | **Business Operating System** | 2 | 2 | queued | [epic-15-business-os](epic-15-business-os.md) |
| 13 | **Marketplace Operating System** | 2 | 2 | queued | [epic-13-marketplace-os](epic-13-marketplace-os.md) |
| 11 | Collaborative Workspace Platform | 2 | 2 | queued | [epic-11-collaborative-workspace](epic-11-collaborative-workspace.md) |
| 14 | **Experience Commerce Platform** | 2 | 2 | queued | [epic-14-experience-commerce](epic-14-experience-commerce.md) |
| 12 | Platform & Ecosystem (connectors, plugins, partners) | 2 | 2 | queued | [epic-12-platform-ecosystem](epic-12-platform-ecosystem.md) |
| 16 | **Experience Intelligence & Learning System** (the learning brain) | 2 | 2 | queued | [epic-16-experience-intelligence](epic-16-experience-intelligence.md) |
| 17 | **Product Experience System (PXS)** — feedback/state framework, web track | 2 | 2 | queued | [epic-17-product-experience-system](epic-17-product-experience-system.md) |
| 20 | Autonomous Marketplace (AI negotiation, ecosystem self-optimization) | 2 | 2 | outline only | *(largely absorbed into 13’s forecasting + 10’s evaluation; write when reached)* |

### Track 2 launch gate — Architecture Complete

Track 2 is complete only when:

- All assigned ADRs are written and accepted.
- Every architecture contract is implemented and verified.
- Epics 07–09 expose the shared public Gurman API/interface used by Gurman V0; V0 remains a compatible fallback, not a disposable prototype.

## Shipped foundation (outside the two execution tracks)

| # | Epic | Status | Notes |
|---|---|---|---|
| 03 | AI Platform Foundation (six-layer contracts + Patch A-G) | ✅ **SHIPPED** `13744ba` + `b752fad` | Executed prerequisite; retained at its original number. |

## Parallel infrastructure track (not epics — see `docs/evidence/2026-08-06-status-report.md`)

M1 platform hygiene (migration drift, Redis, indexes) → M3 mobile design foundation → M4 WOW Flow 02A/B/C → M5 notifications → M6 booking engine → M7 payments. Several epics are gated on these (11 on M5, 13 on M6, 14 on M7); the gates are stated in each mission file.

## ADR assignments

001 Tool Orchestrator · 002 Bootstrap-not-Tailwind · 003 Hanken+Golos · 004 RN/Expo mobile · 005 Intelligence Platform · 006 Retrieval First (epic 07) · 007 Deterministic Reasoning (epic 08) · 008 LLM as Replaceable Interface (epic 09) · 009 Evidence-Driven Intelligence (epic 10) · 010 Event sourcing vs activity log (queued, workspace implementation).
