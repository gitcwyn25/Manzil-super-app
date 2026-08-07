/**
 * Layer 4.5 (Hybrid Retrieval) — the score, as arithmetic anyone can audit.
 *
 * The epic mandates ten score fields per entity. The interesting decision is
 * not which ten, it is what happens when eight of them are `null` — which, at
 * Manzil's current data volume, is most of the time.
 *
 * **A missing signal is never a zero.** The overall score is a weighted mean
 * over the components that *exist*, normalized by the weights of those
 * components alone. An item scored on graph evidence and freshness gets the
 * score its two signals justify, not a score dragged toward zero by eight
 * absences. The alternative — treating `null` as 0 — quietly ranks
 * well-evidenced items below thin ones whenever the thin ones happen to have
 * more *kinds* of thin evidence, which is precisely backwards.
 *
 * What that costs is comparability: a score from two components and a score
 * from seven are not the same measurement, so `RetrievalScore` keeps every
 * component visible and the pipeline sorts by *source priority first*
 * (`retrieval-ranking.ts`), using the score only within a priority band.
 *
 * The weights are DATA, for the reason every policy in this platform is data:
 * a weight that lives inside whichever function needed it first cannot be
 * reviewed and cannot be tuned once.
 *
 * Imports `core` only.
 */
import type { NonEmptyArray } from "../core";
import type {
  RetrievalFact,
  RetrievalReasonCode,
  RetrievalScore
} from "./hybrid-retrieval.types";

/** The nine weighted components; `overallScore` is their result, not an input. */
export type RetrievalScoreComponent =
  | "retrievalScore"
  | "semanticScore"
  | "graphScore"
  | "memoryScore"
  | "featureScore"
  | "distanceScore"
  | "availabilityScore"
  | "freshnessScore"
  | "businessTrustScore";

/**
 * The weights.
 *
 * Ordered by ADR-006's principles rather than by intuition: memory and graph
 * evidence — knowledge that is *ours* — carry the most; the engine's own
 * relevance is the baseline; semantic similarity carries the least of any
 * non-zero weight, because "structured knowledge outranks semantic
 * similarity" has to be true in the arithmetic and not only in the sort.
 *
 * Note that the sort already places semantic last unconditionally, so this
 * weight only matters inside the semantic band. It is deliberately low anyway:
 * if the two mechanisms ever disagree, they should disagree in the same
 * direction.
 */
export const RETRIEVAL_SCORE_WEIGHTS = {
  retrievalScore: 1,
  semanticScore: 0.4,
  graphScore: 1.2,
  memoryScore: 1.5,
  featureScore: 0.9,
  distanceScore: 0.8,
  availabilityScore: 1,
  freshnessScore: 0.6,
  businessTrustScore: 1.1
} as const satisfies Readonly<Record<RetrievalScoreComponent, number>>;

/** The components, in the order `explain()` reports them. */
export const RETRIEVAL_SCORE_COMPONENTS = [
  "retrievalScore",
  "memoryScore",
  "graphScore",
  "businessTrustScore",
  "availabilityScore",
  "featureScore",
  "distanceScore",
  "freshnessScore",
  "semanticScore"
] as const satisfies readonly RetrievalScoreComponent[];

/** Clamps a raw signal into [0, 1]; NaN becomes null upstream, never 0.5. */
export function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

/** Rounds to four places so scores are stable across platforms and snapshots. */
export function roundScore(value: number): number {
  return Math.round(value * 10_000) / 10_000;
}

/** The nine components of a score, as a plain record for iteration. */
export type RetrievalScoreInput = Readonly<Record<RetrievalScoreComponent, number | null>>;

/** Every component absent — the starting point every engine narrows from. */
export const EMPTY_SCORE_INPUT: RetrievalScoreInput = {
  retrievalScore: null,
  semanticScore: null,
  graphScore: null,
  memoryScore: null,
  featureScore: null,
  distanceScore: null,
  availabilityScore: null,
  freshnessScore: null,
  businessTrustScore: null
};

/**
 * The weighted mean over present components.
 *
 * Returns 0 only when *nothing* was measurable, which cannot happen through
 * `buildScore` — `retrievalScore` is required there — but is expressible here
 * and answered honestly rather than by dividing by zero.
 */
export function overallScore(input: RetrievalScoreInput): number {
  let weighted = 0;
  let weight = 0;

  for (const component of RETRIEVAL_SCORE_COMPONENTS) {
    const value = input[component];
    if (value === null || !Number.isFinite(value)) continue;

    const componentWeight = RETRIEVAL_SCORE_WEIGHTS[component];
    weighted += clamp01(value) * componentWeight;
    weight += componentWeight;
  }

  return weight === 0 ? 0 : roundScore(weighted / weight);
}

/** How many of the nine components an item was actually scored on. */
export function measuredComponentCount(input: RetrievalScoreInput): number {
  return RETRIEVAL_SCORE_COMPONENTS.filter((component) => input[component] !== null).length;
}

/**
 * Builds a score from a required engine relevance plus whatever else is known.
 *
 * `retrievalScore` is required by the signature because an engine that cannot
 * say how relevant its own hit is has not retrieved anything — it has listed
 * something.
 */
