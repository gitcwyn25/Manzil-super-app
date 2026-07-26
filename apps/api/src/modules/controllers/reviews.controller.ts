import { Body, Controller, Param, Post, Req, UseGuards } from "@nestjs/common";
import type { ManzilRequest } from "../auth/auth.types";
import { ManzilAuthGuard } from "../auth/manzil-auth.guard";
import { RequireAuth } from "../auth/require-auth.decorator";
import { Roles } from "../auth/roles.decorator";
import { DatabaseRepository } from "../repositories/database.repository";
import { ReviewTrustRepository } from "../reviews/review-trust.repository";
import { LinkBookingDto } from "../reviews/review-trust.dto";
import { ReportReviewDto, ReviewReplyDto } from "./moderation.dto";
import { ThrottleWrite } from "../security/throttle.config";

@Controller("reviews")
export class ReviewsController {
  constructor(
    private readonly repository: DatabaseRepository,
    private readonly trust: ReviewTrustRepository
  ) {}

  /**
   * Toggles the caller's helpful vote.
   *
   * Throttled as a write: one row per user per review is enforced by a unique
   * constraint, but nothing stops a script toggling the same vote in a loop.
   */
  @Post(":id/helpful")
  @ThrottleWrite()
  @UseGuards(ManzilAuthGuard)
  @RequireAuth()
  async toggleHelpful(@Param("id") id: string, @Req() request: ManzilRequest) {
    return { data: await this.trust.toggleHelpful(id, request.manzilActor!) };
  }

  /** Links a completed booking to the caller's review, earning the verified-visit badge. */
  @Post(":id/verify")
  @ThrottleWrite()
  @UseGuards(ManzilAuthGuard)
  @RequireAuth()
  async verifyReview(
    @Param("id") id: string,
    @Body() body: LinkBookingDto,
    @Req() request: ManzilRequest
  ) {
    return { data: await this.trust.linkBookingToReview(id, body.bookingId, request.manzilActor!) };
  }

  @Post(":id/replies")
  @UseGuards(ManzilAuthGuard)
  @Roles("business_owner", "admin")
  async replyToReview(
    @Param("id") id: string,
    @Body() body: ReviewReplyDto,
    @Req() request: ManzilRequest
  ) {
    return {
      data: {
        reply: await this.repository.createReviewReply(id, body.text, request.manzilActor!)
      }
    };
  }

  @Post(":id/report")
  @UseGuards(ManzilAuthGuard)
  @RequireAuth()
  async reportReview(
    @Param("id") id: string,
    @Body() body: ReportReviewDto,
    @Req() request: ManzilRequest
  ) {
    return {
      data: {
        report: await this.repository.createReviewReport(id, body.reason, request.manzilActor!)
      }
    };
  }
}
