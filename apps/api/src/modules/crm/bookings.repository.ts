import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma, type Booking, type BookingStatus } from "@prisma/client";
import { PrismaService } from "../prisma.service";
import type { AuthActor } from "../repositories/database.repository";
import { requireOwnedBusiness } from "./business-ownership.util";
import { LoyaltyService } from "./loyalty.service";

export type CreateBookingInput = {
  serviceName: string;
  customerPhone: string;
  startsAt: string;
  endsAt?: string;
  depositAmount?: number;
};

export type ListBookingsFilter = {
  status?: string;
  from?: string;
  to?: string;
  take?: number;
  skip?: number;
};

const BOOKING_STATUSES: BookingStatus[] = ["pending", "confirmed", "canceled", "completed", "no_show"];

/** Once reached, a booking never legally leaves this status. */
const TERMINAL_STATUSES = new Set<BookingStatus>(["completed", "canceled", "no_show"]);

const DEFAULT_TAKE = 50;
const MAX_TAKE = 100;

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "P2002"
  );
}

/**
 * Owner-recorded bookings: the phone/walk-in intake that feeds the CRM.
 *
 * Deliberately separate from a future self-service/Payme-Click booking widget
 * (the `booking` PlanFeature entitlement seeded on the Max tier references
 * that customer-facing flow, not this one) — recording a booking an owner
 * already took by phone is basic intake, not a premium feature, so these
 * routes are ungated like the rest of M0 CRM.
 */
