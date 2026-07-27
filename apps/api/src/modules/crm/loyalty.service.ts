import { Injectable, Logger } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma.service";

/** Points per completed visit, regardless of spend — the floor reward. */
const POINTS_PER_VISIT = 10;
/** Additional points per 10,000 UZS actually paid. */
const UZS_PER_POINT = 10_000;

@Injectable()
export class LoyaltyService {
  private readonly logger = new Logger(LoyaltyService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Awards points for a completed booking.
   *
   * Points-only for now: tiers and redemption are a later milestone, and a
   * tier ladder built before anyone has accumulated points would be designed
   * against guesses rather than real distributions.
   *
   * Runs inside the caller's transaction so the points and the state change
   * that earned them commit together — awarding points for a booking that then
   * fails to complete would be worse than awarding none.
   */
  async awardForCompletedBooking(
    tx: Prisma.TransactionClient,
    bookingId: string
  ): Promise<{ awarded: number; customerId: string } | null> {
    const booking = await tx.booking.findUnique({
      where: { id: bookingId },
      include: { payment: { select: { amount: true, status: true } } }
    });

    if (!booking || !booking.customerId || booking.status !== "completed") {
      return null;
    }

    // Same rule the backfill and the customer profile use: only a settled
    // payment counts as money received. Keeping this consistent matters — a
    // customer whose spend and points disagree will trust neither.
    const paid =
      booking.payment?.status === "paid"
        ? booking.payment.amount
        : new Prisma.Decimal(0);

    const spendPoints = Math.floor(Number(paid) / UZS_PER_POINT);
    const awarded = POINTS_PER_VISIT + Math.max(0, spendPoints);

    await tx.customer.update({
      where: { id: booking.customerId },
      data: { loyaltyPoints: { increment: awarded } }
    });

    return { awarded, customerId: booking.customerId };
  }

  /**
   * Recomputes a customer's points from their completed bookings.
   *
   * Exists because `increment` is only correct if every award happened exactly
   * once; this is the repair path for a customer whose balance is disputed,
   * and the check that the incremental logic has not drifted.
   */
  async recomputeForCustomer(customerId: string): Promise<number> {
    const bookings = await this.prisma.booking.findMany({
      where: { customerId, status: "completed" },
      include: { payment: { select: { amount: true, status: true } } }
    });

    const total = bookings.reduce((sum, booking) => {
      const paid =
        booking.payment?.status === "paid" ? Number(booking.payment.amount) : 0;
      return sum + POINTS_PER_VISIT + Math.max(0, Math.floor(paid / UZS_PER_POINT));
    }, 0);

    await this.prisma.customer.update({
      where: { id: customerId },
      data: { loyaltyPoints: total }
    });

    this.logger.log(`Recomputed loyalty for customer ${customerId}: ${total} points`);
    return total;
  }
}
