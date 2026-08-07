/**
 * Layer 2 (Marketplace Intelligence) — the honesty rule, as code.
 *
 * This is the most important file in Epic 06. Doc 22 wants a marketplace that
 * *understands itself*; the AI Bible forbids the platform from pretending to
 * know things. Manzil currently has ~2 businesses, so most of what a mature
 * marketplace would compute cannot be computed here — and the difference
 * between "declining bookings" and "we cannot tell yet" is the difference
 * between an intelligence layer and a random number generator.
 *
 * So every model in this module returns an `IntelligenceOutcome`: either a
 * value **with the evidence it stands on**, or a typed
 * `IntelligenceFailure` naming what was missing and how much of it there was.
 * There is no third branch, and no default value: a model that cannot be
 * computed is unrepresentable as a number.
 *
 * The floors are DATA (`MODEL_EVIDENCE_FLOOR`), not `if`s scattered through
 * services, for the same reason memory TTLs are data: a policy that lives in
 * whichever function needed it first cannot be reviewed, and cannot be raised
 * once when the marketplace grows.
 *
 * Imports `core` only.
 */
import type {
  Confidence,
  EntityId,
  IntelligenceFailure,
  IsoDateTime,
  KnowledgeSource,
  TimeWindow
} from "../core";

/**
 * The ten intelligence models Epic 06 names, plus the summarizer-level models
 * that carry their own floor. Closed union: a model added without a floor
 * below does not compile.
 */
export type IntelligenceModelName =
  | "business_health"
  | "customer_health"
  | "demand_prediction"
  | "popularity"
  | "typical_customers"
  | "peak_hours"
  | "business_strengths"
  | "business_weaknesses"
  | "alternative_businesses"
  | "recommended_services"
  | "popular_services"
  | "average_visit_minutes"
  | "average_spend"
  | "repeat_visitor_share"
  | "visit_frequency"
  | "activity_pattern"
  | "cuisine_ranking"
  | "travel_radius"
  | "trend"
  | "demand_pressure"
  | "neighborhood_character"
  | "service_market"
  | "campaign_performance"
  | "workspace_plan";

/** One model's minimum evidence, with the reason it is set where it is. */
export interface EvidenceFloor {
  /** Observations (rows, events, mentions) below which the model refuses. */
  readonly minObservations: number;
  /**
   * Comparable subjects the model needs. A percentile over one peer is not a
   * percentile; a substitute set drawn from one candidate is not a choice.
   */
  readonly minPeers: number;
  /** Days of history the model needs before it may speak about change. */
  readonly minWindowDays: number;
  /** Why this number — reviewed as prose, enforced as data. */
  readonly rationale: string;
}

/**
 * The floors.
 *
 * Deliberately conservative. At Manzil's current size almost every entry
 * refuses, and that is the correct behaviour: an intelligence layer that
 * produces confident output on two businesses has learned to lie before it
 * has learned to count.
 */
