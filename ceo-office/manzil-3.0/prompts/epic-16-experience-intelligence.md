# Epic 16 — Experience Intelligence & Learning System

> QUEUED after Epic 15. **Numbering:** Autonomous Marketplace shifts to Epic 17 (and is largely absorbed by 13's forecasting + 10's evaluation). This is the platform's **learning brain** — what turns Gurman from "an AI that books" into "an AI that understands people".

## The problem with stars

Three restaurants all rate 4.8: one has amazing food but slow, loud service; one is romantic with average food and excellent service; one is cheap, fast, kid-friendly, noisy. Google treats them as equivalent. Humans don't. **Gurman must not.**

## Experience Vectors, not ratings

Every business carries a semantic profile instead of a scalar:

```yaml
food:     { taste: 9.7, freshness: 9.2, presentation: 8.9 }
service:  { friendliness: 9.8, speed: 6.4, professionalism: 9.0 }
atmosphere: { romantic: 9.8, family: 2.0, luxury: 8.9, quiet: 8.7 }
value:    { worth_price: 8.2 }
accessibility: { parking: 7.8 }
consistency: { stable_quality: 9.4 }
```

Plus a learned **experience embedding** (768/1024-dim) for similarity.

## Implement

- **Experience Graph** + **Experience DNA** per business (luxury 92 · romantic 96 · family 28 · quiet 90 · business 82 · nightlife 18 · vegetarian 67 · fast 44) — continuously learned, never manually entered.
- **Review Intelligence:** stop asking "rate 1-5"; ask "how was it?" (voice, text, photos, receipt, timeline, group feedback) and extract structure — "steak incredible / waited 40 min / staff apologized / music too loud" → `{food_quality: 0.97, waiting_time: high, service_recovery: excellent, noise: high, sentiment: positive}`. No human tagging. Pipeline: review → LLM extraction → Experience Graph → Knowledge Graph → Business Intelligence → Marketplace Intelligence → future recommendations.
- **Group Consensus Engine:** five friends produce five individual vectors → consensus vector + **disagreement score** + summary. Gurman then recommends the best *compromise*, not the highest-rated place.
- **Trust-weighted reviews:** every review carries confidence from verified booking, visit duration, receipt match, group consensus, review consistency, historical reliability, bot likelihood, spam probability. High-trust reviews dominate recommendations.
- **Emotional journey analysis:** arrival → ordering → waiting → dining → payment → departure, with sentiment per stage, so the AI locates *exactly where friction occurred*.
- **Experience similarity:** "96% similar experience" replaces "people also visited".
- **Business Improvement AI (nightly):** strengths, weaknesses, vs competitors / last month / category average, suggested improvements **with expected impact** ("reduce average wait 38→22 min → +11% repeat visits"). Owners get actionable reports, not raw reviews.
- **Marketplace learning:** aggregate patterns ("young professionals prefer quieter cafés after 20:00", "families avoid venues without parking", "proposal dinners need privacy + flowers + photography + window seating") — powering recommendations **without exposing individual user data**.
- **Experience Memory:** each completed experience stores intent, participants, businesses, budget, timeline, photos, AI summary, individual vectors, group consensus, and lessons learned — so Gurman can open the next plan with "last year the group disliked the loud music; prioritize quieter places?" Intelligence from *your own history*, not generic AI.
- **Long-term preference evolution** + continuous evaluation/retraining pipeline.

## Binding execution constraints (orchestrator-added)

1. **This is the first epic that legitimately needs embeddings + a vector store** — gated on Epic 07's semantic provider contracts (pgvector/Qdrant/etc.). Vectors are computed by a pipeline, never by the conversation layer.
2. **Extraction is an LLM job, not an LLM decision** — review→structure runs as a batch job (Epic 03 job contracts) whose output is validated structured data; the reasoning engine still decides (ADR-007).
3. **Privacy is a hard constraint:** marketplace learning publishes aggregate patterns only, with k-anonymity thresholds; individual vectors never leave the user's own memory tier. Group consensus visible to participants only.
4. **Cold start honesty:** a business with three reviews has no Experience DNA — return `insufficientData`, never an interpolated personality. Confidence must be visible wherever DNA is consumed.
5. Extends (never forks) Epic 05 memory tiers, Epic 06 summarizers, Epic 10 evaluation signals.

## Why it is defensible

It trains on proprietary experience data — group consensus, emotional journeys, trust-weighted outcomes — that competitors cannot reproduce by scraping listings.
