/**
 * Layer 2 (Marketplace Intelligence) — the customer-scoped models, as pure
 * functions.
 *
 * Doc 22: "every customer a summary updated after each experience". This file
 * derives that summary — and `CustomerHealth`, the ninth of the epic's ten
 * models — from visits, bookings, CRM rows and the categories of the places a
 * person actually went.
 *
 * Two absences are load-bearing and deliberate:
 *
 * - **Dietary facts stay empty.** Epic 05 left them empty and said why: a
 *   guess about halal or an allergy is not a guess this platform gets to make.
 *   Review text mentioning "halal" is evidence about a venue, not about the
 *   reviewer's diet, and this module does not blur the two.
 * - **Companions stay empty.** Nothing in the schema records who a person went
 *   with, so `RelationshipPattern` reports confidence 0 rather than inventing
 *   a social graph out of co-timed bookings.
 *
 * Imports `core` and Layer 2 contracts only.
 */
import type {
  BudgetRange,
  Confidence,
  EntityId,
  IsoDateTime,
  KnowledgeFact,
  MoneyAmount,
  TimeWindow
} from "../core";
import type {
  BehaviorPattern,
  BudgetPattern,
  CuisinePattern,
  CustomerPreference,
  CustomerSummary,
  MemorySnapshot,
  PlanningPattern,
  RelationshipPattern,
  TravelPattern
} from "../customer-intelligence";
import type { ActivityPattern } from "../feature-store";
import type { CustomerFactSummary } from "./marketplace-intelligence.types";
import {
  computed,
  confidenceFromSample,
  MODEL_EVIDENCE_FLOOR,
  refuseSparse,
  refuseWithoutEvidence,
  type IntelligenceOutcome
} from "./marketplace-intelligence.evidence";
import { OBSERVATION_WINDOW_DAYS } from "./marketplace-intelligence.freshness";
import {
  bookingLeadHours,
  customerIdentity,
  decimalToNumber,
  FACT_SOURCE,
  isCanceledBooking,
  isCompletedBooking,
  isTerminalBooking,
  neighborhoodOf,
  toIso,
  type BookingIntelligenceRow,
  type BusinessIntelligenceRow,
  type CustomerIntelligenceRow,
  type VisitIntelligenceRow
} from "./marketplace-intelligence.projection";
import {
  clamp01,
  dayPartShares,
  daysBetween,
  haversineKm,
  isWeekend,
  localParts,
  mean,
  median,
  rankByFrequency,
  roundTo,
  toMoney,
  unique,
  windowEndingAt,
  within
} from "./marketplace-intelligence.statistics";
import { coordinatesOf } from "./business.model";

/** Everything one customer summarization reads, in one shape. */
export interface CustomerObservations {
  /** The id the caller asked about — a platform account or a single CRM row. */
  readonly customerId: EntityId;
  /** Every CRM row that is this person (see `customerIdentity`). */
  readonly customers: readonly CustomerIntelligenceRow[];
  readonly visits: readonly VisitIntelligenceRow[];
  readonly bookings: readonly BookingIntelligenceRow[];
  /** The businesses those visits and bookings touched. */
  readonly businesses: readonly BusinessIntelligenceRow[];
}

/**
 * How engaged a customer is with the marketplace — the tenth model's
 * customer-side twin.
 *
 * Not a frozen Epic 03 contract (none was written for it), so it is declared
 * here in the module that computes it, in the same shape language as
 * `BusinessHealth`: a composite with the components that explain it.
 */
export interface CustomerHealth {
  readonly customerId: EntityId;
  /** Composite engagement in [0, 100]; the components below explain it. */
  readonly overall: number;
  readonly engagement: "growing" | "steady" | "lapsing" | "dormant";
  readonly daysSinceLastVisit: number;
  /** Median gap between consecutive visits — this person's own rhythm. */
  readonly typicalIntervalDays: number;
  /** How far past their own rhythm they are, in [0, 1]. */
  readonly churnRisk: Confidence;
  /** Share of their terminal bookings that were called off, in [0, 1]. */
  readonly cancellationRate: Confidence;
  readonly lifetimeVisits: number;
  readonly computedAt: IsoDateTime;
}

/** Most preferences carried in a summary, so a snapshot stays a snapshot. */
export const MAX_CUSTOMER_PREFERENCES = 8;

/** Most favourite providers named. */
export const MAX_FAVORITE_BUSINESSES = 5;

/** Visits at one business before it is called a favourite. */
export const FAVORITE_VISIT_THRESHOLD = 2;

