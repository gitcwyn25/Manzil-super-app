import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma.service";
import type { AuthActor } from "../repositories/database.repository";
import { requireOwnedBusiness } from "./business-ownership.util";

export type CustomerSummary = {
  id: string;
  phone: string;
  name: string | null;
  lastVisitAt: string | null;
  visitCount: number;
  totalSpend: string;
  tags: string[];
  consentMarketing: boolean;
};

export type CustomerBooking = {
  id: string;
  serviceName: string;
  startsAt: string;
  status: string;
  /** Realized revenue for this booking; "0" unless a payment actually settled. */
  amount: string;
};

export type CustomerReview = {
  id: string;
  rating: number;
  text: string;
  createdAt: string;
};

export type CustomerVisitEntry = {
  id: string;
  occurredAt: string;
  source: string;
};

export type CustomerDetail = CustomerSummary & {
  notes: string | null;
  firstSeenAt: string;
  /** True when this customer is linked to a Manzil account (and so can have reviews). */
  hasAccount: boolean;
  bookings: CustomerBooking[];
  reviews: CustomerReview[];
  visits: CustomerVisitEntry[];
};

/**
 * Read-only customer directory (M0). Creation/editing is a later milestone —
 * Customer rows are populated by the booking-completion backfill/hook, never
 * written directly through this API.
 */
@Injectable()
export class CustomersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async listCustomers(slug: string, actor: AuthActor): Promise<CustomerSummary[]> {
    const business = await requireOwnedBusiness(this.prisma, slug, actor);

    const customers = await this.prisma.customer.findMany({
      where: { businessId: business.id },
      // Most recently active first; a Customer row without a recorded visit
      // (should not normally happen post-backfill) sorts last, not first.
      orderBy: [{ lastVisitAt: { sort: "desc", nulls: "last" } }, { firstSeenAt: "desc" }],
      take: 500
    });

    return customers.map((customer) => ({
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
   * One customer's full profile for the owner dashboard.
   *
   * The customer is looked up by `id` **and** `businessId` together, so an id
   * belonging to another business 404s rather than leaking — the id alone is
   * never trusted as authorization.
   */
  async getCustomer(slug: string, customerId: string, actor: AuthActor): Promise<CustomerDetail> {
    const business = await requireOwnedBusiness(this.prisma, slug, actor);

    const customer = await this.prisma.customer.findFirst({
      where: { id: customerId, businessId: business.id },
      include: {
        bookings: {
          orderBy: { startsAt: "desc" },
          take: 100,
          include: { payment: { select: { amount: true, status: true } } }
        },
        visits: {
          orderBy: { occurredAt: "desc" },
          take: 100
        }
      }
    });

    if (!customer) {
      throw new NotFoundException("Customer not found");
    }

    // Reviews hang off User, not Customer — a customer who booked by phone and
    // never created an account simply has none, which is different from having
    // left none. `hasAccount` lets the UI say which.
    const reviews = customer.userId
      ? await this.prisma.review.findMany({
          where: {
            businessId: business.id,
            userId: customer.userId,
            moderationStatus: "approved"
          },
          orderBy: { createdAt: "desc" },
          take: 50,
          select: { id: true, rating: true, text: true, createdAt: true }
        })
      : [];

    return {
      id: customer.id,
      phone: customer.phone,
      name: customer.name,
      lastVisitAt: customer.lastVisitAt ? customer.lastVisitAt.toISOString() : null,
      visitCount: customer.visitCount,
      totalSpend: customer.totalSpend.toString(),
      tags: customer.tags,
      consentMarketing: customer.consentMarketing,
      notes: customer.notes,
      firstSeenAt: customer.firstSeenAt.toISOString(),
      hasAccount: Boolean(customer.userId),
      bookings: customer.bookings.map((booking) => ({
        id: booking.id,
        serviceName: booking.serviceName,
        startsAt: booking.startsAt.toISOString(),
        status: booking.status,
        // Mirrors the backfill's rule: only a settled payment counts as
        // revenue. A pending or refunded payment is not money received.
        amount: booking.payment?.status === "paid" ? booking.payment.amount.toString() : "0"
      })),
      reviews: reviews.map((review) => ({
        id: review.id,
        rating: review.rating,
        text: review.text,
        createdAt: review.createdAt.toISOString()
      })),
      visits: customer.visits.map((visit) => ({
        id: visit.id,
        occurredAt: visit.occurredAt.toISOString(),
        source: visit.source
      }))
    };
  }
}
