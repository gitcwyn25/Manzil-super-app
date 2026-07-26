import { Injectable } from "@nestjs/common";
import type { BusinessEventType } from "@prisma/client";
import { CacheService } from "../cache/cache.service";
import { PrismaService } from "../prisma.service";

/** Cached briefly: dashboards are read repeatedly on refresh but tolerate staleness. */
const CACHE_NS = "analytics";
const CACHE_TTL_SECONDS = 120;

export type DayPoint = { date: string; value: number };

/** Ordered funnel stages. `view` is the denominator for the rest. */
const FUNNEL_ORDER: BusinessEventType[] = ["view", "photo_view", "directions", "call", "message"];

function emptyDaySeries(days: number): Map<string, number> {
  const buckets = new Map<string, number>();

  for (let index = days - 1; index >= 0; index -= 1) {
    const day = new Date();
    day.setUTCDate(day.getUTCDate() - index);
    buckets.set(day.toISOString().slice(0, 10), 0);
  }

  return buckets;
}

function toSeries(buckets: Map<string, number>): DayPoint[] {
  return [...buckets.entries()].map(([date, value]) => ({ date, value }));
}

/**
 * Aggregation queries for both dashboards.
 *
 * Everything here is a Postgres `groupBy`/`count` over indexed columns — at
 * Manzil's scale that is the right tool, and a streaming pipeline would be
 * infrastructure with no reader. Each query is bounded by a date window so cost
 * does not grow with total table size.
 */
