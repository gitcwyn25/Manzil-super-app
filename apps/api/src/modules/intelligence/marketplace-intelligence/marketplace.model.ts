/**
 * Layer 2 (Marketplace Intelligence) — the marketplace-wide models, as pure
 * functions: neighborhoods, services, trends, demand, and the demand forecast.
 *
 * `DemandPrediction` is the model the epic calls out by name, and it is the
 * clearest illustration of this module's rule. A forecast is a claim about
 * the future; the only honest basis for one is a *series*, and a series needs
 * weeks. At Manzil's size there are no weeks, so the model refuses — with the
 * real observation count attached — instead of extrapolating two data points
 * into a trend line that a merchant would plan around.
 *
 * Imports `core` and Layer 2 contracts only.
 */
import type { EntityId, IsoDateTime, MoneyAmount, TimeWindow } from "../core";
import type {
  DemandSummary,
  MarketplaceFact,
  NeighborhoodSummary,
  RelationshipFactSummary,
  ServiceSummary,
  TrendSummary
} from "./marketplace-intelligence.types";
import {
  computed,
  confidenceFromSample,
  MODEL_EVIDENCE_FLOOR,
  refuseSparse,
  refuseUnknowable,
  refuseWithoutEvidence,
  type IntelligenceModelName,
  type IntelligenceOutcome
} from "./marketplace-intelligence.evidence";
import { OBSERVATION_WINDOW_DAYS } from "./marketplace-intelligence.freshness";
import {
  decimalToNumber,
  FACT_SOURCE,
  isCanceledBooking,
  normalizeServiceName,
  priceTierLevel,
  type BookingIntelligenceRow,
  type BusinessIntelligenceRow,
  type PackageIntelligenceRow,
  type SearchLogRow,
  type VisitIntelligenceRow
} from "./marketplace-intelligence.projection";
import { serviceKeyId, type NeighborhoodKey } from "./marketplace-intelligence.slots";
import {
  changeRate,
  clamp01,
  mean,
  median,
  peakWindows,
  precedingWindow,
  rankByFrequency,
  roundTo,
  toMoney,
  trendDirection,
  weeklyHistogram,
  windowEndingAt,
  within
} from "./marketplace-intelligence.statistics";

/**
 * A `MarketplaceFact` restating a count of rows.
 *
 * Confidence 1.0, and only ever for restatements: "this district contains four
 * businesses" is a `SELECT COUNT(*)`, not an interpretation. Epic 04 drew the
 * same line for projected graph edges, and keeping it lets a consumer tell a
 * counted fact from a derived one by reading the confidence alone.
 */
export function restatedFact<TValue>(
  value: TValue,
  sampleSize: number,
  window: TimeWindow,
  now: IsoDateTime
): MarketplaceFact<TValue> {
  return { value, sampleSize, window, confidence: 1, generatedAt: now };
}

/** A `MarketplaceFact` for something derived, with the model's ramp applied. */
export function derivedFact<TValue>(
  value: TValue,
  sampleSize: number,
  window: TimeWindow,
  now: IsoDateTime,
  model: IntelligenceModelName
): MarketplaceFact<TValue> {
  return {
    value,
    sampleSize,
    window,
    confidence: confidenceFromSample(sampleSize, MODEL_EVIDENCE_FLOOR[model].minObservations),
    generatedAt: now
  };
}

// ---------------------------------------------------------------------------
// Neighborhood
// ---------------------------------------------------------------------------

/** Everything one neighborhood summarization reads. */
export interface NeighborhoodObservations {
  readonly neighborhoodId: EntityId;
  readonly key: NeighborhoodKey;
  readonly businesses: readonly BusinessIntelligenceRow[];
  readonly bookings: readonly BookingIntelligenceRow[];
  readonly visits: readonly VisitIntelligenceRow[];
  /** Searches logged for this district — the only local demand signal. */
  readonly searches: readonly SearchLogRow[];
}

/**
 * The marketplace character of one district.
 *
 * `businessCount` is a restated count and always available; everything else is
 * nullable and stays null below its floor. A district the platform has never
 * placed a business in is not a thin neighborhood — it is not a neighborhood
 * this platform knows, so the model reports `knowledge_missing`.
 */
