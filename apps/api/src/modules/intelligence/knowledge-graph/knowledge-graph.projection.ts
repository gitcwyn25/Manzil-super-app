/**
 * Layer 3 (Knowledge Graph) — the relational projection, as pure functions.
 *
 * PROJECTION-FIRST (Epic 04): the graph is not a second copy of the
 * marketplace waiting to be filled. Everything the relational schema already
 * proves is *derived* from it on read — no migration, no backfill, no drift
 * between two truths. Only knowledge the relational schema cannot express
 * (explicit merchant declarations, inferred edges) needs storage, and that is
 * gated on the M1 drift reconciliation.
 *
 * Projected today (source per `RELATIONAL_EDGE_SOURCE`, confidence 1.0):
 *
 * | Edge                             | Derived from                          |
 * | -------------------------------- | ------------------------------------- |
 * | Business →belongs_to→ Category   | `Business.categoryId`                 |
 * | Business →located_in→ Neighborhood | `Business.city` + `Business.district` |
 * | Business →provides→ Service      | `BusinessPackage`                     |
 * | Customer →visited→ Business      | `CustomerVisit`                       |
 * | Customer →booked→ Service        | `Booking` × `BusinessPackage` by name |
 * | Review →describes→ Business      | `Review.businessId`                   |
 * | Campaign →promotes→ Business     | `Campaign.businessId`                 |
 *
 * Contract-only (the node kind exists in the frozen contract, no model backs
 * it, and Epic 04 invents neither model nor data): Experience, Workspace,
 * Story, Location, Organization, Event, and the reified Relationship node.
 * `Workspace →contains→ Experience`, `Business →participates_in→ Experience`,
 * `Service →supports→ Experience` and `Story →references→ Business` are
 * therefore declared in the registry and produced by nothing.
 *
 * Every function here is pure: rows in, contract shapes out. That is what
 * makes projection correctness testable without a database, and what makes a
 * rebuild idempotent — the same rows always produce the same graph.
 */
import type {
  BudgetRange,
  IsoDateTime,
  KnowledgeFact,
  MoneyAmount,
  WeeklyWindow
} from "../core";
import type { AnyRelationship } from "../relationship-engine";
import type {
  BookingEntity,
  BookingMetadata,
  BusinessEntity,
  CampaignEntity,
  CapabilityFact,
  CategoryEntity,
  CustomerEntity,
  NeighborhoodEntity,
  PriceTier,
  ReviewEntity,
  ServiceEntity
} from "./knowledge-graph.entities";
import { graphId, neighborhoodGraphId } from "./knowledge-graph.ids";
import {
  PROJECTION_CONFIDENCE,
  RELATIONAL_EDGE_SOURCE,
  relationship
} from "./knowledge-graph.relationships";

/** Prisma returns `Decimal`; only its string form is contractually stable. */
export interface DecimalLike {
  toString(): string;
}

export interface BusinessPackageRow {
  readonly id: string;
  readonly businessId: string;
  readonly name: string;
  readonly description: string | null;
  readonly price: DecimalLike;
  readonly currency: string;
  readonly isActive: boolean;
  readonly updatedAt: Date;
}

export interface BusinessProjectionRow {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly categoryId: string;
  readonly city: string;
  readonly district: string;
  readonly address: string;
  readonly lat: DecimalLike | null;
  readonly lng: DecimalLike | null;
  readonly phone: string | null;
  readonly website: string | null;
  readonly telegram: string | null;
  readonly hoursJson: unknown;
  readonly priceTier: string | null;
  readonly verificationStatus: string;
  readonly updatedAt: Date;
  /** Present when the caller included packages; absent means "not loaded". */
  readonly packages?: readonly BusinessPackageRow[];
}

export interface CategoryProjectionRow {
  readonly id: string;
  readonly slug: string;
  readonly nameUz: string;
  readonly parentId: string | null;
}

export interface CustomerProjectionRow {
  readonly id: string;
  readonly businessId: string;
  readonly name: string | null;
  readonly phone: string;
  readonly userId: string | null;
  readonly firstSeenAt: Date;
  readonly updatedAt: Date;
}

export interface CustomerVisitProjectionRow {
  readonly customerId: string;
  readonly businessId: string;
  readonly occurredAt: Date;
}