export const MODEL_EVIDENCE_FLOOR = {
  business_health: {
    minObservations: 8,
    minPeers: 0,
    minWindowDays: 30,
    rationale:
      "Health is a composite with no nullable fields, so it is all-or-nothing: it needs at least one approved review (freshness, response rate) and enough terminal bookings to state a trend. Eight observations across a month is the smallest set where 'declining' means something."
  },
  customer_health: {
    minObservations: 3,
    minPeers: 0,
    minWindowDays: 30,
    rationale:
      "Three visits is where an interval exists at all: with two you have one gap and cannot say whether a person is lapsing or simply between visits."
  },
  demand_prediction: {
    minObservations: 40,
    minPeers: 3,
    minWindowDays: 56,
    rationale:
      "A forecast needs a series, not a total: eight weeks of history and forty demand observations, across at least three providers, before a prediction is a projection rather than a guess dressed as one. This is the model the epic names explicitly — at two businesses it refuses, every time."
  },
  popularity: {
    minObservations: 20,
    minPeers: 5,
    minWindowDays: 30,
    rationale:
      "Popularity is marketplace-relative by definition (a [0,1] feature is a rank). With fewer than five comparable providers the rank encodes the size of the marketplace, not the standing of the business."
  },
  typical_customers: {
    minObservations: 10,
    minPeers: 0,
    minWindowDays: 0,
    rationale:
      "Segments come from merchant CRM tags — the only group-shape signal the schema carries. Ten tagged customers is the smallest set where a share is not one person's label."
  },
  peak_hours: {
    minObservations: 20,
    minPeers: 0,
    minWindowDays: 30,
    rationale:
      "A weekly rhythm has 7×24 buckets. Twenty observations is already thin; below it the 'peak' is wherever the first few bookings happened to fall."
  },
  business_strengths: {
    minObservations: 3,
    minPeers: 0,
    minWindowDays: 0,
    rationale:
      "Per aspect, not per business: three reviews mentioning parking is a signal about parking. One is an anecdote, and the owner would be right to reject it."
  },
  business_weaknesses: {
    minObservations: 3,
    minPeers: 0,
    minWindowDays: 0,
    rationale:
      "Symmetric with strengths on purpose. A weakness is published to owners and weighed in ranking, so it may not stand on less evidence than a strength does."
  },
  alternative_businesses: {
    minObservations: 1,
    minPeers: 1,
    minWindowDays: 0,
    rationale:
      "Substitution is structural (category, area, service names, price tier), not statistical — one comparable provider genuinely is one alternative. What it needs is a peer to exist at all."
  },
  recommended_services: {
    minObservations: 5,
    minPeers: 3,
    minWindowDays: 30,
    rationale:
      "Telling an owner to add a service is advice with a cost. It needs three peers offering it and five observed demand events, or the platform is guessing with the merchant's money."
  },
  popular_services: {
    minObservations: 5,
    minPeers: 0,
    minWindowDays: 0,
    rationale:
      "Ranking a business's own catalog is a share of its own bookings; five is where the top service is not simply the first one anybody booked."
  },
  average_visit_minutes: {
    minObservations: 5,
    minPeers: 0,
    minWindowDays: 0,
    rationale: "Five completed bookings with an end time before a duration is called typical."
  },
  average_spend: {
    minObservations: 3,
    minPeers: 0,
    minWindowDays: 0,
    rationale: "Three spending customers; below that the average is one receipt."
  },
  repeat_visitor_share: {
    minObservations: 10,
    minPeers: 0,
    minWindowDays: 0,
    rationale: "A share over fewer than ten customers moves by 10+ points per person."
  },
  visit_frequency: {
    minObservations: 3,
    minPeers: 0,
    minWindowDays: 30,
    rationale: "Visits per month needs both several visits and a month to have passed."
  },
  activity_pattern: {
    minObservations: 8,
    minPeers: 0,
    minWindowDays: 0,
    rationale: "Four day-parts; eight observations is two per bucket at best."
  },
  cuisine_ranking: {
    minObservations: 3,
    minPeers: 0,
    minWindowDays: 0,
    rationale: "A ranking needs repeats: three category-bearing visits before an order exists."
  },
  travel_radius: {
    minObservations: 3,
    minPeers: 3,
    minWindowDays: 0,
    rationale:
      "A radius is the spread of visited places. Three located businesses is the minimum spread that is not a line segment."
  },
  trend: {
    minObservations: 10,
    minPeers: 0,
    minWindowDays: 60,
    rationale:
      "A trend compares two equal windows, so it needs both halves populated. Ten observations across sixty days is the floor at which direction survives one busy weekend."
  },
  demand_pressure: {
    minObservations: 10,
    minPeers: 1,
    minWindowDays: 30,
    rationale:
      "Pressure is demand ÷ supply. Ten demand events and one real provider; with zero supply the ratio is not large, it is undefined."
  },
  neighborhood_character: {
    minObservations: 3,
    minPeers: 3,
    minWindowDays: 0,
    rationale:
      "A neighborhood described from fewer than three businesses is a description of those businesses."
  },
  service_market: {
    minObservations: 2,
    minPeers: 2,
    minWindowDays: 0,
    rationale:
      "A median price needs two providers; with one, the 'market rate' is that provider's price with extra steps."
  },
  campaign_performance: {
    minObservations: 10,
    minPeers: 0,
    minWindowDays: 0,
    rationale: "Ten sends before a delivery rate is a rate rather than a tally."
  },
  workspace_plan: {
    minObservations: 1,
    minPeers: 0,
    minWindowDays: 0,
    rationale:
      "Nominal. The relational schema has no Workspace model at all, so this summarizer never reaches a floor — it returns knowledge_missing, which is a different statement from 'not enough workspaces'."
  }
} as const satisfies Readonly<Record<IntelligenceModelName, EvidenceFloor>>;

/**
 * What a computed value stands on. Travels with every outcome — including the
 * refusals, because "0 of 40" is the most useful thing a refusal can say.
 */
