/**
 * Layer 3 (Knowledge Graph) — the projection repository.
 *
 * The only place in the graph that talks to Prisma. It reads Layer 1 rows and
 * hands back Layer 3 contract shapes; every mapping decision lives in the
 * pure `knowledge-graph.projection` module, so this file is queries and
 * budgets and nothing else.
 *
 * Budgets are not optional. A business with 4 000 reviews must not turn one
 * node read into a 4 000-edge answer, so every fan-in is capped by
 * `MAX_EDGES_PER_KIND` and the newest rows win. Callers that need the full
 * set query the owning module, not the graph.
 */
import { Injectable } from "@nestjs/common";
import type { EntityId, IsoDateTime } from "../core";
import type { AnyRelationship } from "../relationship-engine";
import { PrismaService } from "../../prisma.service";
import type { AnyGraphEntity } from "./knowledge-graph.entities";
import {
  graphId,
  parseGraphId,
  parseNeighborhoodGraphId,
  type ParsedGraphId
} from "./knowledge-graph.ids";
import {
  bookedEdges,
  businessOutgoingEdges,
  categoryParentEdge,
  customerIdentityKey,
  describesEdge,
  mapPriceTier,
  matchServiceId,
  normalizeServiceName,
  promotesEdge,
  toBookingEntity,
  toBusinessEntity,
  toCampaignEntity,
  toCategoryEntity,
  toCustomerEntity,
  toIso,
  toNeighborhoodEntity,
  toReviewEntity,
  toServiceEntity,
  visitedEdges,
  type BookingProjectionRow,
  type BusinessPackageRow,
  type BusinessProjectionRow,
  type CustomerProjectionRow
} from "./knowledge-graph.projection";
import {
  PROJECTION_CONFIDENCE,
  RELATIONAL_EDGE_SOURCE,
  relationship
} from "./knowledge-graph.relationships";

/** Per-kind fan-in ceiling on any single node read. */
export const MAX_EDGES_PER_KIND = 200;

/** Ceiling on the entity ids one full rebuild announces. */
export const MAX_FULL_REBUILD_ENTITIES = 1000;

/** Ceiling on rows any inference pass pulls per query. */
export const MAX_INFERENCE_ROWS = 2000;

const businessSelect = {
  id: true,
  slug: true,
  name: true,
  categoryId: true,
  city: true,
  district: true,
  address: true,
  lat: true,
  lng: true,
  phone: true,
  website: true,
  telegram: true,
  hoursJson: true,
  priceTier: true,
  verificationStatus: true,
  updatedAt: true
} as const;

const packageSelect = {
  id: true,
  businessId: true,
  name: true,
  description: true,
  price: true,
  currency: true,
  isActive: true,
  updatedAt: true
} as const;

const reviewSelect = {
  id: true,
  businessId: true,
  userId: true,
  rating: true,
  bookingId: true,
  updatedAt: true
} as const;

const campaignSelect = {
  id: true,
  businessId: true,
  name: true,
  channel: true,
  isActive: true,
  createdAt: true,
  updatedAt: true
} as const;

const customerSelect = {
  id: true,
  businessId: true,
  name: true,
  phone: true,
  userId: true,
  firstSeenAt: true,
  updatedAt: true
} as const;

const bookingSelect = {
  id: true,
  businessId: true,
  customerId: true,
  serviceName: true,
  startsAt: true,
  endsAt: true,
  status: true,
  updatedAt: true
} as const;