export interface BookingProjectionRow {
  readonly id: string;
  readonly businessId: string;
  readonly customerId: string | null;
  readonly serviceName: string;
  readonly startsAt: Date;
  readonly endsAt: Date | null;
  readonly status: string;
  readonly updatedAt: Date;
}

export interface ReviewProjectionRow {
  readonly id: string;
  readonly businessId: string;
  readonly userId: string;
  readonly rating: number;
  readonly bookingId: string | null;
  readonly updatedAt: Date;
}

export interface CampaignProjectionRow {
  readonly id: string;
  readonly businessId: string;
  readonly name: string;
  readonly channel: string;
  readonly isActive: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

/** ISO order, so projected weekly windows are always in the same order. */
const DAY_ORDER = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday"
] as const;

type DayName = (typeof DAY_ORDER)[number];

const WEEKDAYS: readonly DayName[] = DAY_ORDER.slice(0, 5);
const WEEKEND: readonly DayName[] = DAY_ORDER.slice(5);

/** `09:00-18:00`, the only opening-hours shape that carries real structure. */
const HOURS_RANGE = /^\s*(\d{2}:\d{2})\s*[-–]\s*(\d{2}:\d{2})\s*$/;

/** UZS and every other currency the platform bills in has two minor digits. */
const MINOR_UNITS_PER_MAJOR = 100;

export function toIso(value: Date): IsoDateTime {
  return value.toISOString();
}

/**
 * Normalized service name — the join key between `Booking.serviceName`
 * (free text) and `BusinessPackage.name`. Bookings carry no service foreign
 * key, so this is the only honest way to connect a booking to the service
 * object it purchased.
 */
export function normalizeServiceName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

/**
 * Price tier as the contract spells it. The column is free text and carries
 * both symbol and word forms across the seed; unknown values project as null
 * rather than guessing a tier the merchant never stated.
 */
export function mapPriceTier(priceTier: string | null): PriceTier | null {
  switch (priceTier?.trim().toLowerCase()) {
    case "$":
    case "budget":
      return "$";
    case "$$":
    case "mid":
    case "standard":
      return "$$";
    case "$$$":
    case "premium":
      return "$$$";
    case "$$$$":
    case "luxury":
      return "$$$$";
    default:
      return null;
  }
}

/**
 * Booking status, contract spelling.
 *
 * Prisma's enum says `canceled`; `BookingMetadata` says `cancelled`. The
 * mapper is where that difference is resolved once — a graph consumer never
 * sees two spellings of one status.
 */
export function mapBookingStatus(status: string): BookingMetadata["status"] {
  switch (status) {
    case "canceled":
    case "cancelled":
      return "cancelled";
    case "confirmed":
      return "confirmed";
    case "completed":
      return "completed";
    case "no_show":
      return "no_show";
    default:
      return "pending";
  }
}

function money(amount: DecimalLike, currency: string): MoneyAmount {
  const major = Number(amount.toString());
  return {
    amountMinor: Number.isFinite(major) ? Math.round(major * MINOR_UNITS_PER_MAJOR) : 0,
    currency
  };
}

/** A fixed package price is a degenerate band whose bounds coincide. */
export function packagePrice(row: BusinessPackageRow): BudgetRange {
  const amount = money(row.price, row.currency);
  return { min: amount, max: amount };
}

function fact<TValue>(value: TValue, observedAt: IsoDateTime): KnowledgeFact<TValue> {
  return {
    value,
    source: "merchant_input",
    confidence: PROJECTION_CONFIDENCE,
    observedAt
  };
}

/**
 * The capability facts the relational record actually proves.
 *
 * Deliberately small. Doc 16's richer capability graph (capacity, parking,
 * private rooms, noise level) needs a capability ingestion pipeline; until
 * one exists, the honest projection is the handful of capabilities the row
 * demonstrates, and the absence of the rest — never a guess dressed as a
 * fact. Booleans are emitted even when false: "this provider publishes no
 * phone number" is itself a fact the record proves.
 */
