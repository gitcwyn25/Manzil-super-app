import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma.service";
import type { AuthActor } from "../repositories/database.repository";

/**
 * Review trust signals: helpful votes and verified-visit provenance.
 *
 * Both exist to make the review list mean something. A helpful count nobody
 * can hold to one-vote-per-user is decorative, and a "verified" badge that is
 * not tied to a real transaction is worse than no badge — it launders
 * unverified reviews as trustworthy.
 */
@Injectable()
export class ReviewTrustRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Toggles the caller's helpful vote and returns the resulting count.
   *
   * The vote row and the denormalised counter move together in one
   * transaction, so the number on screen always matches the number of rows
   * that justify it.
   *
   * A user cannot mark their own review helpful — self-endorsement is the
   * cheapest possible way to game the signal.
   */
  async toggleHelpful(reviewId: string, actor: AuthActor) {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
      select: { id: true, userId: true, moderationStatus: true }
    });

    if (!review || review.moderationStatus !== "approved") {
      throw new NotFoundException("Review not found");
    }

    if (review.userId === actor.userId) {
      throw new ConflictException("You cannot mark your own review as helpful");
    }

    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.reviewHelpfulVote.findUnique({
        where: { reviewId_userId: { reviewId, userId: actor.userId } }
      });

      if (existing) {
        await tx.reviewHelpfulVote.delete({ where: { id: existing.id } });
      } else {
        await tx.reviewHelpfulVote.create({ data: { reviewId, userId: actor.userId } });
      }

      // Recount rather than increment: a recount cannot drift from the rows,
      // and this runs once per click on a small set.
      const helpfulCount = await tx.reviewHelpfulVote.count({ where: { reviewId } });

      await tx.review.update({ where: { id: reviewId }, data: { helpfulCount } });

      return { reviewId, helpfulCount, voted: !existing };
    });
  }

  /** Which of these reviews the caller has already marked helpful, for rendering button state. */
  async getVotedReviewIds(reviewIds: string[], userId: string): Promise<string[]> {
    if (reviewIds.length === 0) return [];

    const votes = await this.prisma.reviewHelpfulVote.findMany({
      where: { reviewId: { in: reviewIds }, userId },
      select: { reviewId: true }
    });

    return votes.map((vote) => vote.reviewId);
  }

  /**
   * Links a review to the booking that justifies it, which is what the
   * verified-visit badge reflects.
   *
   * The booking must belong to the same business and to this reviewer, and
   * must have actually completed — a pending or cancelled booking is not
   * evidence anyone visited. `Review.bookingId` is unique, so one booking
   * cannot verify several reviews.
   */
  async linkBookingToReview(reviewId: string, bookingId: string, actor: AuthActor) {
    const [review, booking] = await Promise.all([
      this.prisma.review.findUnique({
        where: { id: reviewId },
        select: { id: true, userId: true, businessId: true }
      }),
      this.prisma.booking.findUnique({
        where: { id: bookingId },
        select: { id: true, businessId: true, customerUserId: true, status: true }
      })
    ]);

    if (!review) throw new NotFoundException("Review not found");
    if (!booking) throw new NotFoundException("Booking not found");

    if (review.userId !== actor.userId) {
      throw new NotFoundException("Review not found");
    }

    if (booking.businessId !== review.businessId) {
      throw new ConflictException("That booking is for a different business");
    }

    if (booking.customerUserId !== actor.userId) {
      throw new ConflictException("That booking belongs to a different customer");
    }

    if (booking.status !== "completed") {
      throw new ConflictException(
        "Only a completed booking can verify a review"
      );
    }

    const alreadyUsed = await this.prisma.review.findUnique({
      where: { bookingId },
      select: { id: true }
    });

    if (alreadyUsed && alreadyUsed.id !== reviewId) {
      throw new ConflictException("That booking already verifies another review");
    }

    await this.prisma.review.update({ where: { id: reviewId }, data: { bookingId } });

    return { reviewId, verified: true };
  }
}
