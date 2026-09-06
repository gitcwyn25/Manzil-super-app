# Gurman V0

Gurman V0 is a deterministic, database-backed fallback recommendation flow. It reads only publicly visible `Business` and `Category` rows; it does not add migrations, fabricate businesses, or use an LLM for scoring, ranking, or selection.

## What works

- `POST /gurman/v0/plan` accepts structured intent (`category`, `budget`, `radius`, coordinates, group size, occasion).
- Hard filters return typed rejection codes such as `over_budget` and `outside_radius`.
- Weighted deterministic ranking returns Decision/Explanation-compatible structured output with reason codes and confidence.
- The response composer makes one provider call only to express already-selected structured data as natural language. It uses the existing provider boundary and `ANTHROPIC_API_KEY`/provider configuration.
- Empty catalogs return `status: "insufficientData"`, no selected plan, and `available: false`. Fewer results than requested are marked `limitedResults`.

## Deliberate limits

The existing schema does not provide reliable per-request capacity or a normalized opening-hours contract, so V0 does not invent `no_capacity` or `closed` decisions. Those remain future reasoning-engine signals. Group size and occasion are accepted as intent context but do not create unsupported capabilities.

## V0 to Epics 07–08

The V0 `decision`, `candidatePlans`, `selectedPlan`, `alternatives`, `reasonCodes`, `confidence`, and separate `explanation` fields are stable migration seams. When retrieval and deterministic reasoning arrive, they can replace the catalog query and scoring implementation behind the same public response shape. V0 remains the fallback when graph or memory data is unavailable.