/**
 * Share of a person's visits one neighborhood must carry before it is called
 * their home area.
 *
 * `homeNeighborhoodId` means where somebody *lives*, and the schema records no
 * address. A dominant visit share is the closest honest proxy, and it is only
 * honest when it dominates — half a person's visits in one district is a
 * pattern; a third of them is a coincidence with three districts.
 */
export const HOME_NEIGHBORHOOD_SHARE = 0.5;

/** Days before a recorded birthday that "planning a birthday" becomes likely. */
export const BIRTHDAY_HORIZON_DAYS = 45;

// ---------------------------------------------------------------------------
// Model 9 — CustomerHealth
// ---------------------------------------------------------------------------

/**
 * Engagement and churn risk, or a typed reason there is none.
 *
 * Needs three visits, because with two there is exactly one interval and no
 * way to tell a lapsing customer from one who is simply between visits. Churn
 * risk is their own rhythm, not a marketplace average: somebody who comes
 * every eight weeks is not at risk in week six.
 */
export function computeCustomerHealth(
  observations: CustomerObservations,
  now: IsoDateTime
): IntelligenceOutcome<CustomerHealth> {
  const visits = [...observations.visits].sort(
    (a, b) => a.occurredAt.getTime() - b.occurredAt.getTime()
  );
  const window = windowEndingAt(now, OBSERVATION_WINDOW_DAYS.behaviour);

  const base = {
    observations: visits.length,
    window,
    sources: [FACT_SOURCE.visit, FACT_SOURCE.booking],
    subjectId: observations.customerId,
    at: now,
    scopeKey: `customer:${observations.customerId}#health`
  };

  const refusal = refuseWithoutEvidence<CustomerHealth>("customer_health", base);
  if (refusal) return refusal;

  const intervals: number[] = [];
  for (let index = 1; index < visits.length; index += 1) {
    intervals.push(
      daysBetween(
        (visits[index - 1] as VisitIntelligenceRow).occurredAt,
        (visits[index] as VisitIntelligenceRow).occurredAt
      )
    );
  }

  const typicalIntervalDays = median(intervals);
  if (typicalIntervalDays === null || typicalIntervalDays <= 0) {
    // Every visit on the same day is one occasion, not a rhythm.
    return refuseSparse<CustomerHealth>("customer_health", { ...base, observations: 0 });
  }

  const newest = visits[visits.length - 1] as VisitIntelligenceRow;
  const daysSinceLastVisit = daysBetween(newest.occurredAt, new Date(now));
  const churnRisk = clamp01(daysSinceLastVisit / (typicalIntervalDays * 3));

  const terminal = observations.bookings.filter((booking) => isTerminalBooking(booking.status));
  const cancellationRate =
    terminal.length === 0
      ? 0
      : clamp01(terminal.filter((booking) => isCanceledBooking(booking.status)).length / terminal.length);

  const half = Math.floor(visits.length / 2);
  const recentHalf = visits.length - half;
  const engagement: CustomerHealth["engagement"] =
    daysSinceLastVisit > typicalIntervalDays * 3
      ? "dormant"
      : daysSinceLastVisit > typicalIntervalDays * 1.5
        ? "lapsing"
        : recentHalf > half
          ? "growing"
          : "steady";

  const overall = Math.round(100 * clamp01((1 - churnRisk) * 0.7 + (1 - cancellationRate) * 0.3));

  return computed<CustomerHealth>(
    "customer_health",
    {
      customerId: observations.customerId,
      overall,
      engagement,
      daysSinceLastVisit,
      typicalIntervalDays: roundTo(typicalIntervalDays, 1),
      churnRisk: roundTo(churnRisk),
      cancellationRate: roundTo(cancellationRate),
      lifetimeVisits: visits.length,
      computedAt: now
    },
    base
  );
}

// ---------------------------------------------------------------------------
// The stored customer summary
// ---------------------------------------------------------------------------

/** Business rows keyed by id, for facet lookups. */
function businessIndex(
  businesses: readonly BusinessIntelligenceRow[]
): ReadonlyMap<string, BusinessIntelligenceRow> {
  return new Map(businesses.map((row) => [row.id, row]));
}

/** Category slugs of the places a person visited, in visit order. */
export function visitedCategorySlugs(observations: CustomerObservations): readonly string[] {
  const index = businessIndex(observations.businesses);

  return observations.visits
    .map((visit) => index.get(visit.businessId)?.categorySlug)
    .filter((slug): slug is string => typeof slug === "string" && slug.length > 0);
}