@Injectable()
export class GraphProjectionRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Resolves one graph id to its node, or null when nothing backs it.
   *
   * Contract-only node kinds (experience, workspace, story, location,
   * organization, event, relationship) resolve to null by design: no model
   * backs them, and returning a fabricated shell would be worse than an
   * honest miss.
   */
  async entity(id: EntityId): Promise<AnyGraphEntity | null> {
    const parsed = parseGraphId(id);
    if (!parsed) return null;

    switch (parsed.type) {
      case "business":
        return this.businessNode(parsed.sourceId);
      case "category":
        return this.categoryNode(parsed.sourceId);
      case "service":
        return this.serviceNode(parsed.sourceId);
      case "customer":
        return this.customerNode(parsed.sourceId);
      case "review":
        return this.reviewNode(parsed.sourceId);
      case "campaign":
        return this.campaignNode(parsed.sourceId);
      case "booking":
        return this.bookingNode(parsed.sourceId);
      case "neighborhood":
        return this.neighborhoodNode(id);
      default:
        return null;
    }
  }

  /** Every edge incident to a node, in one call (both directions). */
  async edgesOf(id: EntityId): Promise<readonly AnyRelationship[]> {
    const node = await this.entity(id);
    return node?.relationships ?? [];
  }

  // -------------------------------------------------------------------------
  // Nodes
  // -------------------------------------------------------------------------

  async businessNode(businessId: string): Promise<AnyGraphEntity | null> {
    const row = await this.prisma.business.findUnique({
      where: { id: businessId },
      select: businessSelect
    });

    if (!row) return null;

    const [packages, reviews, campaigns, visits] = await Promise.all([
      this.prisma.businessPackage.findMany({
        where: { businessId, isActive: true },
        select: packageSelect,
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
        take: MAX_EDGES_PER_KIND
      }),
      this.prisma.review.findMany({
        where: { businessId, moderationStatus: "approved" },
        select: reviewSelect,
        orderBy: { createdAt: "desc" },
        take: MAX_EDGES_PER_KIND
      }),
      this.prisma.campaign.findMany({
        where: { businessId },
        select: campaignSelect,
        orderBy: { createdAt: "desc" },
        take: MAX_EDGES_PER_KIND
      }),
      this.prisma.customerVisit.findMany({
        where: { businessId },
        select: { customerId: true, businessId: true, occurredAt: true },
        orderBy: { occurredAt: "desc" },
        take: MAX_EDGES_PER_KIND
      })
    ]);

    const withPackages: BusinessProjectionRow = { ...row, packages };

    const incomingVisits = groupBy(visits, (visit) => visit.customerId).flatMap(
      ([customerId, customerVisits]) => visitedEdges(customerId, customerVisits)
    );

    return toBusinessEntity(withPackages, [
      ...businessOutgoingEdges(withPackages),
      ...reviews.map((review) => describesEdge(review)),
      ...campaigns.map((campaign) => promotesEdge(campaign)),
      ...incomingVisits
    ]);
  }

  async categoryNode(categoryId: string): Promise<AnyGraphEntity | null> {
    const row = await this.prisma.category.findUnique({
      where: { id: categoryId },
      select: { id: true, slug: true, nameUz: true, parentId: true }
    });

    if (!row) return null;

    const businesses = await this.prisma.business.findMany({
      where: { categoryId },
      select: businessSelect,
      orderBy: { name: "asc" },
      take: MAX_EDGES_PER_KIND
    });

    // A category row has no updatedAt column; the newest member business is
    // the freshest thing the platform knows about this node.
    const updatedAt = newestIso(businesses.map((business) => business.updatedAt));
    const parentEdge = categoryParentEdge(row, updatedAt);

    const incoming = businesses.flatMap((business) =>
      businessOutgoingEdges(business).filter((edge) => edge.kind === "belongs_to")
    );

    return toCategoryEntity(row, parentEdge ? [parentEdge, ...incoming] : incoming, updatedAt);
  }

  async serviceNode(packageId: string): Promise<AnyGraphEntity | null> {
    const row = await this.prisma.businessPackage.findUnique({
      where: { id: packageId },
      select: { ...packageSelect, business: { select: { categoryId: true, priceTier: true } } }
    });

    if (!row) return null;

    const { business, ...packageRow } = row;

    const bookings = await this.prisma.booking.findMany({
      where: {
        businessId: packageRow.businessId,
        customerId: { not: null },
        serviceName: { equals: packageRow.name, mode: "insensitive" }
      },
      select: bookingSelect,
      orderBy: { startsAt: "desc" },
      take: MAX_EDGES_PER_KIND
    });

    const packagesByBusiness = new Map<string, readonly BusinessPackageRow[]>([
      [packageRow.businessId, [packageRow]]
    ]);

    const incomingBooked = groupBy(
      bookings.filter((booking): booking is typeof booking & { customerId: string } =>
        booking.customerId !== null
      ),
      (booking) => booking.customerId
    ).flatMap(([customerId, customerBookings]) =>
      bookedEdges(customerId, customerBookings, packagesByBusiness)
    );

    const providedBy = businessProvidesEdge(packageRow, business.priceTier);

    return toServiceEntity(packageRow, business.categoryId, [providedBy, ...incomingBooked]);
  }

  async customerNode(customerId: string): Promise<AnyGraphEntity | null> {
    const row = await this.prisma.customer.findUnique({
      where: { id: customerId },
      select: customerSelect
    });

    if (!row) return null;

    const [visits, bookings] = await Promise.all([
      this.prisma.customerVisit.findMany({
        where: { customerId },
        select: { customerId: true, businessId: true, occurredAt: true },
        orderBy: { occurredAt: "desc" },
        take: MAX_EDGES_PER_KIND
      }),
      this.prisma.booking.findMany({
        where: { customerId },
        select: bookingSelect,
        orderBy: { startsAt: "desc" },
        take: MAX_EDGES_PER_KIND
      })
    ]);

    const packagesByBusiness = await this.packagesByBusiness(
      unique(bookings.map((booking) => booking.businessId))
    );

    return toCustomerEntity(row, [
      ...visitedEdges(customerId, visits),
      ...bookedEdges(customerId, bookings, packagesByBusiness)
    ]);
  }

  async reviewNode(reviewId: string): Promise<AnyGraphEntity | null> {
    const row = await this.prisma.review.findUnique({
      where: { id: reviewId },
      select: reviewSelect
    });

    return row ? toReviewEntity(row, [describesEdge(row)]) : null;
  }

  async campaignNode(campaignId: string): Promise<AnyGraphEntity | null> {
    const row = await this.prisma.campaign.findUnique({
      where: { id: campaignId },
      select: campaignSelect
    });

    return row ? toCampaignEntity(row, [promotesEdge(row)]) : null;
  }

  /**
   * A booking node carries its participants in metadata rather than as edges:
   * the customer→service edge the booking justifies already hangs off the
   * customer node, and duplicating it here would make one fact appear twice
   * in a traversal.
   */
  async bookingNode(bookingId: string): Promise<AnyGraphEntity | null> {
    const row = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      select: bookingSelect
    });

    if (!row) return null;

    const packages = await this.prisma.businessPackage.findMany({
      where: { businessId: row.businessId, isActive: true },
      select: packageSelect,
      take: MAX_EDGES_PER_KIND
    });

    return toBookingEntity(row, matchServiceId(row, packages), []);
  }

  async neighborhoodNode(id: EntityId): Promise<AnyGraphEntity | null> {
    const key = parseNeighborhoodGraphId(id);
    if (!key) return null;

    const businesses = await this.prisma.business.findMany({
      where: { city: key.city, district: key.district },
      select: businessSelect,
      orderBy: { name: "asc" },
      take: MAX_EDGES_PER_KIND
    });

    // A neighborhood with no businesses is not a place the platform knows.
    if (businesses.length === 0) return null;

    const incoming = businesses.flatMap((business) =>
      businessOutgoingEdges(business).filter((edge) => edge.kind === "located_in")
    );

    return toNeighborhoodEntity(
      key,
      businesses,
      incoming,
      newestIso(businesses.map((business) => business.updatedAt))
    );
  }

  // -------------------------------------------------------------------------
  // Queries the graph exposes beyond node reads
  // -------------------------------------------------------------------------

  /**
   * Every business offering the same service, by normalized name.
   *
   * "Haircut → provided by 120 businesses" (doc 21) is the substitution
   * question. Packages are per business, so the cross-business identity of a
   * service is its name — compared case-insensitively in SQL, then
   * whitespace-normalized in memory, because Postgres cannot collapse inner
   * spaces without a functional index the schema does not have.
   */
  async providersOfService(serviceId: EntityId): Promise<readonly EntityId[]> {
    const parsed = parseGraphId(serviceId);
    if (!parsed || parsed.type !== "service") return [];

    const service = await this.prisma.businessPackage.findUnique({
      where: { id: parsed.sourceId },
      select: { name: true }
    });

    if (!service) return [];

    const wanted = normalizeServiceName(service.name);

    const matches = await this.prisma.businessPackage.findMany({
      where: { isActive: true, name: { equals: service.name, mode: "insensitive" } },
      select: { name: true, businessId: true },
      take: MAX_EDGES_PER_KIND
    });

    return unique(
      matches
        .filter((match) => normalizeServiceName(match.name) === wanted)
        .map((match) => graphId("business", match.businessId))
    ).sort();
  }

  /** Business ids a full rebuild announces, newest first. */
  async businessGraphIds(limit = MAX_FULL_REBUILD_ENTITIES): Promise<readonly EntityId[]> {
    const rows = await this.prisma.business.findMany({
      select: { id: true },
      orderBy: { updatedAt: "desc" },
      take: Math.min(limit, MAX_FULL_REBUILD_ENTITIES)
    });

    return rows.map((row) => graphId("business", row.id));
  }

  /** Active packages of each business, keyed by business id. */
  async packagesByBusiness(
    businessIds: readonly string[]
  ): Promise<ReadonlyMap<string, readonly BusinessPackageRow[]>> {
    if (businessIds.length === 0) return new Map();

    const rows = await this.prisma.businessPackage.findMany({
      where: { businessId: { in: [...businessIds] }, isActive: true },
      select: packageSelect,
      take: MAX_INFERENCE_ROWS
    });

    return new Map(groupBy(rows, (row) => row.businessId));
  }

  /** Customer rows of the given businesses (inference input). */
  async customersOfBusinesses(businessIds: readonly string[]): Promise<readonly CustomerProjectionRow[]> {
    if (businessIds.length === 0) return [];

    return this.prisma.customer.findMany({
      where: { businessId: { in: [...businessIds] } },
      select: customerSelect,
      orderBy: { updatedAt: "desc" },
      take: MAX_INFERENCE_ROWS
    });
  }

  /**
   * Customer rows anywhere on the platform belonging to the same people.
   *
   * The join is `userId` when the row is linked to an account and phone
   * otherwise — the only cross-business identity the schema carries (see
   * `customerIdentityKey`). This is what lets inference notice that one
   * person visits two providers without ever merging their customer nodes.
   */
  async customersByIdentity(
    keys: readonly string[]
  ): Promise<readonly CustomerProjectionRow[]> {
    const userIds = keys.filter((key) => key.startsWith("user:")).map((key) => key.slice(5));
    const phones = keys.filter((key) => key.startsWith("phone:")).map((key) => key.slice(6));

    if (userIds.length === 0 && phones.length === 0) return [];

    return this.prisma.customer.findMany({
      where: {
        OR: [
          ...(userIds.length > 0 ? [{ userId: { in: userIds } }] : []),
          ...(phones.length > 0 ? [{ phone: { in: phones } }] : [])
        ]
      },
      select: customerSelect,
      take: MAX_INFERENCE_ROWS
    });
  }

  /** Bookings of the given customers (inference input). */
  async bookingsOfCustomers(customerIds: readonly string[]): Promise<readonly BookingProjectionRow[]> {
    if (customerIds.length === 0) return [];

    return this.prisma.booking.findMany({
      where: { customerId: { in: [...customerIds] } },
      select: bookingSelect,
      orderBy: { startsAt: "desc" },
      take: MAX_INFERENCE_ROWS
    });
  }

  /** Visits of the given customers (inference input). */
  async visitsOfCustomers(customerIds: readonly string[]) {
    if (customerIds.length === 0) return [];

    return this.prisma.customerVisit.findMany({
      where: { customerId: { in: [...customerIds] } },
      select: { customerId: true, businessId: true, occurredAt: true },
      orderBy: { occurredAt: "desc" },
      take: MAX_INFERENCE_ROWS
    });
  }

  /** Identity keys of the customers of the given businesses. */
  async identityKeysOfBusinesses(businessIds: readonly string[]): Promise<readonly string[]> {
    const customers = await this.customersOfBusinesses(businessIds);
    return unique(customers.map((customer) => customerIdentityKey(customer)));
  }
}

