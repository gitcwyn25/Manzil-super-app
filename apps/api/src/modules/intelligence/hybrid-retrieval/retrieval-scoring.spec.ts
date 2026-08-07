import {
  buildScore,
  clamp01,
  contributingSignals,
  distanceScoreOf,
  EMPTY_SCORE_INPUT,
  freshnessScoreOf,
  measuredComponentCount,
  mergeReasonCodes,
  mergeScores,
  overallScore,
  RETRIEVAL_SCORE_COMPONENTS,
  RETRIEVAL_SCORE_WEIGHTS,
  scoreComponents
} from "./retrieval-scoring";

/**
 * The one behaviour worth defending in this file: **a missing signal is never
 * a zero.** Everything else is arithmetic.
 */
describe("overallScore — normalization over present components", () => {
  it("normalizes by the weights of the components that exist, not by all nine", () => {
    const twoStrong = overallScore({
      ...EMPTY_SCORE_INPUT,
      retrievalScore: 1,
      memoryScore: 1
    });

    expect(twoStrong).toBe(1);
  });

  it("does not punish an item for signals nobody could measure", () => {
    const sparse = overallScore({ ...EMPTY_SCORE_INPUT, retrievalScore: 0.9, graphScore: 0.9 });
    const dense = overallScore({
      retrievalScore: 0.9,
      graphScore: 0.9,
      memoryScore: 0.2,
      featureScore: 0.2,
      distanceScore: 0.2,
      availabilityScore: 0.2,
      freshnessScore: 0.2,
      businessTrustScore: 0.2,
      semanticScore: 0.2
    });

    expect(sparse).toBeGreaterThan(dense);
  });

  it("would rank the well-evidenced item BELOW the thin one if nulls were zeros", () => {
    // The counterfactual, asserted so the intent survives a refactor: treating
    // absence as zero inverts the ranking this platform needs.
    const asZeros = (input: Record<string, number | null>) => {
      const total = RETRIEVAL_SCORE_COMPONENTS.reduce(
        (sum, component) => sum + (input[component] ?? 0) * RETRIEVAL_SCORE_WEIGHTS[component],
        0
      );
      const weight = RETRIEVAL_SCORE_COMPONENTS.reduce(
        (sum, component) => sum + RETRIEVAL_SCORE_WEIGHTS[component],
        0
      );
      return total / weight;
    };

    const sparse = { retrievalScore: 0.9, graphScore: 0.9 };
    const dense = {
      retrievalScore: 0.9,
      graphScore: 0.9,
      memoryScore: 0.2,
      featureScore: 0.2,
      distanceScore: 0.2,
      availabilityScore: 0.2,
      freshnessScore: 0.2,
      businessTrustScore: 0.2,
      semanticScore: 0.2
    };

    expect(asZeros(sparse)).toBeLessThan(asZeros(dense));
    expect(overallScore({ ...EMPTY_SCORE_INPUT, ...sparse })).toBeGreaterThan(
      overallScore({ ...EMPTY_SCORE_INPUT, ...dense })
    );
  });

  it("answers zero — not NaN — when nothing at all was measurable", () => {
    expect(overallScore(EMPTY_SCORE_INPUT)).toBe(0);
  });

  it("counts how many of the nine an item actually stands on", () => {
    expect(measuredComponentCount({ ...EMPTY_SCORE_INPUT, retrievalScore: 1, graphScore: 0 })).toBe(
      2
    );
  });
});

describe("buildScore", () => {
  it("requires an engine relevance and keeps every unmeasured component null", () => {
    const score = buildScore(0.8, ["graph_match"]);

    expect(score.retrievalScore).toBe(0.8);
    expect(score.semanticScore).toBeNull();
    expect(score.memoryScore).toBeNull();
    expect(score.reasonCodes).toEqual(["graph_match"]);
  });

  it("clamps out-of-range inputs rather than propagating them", () => {
    expect(buildScore(4, ["graph_match"]).retrievalScore).toBe(1);
    expect(buildScore(-2, ["graph_match"]).retrievalScore).toBe(0);
    expect(buildScore(0.5, ["graph_match"], { graphScore: Number.NaN }).graphScore).toBeNull();
  });

  it("leaves semanticScore null on everything this platform can produce today", () => {
    expect(buildScore(1, ["graph_match"], { graphScore: 1 }).semanticScore).toBeNull();
  });
});

describe("mergeScores — the owner keeps what it measured", () => {
  const owner = buildScore(0.9, ["workspace_match"], { memoryScore: 0.9 });
  const other = buildScore(0.2, ["business_knowledge"], {
    memoryScore: 0.1,
    businessTrustScore: 0.7
  });

  it("fills only the gaps, never overwrites", () => {
    const merged = mergeScores(owner, other);

    expect(merged.memoryScore).toBe(0.9);
    expect(merged.businessTrustScore).toBe(0.7);
  });

  it("keeps the owner's own relevance so the item ranks as its owner scored it", () => {
    expect(mergeScores(owner, other).retrievalScore).toBe(0.9);
  });

  it("unions the reason codes without duplicating them", () => {
    const merged = mergeScores(owner, other);

    expect(merged.reasonCodes).toEqual(["workspace_match", "business_knowledge"]);
    expect(mergeReasonCodes(["graph_match"], ["graph_match"])).toEqual(["graph_match"]);
  });

  it("never averages two contradictory readings — Epic 05's conflict rule", () => {
    const high = buildScore(1, ["business_knowledge"], { businessTrustScore: 0.9 });
    const low = buildScore(1, ["marketplace_signal"], { businessTrustScore: 0.1 });

    expect(mergeScores(high, low).businessTrustScore).toBe(0.9);
    expect(mergeScores(low, high).businessTrustScore).toBe(0.1);
  });
});

describe("signal helpers", () => {
  it("reports distance as a transparent ramp to a horizon", () => {
    expect(distanceScoreOf(0, 10)).toBe(1);
    expect(distanceScoreOf(5, 10)).toBe(0.5);
    expect(distanceScoreOf(20, 10)).toBe(0);
    expect(distanceScoreOf(1, 0)).toBeNull();
  });

  it("returns null freshness for sources that declare no TTL, not a confident 1", () => {
    expect(freshnessScoreOf(0, null)).toBeNull();
    expect(freshnessScoreOf(0, 100)).toBe(1);
    expect(freshnessScoreOf(50, 100)).toBe(0.5);
    expect(freshnessScoreOf(500, 100)).toBe(0);
  });

  it("clamps without inventing a midpoint", () => {
    expect(clamp01(Number.NaN)).toBe(0);
    expect(clamp01(2)).toBe(1);
  });
});

describe("contributingSignals — what an explanation may cite", () => {
  it("lists only the components that were measured", () => {
    const score = buildScore(0.5, ["graph_match"], { graphScore: 0.4 });
    const keys = contributingSignals(score).map((entry) => entry.key);

    expect(keys).toEqual(["score.retrievalScore", "score.graphScore"]);
  });

  it("projects the score back into a plain component record", () => {
    const score = buildScore(0.5, ["graph_match"], { graphScore: 0.4 });

    expect(scoreComponents(score).graphScore).toBe(0.4);
    expect(scoreComponents(score).semanticScore).toBeNull();
  });
});