export function computeNeighborhoodSummary(
  observations: NeighborhoodObservations,
  now: IsoDateTime,
  /**
   * Categories whose demand pressure exceeded 1 here, from the demand model.
   * Passed in rather than derived, because "underserved" is a *demand*
   * question and this module must give it one answer, not two.
   */
  underservedServiceIds: readonly EntityId[] = []
): IntelligenceOutcome<NeighborhoodSummary> {
  const window = windowEndingAt(now, OBSERVATION_WINDOW_DAYS.behaviour);
  const base = {
    observations: observations.businesses.length,
    peers: observations.businesses.length,
    sources: [FACT_SOURCE.merchantInput],
    subjectId: observations.neighborhoodId,
    at: now,
    scopeKey: `neighborhood:${observations.key.city}/${observations.key.district}`
  };

  if (observations.businesses.length === 0) {
    return refuseUnknowable<NeighborhoodSummary>("neighborhood_character", {
      ...base,
      missingKey: "neighborhood.businesses"
    });
  }

  const levels = observations.businesses
    .map((business) => priceTierLevel(business.priceTier))
    .filter((level): level is number => level !== null);

  const instants = [
    ...observations.bookings
      .filter((booking) => within(window, booking.startsAt) && !isCanceledBooking(booking.status))
      .map((booking) => booking.startsAt),
    ...observations.visits
      .filter((visit) => within(window, visit.occurredAt))
      .map((visit) => visit.occurredAt)
  ];

  const averageLevel = mean(levels);
  const peakFloor = MODEL_EVIDENCE_FLOOR.peak_hours.minObservations;
  const characterFloor = MODEL_EVIDENCE_FLOOR.neighborhood_character.minObservations;

  const summary: NeighborhoodSummary = {
    neighborhoodId: observations.neighborhoodId,
    businessCount: restatedFact(observations.businesses.length, observations.businesses.length, window, now),
    // Filled from the demand model's own answers, so a district is never
    // called underserved by a summarizer that did not measure demand. When
    // demand refuses — which it does at this marketplace size — this is empty,
    // and empty means "we did not establish that anything is underserved",
    // never "nothing is".
    underservedServiceIds,
    averagePriceLevel:
      averageLevel !== null && levels.length >= characterFloor
        ? derivedFact(roundTo(averageLevel), levels.length, window, now, "neighborhood_character")
        : null,
    peakActivity:
      instants.length >= peakFloor
        ? derivedFact(
            peakWindows(weeklyHistogram(instants), instants.length),
            instants.length,
            window,
            now,
            "peak_hours"
          )
        : null,
    generatedAt: now
  };

  return computed<NeighborhoodSummary>("neighborhood_character", summary, base);
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

/** Everything one service summarization reads. */
export interface ServiceObservations {
  /** Marketplace-level service id (`service-market:haircut`). */
  readonly serviceId: EntityId;
  readonly serviceKey: string;
  /** Active packages across every provider whose name normalizes to the key. */
  readonly packages: readonly PackageIntelligenceRow[];
  /** Bookings whose service name normalizes to the key. */
  readonly bookings: readonly BookingIntelligenceRow[];
  /** Normalized service names each customer identity has booked. */
  readonly serviceNamesByIdentity: ReadonlyMap<string, readonly string[]>;
}

/** Most co-booked services named. */
export const MAX_CO_BOOKED_SERVICES = 5;

/**
 * Marketplace-level facts about one service ("Haircut, across every provider").
 *
 * `providerCount` is a restated count. The median price needs two providers,
 * because with one the "market rate" is that provider's price with extra
 * steps — a number an owner would price against, believing it to be the
 * market.
 */
export function computeServiceSummary(
  observations: ServiceObservations,
  now: IsoDateTime
): IntelligenceOutcome<ServiceSummary> {
  const window = windowEndingAt(now, OBSERVATION_WINDOW_DAYS.behaviour);
  const providers = new Set(observations.packages.map((row) => row.businessId));

  const base = {
    observations: providers.size,
    peers: providers.size,
    window,
    sources: [FACT_SOURCE.merchantInput, FACT_SOURCE.booking],
    subjectId: observations.serviceId,
    at: now,
    scopeKey: `service:${observations.serviceKey}`
  };

  if (providers.size === 0) {
    return refuseUnknowable<ServiceSummary>("service_market", {
      ...base,
      missingKey: "service.providers"
    });
  }

  const prices = observations.packages.map((row) => decimalToNumber(row.price)).filter((price) => price > 0);
  const currency = observations.packages[0]?.currency ?? "UZS";
  const marketFloor = MODEL_EVIDENCE_FLOOR.service_market.minObservations;

  const leads = observations.bookings
    .map((booking) => (booking.startsAt.getTime() - booking.createdAt.getTime()) / 3_600_000)
    .filter((hours) => hours >= 0);

  const medianPrice = prices.length >= marketFloor ? median(prices) : null;
  const medianLead = leads.length >= marketFloor ? median(leads) : null;

  const summary: ServiceSummary = {
    serviceId: observations.serviceId,
    providerCount: restatedFact(providers.size, providers.size, window, now),
    medianPrice:
      medianPrice === null
        ? null
        : derivedFact(toMoney(medianPrice, currency), prices.length, window, now, "service_market"),
    medianBookingLeadHours:
      medianLead === null
        ? null
        : derivedFact(roundTo(medianLead, 1), leads.length, window, now, "service_market"),
    frequentlyBookedWithServiceIds: coBookedServiceIds(observations),
    generatedAt: now
  };

  return computed<ServiceSummary>("service_market", summary, base);
}

/**
 * Services the same people also book.
 *
 * Note the deliberate division of labour: the *graph* stores `booked_together`
 * edges (Epic 04's `InferRelationshipsJob`), because an edge is a Layer 3
 * object. What this layer stores is the marketplace-level fact "haircuts are
 * usually booked with beard trims", which is read directly off the same rows
 * rather than through an upward import that would break the layer isolation.
 */
export function coBookedServiceIds(observations: ServiceObservations): readonly EntityId[] {
  const counts = new Map<string, number>();

  for (const names of observations.serviceNamesByIdentity.values()) {
    const normalized = new Set(names.map((name) => normalizeServiceName(name)));
    if (!normalized.has(observations.serviceKey)) continue;

    for (const name of normalized) {
      if (name === observations.serviceKey) continue;
      counts.set(name, (counts.get(name) ?? 0) + 1);
    }
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, MAX_CO_BOOKED_SERVICES)
    .map(([name]) => serviceKeyId(name));
}

// ---------------------------------------------------------------------------
// Trend
// ---------------------------------------------------------------------------

/** Everything one trend computation reads — instants of the measured events. */
export interface TrendObservations {
  readonly subjectEntityId: EntityId;
  readonly metric: TrendSummary["metric"];
  /** When each observation of the metric happened. */
  readonly instants: readonly Date[];
}

/**
 * Momentum of one subject over two equal windows.
 *
 * Both halves must be populated. A month with four bookings following a month
 * with none is a first month, not a 400% rise and not an infinite one — and
 * `changeRate` returns null there precisely so nobody has to decide which lie
 * to tell.
 *
 * `story_mentions` is in the frozen metric union but no Story model exists in
 * the relational schema, so it returns `knowledge_missing` rather than zero.
 * Zero mentions and no mention-recording are different facts.
 */
export function computeTrend(
  observations: TrendObservations,
  now: IsoDateTime
): IntelligenceOutcome<TrendSummary> {
  const current = windowEndingAt(now, OBSERVATION_WINDOW_DAYS.trendHalf);
  const previous = precedingWindow(current);
  const span: TimeWindow = { start: previous.start, end: current.end };

  const base = {
    observations: observations.instants.filter((at) => within(span, at)).length,
    window: span,
    sources: [FACT_SOURCE.inference],
    subjectId: observations.subjectEntityId,
    at: now,
    scopeKey: `trend:${observations.metric}:${observations.subjectEntityId}`
  };

  if (observations.metric === "story_mentions") {
    return refuseUnknowable<TrendSummary>("trend", { ...base, missingKey: "story" });
  }

  const refusal = refuseWithoutEvidence<TrendSummary>("trend", base);
  if (refusal) return refusal;

  const currentCount = observations.instants.filter((at) => within(current, at)).length;
  const previousCount = observations.instants.filter((at) => within(previous, at)).length;

  if (previousCount === 0 || currentCount === 0) {
    return refuseSparse<TrendSummary>("trend", {
      ...base,
      observations: currentCount + previousCount,
      scopeKey: `${base.scopeKey}#half_window`
    });
  }

  const rate = changeRate(previousCount, currentCount);

  return computed<TrendSummary>(
    "trend",
    {
      subjectEntityId: observations.subjectEntityId,
      direction: trendDirection(rate),
      changeRate: derivedFact(rate ?? 0, currentCount + previousCount, span, now, "trend"),
      metric: observations.metric
    },
    base
  );
}

// ---------------------------------------------------------------------------
// Demand and the forecast
// ---------------------------------------------------------------------------

/** Everything one demand computation reads. */
export interface DemandObservations {
  readonly serviceOrCategoryId: EntityId;
  readonly neighborhoodId: EntityId | null;
  /** When each demand signal happened — a search, or an attempted booking. */
  readonly demandInstants: readonly Date[];
  /** Providers able to serve that demand right now. */
  readonly supplyCount: number;
}

/**
 * Demand against supply for a service or category in an area.
 *
 * Pressure is `demand / supply`, and it is the reason `supplyCount` has a
 * floor of its own: with zero providers the ratio is not enormous, it is
 * undefined, and "underserved by ∞" is not a fact anybody can act on.
 */
export function computeDemand(
  observations: DemandObservations,
  now: IsoDateTime
): IntelligenceOutcome<DemandSummary> {
  const window = windowEndingAt(now, OBSERVATION_WINDOW_DAYS.demand);
  const inWindow = observations.demandInstants.filter((at) => within(window, at));

  const base = {
    observations: inWindow.length,
    peers: observations.supplyCount,
    window,
    sources: [FACT_SOURCE.inference],
    subjectId: observations.serviceOrCategoryId,
    at: now,
    scopeKey: `demand:${observations.serviceOrCategoryId}${
      observations.neighborhoodId ? `@${observations.neighborhoodId}` : ""
    }`
  };

  const refusal = refuseWithoutEvidence<DemandSummary>("demand_pressure", base);
  if (refusal) return refusal;

  const pressure = inWindow.length / observations.supplyCount;

  return computed<DemandSummary>(
    "demand_pressure",
    {
      serviceOrCategoryId: observations.serviceOrCategoryId,
      neighborhoodId: observations.neighborhoodId,
      window,
      demandVolume: restatedFact(inWindow.length, inWindow.length, window, now),
      supplyCount: restatedFact(observations.supplyCount, observations.supplyCount, window, now),
      pressure: derivedFact(roundTo(pressure), inWindow.length, window, now, "demand_pressure")
    },
    base
  );
}

/**
 * A forecast of demand for the coming week.
 *
 * No frozen contract exists for this one, so it is declared where it is
 * computed — and it names its own method, because a prediction whose basis is
 * unstated is indistinguishable from a number somebody liked.
 */
export interface DemandPrediction {
  readonly serviceOrCategoryId: EntityId;
  readonly neighborhoodId: EntityId | null;
  /** The window the prediction is about. */
  readonly horizon: TimeWindow;
  readonly expectedDemand: MarketplaceFact<number>;
  /**
   * How the number was produced. One value today: the mean of the observed
   * weekly counts. Deliberately a union, so a second method has to be named
   * rather than silently substituted.
   */
  readonly basis: "weekly_mean";
  readonly weeksObserved: number;
  readonly computedAt: IsoDateTime;
}

/** Days in the prediction horizon — one week ahead, and no further. */
export const PREDICTION_HORIZON_DAYS = 7;

/**
 * Expected demand next week, or a typed refusal.
 *
 * **This is the model the epic names as the honesty test.** It needs eight
 * weeks of history, forty observations and three providers before it will say
 * anything, and Manzil clears none of those today — so in production it
 * returns `marketplace_sparse` with the real count, every time.
 *
 * When it does compute, the method is the mean of the observed weekly counts:
 * no smoothing, no seasonality, no regression. Not because those are hard, but
 * because a marketplace with eight weeks of history cannot evidence a seasonal
 * term, and a model that fits one would be describing noise with confidence.
 */
export function computeDemandPrediction(
  observations: DemandObservations,
  now: IsoDateTime
): IntelligenceOutcome<DemandPrediction> {
  const floor = MODEL_EVIDENCE_FLOOR.demand_prediction;
  const history = windowEndingAt(now, floor.minWindowDays);
  const inHistory = observations.demandInstants.filter((at) => within(history, at));

  const base = {
    observations: inHistory.length,
    peers: observations.supplyCount,
    window: history,
    sources: [FACT_SOURCE.inference],
    subjectId: observations.serviceOrCategoryId,
    at: now,
    scopeKey: `demand_prediction:${observations.serviceOrCategoryId}${
      observations.neighborhoodId ? `@${observations.neighborhoodId}` : ""
    }`
  };

  const refusal = refuseWithoutEvidence<DemandPrediction>("demand_prediction", base);
  if (refusal) return refusal;

  const weeks = Math.max(1, Math.floor(floor.minWindowDays / 7));
  const counts = weeklyCounts(inHistory, now, weeks);

  // Every observed week must be a week we actually watched, not a gap in the
  // log: a zero week from an outage would drag the mean down as though demand
  // had fallen.
  const populated = counts.filter((count) => count > 0).length;
  if (populated < weeks / 2) {
    return refuseSparse<DemandPrediction>("demand_prediction", {
      ...base,
      scopeKey: `${base.scopeKey}#sparse_weeks`
    });
  }

  const expected = mean(counts) ?? 0;
  const horizonStart = now;
  const horizon: TimeWindow = {
    start: horizonStart,
    end: new Date(Date.parse(now) + PREDICTION_HORIZON_DAYS * 86_400_000).toISOString()
  };

  return computed<DemandPrediction>(
    "demand_prediction",
    {
      serviceOrCategoryId: observations.serviceOrCategoryId,
      neighborhoodId: observations.neighborhoodId,
      horizon,
      expectedDemand: derivedFact(
        roundTo(expected, 1),
        inHistory.length,
        history,
        now,
        "demand_prediction"
      ),
      basis: "weekly_mean",
      weeksObserved: weeks,
      computedAt: now
    },
    base
  );
}

/** Observations per week, oldest week first. */
export function weeklyCounts(
  instants: readonly Date[],
  now: IsoDateTime,
  weeks: number
): readonly number[] {
  const end = Date.parse(now);
  const counts: number[] = [];

  for (let index = weeks; index > 0; index -= 1) {
    const weekEnd = end - (index - 1) * 7 * 86_400_000;
    const weekStart = weekEnd - 7 * 86_400_000;

    counts.push(
      instants.filter((at) => at.getTime() >= weekStart && at.getTime() < weekEnd).length
    );
  }

  return counts;
}

// ---------------------------------------------------------------------------
// Relationship facts
// ---------------------------------------------------------------------------

/**
 * Substitution facts derived from structural overlap.
 *
 * Only the `substitution` pattern. `co_visit`, `co_booking` and
 * `sequential_visit` are *edges*, and edges are Layer 3 — Epic 04's
 * `InferRelationshipsJob` already derives them from the same rows and stores
 * them as `recommended_with` / `booked_together`. Recomputing them here would
 * put two answers to one question in the platform, and the layer isolation
 * rule forbids importing the graph to reuse its answer. So this layer
 * publishes what it alone computes, and says so.
 */
export function substitutionFacts(
  businessId: EntityId,
  alternatives: readonly { readonly businessId: EntityId; readonly constraintOverlap: number }[],
  window: TimeWindow,
  now: IsoDateTime
): readonly RelationshipFactSummary[] {
  return alternatives.map((alternative) => ({
    fromEntityId: businessId,
    toEntityId: alternative.businessId,
    pattern: "substitution" as const,
    strength: derivedFact(
      roundTo(clamp01(alternative.constraintOverlap)),
      1,
      window,
      now,
      "alternative_businesses"
    )
  }));
}

/** Search rows whose district and category match a demand scope. */
export function searchesMatching(
  searches: readonly SearchLogRow[],
  district: string | null,
  categorySlug: string | null
): readonly SearchLogRow[] {
  return searches.filter(
    (row) =>
      (district === null || row.district === district) &&
      (categorySlug === null || row.categorySlug === categorySlug)
  );
}

/** The most-searched queries in a set, for the owner voice. */
export function topQueries(searches: readonly SearchLogRow[], limit = 5): readonly string[] {
  return rankByFrequency(searches.map((row) => row.query.trim().toLowerCase()))
    .slice(0, limit)
    .map(([query]) => query);
}

/** Median price across a package set, as money; null when empty. */
export function marketPrice(packages: readonly PackageIntelligenceRow[]): MoneyAmount | null {
  const prices = packages.map((row) => decimalToNumber(row.price)).filter((price) => price > 0);
  const value = median(prices);

  return value === null ? null : toMoney(value, packages[0]?.currency ?? "UZS");
}
