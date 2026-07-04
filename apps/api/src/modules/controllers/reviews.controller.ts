import { Body, Controller, Param, Post, Req, UseGuards } from "@nestjs/common";
import type { ManzilRequest } from "../auth/auth.types";
import { ManzilAuthGuard } from "../auth/manzil-auth.guard";
import { RequireAuth } from "../auth/require-auth.decorator";
import { Roles } from "../auth/roles.decorator";
import { DatabaseRepository } from "../repositories/database.repository";

@Controller("reviews")
export class ReviewsController {
  constructor(private readonly repository: DatabaseRepository) {}

  @Post(":id/replies")
  @UseGuards(ManzilAuthGuard)
  @Roles("business_owner", "admin")
  async replyToReview(
    @Param("id") id: string,
    @Body() body: { text: string },
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
    @Body() body: { reason: string },
    @Req() request: ManzilRequest
  ) {
    return {
      data: {
        report: await this.repository.createReviewReport(id, body.reason, request.manzilActor!)
      }
    };
  }
}