/**
 * Business → provides → Service, seen from the service side of the join.
 *
 * Identical in shape to the edge `businessOutgoingEdges` emits from the
 * business side — same kind, endpoints, source and confidence — so the two
 * reads agree about one fact and deduplication in the relationship service
 * has nothing to reconcile.
 */
function businessProvidesEdge(
  packageRow: BusinessPackageRow,
  priceTier: string | null
): AnyRelationship {
  return relationship({
    kind: "provides",
    fromId: graphId("business", packageRow.businessId),
    toId: graphId("service", packageRow.id),
    attributes: { priceTier: mapPriceTier(priceTier) },
    source: RELATIONAL_EDGE_SOURCE.provides,
    confidence: PROJECTION_CONFIDENCE,
    updatedAt: toIso(packageRow.updatedAt)
  });
}

function groupBy<TRow, TKey extends string>(
  rows: readonly TRow[],
  key: (row: TRow) => TKey
): [TKey, TRow[]][] {
  const grouped = new Map<TKey, TRow[]>();

  for (const row of rows) {
    const bucket = grouped.get(key(row));
    if (bucket) {
      bucket.push(row);
    } else {
      grouped.set(key(row), [row]);
    }
  }

  return [...grouped.entries()];
}

function unique<T>(values: readonly T[]): T[] {
  return [...new Set(values)];
}

function newestIso(dates: readonly Date[]): IsoDateTime {
  const newest = dates.reduce<Date | null>(
    (latest, date) => (latest === null || date > latest ? date : latest),
    null
  );

  // No member rows at all: the node is as old as the epoch rather than
  // pretending to have been observed now, which would defeat freshness
  // metrics (doc 23 §8).
  return toIso(newest ?? new Date(0));
}

export type { ParsedGraphId };