/** Neighborhood ids of the places a person visited, in visit order. */
export function visitedNeighborhoods(observations: CustomerObservations): readonly EntityId[] {
  const index = businessIndex(observations.businesses);

  return observations.visits
    .map((visit) => index.get(visit.businessId))
    .filter((business): business is BusinessIntelligenceRow => business !== undefined)
    .map((business) => neighborhoodOf(business));
}

/** Average spend per visit across every CRM row that is this person. */
export function averageSpendPerVisit(observations: CustomerObservations): number | null {
  const totals = observations.customers.reduce(
    (accumulator, row) => ({
      spend: accumulator.spend + decimalToNumber(row.totalSpend),
      visits: accumulator.visits + row.visitCount
    }),
    { spend: 0, visits: 0 }
  );

  if (totals.visits <= 0 || totals.spend <= 0) return null;
  return roundTo(totals.spend / totals.visits, 2);
}

/**
 * The budget band a person's spending evidences.
 *
 * **No lower bound, ever.** Epic 05 made this call for the memory projection
 * and it holds here for the same reason: spending less than usual is never
 * evidence of a floor, and inventing one has the ranking layer discard exactly
 * the affordable options a budget-conscious customer wants.
 */
export function budgetFromSpend(averageSpend: number | null): BudgetRange | null {
  if (averageSpend === null) return null;
  return { min: null, max: toMoney(averageSpend, "UZS") };
}

/**
 * The whole stored profile of one customer.
 *
 * Unlike `BusinessHealth`, every sub-pattern here is nullable field by field
 * and carries its own confidence — so this summary publishes exactly what is
 * known and reports confidence 0 for the patterns nothing supports. That is
 * why it can be produced for a customer with one visit while health refuses.
 */
export function computeCustomerSummary(
  observations: CustomerObservations,
  now: IsoDateTime
): IntelligenceOutcome<CustomerSummary> {
  const base = {
    observations: observations.visits.length + observations.bookings.length,
    sources: [FACT_SOURCE.visit, FACT_SOURCE.booking],
    subjectId: observations.customerId,
    at: now,
    scopeKey: `customer:${observations.customerId}`
  };

  // No CRM row and no activity is not a thin customer, it is not a customer.
  if (observations.customers.length === 0 && base.observations === 0) {
    return refuseSparse<CustomerSummary>("customer_health", base);
  }

  const summary: CustomerSummary = {
    customerId: observations.customerId,
    preferences: computePreferences(observations, now),
    behavior: computeBehavior(observations, now),
    budget: computeBudget(observations),
    travel: computeTravel(observations),
    cuisine: computeCuisine(observations, now),
    relationships: computeRelationships(),
    planning: computePlanning(observations),
    // No Experience model exists in the relational schema (Epic 04 kept the
    // node kind contract-only for the same reason), so a completed visit is
    // the closest countable thing and it is counted as what it is.
    completedExperienceCount: observations.bookings.filter((booking) =>
      isCompletedBooking(booking.status)
    ).length,
    updatedAt: now
  };

  return computed<CustomerSummary>("customer_health", summary, base);
}

/** Preferences the platform has learned, strongest first. */
export function computePreferences(
  observations: CustomerObservations,
  now: IsoDateTime
): readonly CustomerPreference[] {
  const preferences: CustomerPreference[] = [];
  const slugs = visitedCategorySlugs(observations);
  const floor = MODEL_EVIDENCE_FLOOR.cuisine_ranking.minObservations;

  if (slugs.length >= floor) {
    for (const [slug, count] of rankByFrequency(slugs)) {
      preferences.push({
        dimension: "category",
        fact: {
          value: slug,
          // The visits are rows; reading a *preference* out of them is the
          // platform's own interpretation, so the source says so.
          source: FACT_SOURCE.inference,
          confidence: confidenceFromSample(count, floor),
          observedAt: now
        }
      });
    }
  }

  const index = businessIndex(observations.businesses);
  const tiers = observations.visits
    .map((visit) => index.get(visit.businessId)?.priceTier)
    .filter((tier): tier is string => typeof tier === "string" && tier.length > 0);

  if (tiers.length >= floor) {
    const [top] = rankByFrequency(tiers);
    if (top) {
      preferences.push({
        dimension: "price_tier",
        fact: {
          value: top[0],
          source: FACT_SOURCE.inference,
          confidence: confidenceFromSample(top[1], floor),
          observedAt: now
        }
      });
    }
  }

  return preferences
    .sort((a, b) => b.fact.confidence - a.fact.confidence)
    .slice(0, MAX_CUSTOMER_PREFERENCES);
}

