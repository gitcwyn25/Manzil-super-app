# Epic 06 — Marketplace Intelligence Implementation

> QUEUED behind Epic 05. No AI APIs. Strongly typed, asynchronous, event-driven (in-process bus behind EventPublisher contracts per doc 23).

MISSION: Implement the system that continuously understands the marketplace.

**Summarizers:** Business, Customer, Neighborhood, Service, Trend, Campaign, Workspace — updated automatically on new marketplace data (event-triggered jobs).

**Intelligence models:** BusinessHealth, CustomerHealth, DemandPrediction, Popularity, TypicalCustomers, PeakHours, BusinessStrengths, BusinessWeaknesses, AlternativeBusinesses, RecommendedServices.

**Execution constraints (orchestrator-added, binding):**
- Compute from REAL data only (reviews, visits, bookings, analytics events, search logs). Where the dataset is too sparse for a model (e.g. DemandPrediction at 2 businesses), return typed `insufficientData` results — never fabricated numbers (D7 discipline applies to intelligence too).
- Derived facts write to the Feature Store contracts from Epic 03.
- Summaries are STORED and updated by jobs (SummarizeBusinessJob etc.), never regenerated per query (doc 22).
- Gates: typecheck + jest green. Never push.
