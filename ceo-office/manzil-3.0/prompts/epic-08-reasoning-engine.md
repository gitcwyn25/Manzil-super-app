# Epic 08 — Gurman Reasoning & Decision Engine

> QUEUED behind Epic 07. **The most valuable IP of Manzil — the LLM is replaceable; this engine is not.** Epic 07 retrieves; Epic 08 decides. Natural language generation explicitly OUT OF SCOPE.

MISSION: Given structured context from Epic 07, produce the optimal structured decision. Gurman does not search — Gurman understands.

**Input discipline:** receives ONLY the Retrieval Package. Never repositories, never DB queries, never external APIs, never LLMs. Repository-independent architecture.

**Pipeline:** Intent Analysis → Goal Extraction → Constraint Resolution → Candidate Generation → Policy Evaluation → Scoring → Optimization → Alternative Generation → Decision Selection → Explanation Object.

- **Intent Analyzer:** primary/secondary goals, urgency, confidence, planning horizon, budget sensitivity, group type, mood, context (birthday, coffee, haircut, family dinner, business meeting, weekend, travel, wedding, date).
- **Goal Extraction:** "somewhere quiet for dinner" → {quiet environment, dinner, open tonight, within radius, suitable for two, budget}.
- **Constraint Engine:** hard (closed, unavailable, suspended, outside radius, budget limit, workspace conflict) vs soft (luxury, family-friendly, walking distance, parking, outdoor, pet-friendly, view).
- **Policy Engine:** admin/marketplace/business/campaign/workspace/customer/safety/premium policies — configurable, versioned, never hardcoded (consumes Epic 03's decision-engine contracts).
- **Candidate Generator:** candidate PLANS, never single results (restaurant · +dessert · +walk · +cinema · complete birthday · travel package · workspace itinerary), always with alternatives.
- **Scoring Engine:** preference/mission/distance/availability/popularity/trust/price/freshness/business-health/review-quality/experience-quality/campaign-relevance → total + reason codes.
- **Optimizer:** dedupe, route/timing improvement, cost reduction, quality/confidence increase.
- **Replacement Engine:** auto-replace unavailable businesses maintaining constraints + intent, with explained reason.
- **Package Builder:** complete experiences (restaurant, cake, flowers, photography, gifts, parking, reservation + travel time, backup option).
- **Workspace Planner:** everything lands in the Workspace Timeline lifecycle (planning → draft → confirmed → booked → completed → memories).

**Decision Object (structured only):** decisionId, intent, mission, constraints, candidatePlans, selectedPlan, alternatives, reasonCodes, confidence, estimatedDuration, estimatedCost, riskFactors, requiredTools, requiredBookings, requiredActions.

**Explanation Object (separate, never natural language):** whySelected, whyRejected, tradeoffs, confidenceFactors, missingInformation, optimizationNotes.

**Decision History (persisted):** decisionId, workspaceId, customerId, timestamp, inputSnapshot, retrievalSnapshot, selectedPlan, reasonCodes, confidence, executionTime. (Storage model gated on M1 like Epics 04/05.)

**Self-Evaluation:** after every completed booking compare expected vs actual → accuracy, completion, satisfaction, corrections — future learning signals.

**Failure handling:** low confidence → {missingInformation, clarificationQuestions, alternativeStrategies}. **Never hallucinate.**

**Observability:** reasoningId, retrievalId, workspaceId, customerId, executionTime, candidateCount, policyCount, optimizationCount, confidence.

**Testing:** unit, integration, policy, constraint, optimization, decision-consistency, performance, failure, regression.

**Docs:** reasoning architecture, decision pipeline, policy guide, optimization guide, Decision Object spec, extension guide, sequence + state diagrams.

**ADR-007 — Deterministic Reasoning (write during this epic; event-sourcing renumbers to ADR-008):** the Reasoning Engine owns all business decisions · LLMs never make marketplace decisions · every recommendation explainable with confidence + reason codes · reproducible from identical inputs · policies configurable and versioned · structured decisions with language generation as a separate concern · all decisions auditable and replayable.

Gates: typecheck + full jest green. Never push.