export function buildScore(
  retrievalScore: number,
  reasonCodes: NonEmptyArray<RetrievalReasonCode>,
  components: Partial<RetrievalScoreInput> = {}
): RetrievalScore {
  const input: RetrievalScoreInput = {
    ...EMPTY_SCORE_INPUT,
    ...components,
    retrievalScore: clamp01(retrievalScore)
  };

  return {
    retrievalScore: input.retrievalScore ?? 0,
    semanticScore: normalize(input.semanticScore),
    graphScore: normalize(input.graphScore),
    memoryScore: normalize(input.memoryScore),
    featureScore: normalize(input.featureScore),
    distanceScore: normalize(input.distanceScore),
    availabilityScore: normalize(input.availabilityScore),
    freshnessScore: normalize(input.freshnessScore),
    businessTrustScore: normalize(input.businessTrustScore),
    overallScore: overallScore(input),
    reasonCodes
  };
}

/** A component value clamped, or null — never a coerced number. */
function normalize(value: number | null): number | null {
  if (value === null || !Number.isFinite(value)) return null;
  return roundScore(clamp01(value));
}

/** The score's components as a plain record, for merging and reporting. */
export function scoreComponents(score: RetrievalScore): RetrievalScoreInput {
  return {
    retrievalScore: score.retrievalScore,
    semanticScore: score.semanticScore,
    graphScore: score.graphScore,
    memoryScore: score.memoryScore,
    featureScore: score.featureScore,
    distanceScore: score.distanceScore,
    availabilityScore: score.availabilityScore,
    freshnessScore: score.freshnessScore,
    businessTrustScore: score.businessTrustScore
  };
}

/**
 * The components that were actually measured, as keyed facts — what
 * `explain()` publishes.
 *
 * Absent components are omitted rather than reported as null: an explanation
 * lists what supported the item, and "we could not measure distance" belongs
 * in a warning, not in the reasons an item ranked where it did.
 */
export function contributingSignals(score: RetrievalScore): readonly RetrievalFact[] {
  const components = scoreComponents(score);

  return RETRIEVAL_SCORE_COMPONENTS.filter((component) => components[component] !== null).map(
    (component) => ({ key: `score.${component}`, value: components[component] })
  );
}

/**
 * Merges two engines' views of the same entity.
 *
 * The *primary* score keeps its components; the secondary fills only the gaps.
 * That direction is the merge rule of the whole pipeline restated at the field
 * level: the higher-priority engine owns the item, and a lower-priority engine
 * may add what the owner could not measure but may never overwrite what it
 * did. Two engines disagreeing about trust is resolved by priority, not by an
 * average — averaging contradictory knowledge is exactly what Epic 05's
 * conflict rule refuses to do.
 */
export function mergeScores(primary: RetrievalScore, secondary: RetrievalScore): RetrievalScore {
  const primaryComponents = scoreComponents(primary);
  const secondaryComponents = scoreComponents(secondary);

  const merged = { ...primaryComponents } as { [K in RetrievalScoreComponent]: number | null };

  for (const component of RETRIEVAL_SCORE_COMPONENTS) {
    if (merged[component] === null) merged[component] = secondaryComponents[component];
  }

  // `retrievalScore` is the engine's own relevance and is required; the
  // primary's always wins, so the merged item ranks as its owner scored it.
  merged.retrievalScore = primary.retrievalScore;

  const reasonCodes = mergeReasonCodes(primary.reasonCodes, secondary.reasonCodes);

  return {
    retrievalScore: merged.retrievalScore,
    semanticScore: merged.semanticScore,
    graphScore: merged.graphScore,
    memoryScore: merged.memoryScore,
    featureScore: merged.featureScore,
    distanceScore: merged.distanceScore,
    availabilityScore: merged.availabilityScore,
    freshnessScore: merged.freshnessScore,
    businessTrustScore: merged.businessTrustScore,
    overallScore: overallScore(merged),
    reasonCodes
  };
}

/** Union of two reason-code lists, order-stable and deduplicated. */
export function mergeReasonCodes(
  primary: NonEmptyArray<RetrievalReasonCode>,
  secondary: readonly RetrievalReasonCode[]
): NonEmptyArray<RetrievalReasonCode> {
  const seen = new Set<RetrievalReasonCode>(primary);
  const merged: RetrievalReasonCode[] = [...primary];

  for (const code of secondary) {
    if (seen.has(code)) continue;
    seen.add(code);
    merged.push(code);
  }

  return merged as NonEmptyArray<RetrievalReasonCode>;
}

/**
 * Distance as a score in [0, 1], linear to a horizon.
 *
 * Deliberately not a decay curve. A transparent ramp is auditable by anyone
 * reading the number; an exponential with a tuned half-life is a model, and
 * this module does not ship models it cannot defend from data it does not
 * have.
 */
export function distanceScoreOf(distanceKm: number, horizonKm: number): number | null {
  if (!Number.isFinite(distanceKm) || !Number.isFinite(horizonKm) || horizonKm <= 0) return null;
  return roundScore(clamp01(1 - distanceKm / horizonKm));
}

/**
 * Freshness as a score in [0, 1], linear to a TTL.
 *
 * Knowledge at age 0 scores 1; at its TTL it scores 0 and is `stale`. Sources
 * that declare no TTL (structural graph facts) get `null`, not 1 — "does not
 * rot" is not the same claim as "was just computed".
 */
export function freshnessScoreOf(ageSeconds: number, ttlSeconds: number | null): number | null {
  if (ttlSeconds === null || ttlSeconds <= 0) return null;
  if (!Number.isFinite(ageSeconds) || ageSeconds < 0) return null;
  return roundScore(clamp01(1 - ageSeconds / ttlSeconds));
}
