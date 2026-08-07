import {
  computed,
  confidenceFromSample,
  gapOf,
  isComputed,
  MAX_DERIVED_CONFIDENCE,
  MIN_PUBLISHED_CONFIDENCE,
  MODEL_EVIDENCE_FLOOR,
  refusePending,
  refuseSparse,
  refuseUnknowable,
  refuseWithoutEvidence,
  valueOrNull,
  type IntelligenceModelName
} from "./marketplace-intelligence.evidence";

const NOW = "2026-08-07T09:00:00.000Z";

const base = {
  observations: 0,
  at: NOW,
  scopeKey: "business:biz_1",
  subjectId: "biz_1"
};

describe("evidence floors", () => {
  it("defines a floor for every model, with the reasoning attached", () => {
    for (const [model, floor] of Object.entries(MODEL_EVIDENCE_FLOOR)) {
      expect(floor.minObservations).toBeGreaterThan(0);
      expect(floor.minPeers).toBeGreaterThanOrEqual(0);
      expect(floor.minWindowDays).toBeGreaterThanOrEqual(0);
      // A floor without a stated reason is a magic number waiting to be tuned
      // by whoever finds it inconvenient.
      expect(floor.rationale.length).toBeGreaterThan(40);
      expect(model).toBeTruthy();
    }
  });

  it("keeps demand prediction the strictest model — it is the honesty test", () => {
    const prediction = MODEL_EVIDENCE_FLOOR.demand_prediction;

    expect(prediction.minWindowDays).toBeGreaterThanOrEqual(56);
    expect(prediction.minObservations).toBeGreaterThanOrEqual(40);
    expect(prediction.minPeers).toBeGreaterThanOrEqual(3);
  });

  it("holds weaknesses to the same evidence as strengths", () => {
    expect(MODEL_EVIDENCE_FLOOR.business_weaknesses.minObservations).toBe(
      MODEL_EVIDENCE_FLOOR.business_strengths.minObservations
    );
  });
});

describe("refuseWithoutEvidence", () => {
  it("refuses below the observation floor, naming the real sample size", () => {
    const refusal = refuseWithoutEvidence("popularity", { ...base, observations: 3, peers: 9 });

    expect(refusal).not.toBeNull();
    expect(refusal?.failure.error).toEqual({
      kind: "marketplace_sparse",
      scopeKey: "business:biz_1",
      sampleSize: 3
    });
    // Sparse is the one failure kind that time alone fixes.
    expect(refusal?.failure.retryable).toBe(true);
    expect(refusal?.evidence.required).toBe(MODEL_EVIDENCE_FLOOR.popularity.minObservations);
  });

  it("refuses when there are observations but no comparison set", () => {
    const refusal = refuseWithoutEvidence("popularity", { ...base, observations: 500, peers: 1 });

    expect(refusal).not.toBeNull();
    expect(refusal?.evidence.peers).toBe(1);
    expect(refusal?.evidence.requiredPeers).toBe(MODEL_EVIDENCE_FLOOR.popularity.minPeers);
  });

  it("refuses when the window is shorter than the model needs", () => {
    const refusal = refuseWithoutEvidence("trend", {
      ...base,
      observations: 100,
      window: { start: "2026-08-01T00:00:00.000Z", end: NOW }
    });

    expect(refusal).not.toBeNull();
  });

  it("passes when observations, peers and window all clear", () => {
    expect(
      refuseWithoutEvidence("popularity", {
        ...base,
        observations: 40,
        peers: 9,
        window: { start: "2026-05-09T09:00:00.000Z", end: NOW }
      })
    ).toBeNull();
  });
});

describe("the three refusal kinds", () => {
  it("distinguishes sparse (grow and ask again) from unknowable (no column exists)", () => {
    const sparse = refuseSparse("business_health", { ...base, observations: 2 });
    const unknowable = refuseUnknowable("typical_customers", {
      ...base,
      missingKey: "customer.segment_tags"
    });

    expect(sparse.failure.error.kind).toBe("marketplace_sparse");
    expect(sparse.failure.retryable).toBe(true);

    expect(unknowable.failure.error).toEqual({
      kind: "knowledge_missing",
      entityId: "biz_1",
      missingKey: "customer.segment_tags"
    });
    // Retrying forever for data no row can contain is the bug this prevents.
    expect(unknowable.failure.retryable).toBe(false);
  });

  it("names an unshipped dependency as feature_unavailable, not as sparsity", () => {
    const pending = refusePending("popularity", { ...base, featureKey: "trust.overall" });

    expect(pending.failure.error).toEqual({
      kind: "feature_unavailable",
      featureKey: "trust.overall",
      entityId: "biz_1"
    });
    expect(pending.failure.retryable).toBe(false);
  });
});

describe("confidence", () => {
  it("never reaches certainty — this module interprets rows, it does not restate them", () => {
    expect(confidenceFromSample(1_000_000, 3)).toBe(MAX_DERIVED_CONFIDENCE);
  });

  it("is zero with no observations, and rises with them", () => {
    expect(confidenceFromSample(0, 10)).toBe(0);
    expect(confidenceFromSample(10, 10)).toBeGreaterThanOrEqual(MIN_PUBLISHED_CONFIDENCE);
    expect(confidenceFromSample(40, 10)).toBeGreaterThan(confidenceFromSample(10, 10));
  });

  it("saturates at four times the floor", () => {
    expect(confidenceFromSample(40, 10)).toBe(confidenceFromSample(400, 10));
  });
});

describe("outcomes and gaps", () => {
  it("carries the evidence on a computed value", () => {
    const outcome = computed("peak_hours", 42, { ...base, observations: 30 });

    expect(isComputed(outcome)).toBe(true);
    expect(valueOrNull(outcome)).toBe(42);
    expect(outcome.evidence.observations).toBe(30);
    expect(gapOf("peak_hours", outcome)).toBeNull();
  });

  it("turns a refusal into a reportable gap with both counts", () => {
    const outcome = refuseSparse("demand_prediction", { ...base, observations: 3 });
    const gap = gapOf("demand_prediction", outcome);

    expect(valueOrNull(outcome)).toBeNull();
    expect(gap).toEqual({
      model: "demand_prediction",
      failure: outcome.failure,
      observations: 3,
      required: MODEL_EVIDENCE_FLOOR.demand_prediction.minObservations
    });
  });

  it("sorts and deduplicates the sources it reports", () => {
    const outcome = computed("average_spend", 1, {
      ...base,
      observations: 5,
      sources: ["visit", "booking", "visit"]
    });

    expect(outcome.evidence.sources).toEqual(["booking", "visit"]);
  });
});

describe("the model catalog", () => {
  it("names the ten models the epic requires", () => {
    const required: readonly IntelligenceModelName[] = [
      "business_health",
      "customer_health",
      "demand_prediction",
      "popularity",
      "typical_customers",
      "peak_hours",
      "business_strengths",
      "business_weaknesses",
      "alternative_businesses",
      "recommended_services"
    ];

    for (const model of required) {
      expect(MODEL_EVIDENCE_FLOOR[model]).toBeDefined();
    }
  });
});