/** Rhythm, not identity. */
export function computeBehavior(
  observations: CustomerObservations,
  now: IsoDateTime
): BehaviorPattern {
  const window = windowEndingAt(now, OBSERVATION_WINDOW_DAYS.behaviour);
  const inWindow = observations.visits.filter((visit) => within(window, visit.occurredAt));
  const floor = MODEL_EVIDENCE_FLOOR.visit_frequency.minObservations;
  const months = OBSERVATION_WINDOW_DAYS.behaviour / 30;

  const weekendVisits = observations.visits.filter(
    (visit) => isWeekend(localParts(visit.occurredAt).day)
  ).length;

  return {
    visitsPerMonth:
      inWindow.length >= floor ? roundTo(inWindow.length / months, 2) : null,
    // No party size column exists anywhere in the schema.
    typicalPartySize: null,
    prefersWeekends:
      observations.visits.length >= floor
        ? weekendVisits / observations.visits.length > 2 / 7
        : null,
    // The booking rows carry no channel; the platform cannot say how somebody
    // reached it without recording it.
    typicalBookingChannel: null,
    confidence:
      inWindow.length >= floor ? confidenceFromSample(inWindow.length, floor) : 0
  };
}

/** What the customer spends, overall; per experience type stays empty. */
export function computeBudget(observations: CustomerObservations): BudgetPattern {
  const average = averageSpendPerVisit(observations);
  const spendingRows = observations.customers.filter((row) => row.visitCount > 0).length;

  return {
    overall: budgetFromSpend(average),
    // Per-experience budgets need an Experience model; none exists.
    byExperienceType: new Map(),
    confidence:
      average === null
        ? 0
        : confidenceFromSample(spendingRows, MODEL_EVIDENCE_FLOOR.average_spend.minObservations)
  };
}

/** Where the customer goes, and how far. */
export function computeTravel(observations: CustomerObservations): TravelPattern {
  const neighborhoods = visitedNeighborhoods(observations);
  const ranked = rankByFrequency([...neighborhoods]);
  const top = ranked[0];

  const home =
    top && neighborhoods.length >= MODEL_EVIDENCE_FLOOR.cuisine_ranking.minObservations &&
    top[1] / neighborhoods.length >= HOME_NEIGHBORHOOD_SHARE
      ? top[0]
      : null;

  return {
    homeNeighborhoodId: home,
    typicalRadiusKm: activityRadiusKm(observations),
    // Nothing records how somebody travelled.
    usesTaxi: null,
    frequentNeighborhoodIds: ranked.map(([id]) => id).slice(0, MAX_FAVORITE_BUSINESSES),
    confidence:
      neighborhoods.length === 0
        ? 0
        : confidenceFromSample(neighborhoods.length, MODEL_EVIDENCE_FLOOR.cuisine_ranking.minObservations)
  };
}

/**
 * Half the widest distance between the places a person visited.
 *
 * Not "how far from home" — the schema has no home address — but how far
 * apart the places they choose are, which is the quantity a radius constraint
 * actually needs. Null below three located businesses: two points are a line,
 * not a radius.
 */
export function activityRadiusKm(observations: CustomerObservations): number | null {
  const index = businessIndex(observations.businesses);
  const points = unique(observations.visits.map((visit) => visit.businessId))
    .map((id) => index.get(id))
    .filter((business): business is BusinessIntelligenceRow => business !== undefined)
    .map((business) => coordinatesOf(business))
    .filter((point): point is { lat: number; lng: number } => point !== null);

  if (points.length < MODEL_EVIDENCE_FLOOR.travel_radius.minPeers) return null;

  let widest = 0;
  for (let i = 0; i < points.length; i += 1) {
    for (let j = i + 1; j < points.length; j += 1) {
      widest = Math.max(widest, haversineKm(points[i] as { lat: number; lng: number }, points[j] as { lat: number; lng: number }));
    }
  }

  return roundTo(widest / 2, 1);
}

/**
 * Category affinities.
 *
 * `avoids` and `dietary` stay empty by design: the schema records no negative
 * signal, and a dietary claim (halal, an allergy) is not a guess this platform
 * gets to make — Epic 05 said so about the same field and nothing has changed.
 */
