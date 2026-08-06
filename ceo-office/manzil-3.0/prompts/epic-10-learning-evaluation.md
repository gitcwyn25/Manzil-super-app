# Epic 10 — Learning & Evaluation Platform

> QUEUED behind Epic 09 (and prerequisite to any autonomous-intelligence work or model fine-tuning). Answers the question every AI company eventually hits: **"How do we know whether Gurman is getting better?"** Feedback loops without training a model.

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