export interface EvidenceBasis {
  readonly observations: number;
  readonly required: number;
  readonly peers: number;
  readonly requiredPeers: number;
  readonly window: TimeWindow | null;
  /** Which raw sources the observations came from, deduplicated and sorted. */
  readonly sources: readonly KnowledgeSource[];
}

/** A model result: a value with its evidence, or a typed reason there is none. */
export type IntelligenceOutcome<TValue> =
  | {
      readonly status: "computed";
      readonly value: TValue;
      readonly confidence: Confidence;
      readonly evidence: EvidenceBasis;
    }
  | {
      readonly status: "insufficient_data";
      readonly evidence: EvidenceBasis;
      readonly failure: IntelligenceFailure;
    };

/**
 * A model that refused, recorded.
 *
 * The honesty rule is only half-kept by refusing: the other half is *saying
 * so*, in a form an owner dashboard, a metrics sink and a Layer 5 explanation
 * can all read. So every stored summary carries the gaps beside the knowledge
 * — "we did not compute demand for you, we needed 40 observations and had 3"
 * — instead of a silently absent field that looks like a bug.
 */
export interface IntelligenceGap {
  readonly model: IntelligenceModelName;
  readonly failure: IntelligenceFailure;
  readonly observations: number;
  readonly required: number;
}

/** The gap an outcome represents, or null when it computed. */
export function gapOf<TValue>(
  model: IntelligenceModelName,
  outcome: IntelligenceOutcome<TValue>
): IntelligenceGap | null {
  if (outcome.status === "computed") return null;

  return {
    model,
    failure: outcome.failure,
    observations: outcome.evidence.observations,
    required: outcome.evidence.required
  };
}

/** True when an outcome carries a value — the type guard consumers narrow on. */
export function isComputed<TValue>(
  outcome: IntelligenceOutcome<TValue>
): outcome is Extract<IntelligenceOutcome<TValue>, { status: "computed" }> {
  return outcome.status === "computed";
}

/** The value, or null. For call sites that legitimately accept absence. */
export function valueOrNull<TValue>(outcome: IntelligenceOutcome<TValue>): TValue | null {
  return outcome.status === "computed" ? outcome.value : null;
}

/**
 * Ceiling on the confidence of anything this module derives.
 *
 * Below 1.0 always. Certainty is reserved for restatements of rows that exist
 * (Epic 04's projected edges); every fact here is an *interpretation* of rows
 * — "these bookings cluster on Friday evening" is a reading, not a row.
 */
export const MAX_DERIVED_CONFIDENCE = 0.9;

/** Floor on the confidence of anything published at all. */
export const MIN_PUBLISHED_CONFIDENCE = 0.3;

/**
 * Sample size → confidence, as a transparent linear ramp.
 *
 * Deliberately not a model. It saturates at four times the model's floor: at
 * exactly the floor a fact is admissible but weak, and it earns certainty by
 * being observed repeatedly, which is the only thing sample size can tell us.
 */
export function confidenceFromSample(observations: number, floor: number): Confidence {
  if (observations <= 0 || floor <= 0) return 0;

  const saturation = floor * 4;
  const ramp = MIN_PUBLISHED_CONFIDENCE + (MAX_DERIVED_CONFIDENCE - MIN_PUBLISHED_CONFIDENCE) *
    Math.min(1, observations / saturation);

  return Math.round(Math.min(MAX_DERIVED_CONFIDENCE, ramp) * 100) / 100;
}

/** Input to the one gate every model passes through. */
export interface EvidenceInput {
  readonly observations: number;
  readonly peers?: number;
  readonly window?: TimeWindow | null;
  readonly sources?: readonly KnowledgeSource[];
  readonly at: IsoDateTime;
  /** The entity the model was asked about, for the failure payload. */
  readonly subjectId?: EntityId | null;
  /** Stable scope key for `marketplace_sparse` (`business:clx…`, `service:haircut`). */
  readonly scopeKey: string;
}

function basisOf(model: IntelligenceModelName, input: EvidenceInput): EvidenceBasis {
  const floor = MODEL_EVIDENCE_FLOOR[model];

  return {
    observations: input.observations,
    required: floor.minObservations,
    peers: input.peers ?? 0,
    requiredPeers: floor.minPeers,
    window: input.window ?? null,
    sources: [...new Set(input.sources ?? [])].sort()
  };
}

function windowDays(window: TimeWindow | null | undefined): number {
  if (!window) return 0;

  const start = Date.parse(window.start);
  const end = Date.parse(window.end);
  if (Number.isNaN(start) || Number.isNaN(end)) return 0;

  return Math.max(0, (end - start) / 86_400_000);
}

