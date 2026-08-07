/**
 * Layer 4 (Memory Engine) — preference knowledge projected from behaviour.
 *
 * Epic 04's thesis applies here too: what the relational schema already proves
 * should be *derived on read*, not copied into a second store that drifts. A
 * customer who visited the same tea house four times has a favourite, and the
 * platform knows it without anybody writing a memory — so the preference tier
 * is projection plus overlay: rows prove what they prove, and explicitly
 * remembered knowledge merges on top through the conflict rule.
 *
 * The distinction from Epic 04 is confidence. A projected *edge* restates a
 * row and is certain (1.0). A projected *preference* interprets rows — four
 * visits mean something, but not with certainty — so everything here is capped
 * below 1.0 by `MAX_PROJECTED_CONFIDENCE`. Certainty stays reserved for
 * restatements of facts that exist.
 *
 * Pure module: rows in, contract shapes out, no Prisma, no clock.
 */
import type {
  BudgetRange,
  Confidence,
  EntityId,
  IsoDateTime,
  KnowledgeFact,
  MoneyAmount
} from "../core";
import type { CustomerPreference } from "../customer-intelligence";
import type { PreferenceKnowledge } from "./memory.tiers";

/**
 * Ceiling on any projected preference.
 *
 * Behaviour is evidence, not testimony: the customer never said "I prefer
 * this", the platform noticed. Ranking and trust both read the difference.
 */
export const MAX_PROJECTED_CONFIDENCE = 0.9;

/** Visits at which a projected preference stops gaining confidence. */
export const PROJECTION_SATURATION = 8;

/** Visits to one business before it counts as a favourite. */
export const MIN_VISITS_FOR_FAVORITE = 2;

/** Ceiling on projected favourites, so one heavy user cannot blow up a payload. */
export const MAX_PROJECTED_FAVORITES = 20;

/**
 * The platform's currency.
 *
 * `Customer.totalSpend` carries no currency column because the marketplace is
 * single-currency (`Payment.currency` defaults to UZS). Naming the assumption
 * here means a second currency becomes a compile-time visit to one constant
 * rather than a hunt through arithmetic.
 */
export const PLATFORM_CURRENCY = "UZS";

/** `Customer` row fields the projection reads. Business-scoped, as the table is. */
export interface CustomerMemoryRow {
  readonly id: string;
  readonly businessId: string;
  readonly userId: string | null;
  readonly phone: string;
  readonly visitCount: number;
  /** Prisma `Decimal`; read through `toString()` so no float ever touches money. */
  readonly totalSpend: { toString(): string };
  readonly lastVisitAt: Date | null;
  readonly updatedAt: Date;
}

/** `CustomerVisit` row fields the projection reads. */
export interface VisitMemoryRow {
  readonly customerId: string;
  readonly businessId: string;
  readonly occurredAt: Date;
}

/** The `Business` facets a preference can be derived from. */
export interface BusinessFacetRow {
  readonly id: string;
  readonly categoryId: string;
  readonly categorySlug: string | null;
  readonly priceTier: string | null;
}

/** Everything the preference projection needs, already fetched. */
export interface PreferenceProjectionInput {
  readonly customerId: EntityId;
  readonly customers: readonly CustomerMemoryRow[];
  readonly visits: readonly VisitMemoryRow[];
  readonly businesses: readonly BusinessFacetRow[];
  /** Fallback observation time when no visit carries one. */
  readonly now: IsoDateTime;
}

/** A projected tier payload plus the envelope facts its writer needs. */
export interface ProjectedPreference {
  readonly knowledge: PreferenceKnowledge;
  readonly confidence: Confidence;
  readonly observedAt: IsoDateTime;
  /** Visits the projection is built from; 0 means "nothing to say". */
  readonly evidenceCount: number;
}

/** Linear ramp, two decimals, capped below certainty. */
export function projectionConfidence(observations: number): Confidence {
  if (observations <= 0) return 0;
  const raw = Math.min(MAX_PROJECTED_CONFIDENCE, observations / PROJECTION_SATURATION);
  return Math.round(raw * 100) / 100;
}

function toIso(date: Date | null): IsoDateTime | null {
  return date ? date.toISOString() : null;
}

/** Visits per business, deterministic: count desc, then id asc. */
export function countVisitsByBusiness(visits: readonly VisitMemoryRow[]): ReadonlyMap<string, number> {
  const counts = new Map<string, number>();

  for (const visit of visits) {
    counts.set(visit.businessId, (counts.get(visit.businessId) ?? 0) + 1);
  }

  return counts;
}