export function businessCapabilities(row: BusinessProjectionRow): readonly CapabilityFact[] {
  const observedAt = toIso(row.updatedAt);
  const capabilities: CapabilityFact[] = [
    { key: "phone_contact", fact: fact(row.phone !== null && row.phone.length > 0, observedAt) },
    { key: "telegram_contact", fact: fact(row.telegram !== null && row.telegram.length > 0, observedAt) },
    { key: "web_presence", fact: fact(row.website !== null && row.website.length > 0, observedAt) },
    { key: "verified_business", fact: fact(row.verificationStatus === "verified", observedAt) }
  ];

  const tier = mapPriceTier(row.priceTier);
  if (tier) {
    capabilities.push({ key: "price_tier", fact: fact(tier, observedAt) });
  }

  const geoLocated = row.lat !== null && row.lng !== null;
  capabilities.push({ key: "geo_located", fact: fact(geoLocated, observedAt) });

  return capabilities;
}

/**
 * Opening hours, parsed only where the stored JSON carries real structure.
 *
 * `hoursJson` is free-form across the seed (`{ weekdays: "Mon-Sun 9-22" }`).
 * Day keys, plus the three collective keys, are expanded when — and only
 * when — their value matches `HH:mm-HH:mm`. Anything else yields no window:
 * an unparseable string is missing knowledge, and inventing hours a merchant
 * never stated is exactly the failure mode this layer exists to prevent.
 */
export function parseOpeningHours(hoursJson: unknown): readonly WeeklyWindow[] {
  if (!hoursJson || typeof hoursJson !== "object" || Array.isArray(hoursJson)) {
    return [];
  }

  const source = hoursJson as Record<string, unknown>;
  const byDay = new Map<DayName, { start: string; end: string }>();

  const assign = (days: readonly DayName[], raw: unknown) => {
    if (typeof raw !== "string") return;
    const match = HOURS_RANGE.exec(raw);
    if (!match) return;

    for (const day of days) {
      // Already-assigned days are never overwritten; combined with the
      // specificity passes below, that makes the winner independent of JSON
      // key order.
      if (!byDay.has(day)) {
        byDay.set(day, { start: match[1] as string, end: match[2] as string });
      }
    }
  };

  const entries = Object.entries(source).map(
    ([key, value]) => [key.trim().toLowerCase(), value] as const
  );

  // Specific beats general, whatever order the JSON happened to store: an
  // explicit `monday` overrides `weekdays`, which overrides `daily`.
  for (const [key, value] of entries) {
    if ((DAY_ORDER as readonly string[]).includes(key)) assign([key as DayName], value);
  }

  for (const [key, value] of entries) {
    if (key === "weekdays") assign(WEEKDAYS, value);
    else if (key === "weekends" || key === "weekend") assign(WEEKEND, value);
  }

  for (const [key, value] of entries) {
    if (key === "daily" || key === "everyday") assign(DAY_ORDER, value);
  }

  return DAY_ORDER.filter((day) => byDay.has(day)).map((day) => {
    const window = byDay.get(day) as { start: string; end: string };
    return { day, startLocalTime: window.start, endLocalTime: window.end };
  });
}

// ---------------------------------------------------------------------------
// Nodes
// ---------------------------------------------------------------------------

export function toBusinessEntity(
  row: BusinessProjectionRow,
  relationships: readonly AnyRelationship[]
): BusinessEntity {
  return {
    id: graphId("business", row.id),
    type: "business",
    relationships,
    metadata: {
      name: row.name,
      slug: row.slug,
      categoryId: graphId("category", row.categoryId),
      neighborhoodId: neighborhoodGraphId(row.city, row.district),
      priceTier: mapPriceTier(row.priceTier),
      capabilities: businessCapabilities(row),
      openingHours: parseOpeningHours(row.hoursJson),
      verified: row.verificationStatus === "verified"
    },
    // A projection is a lossless restatement of a row that exists: the
    // platform is exactly as sure of it as of its own database.
    confidence: PROJECTION_CONFIDENCE,
    updatedAt: toIso(row.updatedAt)
  };
}

/**
 * Category names are per-locale columns with no single canonical `name`;
 * the graph carries the Uzbek name because it is the only one the schema
 * makes non-nullable. Locale rendering is Layer 6's job, not the graph's.
 */
export function toCategoryEntity(
  row: CategoryProjectionRow,
  relationships: readonly AnyRelationship[],
  updatedAt: IsoDateTime
): CategoryEntity {
  return {
    id: graphId("category", row.id),
    type: "category",
    relationships,
    metadata: {
      name: row.nameUz,
      slug: row.slug,
      parentCategoryId: row.parentId ? graphId("category", row.parentId) : null
    },
    confidence: PROJECTION_CONFIDENCE,
    updatedAt
  };
}

