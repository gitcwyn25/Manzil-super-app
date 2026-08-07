/**
 * Layer 2 (Marketplace Intelligence) — the business-scoped intelligence
 * models, as pure functions.
 *
 * Seven of the ten models the epic names live here: BusinessHealth,
 * Popularity, PeakHours, TypicalCustomers, BusinessStrengths,
 * BusinessWeaknesses, AlternativeBusinesses and RecommendedServices. Each one
 * takes observations, returns an `IntelligenceOutcome`, and has no clock, no
 * Prisma and no Nest decorator — so every claim the platform makes about a
 * provider reduces to a function a reviewer can run on a literal.
 *
 * Every model here passes through `refuseWithoutEvidence` before it computes.
 * That is not a style rule: at ~2 businesses most of these must refuse, and a
 * model whose refusal branch is missing is a model that will fabricate.
 *
 * Imports `core` and Layer 2 contracts only.
 */
import type {
  Confidence,
  EntityId,
  ExperienceType,
  IsoDateTime,
  MoneyAmount,
  TimeWindow
} from "../core";
import type {
  AlternativeBusiness,
  BusinessAspect,
  BusinessHealth,
  PeakHoursProfile,
  PopularService,
  SuitableExperience,
  TypicalCustomerProfile
} from "../business-intelligence";
import type { BusinessFactSummary, MarketplaceFact } from "./marketplace-intelligence.types";
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
import { LISTING_STALE_DAYS, OBSERVATION_WINDOW_DAYS } from "./marketplace-intelligence.freshness";
import {
  bookingLeadHours,
  bookingMinutes,
  customerIdentity,
  decimalOrNull,
  decimalToNumber,
  FACT_SOURCE,
  isCanceledBooking,
  isCompletedBooking,
  isPublishedReview,
  isTerminalBooking,
  neighborhoodOf,
  normalizeServiceName,
  priceTierLevel,
  spendPerVisit,
  toIso,
  type BookingIntelligenceRow,
  type BusinessEventRow,
  type BusinessIntelligenceRow,
  type CustomerIntelligenceRow,
  type PackageIntelligenceRow,
  type ReviewIntelligenceRow,
  type VisitIntelligenceRow
} from "./marketplace-intelligence.projection";
import { serviceKeyId } from "./marketplace-intelligence.slots";
import {
  changeRate,
  clamp01,
  daysBetween,
  jaccard,
  mean,
  median,
  peakWindows,
  percentileRank,
  precedingWindow,
  rankByFrequency,
  roundTo,
  share,
  toMoney,
  trendDirection,
  weeklyHistogram,
  windowEndingAt,
  within
} from "./marketplace-intelligence.statistics";
import { extractAspectSignals, type AspectSignals } from "./review-signals";

/** Everything one business summarization reads, in one shape. */
export interface BusinessObservations {
  readonly business: BusinessIntelligenceRow;
  readonly reviews: readonly ReviewIntelligenceRow[];
  readonly bookings: readonly BookingIntelligenceRow[];
  readonly visits: readonly VisitIntelligenceRow[];
  /** `BusinessEvent` rows: view, call, directions, message, photo_view. */
  readonly events: readonly BusinessEventRow[];
  readonly packages: readonly PackageIntelligenceRow[];
  readonly customers: readonly CustomerIntelligenceRow[];
}

/** One comparable provider, with just enough of it to compare. */
export interface PeerObservation {
  readonly business: BusinessIntelligenceRow;
  readonly packages: readonly PackageIntelligenceRow[];
  /** Engagement score over the behaviour window, on the same scale as ours. */
  readonly engagement: number;
  /** Bookings observed for each normalized service name. */
  readonly serviceDemand: ReadonlyMap<string, number>;
}

/** The comparison set a marketplace-relative model needs to exist. */
export interface PeerContext {
  readonly peers: readonly PeerObservation[];
}

/** Most alternatives stored per business — a shortlist, not a directory. */
export const MAX_ALTERNATIVES = 5;

/** Most recommended services stored per business. */
export const MAX_RECOMMENDED_SERVICES = 5;

/** Most popular services ranked within one catalog. */
export const MAX_POPULAR_SERVICES = 5;

/**
 * Weights of the engagement score, as data.
 *
 * A booking is worth far more than a page view because it costs the customer
 * something. The ratios are a product judgement, stated once here rather than
 * implied by whichever query ran first.
 */
export const ENGAGEMENT_WEIGHTS = {
  booking: 5,
  visit: 4,
  review: 3,
  call: 2,
  directions: 2,
  message: 2,
  view: 1
} as const;

/**
 * Weights of the health composite, as data. They sum to 1.
 *
 * Rating leads because it is the only component the customer authored.
 * Cancellation outranks trend because a cancelled booking is a broken promise
 * and a slow month is not.
 */
