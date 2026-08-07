/**
 * Layer 2 (Marketplace Intelligence) — the projection repository.
 *
 * The only place in this module that talks to Prisma. It reads Layer 1 rows
 * and hands back the observation shapes the pure models consume; every mapping
 * decision lives in `marketplace-intelligence.projection.ts` and the models
 * themselves, so summarizer correctness is testable without a database.
 *
 * Budgets are not optional. A business with four thousand reviews must not
 * turn one summarization into a four-thousand-row read, and a nightly pass
 * over the marketplace must not degenerate into a full scan per subject. Every
 * fan-in below is capped and the newest rows win.
 */
import { Injectable } from "@nestjs/common";
import type { EntityId } from "../core";
import { PrismaService } from "../../prisma.service";
import { IntelligenceCacheService, MARKETPLACE_CACHE_TTL } from "./intelligence-cache.service";
import type {
  BusinessObservations,
  PeerContext,
  PeerObservation
} from "./business.model";
import { engagementScore } from "./business.model";
import type { CustomerObservations } from "./customer.model";
import type {
  DemandObservations,
  NeighborhoodObservations,
  ServiceObservations,
  TrendObservations
} from "./marketplace.model";
import type { CampaignObservations } from "./campaign.model";
import { OBSERVATION_WINDOW_DAYS } from "./marketplace-intelligence.freshness";
import {
  customerIdentity,
  normalizeServiceName,
  type BookingIntelligenceRow,
  type BusinessEventRow,
  type BusinessIntelligenceRow,
  type CustomerIntelligenceRow,
  type PackageIntelligenceRow,
  type ReviewIntelligenceRow,
  type SearchLogRow,
  type VisitIntelligenceRow
} from "./marketplace-intelligence.projection";
import {
  neighborhoodId,
  parseNeighborhoodId,
  parseServiceKeyId,
  serviceKeyId
} from "./marketplace-intelligence.slots";
import type { TrendSummary } from "./marketplace-intelligence.types";
import { behaviourWindow } from "./business.model";

/** Ceiling on rows of any one kind read for a single subject. */
export const MAX_SUBJECT_ROWS = 500;

/** Ceiling on comparable providers loaded into one peer context. */
export const MAX_PEERS = 25;

/** Ceiling on rows read across a whole peer set. */
export const MAX_PEER_ROWS = 2000;

/** Ceiling on subjects one discovery query announces. */
export const MAX_DISCOVERED_SUBJECTS = 500;

const businessSelect = {
  id: true,
  categoryId: true,
  city: true,
  district: true,
  priceTier: true,
  status: true,
  verificationStatus: true,
  avgRating: true,
  reviewCount: true,
  lat: true,
  lng: true,
  createdAt: true,
  updatedAt: true,
  category: { select: { slug: true } }
} as const;

const packageSelect = {
  id: true,
  businessId: true,
  name: true,
  price: true,
  currency: true,
  isActive: true,
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
  createdAt: true
} as const;

const visitSelect = { businessId: true, customerId: true, occurredAt: true } as const;

const customerSelect = {
  id: true,
  businessId: true,
  userId: true,
  tags: true,
  visitCount: true,
  totalSpend: true,
  lastVisitAt: true,
  firstSeenAt: true,
  birthday: true,
  updatedAt: true
} as const;

const searchSelect = {
  query: true,
  district: true,
  categorySlug: true,
  resultCount: true,
  clickedBusinessId: true,
  createdAt: true
} as const;

type BusinessQueryRow = {
  readonly category: { readonly slug: string } | null;
} & Omit<BusinessIntelligenceRow, "categorySlug">;

function toBusinessRow(row: BusinessQueryRow): BusinessIntelligenceRow {
  const { category, ...rest } = row;
  return { ...rest, categorySlug: category?.slug ?? null };
}