/**
 * A service node is a `BusinessPackage`.
 *
 * The contract wants services independent of any one business ("Haircut →
 * provided by 120 businesses"), but the schema models packages per business.
 * The projection keeps the row identity and recovers the independence at
 * query time: `providersOfService` matches on the normalized service name
 * across businesses, which is the substitution question the contract is
 * actually asking.
 */
export function toServiceEntity(
  row: BusinessPackageRow,
  categoryId: string | null,
  relationships: readonly AnyRelationship[]
): ServiceEntity {
  return {
    id: graphId("service", row.id),
    type: "service",
    relationships,
    metadata: {
      name: row.name,
      categoryId: categoryId ? graphId("category", categoryId) : null,
      // No duration column exists; absent rather than assumed.
      typicalDurationMinutes: null,
      typicalPrice: packagePrice(row)
    },
    confidence: PROJECTION_CONFIDENCE,
    updatedAt: toIso(row.updatedAt)
  };
}

/**
 * Customer identity is business-scoped: `Customer` is unique on
 * `(businessId, phone)`, so one person known to three businesses is three
 * rows and therefore three nodes. Cross-business identity is resolved only
 * where the schema supports it — see `customerIdentityKey` — and never by
 * merging nodes the database keeps apart.
 */
export function toCustomerEntity(
  row: CustomerProjectionRow,
  relationships: readonly AnyRelationship[]
): CustomerEntity {
  return {
    id: graphId("customer", row.id),
    type: "customer",
    relationships,
    metadata: {
      displayName: row.name ?? row.phone,
      // The CRM customer row carries no locale; `uz` is the platform default
      // (`User.locale` default) rather than a guess about this person.
      locale: "uz",
      homeNeighborhoodId: null,
      memberSince: toIso(row.firstSeenAt).slice(0, 10)
    },
    confidence: PROJECTION_CONFIDENCE,
    updatedAt: toIso(row.updatedAt)
  };
}

export function toReviewEntity(
  row: ReviewProjectionRow,
  relationships: readonly AnyRelationship[]
): ReviewEntity {
  return {
    id: graphId("review", row.id),
    type: "review",
    relationships,
    metadata: {
      businessId: graphId("business", row.businessId),
      customerId: null,
      rating: row.rating,
      // Exactly the rule `DatabaseRepository.mapReview` enforces: a verified
      // visit means the review is traceable to a booking, never a badge.
      verifiedVisit: row.bookingId !== null,
      // Signal extraction from review prose is Epic 06+; the graph carries no
      // extracted signals rather than fabricating them.
      extractedSignals: []
    },
    confidence: PROJECTION_CONFIDENCE,
    updatedAt: toIso(row.updatedAt)
  };
}

export function toCampaignEntity(
  row: CampaignProjectionRow,
  relationships: readonly AnyRelationship[]
): CampaignEntity {
  return {
    id: graphId("campaign", row.id),
    type: "campaign",
    relationships,
    metadata: {
      title: row.name,
      businessId: graphId("business", row.businessId),
      // Trigger-based campaigns have no scheduled window: they run from
      // activation until deactivation, which is what the window records.
      window: { start: toIso(row.createdAt), end: toIso(row.updatedAt) },
      discountPercent: null
    },
    confidence: PROJECTION_CONFIDENCE,
    updatedAt: toIso(row.updatedAt)
  };
}

export function toBookingEntity(
  row: BookingProjectionRow,
  serviceId: string | null,
  relationships: readonly AnyRelationship[]
): BookingEntity {
  return {
    id: graphId("booking", row.id),
    type: "booking",
    relationships,
    metadata: {
      customerId: row.customerId ? graphId("customer", row.customerId) : "",
      businessId: graphId("business", row.businessId),
      serviceId: serviceId ? graphId("service", serviceId) : null,
      // Experiences have no model; a booking is never part of one yet.
      experienceId: null,
      window: {
        start: toIso(row.startsAt),
        // A booking without an end is a point in time; the half-open window
        // degenerates to zero length rather than inventing a duration.
        end: toIso(row.endsAt ?? row.startsAt)
      },
      status: mapBookingStatus(row.status),
      partySize: null
    },
    confidence: PROJECTION_CONFIDENCE,
    updatedAt: toIso(row.updatedAt)
  };
}