export function computeCuisine(
  observations: CustomerObservations,
  now: IsoDateTime
): CuisinePattern {
  const slugs = visitedCategorySlugs(observations);
  const floor = MODEL_EVIDENCE_FLOOR.cuisine_ranking.minObservations;

  const favorites: KnowledgeFact<string>[] =
    slugs.length >= floor
      ? rankByFrequency(slugs).map(([slug, count]) => ({
          value: slug,
          source: FACT_SOURCE.inference,
          confidence: confidenceFromSample(count, floor),
          observedAt: now
        }))
      : [];

  return { favorites, avoids: [], dietary: [] };
}

/** Who the customer shares experiences with — unknowable on this schema. */
export function computeRelationships(): RelationshipPattern {
  return {
    frequentCompanionIds: [],
    celebratesRecurringEvents: null,
    organizesForGroups: null,
    confidence: 0
  };
}

/** How the customer plans — lead time is real; the rest is not recorded. */
export function computePlanning(observations: CustomerObservations): PlanningPattern {
  const leads = observations.bookings
    .map((booking) => bookingLeadHours(booking))
    .filter((hours): hours is number => hours !== null)
    .map((hours) => hours / 24);

  const floor = MODEL_EVIDENCE_FLOOR.visit_frequency.minObservations;
  const typical = leads.length >= floor ? median(leads) : null;

  return {
    typicalLeadDays: typical === null ? null : roundTo(typical, 1),
    plansMultiServiceExperiences: null,
    acceptsAiRecommendations: null,
    reusesPastPlans: null,
    confidence: typical === null ? 0 : confidenceFromSample(leads.length, floor)
  };
}

// ---------------------------------------------------------------------------
// Marketplace facts and the memory snapshot
// ---------------------------------------------------------------------------

/** The Layer 2 fact summary for one customer; nullable field by field. */
export function computeCustomerFacts(
  observations: CustomerObservations,
  now: IsoDateTime
): CustomerFactSummary {
  const window = windowEndingAt(now, OBSERVATION_WINDOW_DAYS.behaviour);
  const inWindow = observations.visits.filter((visit) => within(window, visit.occurredAt));
  const behaviour = computeBehavior(observations, now);
  const average = averageSpendPerVisit(observations);
  const neighborhoods = visitedNeighborhoods(observations);
  const ranked = rankByFrequency([...neighborhoods]);
  const top = ranked[0];

  const factOf = <TValue>(
    value: TValue,
    sampleSize: number,
    floor: number
  ) => ({
    value,
    sampleSize,
    window,
    confidence: confidenceFromSample(sampleSize, floor),
    generatedAt: now
  });

  return {
    customerId: observations.customerId,
    visitsPerMonth:
      behaviour.visitsPerMonth === null
        ? null
        : factOf(
            behaviour.visitsPerMonth,
            inWindow.length,
            MODEL_EVIDENCE_FLOOR.visit_frequency.minObservations
          ),
    averageSpend:
      average === null
        ? null
        : factOf(
            toMoney(average, "UZS"),
            observations.customers.filter((row) => row.visitCount > 0).length,
            MODEL_EVIDENCE_FLOOR.average_spend.minObservations
          ),
    // No party size column exists.
    typicalPartySize: null,
    mostVisitedNeighborhoodId:
      top && neighborhoods.length >= MODEL_EVIDENCE_FLOOR.cuisine_ranking.minObservations
        ? factOf(top[0], top[1], MODEL_EVIDENCE_FLOOR.cuisine_ranking.minObservations)
        : null,
    generatedAt: now
  };
}

/**
 * The compact projection Layer 4 loads into working memory.
 *
 * Deliberately small: a snapshot is what one request touches, not the whole
 * profile. `completedExperienceTypes` stays empty because no Experience model
 * exists to type a completion with — a visit is not an experience type.
 */
export function computeMemorySnapshot(
  summary: CustomerSummary,
  observations: CustomerObservations,
  now: IsoDateTime
): MemorySnapshot {
  const visitsByBusiness = new Map<string, number>();
  for (const visit of observations.visits) {
    visitsByBusiness.set(visit.businessId, (visitsByBusiness.get(visit.businessId) ?? 0) + 1);
  }

  const favorites = [...visitsByBusiness.entries()]
    .filter(([, count]) => count >= FAVORITE_VISIT_THRESHOLD)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, MAX_FAVORITE_BUSINESSES)
    .map(([businessId]) => businessId);

  return {
    customerId: summary.customerId,
    topPreferences: summary.preferences.slice(0, 3),
    budget: summary.budget.overall,
    homeNeighborhoodId: summary.travel.homeNeighborhoodId,
    favoriteBusinessIds: favorites,
    completedExperienceTypes: [],
    snapshotAt: now,
    source: FACT_SOURCE.inference
  };
}