@Injectable()
export class MarketplaceProjectionRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: IntelligenceCacheService
  ) {}

  // -------------------------------------------------------------------------
  // Business
  // -------------------------------------------------------------------------

  /** One business row, or null when nothing backs the id. */
  async business(businessId: EntityId): Promise<BusinessIntelligenceRow | null> {
    const row = await this.prisma.business.findUnique({
      where: { id: businessId },
      select: businessSelect
    });

    return row ? toBusinessRow(row) : null;
  }

  /** Everything one business summarization reads, or null when it does not exist. */
  async businessObservations(businessId: EntityId): Promise<BusinessObservations | null> {
    const business = await this.business(businessId);
    if (!business) return null;

    const [reviews, bookings, visits, events, pageViews, packages, customers] = await Promise.all([
      this.prisma.review.findMany({
        where: { businessId },
        select: {
          id: true,
          businessId: true,
          userId: true,
          rating: true,
          text: true,
          moderationStatus: true,
          bookingId: true,
          createdAt: true,
          reply: { select: { id: true } }
        },
        orderBy: { createdAt: "desc" },
        take: MAX_SUBJECT_ROWS
      }),
      this.prisma.booking.findMany({
        where: { businessId },
        select: bookingSelect,
        orderBy: { startsAt: "desc" },
        take: MAX_SUBJECT_ROWS
      }),
      this.prisma.customerVisit.findMany({
        where: { businessId },
        select: visitSelect,
        orderBy: { occurredAt: "desc" },
        take: MAX_SUBJECT_ROWS
      }),
      this.prisma.businessEvent.findMany({
        where: { businessId },
        select: { businessId: true, type: true, visitorKey: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        take: MAX_SUBJECT_ROWS
      }),
      this.prisma.businessVisit.findMany({
        where: { businessId },
        select: { businessId: true, visitorKey: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        take: MAX_SUBJECT_ROWS
      }),
      this.prisma.businessPackage.findMany({
        where: { businessId },
        select: packageSelect,
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
        take: MAX_SUBJECT_ROWS
      }),
      this.prisma.customer.findMany({
        where: { businessId },
        select: customerSelect,
        orderBy: { updatedAt: "desc" },
        take: MAX_SUBJECT_ROWS
      })
    ]);

    return {
      business,
      reviews: reviews.map(
        (row): ReviewIntelligenceRow => ({
          id: row.id,
          businessId: row.businessId,
          userId: row.userId,
          rating: row.rating,
          text: row.text,
          moderationStatus: row.moderationStatus,
          bookingId: row.bookingId,
          createdAt: row.createdAt,
          hasReply: row.reply !== null
        })
      ),
      bookings,
      visits,
      // A `BusinessVisit` row IS a page view — the anonymous, visitor-keyed
      // kind — so it is projected as one rather than given a parallel field
      // that every consumer would have to remember to read.
      events: [
        ...events,
        ...pageViews.map(
          (row): BusinessEventRow => ({
            businessId: row.businessId,
            type: "view",
            visitorKey: row.visitorKey,
            createdAt: row.createdAt
          })
        )
      ],
      packages,
      customers
    };
  }

  /**
   * The comparison set for one business: other providers in the same category.
   *
   * Category rather than category-and-district, deliberately. A percentile
   * needs a field, and Manzil does not yet have enough providers to fill a
   * per-district one — narrowing further would make popularity refuse for
   * structural reasons rather than evidential ones, which is the wrong reason
   * to refuse.
   */
  async peerContext(business: BusinessIntelligenceRow): Promise<PeerContext> {
    const ids = await this.cache.readIds(
      `peers:${business.categoryId}`,
      MARKETPLACE_CACHE_TTL.peers,
      async () => {
        const rows = await this.prisma.business.findMany({
          where: { categoryId: business.categoryId, status: { not: "suspended" } },
          select: { id: true },
          orderBy: { updatedAt: "desc" },
          take: MAX_PEERS
        });

        return rows.map((row) => row.id);
      }
    );

    const peerIds = ids.filter((id) => id !== business.id);
    if (peerIds.length === 0) return { peers: [] };

    const window = behaviourWindow(new Date().toISOString());
    const since = new Date(window.start);

    const [businesses, packages, bookings, visits, reviews, events] = await Promise.all([
      this.prisma.business.findMany({
        where: { id: { in: [...peerIds] } },
        select: businessSelect,
        take: MAX_PEERS
      }),
      this.prisma.businessPackage.findMany({
        where: { businessId: { in: [...peerIds] }, isActive: true },
        select: packageSelect,
        take: MAX_PEER_ROWS
      }),
      this.prisma.booking.findMany({
        where: { businessId: { in: [...peerIds] }, startsAt: { gte: since } },
        select: bookingSelect,
        take: MAX_PEER_ROWS
      }),
      this.prisma.customerVisit.findMany({
        where: { businessId: { in: [...peerIds] }, occurredAt: { gte: since } },
        select: visitSelect,
        take: MAX_PEER_ROWS
      }),
      this.prisma.review.findMany({
        where: { businessId: { in: [...peerIds] }, createdAt: { gte: since } },
        select: {
          id: true,
          businessId: true,
          userId: true,
          rating: true,
          text: true,
          moderationStatus: true,
          bookingId: true,
          createdAt: true
        },
        take: MAX_PEER_ROWS
      }),
      this.prisma.businessEvent.findMany({
        where: { businessId: { in: [...peerIds] }, createdAt: { gte: since } },
        select: { businessId: true, type: true, visitorKey: true, createdAt: true },
        take: MAX_PEER_ROWS
      })
    ]);

    const byBusiness = <TRow extends { businessId: string }>(rows: readonly TRow[]) =>
      groupBy(rows, (row) => row.businessId);

    const packagesOf = byBusiness(packages);
    const bookingsOf = byBusiness(bookings);
    const visitsOf = byBusiness(visits);
    const reviewsOf = byBusiness(reviews);
    const eventsOf = byBusiness(events);

    const peers: PeerObservation[] = businesses.map((row) => {
      const peer = toBusinessRow(row);
      const peerBookings = bookingsOf.get(peer.id) ?? [];

      const serviceDemand = new Map<string, number>();
      for (const booking of peerBookings) {
        const key = normalizeServiceName(booking.serviceName);
        serviceDemand.set(key, (serviceDemand.get(key) ?? 0) + 1);
      }

      return {
        business: peer,
        packages: packagesOf.get(peer.id) ?? [],
        engagement: engagementScore(
          {
            bookings: peerBookings,
            visits: visitsOf.get(peer.id) ?? [],
            reviews: (reviewsOf.get(peer.id) ?? []).map((review) => ({
              ...review,
              hasReply: false
            })),
            events: eventsOf.get(peer.id) ?? []
          },
          window
        ),
        serviceDemand
      };
    });

    return { peers };
  }

  // -------------------------------------------------------------------------
  // Customer
  // -------------------------------------------------------------------------

  /**
   * Everything one customer summarization reads.
   *
   * **Identity.** `customerId` is the *person* — a platform account
   * (`User.id`). `Customer` is business-scoped and unique on
   * `(businessId, phone)`, so one person known to three providers is three
   * rows; Epic 04 settled this and did not merge them, and Epic 05 resolves
   * account-first-then-single-row. This module does the same, or the same
   * person would be one customer here and three there.
   */
  async customerObservations(customerId: EntityId): Promise<CustomerObservations> {
    const byAccount = await this.prisma.customer.findMany({
      where: { userId: customerId },
      select: customerSelect,
      orderBy: { updatedAt: "desc" },
      take: MAX_SUBJECT_ROWS
    });

    const customers: CustomerIntelligenceRow[] =
      byAccount.length > 0
        ? byAccount
        : await this.prisma.customer
            .findUnique({ where: { id: customerId }, select: customerSelect })
            .then((row) => (row ? [row] : []));

    const rowIds = customers.map((row) => row.id);

    if (rowIds.length === 0) {
      return { customerId, customers: [], visits: [], bookings: [], businesses: [] };
    }

    const [visits, bookings] = await Promise.all([
      this.prisma.customerVisit.findMany({
        where: { customerId: { in: rowIds } },
        select: visitSelect,
        orderBy: { occurredAt: "desc" },
        take: MAX_SUBJECT_ROWS
      }),
      this.prisma.booking.findMany({
        where: { customerId: { in: rowIds } },
        select: bookingSelect,
        orderBy: { startsAt: "desc" },
        take: MAX_SUBJECT_ROWS
      })
    ]);

    const businessIds = [
      ...new Set([
        ...visits.map((visit) => visit.businessId),
        ...bookings.map((booking) => booking.businessId)
      ])
    ];

    const businesses = await this.businessesByIds(businessIds);

    return { customerId, customers, visits, bookings, businesses };
  }

  /** Business rows by id, capped. */
  async businessesByIds(ids: readonly string[]): Promise<readonly BusinessIntelligenceRow[]> {
    if (ids.length === 0) return [];

    const rows = await this.prisma.business.findMany({
      where: { id: { in: [...ids] } },
      select: businessSelect,
      take: MAX_SUBJECT_ROWS
    });

    return rows.map((row) => toBusinessRow(row));
  }

  // -------------------------------------------------------------------------
  // Neighborhood
  // -------------------------------------------------------------------------

  /** Everything one neighborhood summarization reads, or null for a non-id. */
  async neighborhoodObservations(id: EntityId): Promise<NeighborhoodObservations | null> {
    const key = parseNeighborhoodId(id);
    if (!key) return null;

    const rows = await this.prisma.business.findMany({
      where: { city: key.city, district: key.district },
      select: businessSelect,
      orderBy: { name: "asc" },
      take: MAX_SUBJECT_ROWS
    });

    const businesses = rows.map((row) => toBusinessRow(row));
    const businessIds = businesses.map((business) => business.id);
    const since = new Date(
      Date.now() - OBSERVATION_WINDOW_DAYS.behaviour * 86_400_000
    );

    const [bookings, visits, searches] = await Promise.all([
      businessIds.length === 0
        ? Promise.resolve<BookingIntelligenceRow[]>([])
        : this.prisma.booking.findMany({
            where: { businessId: { in: businessIds }, startsAt: { gte: since } },
            select: bookingSelect,
            take: MAX_PEER_ROWS
          }),
      businessIds.length === 0
        ? Promise.resolve<VisitIntelligenceRow[]>([])
        : this.prisma.customerVisit.findMany({
            where: { businessId: { in: businessIds }, occurredAt: { gte: since } },
            select: visitSelect,
            take: MAX_PEER_ROWS
          }),
      this.prisma.searchQueryLog.findMany({
        where: { district: key.district, createdAt: { gte: since } },
        select: searchSelect,
        take: MAX_PEER_ROWS
      })
    ]);

    return { neighborhoodId: id, key, businesses, bookings, visits, searches };
  }

  // -------------------------------------------------------------------------
  // Service
  // -------------------------------------------------------------------------

  /**
   * Everything one marketplace-level service summarization reads.
   *
   * The cross-business identity of a service is its normalized name (Epic 04
   * reached the same conclusion from the graph side). Postgres can compare
   * case-insensitively but cannot collapse inner whitespace without a
   * functional index the schema does not have, so the SQL filter is
   * case-insensitive equality and the exact match is re-checked in memory.
   */
  async serviceObservations(id: EntityId): Promise<ServiceObservations | null> {
    const key = parseServiceKeyId(id);
    if (!key) return null;

    const [packages, bookings] = await Promise.all([
      this.prisma.businessPackage.findMany({
        where: { isActive: true, name: { equals: key, mode: "insensitive" } },
        select: packageSelect,
        take: MAX_PEER_ROWS
      }),
      this.prisma.booking.findMany({
        where: { serviceName: { equals: key, mode: "insensitive" } },
        select: bookingSelect,
        orderBy: { startsAt: "desc" },
        take: MAX_PEER_ROWS
      })
    ]);

    const matchingPackages = packages.filter((row) => normalizeServiceName(row.name) === key);
    const matchingBookings = bookings.filter(
      (row) => normalizeServiceName(row.serviceName) === key
    );

    return {
      serviceId: id,
      serviceKey: key,
      packages: matchingPackages,
      bookings: matchingBookings,
      serviceNamesByIdentity: await this.serviceNamesByIdentity(
        matchingBookings
          .map((booking) => booking.customerId)
          .filter((customerId): customerId is string => customerId !== null)
      )
    };
  }

  /** Which services each customer identity has booked — the co-booking input. */
  async serviceNamesByIdentity(
    customerRowIds: readonly string[]
  ): Promise<ReadonlyMap<string, readonly string[]>> {
    if (customerRowIds.length === 0) return new Map();

    const customers = await this.prisma.customer.findMany({
      where: { id: { in: [...customerRowIds] } },
      select: customerSelect,
      take: MAX_PEER_ROWS
    });

    const identityByRow = new Map(customers.map((row) => [row.id, customerIdentity(row)]));

    const bookings = await this.prisma.booking.findMany({
      where: { customerId: { in: [...customerRowIds] } },
      select: { customerId: true, serviceName: true },
      take: MAX_PEER_ROWS
    });

    const byIdentity = new Map<string, string[]>();

    for (const booking of bookings) {
      if (!booking.customerId) continue;

      const identity = identityByRow.get(booking.customerId);
      if (!identity) continue;

      const names = byIdentity.get(identity);
      if (names) names.push(booking.serviceName);
      else byIdentity.set(identity, [booking.serviceName]);
    }

    return byIdentity;
  }

  // -------------------------------------------------------------------------
  // Trend and demand
  // -------------------------------------------------------------------------

  /**
   * The instants of one measured metric for one subject.
   *
   * `story_mentions` returns no instants because no Story model exists; the
   * trend model turns that into `knowledge_missing` rather than into a zero.
   */
  async trendObservations(
    subjectEntityId: EntityId,
    metric: TrendSummary["metric"]
  ): Promise<TrendObservations> {
    const since = new Date(Date.now() - OBSERVATION_WINDOW_DAYS.trendHalf * 2 * 86_400_000);
    const businessId = subjectEntityId;

    switch (metric) {
      case "bookings": {
        const rows = await this.prisma.booking.findMany({
          where: { businessId, startsAt: { gte: since } },
          select: { startsAt: true },
          take: MAX_PEER_ROWS
        });
        return { subjectEntityId, metric, instants: rows.map((row) => row.startsAt) };
      }
      case "views": {
        const rows = await this.prisma.businessEvent.findMany({
          where: { businessId, type: "view", createdAt: { gte: since } },
          select: { createdAt: true },
          take: MAX_PEER_ROWS
        });
        return { subjectEntityId, metric, instants: rows.map((row) => row.createdAt) };
      }
      case "reviews": {
        const rows = await this.prisma.review.findMany({
          where: { businessId, moderationStatus: "approved", createdAt: { gte: since } },
          select: { createdAt: true },
          take: MAX_PEER_ROWS
        });
        return { subjectEntityId, metric, instants: rows.map((row) => row.createdAt) };
      }
      case "searches": {
        const rows = await this.prisma.searchQueryLog.findMany({
          where: { clickedBusinessId: businessId, createdAt: { gte: since } },
          select: { createdAt: true },
          take: MAX_PEER_ROWS
        });
        return { subjectEntityId, metric, instants: rows.map((row) => row.createdAt) };
      }
      default:
        // story_mentions — nothing records it.
        return { subjectEntityId, metric, instants: [] };
    }
  }

  /**
   * Demand and supply for a category in an area.
   *
   * Demand is logged searches: the platform's only first-party record of what
   * somebody wanted before they found it. Supply is the count of providers who
   * could serve it. Both are counts of rows that exist.
   */
  async demandObservations(
    categorySlug: string,
    district: string | null
  ): Promise<DemandObservations> {
    const since = new Date(
      Date.now() - Math.max(OBSERVATION_WINDOW_DAYS.demand, 56) * 86_400_000
    );

    const [searches, supplyCount] = await Promise.all([
      this.prisma.searchQueryLog.findMany({
        where: {
          categorySlug,
          ...(district ? { district } : {}),
          createdAt: { gte: since }
        },
        select: searchSelect,
        take: MAX_PEER_ROWS
      }),
      this.prisma.business.count({
        where: {
          category: { slug: categorySlug },
          ...(district ? { district } : {}),
          status: { not: "suspended" }
        }
      })
    ]);

    return {
      serviceOrCategoryId: `category:${categorySlug}`,
      neighborhoodId: district ? neighborhoodId("Tashkent", district) : null,
      demandInstants: searches.map((row) => row.createdAt),
      supplyCount
    };
  }

  // -------------------------------------------------------------------------
  // Campaign
  // -------------------------------------------------------------------------

  /** Everything one campaign summarization reads. */
  async campaignObservations(businessId: EntityId): Promise<CampaignObservations> {
    const campaigns = await this.prisma.campaign.findMany({
      where: { businessId },
      select: { id: true, businessId: true, trigger: true, channel: true, isActive: true },
      take: MAX_SUBJECT_ROWS
    });

    if (campaigns.length === 0) {
      return { businessId, campaigns: [], sends: [] };
    }

    const sends = await this.prisma.campaignSend.findMany({
      where: { campaignId: { in: campaigns.map((campaign) => campaign.id) } },
      select: {
        campaignId: true,
        customerId: true,
        status: true,
        channel: true,
        consentAtSend: true,
        createdAt: true,
        sentAt: true
      },
      orderBy: { createdAt: "desc" },
      take: MAX_PEER_ROWS
    });

    return { businessId, campaigns, sends };
  }

  // -------------------------------------------------------------------------
  // Discovery — which subjects exist to be summarized
  // -------------------------------------------------------------------------

  /** Business ids a full pass would cover, most recently touched first. */
  async businessIds(limit = MAX_DISCOVERED_SUBJECTS): Promise<readonly EntityId[]> {
    const rows = await this.prisma.business.findMany({
      select: { id: true },
      orderBy: { updatedAt: "desc" },
      take: Math.min(limit, MAX_DISCOVERED_SUBJECTS)
    });

    return rows.map((row) => row.id);
  }

  /** Neighborhood ids the marketplace actually occupies. */
  async neighborhoodIds(limit = MAX_DISCOVERED_SUBJECTS): Promise<readonly EntityId[]> {
    const rows = await this.prisma.business.findMany({
      select: { city: true, district: true },
      distinct: ["city", "district"],
      take: Math.min(limit, MAX_DISCOVERED_SUBJECTS)
    });

    return rows.map((row) => neighborhoodId(row.city, row.district)).sort();
  }

  /** Marketplace-level service ids, from the active package catalog. */
  async serviceIds(limit = MAX_DISCOVERED_SUBJECTS): Promise<readonly EntityId[]> {
    const rows = await this.prisma.businessPackage.findMany({
      where: { isActive: true },
      select: { name: true },
      take: Math.min(limit, MAX_DISCOVERED_SUBJECTS)
    });

    return [...new Set(rows.map((row) => serviceKeyId(normalizeServiceName(row.name))))].sort();
  }

  /** Account ids of the people the CRM knows, for customer summarization. */
  async customerSubjectIds(limit = MAX_DISCOVERED_SUBJECTS): Promise<readonly EntityId[]> {
    const rows = await this.prisma.customer.findMany({
      select: { id: true, userId: true },
      orderBy: { updatedAt: "desc" },
      take: Math.min(limit, MAX_DISCOVERED_SUBJECTS)
    });

    // The account id when there is one, the CRM row id otherwise — the same
    // resolution `customerObservations` performs, so a discovered subject is
    // always a subject that resolves.
    return [...new Set(rows.map((row) => row.userId ?? row.id))];
  }
}

/** Groups rows by a key, preserving order within each bucket. */
function groupBy<TRow, TKey extends string>(
  rows: readonly TRow[],
  key: (row: TRow) => TKey
): Map<TKey, TRow[]> {
  const grouped = new Map<TKey, TRow[]>();

  for (const row of rows) {
    const bucket = grouped.get(key(row));
    if (bucket) bucket.push(row);
    else grouped.set(key(row), [row]);
  }

  return grouped;
}

export type { PackageIntelligenceRow, SearchLogRow };