/**
 * Businesses the customer keeps coming back to.
 *
 * Two visits, not one: a single visit is a thing that happened, a second is
 * the first evidence of a choice. Ties break on id so two customers with the
 * same history get the same list in the same order, forever.
 */
export function deriveFavoriteBusinessIds(visits: readonly VisitMemoryRow[]): readonly EntityId[] {
  return [...countVisitsByBusiness(visits).entries()]
    .filter(([, count]) => count >= MIN_VISITS_FOR_FAVORITE)
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .slice(0, MAX_PROJECTED_FAVORITES)
    .map(([businessId]) => businessId);
}

/**
 * The dominant value of one business facet across the customer's visits, as a
 * provenance-carrying fact — or null when the visits prove nothing.
 *
 * `source: "visit"` because the fact restates visit rows; the memory object
 * that carries it is stamped `platform_inference`, because assembling a
 * *preference* out of counted visits is the platform's own reading. Keeping
 * the two apart is what lets the trust layer tell "you went there four times"
 * from "so you like it".
 */
function dominantFacet(
  visits: readonly VisitMemoryRow[],
  facets: ReadonlyMap<string, BusinessFacetRow>,
  select: (facet: BusinessFacetRow) => string | null,
  observedAt: IsoDateTime
): KnowledgeFact<string> | null {
  const counts = new Map<string, number>();

  for (const visit of visits) {
    const facet = facets.get(visit.businessId);
    const value = facet ? select(facet) : null;
    if (!value) continue;

    counts.set(value, (counts.get(value) ?? 0) + 1);
  }

  const ranked = [...counts.entries()].sort(
    (left, right) => right[1] - left[1] || left[0].localeCompare(right[0])
  );
  const top = ranked[0];
  if (!top) return null;

  return {
    value: top[0],
    source: "visit",
    confidence: projectionConfidence(top[1]),
    observedAt
  };
}

/**
 * What the customer has typically been able to spend, per visit.
 *
 * `min` stays null on purpose: spending less than usual is never evidence of a
 * floor, and inventing one would have the ranking layer discard exactly the
 * affordable options a budget-conscious customer wants. The upper bound is an
 * observed average, not a limit the customer stated — which is why it is
 * carried as projected knowledge at projected confidence, and why an
 * explicitly remembered budget outranks it through source precedence.
 */
export function deriveBudget(customers: readonly CustomerMemoryRow[]): BudgetRange | null {
  let spend = 0;
  let visits = 0;

  for (const customer of customers) {
    const rowSpend = Number(customer.totalSpend.toString());
    if (Number.isFinite(rowSpend)) spend += rowSpend;
    visits += customer.visitCount;
  }

  if (visits <= 0 || spend <= 0) return null;

  const average: MoneyAmount = {
    // Major units → minor units (so'm → tiyin), rounded once, at the edge.
    amountMinor: Math.round((spend / visits) * 100),
    currency: PLATFORM_CURRENCY
  };

  return { min: null, max: average };
}

/**
 * The whole projected preference tier for one customer.
 *
 * Returns `evidenceCount: 0` rather than an empty-but-confident payload when
 * there is nothing to project: a first-time visitor has no preferences, and
 * saying so is the honest answer the retrieval path already knows how to
 * handle.
 */
export function projectPreferenceKnowledge(input: PreferenceProjectionInput): ProjectedPreference {
  const facets = new Map(input.businesses.map((business) => [business.id, business]));
  const latestVisit = input.visits.reduce<Date | null>(
    (latest, visit) => (latest === null || visit.occurredAt > latest ? visit.occurredAt : latest),
    null
  );
  const observedAt = toIso(latestVisit) ?? input.now;

  const preferences: CustomerPreference[] = [];

  const category = dominantFacet(input.visits, facets, (facet) => facet.categorySlug, observedAt);
  if (category) preferences.push({ dimension: "category", fact: category });

  const priceTier = dominantFacet(input.visits, facets, (facet) => facet.priceTier, observedAt);
  if (priceTier) preferences.push({ dimension: "price_tier", fact: priceTier });

  return {
    knowledge: {
      customerId: input.customerId,
      preferences,
      budget: deriveBudget(input.customers),
      // Dietary knowledge needs review-signal extraction (Epic 06). Empty is
      // the honest answer; a guess about halal or allergies is not a guess
      // this platform gets to make.
      dietary: [],
      favoriteBusinessIds: deriveFavoriteBusinessIds(input.visits)
    },
    confidence: projectionConfidence(input.visits.length),
    observedAt,
    evidenceCount: input.visits.length
  };
}