@Injectable()
export class BookingsRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly loyalty: LoyaltyService
  ) {}

  async listBookings(slug: string, filter: ListBookingsFilter, actor: AuthActor) {
    const business = await requireOwnedBusiness(this.prisma, slug, actor);

    if (filter.status && !BOOKING_STATUSES.includes(filter.status as BookingStatus)) {
      throw new BadRequestException(`status must be one of: ${BOOKING_STATUSES.join(", ")}`);
    }

    const startsAt: Prisma.DateTimeFilter = {};
    if (filter.from) {
      const from = new Date(filter.from);
      if (Number.isNaN(from.getTime())) {
        throw new BadRequestException("from must be a valid date");
      }
      startsAt.gte = from;
    }
    if (filter.to) {
      const to = new Date(filter.to);
      if (Number.isNaN(to.getTime())) {
        throw new BadRequestException("to must be a valid date");
      }
      startsAt.lte = to;
    }

    const take = Math.min(Math.max(filter.take ?? DEFAULT_TAKE, 1), MAX_TAKE);
    const skip = Math.max(filter.skip ?? 0, 0);

    const where: Prisma.BookingWhereInput = {
      businessId: business.id,
      ...(filter.status ? { status: filter.status as BookingStatus } : {}),
      ...(Object.keys(startsAt).length > 0 ? { startsAt } : {})
    };

    const [bookings, total] = await Promise.all([
      this.prisma.booking.findMany({
        where,
        // Most recent/soonest first, same convention as the customer profile's
        // own booking list (CustomersRepository.getCustomer).
        orderBy: { startsAt: "desc" },
        take,
        skip,
        // Booking itself only ever carries a phone number; the name (when one
        // is on file) lives on the linked Customer, so the dashboard table can
        // show more than a bare phone number for a repeat customer.
        include: { customer: { select: { name: true } } }
      }),
      this.prisma.booking.count({ where })
    ]);

    return {
      bookings: bookings.map((booking) => this.serialize(booking)),
      total,
      take,
      skip
    };
  }

  async createBooking(slug: string, input: CreateBookingInput, actor: AuthActor) {
    const business = await requireOwnedBusiness(this.prisma, slug, actor);

    const serviceName = input.serviceName?.trim();
    const customerPhone = input.customerPhone?.trim();

    if (!serviceName) {
      throw new BadRequestException("serviceName is required");
    }

    if (!customerPhone) {
      throw new BadRequestException("customerPhone is required");
    }

    if (!input.startsAt) {
      throw new BadRequestException("startsAt is required");
    }

    const startsAt = new Date(input.startsAt);
    if (Number.isNaN(startsAt.getTime())) {
      throw new BadRequestException("startsAt must be a valid date");
    }

    let endsAt: Date | null = null;
    if (input.endsAt) {
      endsAt = new Date(input.endsAt);
      if (Number.isNaN(endsAt.getTime())) {
        throw new BadRequestException("endsAt must be a valid date");
      }
      if (endsAt <= startsAt) {
        throw new BadRequestException("endsAt must be after startsAt");
      }
    }

    if (input.depositAmount !== undefined) {
      if (!Number.isFinite(input.depositAmount) || input.depositAmount < 0) {
        throw new BadRequestException("depositAmount must be a non-negative number");
      }
    }

    // Link to an existing customer by phone for continuity, but never create
    // a new Customer row here — that only happens once a visit actually
    // occurs (on completion). A booking that is later canceled or no-showed
    // must not leave a phantom customer behind.
    const existingCustomer = await this.prisma.customer.findUnique({
      where: { businessId_phone: { businessId: business.id, phone: customerPhone } },
      select: { id: true }
    });

    const booking = await this.prisma.booking.create({
      data: {
        businessId: business.id,
        customerId: existingCustomer?.id ?? null,
        customerPhone,
        serviceName,
        startsAt,
        endsAt,
        depositAmount: input.depositAmount ?? null,
        status: "pending"
      }
    });

    return this.serialize(booking);
  }

  async setStatus(bookingId: string, nextStatus: string, actor: AuthActor) {
    if (!BOOKING_STATUSES.includes(nextStatus as BookingStatus)) {
      throw new BadRequestException(`status must be one of: ${BOOKING_STATUSES.join(", ")}`);
    }

    const status = nextStatus as BookingStatus;

    const existing = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { business: { select: { slug: true } } }
    });

    if (!existing) {
      throw new NotFoundException("Booking not found");
    }

    await requireOwnedBusiness(this.prisma, existing.business.slug, actor);

    // Idempotent no-op: re-submitting the same status — a double click, a
    // retried request — is never an illegal transition, it is the same
    // request landing twice.
    if (existing.status === status) {
      return this.serialize(existing);
    }

    if (TERMINAL_STATUSES.has(existing.status)) {
      throw new BadRequestException(
        `Cannot change status from '${existing.status}' to '${status}' — '${existing.status}' is a final state`
      );
    }

    if (status !== "completed") {
      const updated = await this.prisma.booking.update({
        where: { id: bookingId },
        data: { status }
      });
      return this.serialize(updated);
    }

    return this.completeBooking(bookingId);
  }

  /**
   * Marks a booking completed and creates the connective tissue that makes
   * the verified-visit badge and the CRM customer list real: a CustomerVisit,
   * and the Customer row itself (upserted, matched on businessId+phone).
   *
   * Idempotent by construction: CustomerVisit.bookingId is `@unique`, so two
   * completions of the same booking can never produce two visits.
   *   1. `setStatus` above already turns a same-status re-submit into a no-op
   *      before this method is even called — the common double-click case.
   *   2. The `customerVisit.findUnique` check below turns a *sequential*
   *      retry (first request already committed) into a clean no-op too.
   *   3. For genuinely *concurrent* requests — both pass check 2 before
   *      either commits — Postgres serializes the two INSERTs on the unique
   *      index itself: the second blocks until the first commits, then fails
   *      with a unique violation. The catch below turns that failure into
   *      the same graceful "already completed" response rather than a 500.
   */
  private async completeBooking(bookingId: string) {
    try {
      const updated = await this.prisma.$transaction(async (tx) => {
        const current = await tx.booking.findUniqueOrThrow({
          where: { id: bookingId },
          include: { payment: { select: { amount: true, status: true } } }
        });

        if (current.status === "completed") {
          return current;
        }

        const existingVisit = await tx.customerVisit.findUnique({ where: { bookingId } });
        if (existingVisit) {
          return tx.booking.update({ where: { id: bookingId }, data: { status: "completed" } });
        }

        // Same rule as CustomersRepository/LoyaltyService: only a settled
        // payment counts as revenue. A manually-recorded phone booking
        // typically has no Payment row at all, so this is usually zero —
        // depositAmount is a reference figure, not a captured charge.
        const settledSpend =
          current.payment?.status === "paid" ? current.payment.amount : new Prisma.Decimal(0);

        const existingCustomer = await tx.customer.findUnique({
          where: { businessId_phone: { businessId: current.businessId, phone: current.customerPhone } },
          select: { lastVisitAt: true }
        });

        // Never regress lastVisitAt if an even more recent visit was already
        // recorded (bookings are not always completed in chronological order).
        const nextLastVisitAt =
          existingCustomer?.lastVisitAt && existingCustomer.lastVisitAt > current.startsAt
            ? existingCustomer.lastVisitAt
            : current.startsAt;

        const customer = await tx.customer.upsert({
          where: { businessId_phone: { businessId: current.businessId, phone: current.customerPhone } },
          update: {
            lastVisitAt: nextLastVisitAt,
            visitCount: { increment: 1 },
            totalSpend: { increment: settledSpend }
          },
          create: {
            businessId: current.businessId,
            phone: current.customerPhone,
            firstSeenAt: current.startsAt,
            lastVisitAt: current.startsAt,
            visitCount: 1,
            totalSpend: settledSpend
          }
        });

        await tx.customerVisit.create({
          data: {
            businessId: current.businessId,
            customerId: customer.id,
            bookingId,
            source: "booking_completed",
            occurredAt: current.startsAt
          }
        });

        const bookingUpdated = await tx.booking.update({
          where: { id: bookingId },
          data: { status: "completed", customerId: customer.id }
        });

        await this.loyalty.awardForCompletedBooking(tx, bookingId);

        return bookingUpdated;
      }, { timeout: 15_000, maxWait: 10_000 });

      return this.serialize(updated);
    } catch (error) {
      if (isUniqueViolation(error)) {
        // A concurrent request completed this booking first — same outcome,
        // reported without error.
        const current = await this.prisma.booking.findUniqueOrThrow({ where: { id: bookingId } });
        return this.serialize(current);
      }
      throw error;
    }
  }

  private serialize(booking: Booking & { customer?: { name: string | null } | null }) {
    return {
      id: booking.id,
      customerId: booking.customerId,
      customerName: booking.customer?.name ?? null,
      customerPhone: booking.customerPhone,
      serviceName: booking.serviceName,
      startsAt: booking.startsAt.toISOString(),
      endsAt: booking.endsAt ? booking.endsAt.toISOString() : null,
      status: booking.status,
      depositAmount: booking.depositAmount ? booking.depositAmount.toString() : null,
      createdAt: booking.createdAt.toISOString(),
      updatedAt: booking.updatedAt.toISOString()
    };
  }
}