/**
 * THE gate. Returns a refusal when the evidence does not clear the model's
 * floor, and null when it does — so every model reads:
 *
 * ```ts
 * const refusal = refuseWithoutEvidence("popularity", input);
 * if (refusal) return refusal;
 * ```
 *
 * A model that forgets the gate is visible in review as a model with no
 * refusal branch, which is exactly the thing this epic is not allowed to ship.
 */
export function refuseWithoutEvidence<TValue>(
  model: IntelligenceModelName,
  input: EvidenceInput
): Extract<IntelligenceOutcome<TValue>, { status: "insufficient_data" }> | null {
  const floor = MODEL_EVIDENCE_FLOOR[model];
  const evidence = basisOf(model, input);

  const thin =
    input.observations < floor.minObservations ||
    (input.peers ?? 0) < floor.minPeers ||
    windowDays(input.window) < floor.minWindowDays;

  if (!thin) return null;

  return {
    status: "insufficient_data",
    evidence,
    failure: {
      error: {
        kind: "marketplace_sparse",
        scopeKey: input.scopeKey,
        sampleSize: input.observations
      },
      // Retryable: the marketplace grows. This is the one failure kind in the
      // taxonomy that time alone fixes, and saying so is what lets a scheduler
      // keep asking instead of blacklisting the subject.
      retryable: true,
      occurredAt: input.at
    }
  };
}

/**
 * An unconditional sparse refusal.
 *
 * `refuseWithoutEvidence` answers "is there enough?", which is the right
 * question for a model's whole input. Component checks — a health block that
 * cleared the aggregate floor on reviews alone but has no bookings — already
 * know the answer, and expressing that through a maybe-null gate would need a
 * cast at every call site.
 */
export function refuseSparse<TValue>(
  model: IntelligenceModelName,
  input: EvidenceInput
): Extract<IntelligenceOutcome<TValue>, { status: "insufficient_data" }> {
  return {
    status: "insufficient_data",
    evidence: basisOf(model, input),
    failure: {
      error: {
        kind: "marketplace_sparse",
        scopeKey: input.scopeKey,
        sampleSize: input.observations
      },
      retryable: true,
      occurredAt: input.at
    }
  };
}

/** A computed outcome, with confidence derived from the evidence behind it. */
export function computed<TValue>(
  model: IntelligenceModelName,
  value: TValue,
  input: EvidenceInput
): Extract<IntelligenceOutcome<TValue>, { status: "computed" }> {
  const floor = MODEL_EVIDENCE_FLOOR[model];

  return {
    status: "computed",
    value,
    confidence: confidenceFromSample(input.observations, floor.minObservations),
    evidence: basisOf(model, input)
  };
}

/**
 * A refusal because the *schema records nothing at all* — distinct from a
 * refusal because there is too little.
 *
 * `marketplace_sparse` says "ask again when we have grown". `knowledge_missing`
 * says "no amount of growth will fix this; a column has to exist first". Party
 * size, venue capacity, noise, and workspaces are all this second kind, and
 * conflating them would have a scheduler retrying forever for data no row can
 * ever contain.
 */
export function refuseUnknowable<TValue>(
  model: IntelligenceModelName,
  input: EvidenceInput & { readonly missingKey: string }
): Extract<IntelligenceOutcome<TValue>, { status: "insufficient_data" }> {
  return {
    status: "insufficient_data",
    evidence: basisOf(model, input),
    failure: {
      error: {
        kind: "knowledge_missing",
        entityId: input.subjectId ?? null,
        missingKey: input.missingKey
      },
      retryable: false,
      occurredAt: input.at
    }
  };
}

/**
 * A refusal because a *layer this feature depends on has not shipped* — the
 * trust score today. Neither sparse nor unknowable: the data will exist when
 * the owning module does, and the failure names the feature rather than the
 * marketplace.
 */
export function refusePending<TValue>(
  model: IntelligenceModelName,
  input: EvidenceInput & { readonly featureKey: string }
): Extract<IntelligenceOutcome<TValue>, { status: "insufficient_data" }> {
  return {
    status: "insufficient_data",
    evidence: basisOf(model, input),
    failure: {
      error: {
        kind: "feature_unavailable",
        featureKey: input.featureKey,
        entityId: input.subjectId ?? null
      },
      retryable: false,
      occurredAt: input.at
    }
  };
}