export const HEALTH_WEIGHTS = {
  rating: 0.35,
  cancellation: 0.2,
  response: 0.15,
  trend: 0.15,
  reviewFreshness: 0.15
} as const;

/**
 * Merchant CRM tags → customer segments, uz · ru · en.
 *
 * `Customer.tags` is the ONLY group-shape signal the schema carries: there is
 * no party size on `Booking` and no demographics anywhere. So segments come
 * from what owners actually typed, at `merchant_input` provenance, and the
 * model refuses when tag coverage is too thin — rather than inventing
 * "families 61%" out of a booking count.
 */
export const SEGMENT_LEXICON = {
  families: ["oila", "family", "семь", "семей", "farzand", "bolalar", "с детьми"],
  couples: ["juft", "couple", "пар", "romantik", "romantic", "свидан"],
  friend_groups: ["do'st", "dost", "friends", "друз", "компан", "guruh"],
  solo: ["yakka", "solo", "один", "одиноч", "single"],
  business_guests: ["biznes", "business", "бизнес", "корпорат", "corporate", "ish"],
  tourists: ["sayyoh", "tourist", "турист", "mehmon", "гост"],
  students: ["talaba", "student", "студент", "o'quvchi", "oquvchi"]
} as const satisfies Readonly<Record<TypicalCustomerProfile["segment"], readonly string[]>>;

/** The segments, in declaration order. */
export const CUSTOMER_SEGMENTS = Object.keys(
  SEGMENT_LEXICON
) as readonly TypicalCustomerProfile["segment"][];

/**
 * Aspects that evidence an experience type.
 *
 * Not capabilities — the schema has no capability model — but *evidenced
 * aspects*: "reviewers who mentioned birthdays rated this place 4.6" is a real
 * reason to call it birthday-ready, and it is the only one available before a
 * capability model exists. The supporting keys are namespaced `aspect:` so no
 * consumer mistakes them for the structured capability keys Epic 08 will add.
 */
export const EXPERIENCE_ASPECT_EVIDENCE = {
  birthday: ["event_hosting", "group_handling", "atmosphere"],
  wedding: ["event_hosting", "group_handling"],
  coffee: ["atmosphere", "noise_level"],
  haircut: ["service_speed", "staff_friendliness"],
  dinner: ["food_quality", "atmosphere"],
  travel: ["accessibility"],
  "family-day": ["kids_friendliness", "cleanliness"],
  "business-meeting": ["noise_level", "service_speed"],
  weekend: ["atmosphere", "value_for_money"]
} as const satisfies Readonly<Record<ExperienceType, readonly BusinessAspect[]>>;

/** The experience types, in declaration order. */
export const EXPERIENCE_TYPES = Object.keys(EXPERIENCE_ASPECT_EVIDENCE) as readonly ExperienceType[];

// ---------------------------------------------------------------------------
// Shared slicing
// ---------------------------------------------------------------------------

/** The behaviour observation window ending now. */
export function behaviourWindow(now: IsoDateTime): TimeWindow {
  return windowEndingAt(now, OBSERVATION_WINDOW_DAYS.behaviour);
}

/** The current half of a trend comparison. */
export function trendWindow(now: IsoDateTime): TimeWindow {
  return windowEndingAt(now, OBSERVATION_WINDOW_DAYS.trendHalf);
}

