/**
 * Layer 4 (Memory Engine) — the projection repository.
 *
 * The only place in this module that talks to Prisma. It reads Layer 1 rows
 * and hands back the row shapes `memory.projection.ts` maps; every mapping
 * decision lives there, as pure functions, so preference projection is
 * testable without a database.
 *
 * **Identity.** The memory engine's `customerId` is the *person* — a platform
 * account (`User.id`). `Customer` is business-scoped and unique on
 * `(businessId, phone)`, so one person known to three providers is three rows
 * (Epic 04 settled this and did not merge them). The engine resolves account
 * first, then falls back to a single CRM row id, so both callers work and
 * neither is guessed at.
 *
 * Budgets are mandatory: a customer with a thousand visits must not turn one
 * recall into a thousand-row read.
 */
import { Injectable } from "@nestjs/common";
import type { EntityId } from "../core";
import { PrismaService } from "../../prisma.service";
import type {
  BusinessFacetRow,
  CustomerMemoryRow,
  VisitMemoryRow
} from "./memory.projection";

/** Ceiling on CRM rows one identity resolves to. */
export const MAX_CUSTOMER_ROWS = 200;

/** Ceiling on visits any single projection reads — the newest win. */
export const MAX_PROJECTION_VISITS = 500;

/** Ceiling on business facets fetched for one projection. */
export const MAX_PROJECTION_BUSINESSES = 200;

const customerSelect = {
  id: true,
  businessId: true,
  userId: true,
  phone: true,
  visitCount: true,
  totalSpend: true,
  lastVisitAt: true,
  updatedAt: true
} as const;

const visitSelect = {
  customerId: true,
  businessId: true,
  occurredAt: true
} as const;

/** Everything one preference projection reads, in one shape. */
export interface CustomerActivity {
  readonly customers: readonly CustomerMemoryRow[];
  readonly visits: readonly VisitMemoryRow[];
  readonly businesses: readonly BusinessFacetRow[];
}

@Injectable()
export class MemoryProjectionRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * The CRM rows that are this person.
   *
   * Account id first: it is the only signal that links rows across providers
   * without inventing an identity. A caller holding a business-scoped
   * `Customer.id` still gets an answer — one row, its own — because refusing
   * it would make the engine unusable from the merchant side of the product.
   */
  async customerRows(customerId: EntityId): Promise<readonly CustomerMemoryRow[]> {
    const byAccount = await this.prisma.customer.findMany({
      where: { userId: customerId },
      select: customerSelect,
      orderBy: { updatedAt: "desc" },
      take: MAX_CUSTOMER_ROWS
    });

    if (byAccount.length > 0) return byAccount;

    const row = await this.prisma.customer.findUnique({
      where: { id: customerId },
      select: customerSelect
    });

    return row ? [row] : [];
  }

  /** Recent visits of these CRM rows, newest first. */
  async visitsOf(customerRowIds: readonly string[]): Promise<readonly VisitMemoryRow[]> {
    if (customerRowIds.length === 0) return [];

    return this.prisma.customerVisit.findMany({
      where: { customerId: { in: [...customerRowIds] } },
      select: visitSelect,
      orderBy: { occurredAt: "desc" },
      take: MAX_PROJECTION_VISITS
    });
  }

  /**
   * The facets a preference can be derived from.
   *
   * Category arrives as the slug rather than the id: a preference reading
   * `category=coffee` is knowledge a human can check, and `category=clx7…` is
   * a foreign key pretending to be one.
   */
  async businessFacets(businessIds: readonly string[]): Promise<readonly BusinessFacetRow[]> {
    if (businessIds.length === 0) return [];

    const rows = await this.prisma.business.findMany({
      where: { id: { in: [...businessIds] } },
      select: {
        id: true,
        categoryId: true,
        priceTier: true,
        category: { select: { slug: true } }
      },
      take: MAX_PROJECTION_BUSINESSES
    });

    return rows.map((row) => ({
      id: row.id,
      categoryId: row.categoryId,
      categorySlug: row.category?.slug ?? null,
      priceTier: row.priceTier
    }));
  }

  /** One person's activity, in the three reads the projection needs. */
  async activityOf(customerId: EntityId): Promise<CustomerActivity> {
    const customers = await this.customerRows(customerId);
    const visits = await this.visitsOf(customers.map((customer) => customer.id));
    const businesses = await this.businessFacets([
      ...new Set(visits.map((visit) => visit.businessId))
    ]);

    return { customers, visits, businesses };
  }
}