@Injectable()
export class AnalyticsRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService
  ) {}

  private windowStart(days: number): Date {
    const since = new Date();
    since.setUTCDate(since.getUTCDate() - (days - 1));
    since.setUTCHours(0, 0, 0, 0);
    return since;
  }

  /* ------------------------------------------------------------------ */
  /* Business owner dashboard                                            */
  /* ------------------------------------------------------------------ */

  async businessOverview(businessId: string, days: number) {
    return this.cache.getOrSet(CACHE_NS, `business:${businessId}:${days}`, CACHE_TTL_SECONDS, () =>
      this.businessOverviewUncached(businessId, days)
    );
  }

  private async businessOverviewUncached(businessId: string, days: number) {
    const since = this.windowStart(days);

    const [visits, events, reviews, bookings, payments] = await Promise.all([
      this.prisma.businessVisit.findMany({
        where: { businessId, createdAt: { gte: since } },
        select: { createdAt: true, visitorKey: true }
      }),
      this.prisma.businessEvent.groupBy({
        by: ["type"],
        where: { businessId, createdAt: { gte: since } },
        _count: { type: true }
      }),
      this.prisma.review.findMany({
        where: { businessId, moderationStatus: "approved", createdAt: { gte: since } },
        select: { createdAt: true, rating: true }
      }),
      this.prisma.booking.groupBy({
        by: ["status"],
        where: { businessId, createdAt: { gte: since } },
        _count: { status: true }
      }),
      // "paid" is the terminal success state in PaymentStatus; pending and
      // refunded rows must not count toward revenue.
      this.prisma.payment.aggregate({
        where: { businessId, status: "paid", createdAt: { gte: since } },
        _sum: { amount: true },
        _count: { _all: true }
      })
    ]);

    // Visit trend + unique visitors.
    const visitBuckets = emptyDaySeries(days);
    const uniqueVisitors = new Set<string>();

    for (const visit of visits) {
      const key = visit.createdAt.toISOString().slice(0, 10);
      if (visitBuckets.has(key)) {
        visitBuckets.set(key, (visitBuckets.get(key) ?? 0) + 1);
      }
      uniqueVisitors.add(visit.visitorKey);
    }

    // Funnel. Counts are per stage; conversion is expressed against `view`
    // rather than the previous stage, because these are parallel actions a
    // visitor may take — not a strict sequence.
    const eventCounts = new Map<string, number>(
      events.map((row) => [row.type, row._count.type])
    );
    const viewCount = eventCounts.get("view") ?? 0;

    const funnel = FUNNEL_ORDER.map((type) => {
      const count = eventCounts.get(type) ?? 0;
      return {
        type,
        count,
        conversionFromView: viewCount > 0 ? Number(((count / viewCount) * 100).toFixed(1)) : null
      };
    });

    // Rating trend.
    const ratingBuckets = emptyDaySeries(days);
    const ratingTotals = new Map<string, { sum: number; count: number }>();

    for (const review of reviews) {
      const key = review.createdAt.toISOString().slice(0, 10);
      if (!ratingBuckets.has(key)) continue;

      const current = ratingTotals.get(key) ?? { sum: 0, count: 0 };
      current.sum += review.rating;
      current.count += 1;
      ratingTotals.set(key, current);
    }

    const ratingTrend = [...ratingBuckets.keys()].map((date) => {
      const totals = ratingTotals.get(date);
      return {
        date,
        value: totals && totals.count > 0 ? Number((totals.sum / totals.count).toFixed(2)) : null,
        count: totals?.count ?? 0
      };
    });

    const bookingCounts: Record<string, number> = {};
    for (const row of bookings) {
      bookingCounts[row.status] = row._count.status;
    }

    return {
      windowDays: days,
      visits: {
        total: visits.length,
        unique: uniqueVisitors.size,
        trend: toSeries(visitBuckets)
      },
      funnel,
      reviews: {
        count: reviews.length,
        averageRating:
          reviews.length > 0
            ? Number((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(2))
            : null,
        trend: ratingTrend
      },
      bookings: {
        total: Object.values(bookingCounts).reduce((sum, value) => sum + value, 0),
        byStatus: bookingCounts
      },
      revenue: {
        // Decimal → string keeps full precision across the JSON boundary;
        // Number() on a Decimal silently loses precision on large sums.
        totalAmount: payments._sum?.amount?.toString() ?? "0",
        currency: "UZS",
        paymentCount: payments._count?._all ?? 0
      }
    };
  }

  /* ------------------------------------------------------------------ */
  /* Platform / admin dashboard                                          */
  /* ------------------------------------------------------------------ */

  async platformOverview(days: number) {
    return this.cache.getOrSet(CACHE_NS, `platform:${days}`, CACHE_TTL_SECONDS, () =>
      this.platformOverviewUncached(days)
    );
  }

  private async platformOverviewUncached(days: number) {
    const since = this.windowStart(days);

    const [
      totalSearches,
      zeroResultSearches,
      topQueries,
      topZeroResultQueries,
      newBusinesses,
      businessesByStatus,
      subscriptionsByTier
    ] = await Promise.all([
      this.prisma.searchQueryLog.count({ where: { createdAt: { gte: since } } }),
      this.prisma.searchQueryLog.count({
        where: { createdAt: { gte: since }, resultCount: 0 }
      }),
      this.prisma.searchQueryLog.groupBy({
        by: ["query"],
        where: { createdAt: { gte: since } },
        _count: { query: true },
        orderBy: { _count: { query: "desc" } },
        take: 20
      }),
      // The product-critical one: what people search for and Manzil cannot
      // answer. Directly names the categories/districts that need seeding.
      this.prisma.searchQueryLog.groupBy({
        by: ["query"],
        where: { createdAt: { gte: since }, resultCount: 0 },
        _count: { query: true },
        orderBy: { _count: { query: "desc" } },
        take: 20
      }),
      this.prisma.business.findMany({
        where: { createdAt: { gte: since } },
        select: { createdAt: true }
      }),
      this.prisma.business.groupBy({
        by: ["status"],
        _count: { status: true }
      }),
      // The tier column on BusinessSubscription is named `plan`, not `tier`.
      this.prisma.businessSubscription.groupBy({
        by: ["plan"],
        _count: { _all: true }
      })
    ]);

    const growthBuckets = emptyDaySeries(days);
    for (const business of newBusinesses) {
      const key = business.createdAt.toISOString().slice(0, 10);
      if (growthBuckets.has(key)) {
        growthBuckets.set(key, (growthBuckets.get(key) ?? 0) + 1);
      }
    }

    const statusCounts: Record<string, number> = {};
    for (const row of businessesByStatus) {
      statusCounts[row.status] = row._count.status;
    }

    const tierCounts: Record<string, number> = {};
    for (const row of subscriptionsByTier) {
      tierCounts[row.plan] = row._count?._all ?? 0;
    }

    return {
      windowDays: days,
      search: {
        total: totalSearches,
        zeroResult: zeroResultSearches,
        zeroResultRate:
          totalSearches > 0
            ? Number(((zeroResultSearches / totalSearches) * 100).toFixed(1))
            : 0,
        topQueries: topQueries.map((row) => ({ query: row.query, count: row._count.query })),
        unmetDemand: topZeroResultQueries.map((row) => ({
          query: row.query,
          count: row._count.query
        }))
      },
      businesses: {
        newInWindow: newBusinesses.length,
        growthTrend: toSeries(growthBuckets),
        byStatus: statusCounts
      },
      subscriptions: {
        byTier: tierCounts,
        total: Object.values(tierCounts).reduce((sum, value) => sum + value, 0)
      }
    };
  }
}