/**
 * A neighborhood is the `(city, district)` pair carried by business rows, so
 * its centroid is the mean of the located businesses in it — a derived fact,
 * not a stored one, and null when no business in the area publishes coords.
 */
export function toNeighborhoodEntity(
  key: { readonly city: string; readonly district: string },
  businesses: readonly Pick<BusinessProjectionRow, "lat" | "lng">[],
  relationships: readonly AnyRelationship[],
  updatedAt: IsoDateTime
): NeighborhoodEntity {
  const points = businesses
    .map((business) => ({
      latitude: business.lat === null ? Number.NaN : Number(business.lat.toString()),
      longitude: business.lng === null ? Number.NaN : Number(business.lng.toString())
    }))
    .filter((point) => Number.isFinite(point.latitude) && Number.isFinite(point.longitude));

  const centroid =
    points.length === 0
      ? null
      : {
          latitude: points.reduce((sum, point) => sum + point.latitude, 0) / points.length,
          longitude: points.reduce((sum, point) => sum + point.longitude, 0) / points.length
        };

  return {
    id: neighborhoodGraphId(key.city, key.district),
    type: "neighborhood",
    relationships,
    metadata: { name: key.district, city: key.city, centroid },
    confidence: PROJECTION_CONFIDENCE,
    updatedAt
  };
}

// ---------------------------------------------------------------------------
// Edges
// ---------------------------------------------------------------------------

/** Business → Category, Business → Neighborhood, Business → Service. */
export function businessOutgoingEdges(row: BusinessProjectionRow): readonly AnyRelationship[] {
  const updatedAt = toIso(row.updatedAt);
  const fromId = graphId("business", row.id);

  const edges: AnyRelationship[] = [
    relationship({
      kind: "belongs_to",
      fromId,
      toId: graphId("category", row.categoryId),
      attributes: { primary: true },
      source: RELATIONAL_EDGE_SOURCE.belongs_to,
      confidence: PROJECTION_CONFIDENCE,
      updatedAt
    }),
    relationship({
      kind: "located_in",
      fromId,
      toId: neighborhoodGraphId(row.city, row.district),
      attributes: { address: row.address },
      source: RELATIONAL_EDGE_SOURCE.located_in,
      confidence: PROJECTION_CONFIDENCE,
      updatedAt
    })
  ];

  for (const pkg of row.packages ?? []) {
    // Inactive packages are not offered: projecting them would tell the
    // reasoning layer a provider can do something it has withdrawn.
    if (!pkg.isActive) continue;

    edges.push(
      relationship({
        kind: "provides",
        fromId,
        toId: graphId("service", pkg.id),
        attributes: { priceTier: mapPriceTier(row.priceTier) },
        source: RELATIONAL_EDGE_SOURCE.provides,
        confidence: PROJECTION_CONFIDENCE,
        updatedAt
      })
    );
  }

  return edges;
}

/**
 * Customer → visited → Business, aggregated from `CustomerVisit`.
 *
 * From the visit rows rather than `Customer.visitCount`: that column is a
 * denormalised tally the CRM maintains, and an edge that disagrees with the
 * visit table would be a second truth. One edge per business visited.
 */
export function visitedEdges(
  customerId: string,
  visits: readonly CustomerVisitProjectionRow[]
): readonly AnyRelationship[] {
  const byBusiness = new Map<string, { count: number; last: Date }>();

  for (const visit of visits) {
    const current = byBusiness.get(visit.businessId);
    if (current) {
      current.count += 1;
      if (visit.occurredAt > current.last) current.last = visit.occurredAt;
    } else {
      byBusiness.set(visit.businessId, { count: 1, last: visit.occurredAt });
    }
  }

  return [...byBusiness.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([businessId, aggregate]) =>
      relationship({
        kind: "visited",
        fromId: graphId("customer", customerId),
        toId: graphId("business", businessId),
        attributes: { visitCount: aggregate.count, lastVisitAt: toIso(aggregate.last) },
        source: RELATIONAL_EDGE_SOURCE.visited,
        confidence: PROJECTION_CONFIDENCE,
        updatedAt: toIso(aggregate.last)
      })
    );
}

