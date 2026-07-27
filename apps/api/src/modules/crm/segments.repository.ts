import { Injectable } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma.service";
import type { AuthActor } from "../repositories/database.repository";
import { requireOwnedBusiness } from "./business-ownership.util";
import type { CustomerSummary } from "./customers.repository";

/** Days without a visit before a customer counts as lapsed. */
const LAPSED_AFTER_DAYS = 60;
/** Visits required to count as a regular/VIP. */
const VIP_MIN_VISITS = 5;
/** A customer first seen within this many days is still "new". */
const NEW_WITHIN_DAYS = 30;

export type SegmentKey = "vip" | "new" | "lapsed" | "high_value" | "birthday_this_month";

export type SegmentDefinition = {
  key: SegmentKey;
  label: string;
  description: string;
};

/**
 * Five pre-built segments rather than a query builder.
 *
 * A single-location salon or restaurant owner does not want to compose
 * predicates; they want to know who is slipping away and who is worth keeping.
 * A custom builder is more surface area, more support burden, and — at this
 * scale — answers no question these five do not.
 */
export const SEGMENTS: SegmentDefinition[] = [
  {
    key: "vip",
    label: "VIP",
    description: `${VIP_MIN_VISITS}+ visits — your regulars`
  },
  {
    key: "new",
    label: "New",
    description: `First seen in the last ${NEW_WITHIN_DAYS} days`
  },
  {
    key: "lapsed",
    label: "Lapsed",
    description: `No visit in ${LAPSED_AFTER_DAYS}+ days`
  },
  {
    key: "high_value",
    label: "High value",
    description: "Top spenders — above this business's average"
  },
  {
    key: "birthday_this_month",
    label: "Birthday this month",
    description: "Birthday falls in the current month"
  }
];

@Injectable()
export class SegmentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  private daysAgo(days: number): Date {
    const date = new Date();
    date.setUTCDate(date.getUTCDate() - days);
    return date;
  }

  /**
   * Builds the Prisma filter for one segment.
   *
   * `high_value` is intentionally not a fixed currency threshold: a barber and
   * a wedding venue have wildly different baskets, so "high value" is defined
   * relative to that business's own average spend, passed in by the caller.
   */
  private where(
    key: SegmentKey,
    businessId: string,
    averageSpend: Prisma.Decimal | null
  ): Prisma.CustomerWhereInput {
    const base: Prisma.CustomerWhereInput = { businessId };

    switch (key) {
      case "vip":
        return { ...base, visitCount: { gte: VIP_MIN_VISITS } };

      case "new":
        return { ...base, firstSeenAt: { gte: this.daysAgo(NEW_WITHIN_DAYS) } };

      case "lapsed":
        // Requires an actual prior visit: a customer who has never visited is
        // not "lapsed", they are simply new or inactive, and win-back messaging
        // aimed at them would be wrong.
        return {
          ...base,
          lastVisitAt: { not: null, lt: this.daysAgo(LAPSED_AFTER_DAYS) }
        };

      case "high_value":
        return averageSpend
          ? { ...base, totalSpend: { gt: averageSpend } }
          : // No spend recorded anywhere yet — an empty segment is honest,
            // whereas `gt: 0` would label anyone who ever paid as high value.
            { ...base, id: "__none__" };

      case "birthday_this_month":
        return { ...base, birthday: { not: null } };

      default:
        return base;
    }
  }

  async listSegments(slug: string, actor: AuthActor) {
    const business = await requireOwnedBusiness(this.prisma, slug, actor);

    const aggregate = await this.prisma.customer.aggregate({
      where: { businessId: business.id },
      _avg: { totalSpend: true }
    });

    const averageSpend = aggregate._avg?.totalSpend ?? null;

    const counts = await Promise.all(
      SEGMENTS.map(async (segment) => {
        if (segment.key === "birthday_this_month") {
          // Month-of-year cannot be expressed in a Prisma filter, so this one
          // is counted in JS over the (small) set of customers with a birthday.
          const withBirthday = await this.prisma.customer.findMany({
            where: { businessId: business.id, birthday: { not: null } },
            select: { birthday: true }
          });

          const month = new Date().getUTCMonth();
          return {
            ...segment,
            count: withBirthday.filter((c) => c.birthday!.getUTCMonth() === month).length
          };
        }

        return {
          ...segment,
          count: await this.prisma.customer.count({
            where: this.where(segment.key, business.id, averageSpend)
          })
        };
      })
    );

    return {
      segments: counts,
      totalCustomers: await this.prisma.customer.count({ where: { businessId: business.id } }),
      averageSpend: averageSpend?.toString() ?? "0"
    };
  }

  /** Members of one segment, for the dashboard list and campaign targeting. */
  async getSegmentMembers(
    slug: string,
    key: SegmentKey,
    actor: AuthActor
  ): Promise<CustomerSummary[]> {
    const business = await requireOwnedBusiness(this.prisma, slug, actor);

    const aggregate = await this.prisma.customer.aggregate({
      where: { businessId: business.id },
      _avg: { totalSpend: true }
    });

    const customers = await this.prisma.customer.findMany({
      where: this.where(key, business.id, aggregate._avg?.totalSpend ?? null),
      orderBy: [{ lastVisitAt: { sort: "desc", nulls: "last" } }, { firstSeenAt: "desc" }],
      take: 500
    });

    const month = new Date().getUTCMonth();
    const filtered =
      key === "birthday_this_month"
        ? customers.filter((customer) => customer.birthday?.getUTCMonth() === month)
        : customers;

    return filtered.map((customer) => ({
      id: customer.id,
      phone: customer.phone,
      name: customer.name,
      lastVisitAt: customer.lastVisitAt ? customer.lastVisitAt.toISOString() : null,
      visitCount: customer.visitCount,
      totalSpend: customer.totalSpend.toString(),
      tags: customer.tags,
      consentMarketing: customer.consentMarketing
    }));
  }

  /**
   * Resolves segment membership for campaign targeting.
   *
   * Returns full rows rather than summaries because the sender needs consent
   * state and channel addresses, which deliberately never appear in the
   * dashboard-facing summary type.
   */
  async resolveTargets(businessId: string, key: SegmentKey) {
    const aggregate = await this.prisma.customer.aggregate({
      where: { businessId },
      _avg: { totalSpend: true }
    });

    const customers = await this.prisma.customer.findMany({
      where: this.where(key, businessId, aggregate._avg?.totalSpend ?? null),
      take: 1000
    });

    if (key !== "birthday_this_month") return customers;

    const month = new Date().getUTCMonth();
    return customers.filter((customer) => customer.birthday?.getUTCMonth() === month);
  }
}
