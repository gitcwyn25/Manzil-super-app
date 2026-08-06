# Epic 10 — Gurman Learning, Evaluation & Optimization Platform

> QUEUED behind Epic 09. **Replaces "Autonomous Intelligence" entirely** (user decision 2026-08-06). The continuous improvement engine — without it Gurman always makes the same mistakes. No model training, no fine-tuning: learns from marketplace outcomes. **STRICT: the platform never changes production automatically — it produces evidence; humans decide.**

## Full mission (v1.1, authoritative)

**Principle:** every recommendation becomes evidence · every conversation becomes evaluation · every booking becomes feedback · every workspace improves future reasoning.

**Inputs:** Workspace Timeline, reasoning results, Decision Objects, conversation metadata, business events, customer actions, bookings, reviews, campaign results, recommendation outcomes, search behavior, memory/graph/feature-store updates.

**Feedback pipeline:** request → retrieval → reasoning → recommendation → user action → outcome → evaluation → learning signals → future improvements.

**Implement:**
- **Evaluation Engine** — expected vs actual, quality measurement, learning-signal generation.
- **Success Evaluator** — accepted/modified/rejected recommendation, booking completed/cancelled, business replaced, workspace completed, experience completed, review submitted, repeat visit.
- **Learning Signals** (structured) — positive/negative recommendation, missing context, missing business data, reasoning/ranking/retrieval/conversation/booking failure.
- **Quality metrics** — recommendation accuracy, workspace completion, booking conversion, replacement rate, clarification rate, conversation length, average confidence, reasoning/retrieval latency, tool success, memory/knowledge/feature freshness.
- **Business metrics** — customer/business retention, campaign performance, revenue attribution, workspace usage, repeat planning, average experience value, marketplace liquidity, discovery rate.
- **Experiment framework** — A/B, canary, policy/ranking/reasoning/prompt comparisons, feature flags, rollback. ExperimentObject: experimentId, variant, population, start/end, metrics, winner, confidence.
- **Evaluation dataset** (persisted): evaluationId, workspaceId, customerId, reasoningId, decisionId, recommendationId, outcome, confidence, timestamp, learningSignals.
- **Reasoning scorecard** — correctness, constraint satisfaction, ranking quality, alternative quality, optimization quality, decision confidence, customer outcome.
- **Business scorecard** — trust, service quality, recommendation frequency, acceptance rate, satisfaction, cancellation, repeat-customer rate.
- **Customer profile evolution** — ONLY from evidence, never assumptions: budget evolution, preference changes, travel radius, activity/planning/workspace habits.
- **Marketplace insights** — emerging categories, seasonal trends, neighborhood demand, peak hours, popular experiences, missing services, supply gaps, demand growth.
- **Self-correction** — repeated evaluation failures raise structured improvement TASKS (improve retrieval/ranking/memory/graph/business data/policies). Never modifies production; only recommends.
- **AI governance dashboards** — reasoning/retrieval/conversation quality, business intelligence, marketplace health, freshness, memory/knowledge health, experiment results.
- **Simulation** — offline replay of historical workspaces/reasoning/retrieval; algorithm-version comparison; never affects production.
- **Observability** — evaluation latency, experiment latency, metric freshness, signal volume, accuracy, system health.

**Testing:** unit, integration, experiment, simulation, evaluation, regression, performance. **Docs:** evaluation architecture, experiment guide, metric catalog, learning pipeline, simulation guide, governance guide, sequence diagrams, extension guide.

**ADR-009 — Evidence-Driven Intelligence** (write during this epic; event sourcing → ADR-010): intelligence improves from measured outcomes, not intuition · every recommendation evaluated after execution · **user actions are stronger evidence than user statements** · the platform generates signals, never self-modifies production · experiments versioned, measurable, reversible · profiles evolve only from observed behavior · every AI subsystem exposes quality metrics · changes to reasoning/ranking/retrieval require evaluation-platform evidence.

**After Epic 10 (feature epics, not architecture):** 11 Business AI Copilot · 12 Customer Experience AI (voice, multimodal, proactive) · 13 Marketplace Intelligence (fraud, forecasting, pricing, ecosystem health) · 14 AI Developer Platform (SDKs, plugins, public APIs).

## Continuous evaluation

Recommendation, reasoning, retrieval, conversation, and booking quality — measured from real outcomes: recommendation produced → booked? modified? ignored? cancelled? reviewed after experience? → metrics updated. Consumes Epic 08's Decision History + self-evaluation records.

## Marketplace Intelligence Score

Every recommendation produces measurable outcomes: expected → actually booked → stayed/cancelled → reviewed → returned → **confidence updated**. Gurman improves because the platform measures outcomes.

## Experiment framework

Reasoning Engine A vs B, Ranking Policy v2 vs v3 — staged rollout (10% → 50% → 100%), measuring booking conversion, workspace completion, recommendation acceptance, satisfaction, revenue. Evidence over intuition; policies are versioned (ADR-007) exactly so this works.

## Marketplace simulation (later stage of this epic)

Synthetic load: N businesses × M virtual planning requests → observe ranking, latency, diversity, memory growth, graph behavior, feature-store growth, cost. Stress-test before real users see changes.

## AI Governance Dashboard (operational cockpit)

Reasoning sessions/day · average reasoning latency · recommendation acceptance rate · top clarification questions · common retrieval failures · Feature Store freshness · memory update backlog · cost per recommendation · provider usage · confidence distribution. Built on the metric contracts from Epic 03.

## LLM staging (permanent guidance, supersedes any own-LLM ambition)

Stage 1: hosted providers (build all architecture) → Stage 2: adapt an open-weight model for communication style only → Stage 3: domain embeddings over the Knowledge Graph + Feature Store → Stage 4: continual pretraining ONLY if scale justifies it. The moat is the structured intelligence (graph, feature store, memory, reasoning, workspace, orchestrator) — valuable regardless of provider.