/**
 * Customer → booked → Service, aggregated from `Booking`.
 *
 * `Booking.serviceName` is free text with no foreign key, so a booking is
 * connected to a service only when its name matches an active package of the
 * same business. Unmatched bookings produce no edge — the booking node still
 * records what was booked; the graph just does not claim to know which
 * service object it was.
 */
export function bookedEdges(
  customerId: string,
  bookings: readonly BookingProjectionRow[],
  packagesByBusiness: ReadonlyMap<string, readonly BusinessPackageRow[]>
): readonly AnyRelationship[] {
  const byService = new Map<string, { count: number; last: Date }>();

  for (const booking of bookings) {
    const serviceId = matchServiceId(booking, packagesByBusiness.get(booking.businessId) ?? []);
    if (!serviceId) continue;

    const current = byService.get(serviceId);
    if (current) {
      current.count += 1;
      if (booking.startsAt > current.last) current.last = booking.startsAt;
    } else {
      byService.set(serviceId, { count: 1, last: booking.startsAt });
    }
  }

  return [...byService.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([serviceId, aggregate]) =>
      relationship({
        kind: "booked",
        fromId: graphId("customer", customerId),
        toId: graphId("service", serviceId),
        attributes: { bookingCount: aggregate.count, lastBookedAt: toIso(aggregate.last) },
        source: RELATIONAL_EDGE_SOURCE.booked,
        confidence: PROJECTION_CONFIDENCE,
        updatedAt: toIso(aggregate.last)
      })
    );
}

/** The active package whose name matches this booking, if any. */
export function matchServiceId(
  booking: Pick<BookingProjectionRow, "serviceName">,
  packages: readonly BusinessPackageRow[]
): string | null {
  const wanted = normalizeServiceName(booking.serviceName);
  const match = packages.find((pkg) => pkg.isActive && normalizeServiceName(pkg.name) === wanted);
  return match?.id ?? null;
}

/**
 * Category → part_of → Category (its parent).
 *
 * `part_of` is a frozen Epic 03 kind and the category tree is real relational
 * data, so the taxonomy is walkable without inventing a new edge kind.
 */
export function categoryParentEdge(
  row: CategoryProjectionRow,
  updatedAt: IsoDateTime
): AnyRelationship | null {
  if (!row.parentId) return null;

  return relationship({
    kind: "part_of",
    fromId: graphId("category", row.id),
    toId: graphId("category", row.parentId),
    attributes: { role: "parent_category" },
    source: RELATIONAL_EDGE_SOURCE.belongs_to,
    confidence: PROJECTION_CONFIDENCE,
    updatedAt
  });
}

/** Review → describes → Business. */
export function describesEdge(row: ReviewProjectionRow): AnyRelationship {
  return relationship({
    kind: "describes",
    fromId: graphId("review", row.id),
    toId: graphId("business", row.businessId),
    attributes: { rating: row.rating, verifiedVisit: row.bookingId !== null },
    source: RELATIONAL_EDGE_SOURCE.describes,
    confidence: PROJECTION_CONFIDENCE,
    updatedAt: toIso(row.updatedAt)
  });
}

/** Campaign → promotes → Business. */
export function promotesEdge(row: CampaignProjectionRow): AnyRelationship {
  return relationship({
    kind: "promotes",
    fromId: graphId("campaign", row.id),
    toId: graphId("business", row.businessId),
    attributes: { channel: row.channel, active: row.isActive },
    source: RELATIONAL_EDGE_SOURCE.promotes,
    confidence: PROJECTION_CONFIDENCE,
    updatedAt: toIso(row.updatedAt)
  });
}

/**
 * The identity of the person behind a business-scoped customer row.
 *
 * `User.id` when the row is linked to an account, otherwise the phone number
 * — the only two cross-business identity signals the schema carries. Used by
 * relationship inference to notice that one person visited two providers;
 * never used to merge customer nodes, which stay business-scoped.
 */
export function customerIdentityKey(row: Pick<CustomerProjectionRow, "userId" | "phone">): string {
  return row.userId ? `user:${row.userId}` : `phone:${row.phone.replace(/\s+/g, "")}`;
}