/** Reviews that are publicly visible, newest first. */
export function publishedReviews(
  reviews: readonly ReviewIntelligenceRow[]
): readonly ReviewIntelligenceRow[] {
  return reviews
    .filter((review) => isPublishedReview(review.moderationStatus))
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

/** Engagement score of one business over a window — the popularity input. */
export function engagementScore(
  observations: Pick<BusinessObservations, "bookings" | "visits" | "reviews" | "events">,
  window: TimeWindow
): number {
  const bookings = observations.bookings.filter((booking) => within(window, booking.startsAt));
  const visits = observations.visits.filter((visit) => within(window, visit.occurredAt));
  const reviews = publishedReviews(observations.reviews).filter((review) =>
    within(window, review.createdAt)
  );
  const events = observations.events.filter((event) => within(window, event.createdAt));

  let score =
    bookings.length * ENGAGEMENT_WEIGHTS.booking +
    visits.length * ENGAGEMENT_WEIGHTS.visit +
    reviews.length * ENGAGEMENT_WEIGHTS.review;

  for (const event of events) {
    switch (event.type) {
      case "call":
        score += ENGAGEMENT_WEIGHTS.call;
        break;
      case "directions":
        score += ENGAGEMENT_WEIGHTS.directions;
        break;
      case "message":
        score += ENGAGEMENT_WEIGHTS.message;
        break;
      default:
        score += ENGAGEMENT_WEIGHTS.view;
    }
  }

  return score;
}

/** Raw observation count behind the engagement score — the evidence, not the weight. */
export function engagementObservations(
  observations: Pick<BusinessObservations, "bookings" | "visits" | "reviews" | "events">,
  window: TimeWindow
): number {
  return (
    observations.bookings.filter((booking) => within(window, booking.startsAt)).length +
    observations.visits.filter((visit) => within(window, visit.occurredAt)).length +
    publishedReviews(observations.reviews).filter((review) => within(window, review.createdAt))
      .length +
    observations.events.filter((event) => within(window, event.createdAt)).length
  );
}

// ---------------------------------------------------------------------------
// Model 1 — BusinessHealth
// ---------------------------------------------------------------------------

/**
 * Operational health, or a typed reason there is none.
 *
 * `BusinessHealth` has **no nullable fields**, so it is all-or-nothing: a
 * partially-known health would have to invent a booking trend or a response
 * rate, and both are numbers an owner acts on. The floor is therefore the
 * union of its components' needs:
 *
 * - at least one approved review — freshness and response rate come from there;
 * - at least one terminal booking — cancellation rate comes from there;
 * - bookings in **both** halves of the trend comparison — because "stable"
 *   asserted over an empty previous month is a claim about a month that had
 *   no data, and a business's first busy month is growth, not stability.
 *
 * At Manzil's present size this refuses for effectively every business. That
 * is the point: `marketplace_sparse` with the real sample size is a fact, and
 * `overall: 72` would not be.
 */
export function computeBusinessHealth(
  observations: BusinessObservations,
  now: IsoDateTime
): IntelligenceOutcome<BusinessHealth> {
  const businessId = observations.business.id;
  const scopeKey = `business:${businessId}`;
  const reviews = publishedReviews(observations.reviews);
  const terminal = observations.bookings.filter((booking) => isTerminalBooking(booking.status));
  const window = windowEndingAt(now, OBSERVATION_WINDOW_DAYS.trendHalf * 2);

  const base = {
    observations: reviews.length + terminal.length,
    window,
    sources: [FACT_SOURCE.review, FACT_SOURCE.booking],
    subjectId: businessId,
    at: now,
    scopeKey
  };

  const refusal = refuseWithoutEvidence<BusinessHealth>("business_health", base);
  if (refusal) return refusal;

  // Component-level honesty: the aggregate floor can be cleared by reviews
  // alone, and a health block with a fabricated cancellation rate would be
  // exactly the failure this epic exists to prevent.
  if (reviews.length === 0) {
    return refuseSparse<BusinessHealth>("business_health", {
      ...base,
      observations: 0,
      scopeKey: `${scopeKey}#reviews`
    });
  }

  if (terminal.length === 0) {
    return refuseSparse<BusinessHealth>("business_health", {
      ...base,
      observations: 0,
      scopeKey: `${scopeKey}#bookings`
    });
  }

  const current = trendWindow(now);
  const previous = precedingWindow(current);
  const currentCount = observations.bookings.filter((booking) =>
    within(current, booking.startsAt)
  ).length;
  const previousCount = observations.bookings.filter((booking) =>
    within(previous, booking.startsAt)
  ).length;

  if (currentCount === 0 || previousCount === 0) {
    return refuseSparse<BusinessHealth>("business_health", {
      ...base,
      observations: currentCount + previousCount,
      scopeKey: `${scopeKey}#booking_trend`
    });
  }

  const bookingTrend = healthTrend(previousCount, currentCount);
  const newestReview = reviews[0] as ReviewIntelligenceRow;
  const reviewFreshnessDays = daysBetween(newestReview.createdAt, new Date(now));
  const responseRate = clamp01(
    reviews.filter((review) => review.hasReply).length / reviews.length
  );
  const cancellationRate = clamp01(
    terminal.filter((booking) => isCanceledBooking(booking.status)).length / terminal.length
  );

  const averageRating = mean(reviews.map((review) => review.rating)) ?? 3;
  const ratingComponent = clamp01((averageRating - 1) / 4);
  const freshnessComponent = clamp01(1 - reviewFreshnessDays / LISTING_STALE_DAYS);
  const trendComponent = bookingTrend === "growing" ? 1 : bookingTrend === "stable" ? 0.5 : 0;

  const overall = Math.round(
    100 *
      clamp01(
        ratingComponent * HEALTH_WEIGHTS.rating +
          (1 - cancellationRate) * HEALTH_WEIGHTS.cancellation +
          responseRate * HEALTH_WEIGHTS.response +
          trendComponent * HEALTH_WEIGHTS.trend +
          freshnessComponent * HEALTH_WEIGHTS.reviewFreshness
      )
  );

  return computed<BusinessHealth>(
    "business_health",
    {
      businessId,
      overall,
      bookingTrend,
      reviewFreshnessDays,
      responseRate: roundTo(responseRate),
      cancellationRate: roundTo(cancellationRate),
      listingStale: isListingStale(observations, now),
      computedAt: now
    },
    base
  );
}

/**
 * True when a weekly window covers a `(day, hour)` bucket.
 *
 * Day *and* hour: a Friday-evening peak does not make Friday lunchtime busy,
 * and matching on the day alone would report a venue as concentrated because
 * it opens on the same days it peaks. A window that runs to `00:00` is treated
 * as ending at hour 24, which is the half-open reading `peakWindows` writes.
 */
export function coversBucket(
  window: { readonly day: string; readonly startLocalTime: string; readonly endLocalTime: string },
  day: string,
  hour: number
): boolean {
  if (window.day !== day) return false;

  const start = Number.parseInt(window.startLocalTime.slice(0, 2), 10);
  const parsedEnd = Number.parseInt(window.endLocalTime.slice(0, 2), 10);
  const end = parsedEnd <= start ? parsedEnd + 24 : parsedEnd;

  return hour >= start && hour < end;
}

/** `BusinessHealth.bookingTrend` speaks growing/stable/declining, not rising. */
function healthTrend(previous: number, current: number): BusinessHealth["bookingTrend"] {
  const direction = trendDirection(changeRate(previous, current));
  if (direction === "rising") return "growing";
  if (direction === "declining") return "declining";
  return "stable";
}

/**
 * Whether the listing itself looks abandoned (doc 21: "which listings are
 * stale").
 *
 * Computable for **every** business, including one with no reviews and no
 * bookings, because it reads the owner's own edit timestamps rather than
 * customer behaviour. That is why it is the one health signal this module can
 * always give an owner honestly.
 */
export function isListingStale(observations: BusinessObservations, now: IsoDateTime): boolean {
  const touched = [
    observations.business.updatedAt,
    ...observations.packages.map((row) => row.updatedAt)
  ];

  const newest = touched.reduce((latest, at) => (at > latest ? at : latest), touched[0] as Date);
  return daysBetween(newest, new Date(now)) >= LISTING_STALE_DAYS;
}

// ---------------------------------------------------------------------------
// Model 2 — Popularity
// ---------------------------------------------------------------------------

/**
 * Standing against comparable providers, in [0, 1].
 *
 * Popularity is **relative by definition** — a [0, 1] feature is a rank, and a
 * rank needs a field to rank against. With four providers a percentile can
 * only take five values, so the floor demands five peers before the number
 * means anything about the business rather than about the size of Manzil.
 */
export function computePopularity(
  observations: BusinessObservations,
  context: PeerContext,
  now: IsoDateTime
): IntelligenceOutcome<number> {
  const window = behaviourWindow(now);
  const peers = context.peers.filter((peer) => peer.business.id !== observations.business.id);

  const base = {
    observations: engagementObservations(observations, window),
    peers: peers.length,
    window,
    sources: [FACT_SOURCE.booking, FACT_SOURCE.visit, FACT_SOURCE.review],
    subjectId: observations.business.id,
    at: now,
    scopeKey: `business:${observations.business.id}#popularity`
  };

  const refusal = refuseWithoutEvidence<number>("popularity", base);
  if (refusal) return refusal;

  const rank = percentileRank(
    engagementScore(observations, window),
    peers.map((peer) => peer.engagement)
  );

  if (rank === null) {
    return refuseSparse<number>("popularity", { ...base, peers: 0 });
  }

  return computed<number>("popularity", roundTo(rank), base);
}

// ---------------------------------------------------------------------------
// Model 3 — PeakHours
// ---------------------------------------------------------------------------

/**
 * When the business is busy, as observed rather than as claimed.
 *
 * Reads booking start times and recorded customer visits — the two rows that
 * put a person in a venue at an hour. Times are marketplace-local: "Friday
 * 18:00" is a fact about dinner, and in UTC it is 13:00.
 */
export function computePeakHours(
  observations: BusinessObservations,
  now: IsoDateTime
): IntelligenceOutcome<PeakHoursProfile> {
  const window = behaviourWindow(now);
  const instants = [
    ...observations.bookings
      .filter((booking) => within(window, booking.startsAt) && !isCanceledBooking(booking.status))
      .map((booking) => booking.startsAt),
    ...observations.visits
      .filter((visit) => within(window, visit.occurredAt))
      .map((visit) => visit.occurredAt)
  ];

  const base = {
    observations: instants.length,
    window,
    sources: [FACT_SOURCE.booking, FACT_SOURCE.visit],
    subjectId: observations.business.id,
    at: now,
    scopeKey: `business:${observations.business.id}#peak_hours`
  };

  const refusal = refuseWithoutEvidence<PeakHoursProfile>("peak_hours", base);
  if (refusal) return refusal;

  const buckets = weeklyHistogram(instants);
  const windows = peakWindows(buckets, instants.length);

  // Occupancy needs capacity, which the schema does not record. So intensity
  // is the share of activity that lands inside the peak windows — a fact about
  // concentration, which is what the profile can honestly claim.
  const inPeak = buckets
    .filter((bucket) => windows.some((window) => coversBucket(window, bucket.day, bucket.hour)))
    .reduce((sum, bucket) => sum + bucket.count, 0);

  return computed<PeakHoursProfile>(
    "peak_hours",
    {
      businessId: observations.business.id,
      windows,
      peakIntensity: roundTo(clamp01(inPeak / instants.length)),
      computedAt: now
    },
    base
  );
}

// ---------------------------------------------------------------------------
// Model 4 — TypicalCustomers
// ---------------------------------------------------------------------------

/**
 * Who actually visits, as group shape rather than identity.
 *
 * **The schema has no party size.** `Booking` records a phone and a service,
 * never how many people came, and there are no demographics anywhere. So the
 * only honest source is `Customer.tags` — what the owner typed into their own
 * CRM — read through `SEGMENT_LEXICON` at `merchant_input` provenance.
 *
 * When too few customers carry a recognizable tag the model returns
 * `knowledge_missing` naming `customer.segment_tags`, **not**
 * `marketplace_sparse`: more traffic will not produce this data, a column or a
 * tagging habit will. A scheduler must be able to tell those apart.
 */
export function computeTypicalCustomers(
  observations: BusinessObservations,
  now: IsoDateTime
): IntelligenceOutcome<readonly TypicalCustomerProfile[]> {
  const segmented = observations.customers
    .map((customer) => ({ customer, segments: segmentsOf(customer.tags) }))
    .filter((entry) => entry.segments.length > 0);

  const base = {
    observations: segmented.length,
    sources: [FACT_SOURCE.merchantInput],
    subjectId: observations.business.id,
    at: now,
    scopeKey: `business:${observations.business.id}#typical_customers`
  };

  if (segmented.length < MODEL_EVIDENCE_FLOOR.typical_customers.minObservations) {
    return refuseUnknowable<readonly TypicalCustomerProfile[]>("typical_customers", {
      ...base,
      missingKey: "customer.segment_tags"
    });
  }

  const counts = new Map<TypicalCustomerProfile["segment"], number>();
  for (const entry of segmented) {
    for (const segment of entry.segments) {
      counts.set(segment, (counts.get(segment) ?? 0) + 1);
    }
  }

  const profiles: TypicalCustomerProfile[] = CUSTOMER_SEGMENTS.filter((segment) =>
    counts.has(segment)
  ).map((segment) => ({
    segment,
    share: roundTo(clamp01((counts.get(segment) ?? 0) / segmented.length)),
    // Party size is genuinely unknown: no column records it, so null is the
    // only value that is not an invention.
    typicalPartySize: null
  }));

  return computed<readonly TypicalCustomerProfile[]>(
    "typical_customers",
    profiles.sort((a, b) => b.share - a.share || a.segment.localeCompare(b.segment)),
    base
  );
}

/** The segments a tag list names, deduplicated. */
export function segmentsOf(
  tags: readonly string[]
): readonly TypicalCustomerProfile["segment"][] {
  const normalized = tags.map((tag) => tag.toLowerCase().trim()).join(" ");
  if (normalized.length === 0) return [];

  return CUSTOMER_SEGMENTS.filter((segment) =>
    SEGMENT_LEXICON[segment].some((stem) => normalized.includes(stem))
  );
}

// ---------------------------------------------------------------------------
// Models 5 & 6 — BusinessStrengths / BusinessWeaknesses
// ---------------------------------------------------------------------------

/** Strengths and weaknesses, with the reviews-read count as the evidence. */
export function computeAspectSignals(
  observations: BusinessObservations,
  now: IsoDateTime
): IntelligenceOutcome<AspectSignals> {
  const signals = extractAspectSignals(observations.reviews);
  const published = signals.strengths.length + signals.weaknesses.length;

  const base = {
    observations: published > 0 ? signals.reviewsRead : 0,
    sources: [FACT_SOURCE.review],
    subjectId: observations.business.id,
    at: now,
    scopeKey: `business:${observations.business.id}#aspects`
  };

  // Reviews that never name an aspect are not evidence about any aspect —
  // counting them would let a hundred "yaxshi!" reviews certify a parking
  // score nobody mentioned.
  const refusal = refuseWithoutEvidence<AspectSignals>("business_strengths", base);
  if (refusal) return refusal;

  return computed<AspectSignals>("business_strengths", signals, base);
}

/**
 * How well the business fits each experience type, from evidenced aspects.
 *
 * Only experience types with at least one *positive* supporting aspect appear.
 * There is no capability model in the schema, so a business is never called
 * "birthday ready" because it says so — only because reviewers who mentioned
 * birthdays rated it well.
 */
export function computeSuitableExperiences(
  signals: AspectSignals
): readonly SuitableExperience[] {
  const strengthByAspect = new Map(
    signals.strengths.map((assessment) => [assessment.aspect, assessment])
  );

  const suitable: SuitableExperience[] = [];

  for (const experienceType of EXPERIENCE_TYPES) {
    const supporting = EXPERIENCE_ASPECT_EVIDENCE[experienceType]
      .map((aspect) => strengthByAspect.get(aspect))
      .filter((assessment): assessment is NonNullable<typeof assessment> => assessment !== undefined);

    if (supporting.length === 0) continue;

    const fit = mean(supporting.map((assessment) => assessment.score * assessment.confidence));
    if (fit === null || fit <= 0) continue;

    suitable.push({
      experienceType,
      fit: roundTo(clamp01(fit)),
      supportingCapabilityKeys: supporting.map((assessment) => `aspect:${assessment.aspect}`)
    });
  }

  return suitable.sort((a, b) => b.fit - a.fit || a.experienceType.localeCompare(b.experienceType));
}

// ---------------------------------------------------------------------------
// Model 7 — AlternativeBusinesses
// ---------------------------------------------------------------------------

/**
 * Substitute providers, precomputed so replacement is a lookup.
 *
 * Substitution is **structural**, not statistical: two providers substitute
 * when they satisfy the same constraints — same category, same district, same
 * price level, overlapping service catalogs. So one comparable peer genuinely
 * is one alternative, and the floor asks only that a peer exist.
 *
 * Gained and lost keys are service keys, namespaced `service:`. There is no
 * capability model yet (Epic 08), and naming a service as though it were a
 * verified capability would let the replacement narration claim more than the
 * rows support.
 */
export function computeAlternatives(
  observations: BusinessObservations,
  context: PeerContext,
  now: IsoDateTime
): IntelligenceOutcome<readonly AlternativeBusiness[]> {
  const peers = context.peers.filter((peer) => peer.business.id !== observations.business.id);

  const base = {
    observations: peers.length,
    peers: peers.length,
    sources: [FACT_SOURCE.merchantInput],
    subjectId: observations.business.id,
    at: now,
    scopeKey: `business:${observations.business.id}#alternatives`
  };

  const refusal = refuseWithoutEvidence<readonly AlternativeBusiness[]>(
    "alternative_businesses",
    base
  );
  if (refusal) return refusal;

  const ours = constraintSet(observations.business, observations.packages);
  const ourServices = serviceKeys(observations.packages);

  const alternatives = peers
    .map((peer) => {
      const theirServices = serviceKeys(peer.packages);

      return {
        businessId: peer.business.id,
        constraintOverlap: roundTo(jaccard(ours, constraintSet(peer.business, peer.packages))),
        gainedCapabilityKeys: [...theirServices]
          .filter((key) => !ourServices.has(key))
          .sort()
          .map((key) => `service:${key}`),
        lostCapabilityKeys: [...ourServices]
          .filter((key) => !theirServices.has(key))
          .sort()
          .map((key) => `service:${key}`)
      } satisfies AlternativeBusiness;
    })
    .filter((alternative) => alternative.constraintOverlap > 0)
    .sort(
      (a, b) => b.constraintOverlap - a.constraintOverlap || a.businessId.localeCompare(b.businessId)
    )
    .slice(0, MAX_ALTERNATIVES);

  return computed<readonly AlternativeBusiness[]>("alternative_businesses", alternatives, base);
}

/** The constraints a provider satisfies, as a comparable key set. */
export function constraintSet(
  business: BusinessIntelligenceRow,
  packages: readonly PackageIntelligenceRow[]
): ReadonlySet<string> {
  const keys = new Set<string>([
    `category:${business.categoryId}`,
    `area:${neighborhoodOf(business)}`
  ]);

  const level = priceTierLevel(business.priceTier);
  if (level !== null) keys.add(`price:${level}`);

  for (const key of serviceKeys(packages)) keys.add(`service:${key}`);

  return keys;
}

/** Normalized names of a provider's active services. */
export function serviceKeys(packages: readonly PackageIntelligenceRow[]): ReadonlySet<string> {
  return new Set(
    packages.filter((row) => row.isActive).map((row) => normalizeServiceName(row.name))
  );
}

// ---------------------------------------------------------------------------
// Model 8 — RecommendedServices
// ---------------------------------------------------------------------------

/** A service the marketplace suggests a business should start offering. */
export interface RecommendedService {
  /** Marketplace-level service id (`service-market:haircut`). */
  readonly serviceId: EntityId;
  /** The normalized name, so an owner reads a word rather than an id. */
  readonly serviceKey: string;
  /** Comparable providers already offering it. */
  readonly offeringPeerCount: number;
  /** Bookings observed for it across those providers, in the window. */
  readonly observedDemand: number;
  readonly medianPrice: MoneyAmount | null;
  readonly confidence: Confidence;
}

/**
 * Services this business does not offer that its peers do, and that customers
 * demonstrably book.
 *
 * This is advice with a cost attached — an owner who acts on it buys
 * equipment or hires. So the floor is the strictest in the module: three peers
 * offering the service *and* five observed bookings for it. Below that the
 * platform says nothing, which is the correct amount to say.
 */
export function computeRecommendedServices(
  observations: BusinessObservations,
  context: PeerContext,
  now: IsoDateTime
): IntelligenceOutcome<readonly RecommendedService[]> {
  const peers = context.peers.filter(
    (peer) =>
      peer.business.id !== observations.business.id &&
      peer.business.categoryId === observations.business.categoryId
  );

  const ourServices = serviceKeys(observations.packages);
  const offers = new Map<string, { peers: number; demand: number; prices: number[]; currency: string }>();

  for (const peer of peers) {
    for (const row of peer.packages.filter((entry) => entry.isActive)) {
      const key = normalizeServiceName(row.name);
      if (ourServices.has(key)) continue;

      const entry = offers.get(key) ?? { peers: 0, demand: 0, prices: [], currency: row.currency };
      entry.peers += 1;
      entry.demand += peer.serviceDemand.get(key) ?? 0;
      entry.prices.push(decimalToNumber(row.price));
      offers.set(key, entry);
    }
  }

  const candidates = [...offers.entries()].filter(
    ([, entry]) =>
      entry.peers >= MODEL_EVIDENCE_FLOOR.recommended_services.minPeers &&
      entry.demand >= MODEL_EVIDENCE_FLOOR.recommended_services.minObservations
  );

  const base = {
    observations: candidates.reduce((sum, [, entry]) => sum + entry.demand, 0),
    peers: peers.length,
    window: behaviourWindow(now),
    sources: [FACT_SOURCE.booking, FACT_SOURCE.merchantInput],
    subjectId: observations.business.id,
    at: now,
    scopeKey: `business:${observations.business.id}#recommended_services`
  };

  const refusal = refuseWithoutEvidence<readonly RecommendedService[]>(
    "recommended_services",
    base
  );
  if (refusal) return refusal;

  const recommended = candidates
    .map(([key, entry]) => {
      const price = median(entry.prices);

      return {
        serviceId: serviceKeyId(key),
        serviceKey: key,
        offeringPeerCount: entry.peers,
        observedDemand: entry.demand,
        medianPrice: price === null ? null : toMoney(price, entry.currency),
        confidence: confidenceFromSample(
          entry.demand,
          MODEL_EVIDENCE_FLOOR.recommended_services.minObservations
        )
      } satisfies RecommendedService;
    })
    .sort((a, b) => b.observedDemand - a.observedDemand || a.serviceKey.localeCompare(b.serviceKey))
    .slice(0, MAX_RECOMMENDED_SERVICES);

  return computed<readonly RecommendedService[]>("recommended_services", recommended, base);
}

// ---------------------------------------------------------------------------
// Within-catalog ranking and the marketplace fact summary
// ---------------------------------------------------------------------------

/**
 * The business's own services, ranked by share of its bookings.
 *
 * Bookings carry a free-text `serviceName`, so a booking joins a package by
 * normalized name — the same rule Epic 04's projection uses, so the graph and
 * this layer agree about what a booking bought.
 */
export function computePopularServices(
  observations: BusinessObservations,
  now: IsoDateTime
): IntelligenceOutcome<readonly PopularService[]> {
  const window = behaviourWindow(now);
  const byKey = new Map<string, string>(
    observations.packages.map((row) => [normalizeServiceName(row.name), row.id])
  );

  const matched = observations.bookings
    .filter((booking) => within(window, booking.startsAt) && !isCanceledBooking(booking.status))
    .map((booking) => byKey.get(normalizeServiceName(booking.serviceName)))
    .filter((id): id is string => id !== undefined);

  const base = {
    observations: matched.length,
    window,
    sources: [FACT_SOURCE.booking],
    subjectId: observations.business.id,
    at: now,
    scopeKey: `business:${observations.business.id}#popular_services`
  };

  const refusal = refuseWithoutEvidence<readonly PopularService[]>("popular_services", base);
  if (refusal) return refusal;

  const ranked = rankByFrequency(matched)
    .slice(0, MAX_POPULAR_SERVICES)
    .map(([serviceId, count], index) => ({
      serviceId,
      bookingShare: roundTo(clamp01(count / matched.length)),
      rank: index + 1
    }));

  return computed<readonly PopularService[]>("popular_services", ranked, base);
}

/**
 * The Layer 2 marketplace fact summary for one business.
 *
 * Unlike health, this contract is **nullable field by field**, which is what
 * lets it publish exactly what is known and nothing else. Two fields are
 * permanently null on this schema and say so:
 *
 * - `familyShare` — needs a party size, which `Booking` does not record;
 * - `weekendOccupancy` — needs venue capacity, which nothing records. Weekend
 *   *share of visits* is a different quantity and putting it in this field
 *   would misreport it under a name ranking already weighs.
 */
export function computeBusinessFacts(
  observations: BusinessObservations,
  now: IsoDateTime
): BusinessFactSummary {
  const window = behaviourWindow(now);
  const inWindow = observations.bookings.filter((booking) => within(window, booking.startsAt));

  const durations = inWindow
    .filter((booking) => isCompletedBooking(booking.status))
    .map((booking) => bookingMinutes(booking))
    .filter((minutes): minutes is number => minutes !== null);

  const spends = observations.customers
    .map((customer) => spendPerVisit(customer))
    .filter((spend): spend is number => spend !== null);

  const visitsByIdentity = new Map<string, number>();
  const customerById = new Map(observations.customers.map((row) => [row.id, row]));
  for (const visit of observations.visits.filter((row) => within(window, row.occurredAt))) {
    const customer = customerById.get(visit.customerId);
    const identity = customer ? customerIdentity(customer) : `customer:${visit.customerId}`;
    visitsByIdentity.set(identity, (visitsByIdentity.get(identity) ?? 0) + 1);
  }

  const peak = computePeakHours(observations, now);
  const averageMinutes = mean(durations);
  const averageSpend = mean(spends);
  const repeatShare = share(
    [...visitsByIdentity.values()].filter((count) => count > 1).length,
    visitsByIdentity.size
  );

  return {
    businessId: observations.business.id,
    averageVisitMinutes:
      averageMinutes !== null && durations.length >= MODEL_EVIDENCE_FLOOR.average_visit_minutes.minObservations
        ? fact(roundTo(averageMinutes, 0), durations.length, window, now, "average_visit_minutes")
        : null,
    // No party size column exists — see the doc comment.
    familyShare: null,
    peakHours:
      peak.status === "computed"
        ? fact(peak.value.windows, peak.evidence.observations, window, now, "peak_hours")
        : null,
    // No capacity column exists — see the doc comment.
    weekendOccupancy: null,
    averageSpend:
      averageSpend !== null && spends.length >= MODEL_EVIDENCE_FLOOR.average_spend.minObservations
        ? fact(
            toMoney(roundTo(averageSpend, 2), "UZS"),
            spends.length,
            window,
            now,
            "average_spend"
          )
        : null,
    repeatVisitorShare:
      repeatShare !== null &&
      visitsByIdentity.size >= MODEL_EVIDENCE_FLOOR.repeat_visitor_share.minObservations
        ? fact(roundTo(repeatShare), visitsByIdentity.size, window, now, "repeat_visitor_share")
        : null,
    generatedAt: now
  };
}

/** A `MarketplaceFact` with its sample size, window and derived confidence. */
export function fact<TValue>(
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

/** Median booking lead time in hours, or null below the floor. */
export function medianLeadHours(bookings: readonly BookingIntelligenceRow[]): number | null {
  const leads = bookings
    .map((booking) => bookingLeadHours(booking))
    .filter((hours): hours is number => hours !== null);

  return leads.length >= MODEL_EVIDENCE_FLOOR.service_market.minObservations
    ? median(leads)
    : null;
}

/** Coordinates of a business, or null when it has none. */
export function coordinatesOf(
  business: BusinessIntelligenceRow
): { readonly lat: number; readonly lng: number } | null {
  const lat = decimalOrNull(business.lat);
  const lng = decimalOrNull(business.lng);

  return lat === null || lng === null ? null : { lat, lng };
}

/** The newest instant any of these rows was observed at. */
export function newestObservation(observations: BusinessObservations): IsoDateTime | null {
  const instants = [
    ...observations.reviews.map((row) => row.createdAt),
    ...observations.bookings.map((row) => row.startsAt),
    ...observations.visits.map((row) => row.occurredAt),
    ...observations.events.map((row) => row.createdAt)
  ];

  if (instants.length === 0) return null;

  return toIso(
    instants.reduce((latest, at) => (at > latest ? at : latest), instants[0] as Date)
  );
}