// ---------------------------------------------------------------------------
// Customer feature vector inputs
// ---------------------------------------------------------------------------

/** Day-part rhythm of a person's visits, or null below the floor. */
export function computeActivityPattern(
  observations: CustomerObservations,
  weekendOnly = false
): ActivityPattern | null {
  const instants = observations.visits
    .filter((visit) => !weekendOnly || isWeekend(localParts(visit.occurredAt).day))
    .map((visit) => visit.occurredAt);

  if (instants.length < MODEL_EVIDENCE_FLOOR.activity_pattern.minObservations) return null;
  return dayPartShares(instants);
}

/**
 * Probability the customer is planning a birthday soon.
 *
 * Entirely deterministic, and computed from **their own recorded birthday** —
 * a field the customer or the merchant filled in — never from behaviour. With
 * no birthday on file the answer is null, not a small number: "we do not know
 * when your birthday is" and "your birthday is probably not soon" are
 * different statements and the Marketplace Brain acts on them differently.
 */
export function computeBirthdayProbability(
  observations: CustomerObservations,
  now: IsoDateTime
): Confidence | null {
  const birthdays = observations.customers
    .map((row) => row.birthday)
    .filter((birthday): birthday is Date => birthday !== null);

  if (birthdays.length === 0) return null;

  const at = new Date(now);
  const distances = birthdays.map((birthday) => daysUntilAnniversary(birthday, at));
  const nearest = Math.min(...distances);

  if (nearest > BIRTHDAY_HORIZON_DAYS) return 0;
  return roundTo(clamp01(1 - nearest / BIRTHDAY_HORIZON_DAYS));
}

/** Days from `at` to the next anniversary of `birthday`. */
export function daysUntilAnniversary(birthday: Date, at: Date): number {
  const month = birthday.getUTCMonth();
  const day = birthday.getUTCDate();

  const thisYear = Date.UTC(at.getUTCFullYear(), month, day);
  const nextYear = Date.UTC(at.getUTCFullYear() + 1, month, day);
  const target = thisYear >= Date.UTC(at.getUTCFullYear(), at.getUTCMonth(), at.getUTCDate())
    ? thisYear
    : nextYear;

  return Math.max(0, Math.round((target - at.getTime()) / 86_400_000));
}

/** Cuisine (category) ranking for the feature vector, or null below the floor. */
export function computeCuisineRanking(observations: CustomerObservations): readonly string[] | null {
  const slugs = visitedCategorySlugs(observations);
  if (slugs.length < MODEL_EVIDENCE_FLOOR.cuisine_ranking.minObservations) return null;

  return rankByFrequency(slugs).map(([slug]) => slug);
}

/** The budget band for the feature vector. */
export function computeBudgetPreference(observations: CustomerObservations): BudgetRange | null {
  return budgetFromSpend(averageSpendPerVisit(observations));
}

/** Spend per visit as money, for callers that want the raw amount. */
export function customerAverageSpend(observations: CustomerObservations): MoneyAmount | null {
  const average = averageSpendPerVisit(observations);
  return average === null ? null : toMoney(average, "UZS");
}

/** The identities the observed CRM rows resolve to — one person, N rows. */
export function identitiesOf(observations: CustomerObservations): readonly string[] {
  return unique(observations.customers.map((row) => customerIdentity(row)));
}

/** The newest thing observed about this customer, for freshness reporting. */
export function newestCustomerObservation(observations: CustomerObservations): IsoDateTime | null {
  const instants = [
    ...observations.visits.map((row) => row.occurredAt),
    ...observations.bookings.map((row) => row.startsAt),
    ...observations.customers
      .map((row) => row.lastVisitAt)
      .filter((at): at is Date => at !== null)
  ];

  if (instants.length === 0) return null;

  return toIso(instants.reduce((latest, at) => (at > latest ? at : latest), instants[0] as Date));
}

/** Behaviour window helper shared with the summarizer. */
export function customerWindow(now: IsoDateTime): TimeWindow {
  return windowEndingAt(now, OBSERVATION_WINDOW_DAYS.behaviour);
}

/** Mean of a set, exported so the summarizer can report evidence uniformly. */
export const averageOf = mean;
