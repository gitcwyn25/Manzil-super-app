import { Body, Controller, Get, Headers, Ip, Param, Patch, Post, Req, UseGuards } from "@nestjs/common";
import type { ManzilRequest } from "../auth/auth.types";
import { BusinessUpdateDto, ReviewCreateDto } from "./business.dto";
import { AnalyticsService } from "../analytics/analytics.service";
import { ManzilAuthGuard } from "../auth/manzil-auth.guard";
import { RequireAuth } from "../auth/require-auth.decorator";
import { Roles } from "../auth/roles.decorator";
import { CrmRepository } from "../crm/crm.repository";
import { DatabaseRepository } from "../repositories/database.repository";
import { ThrottleVisit, ThrottleWrite } from "../security/throttle.config";

@Controller("businesses")
export class BusinessesController {
  constructor(
    private readonly repository: DatabaseRepository,
    private readonly crm: CrmRepository,
    private readonly analytics: AnalyticsService
  ) {}

  /** Public, anonymous visit tracking for CRM analytics. */
  @Post(":slug/visit")
  @ThrottleVisit()
  async recordVisit(
    @Param("slug") slug: string,
    @Ip() ip: string,
    @Headers("user-agent") userAgent?: string
  ) {
    return {
      data: await this.crm.recordVisit(slug, `${ip}|${userAgent ?? ""}`)
    };
  }

  @Get()
  async listBusinesses() {
    return {
      data: {
        businesses: await this.repository.listBusinesses()
      }
    };
  }

  // NOTE: must stay above the ":slug" route or Nest matches "mine" as a slug.
  @Get("mine")
  @UseGuards(ManzilAuthGuard)
  @RequireAuth()
  async listOwnedBusinesses(@Req() request: ManzilRequest) {
    return {
      data: await this.repository.listOwnedBusinesses(request.manzilActor!)
    };
  }

  @Get(":slug")
  async getBusiness(
    @Param("slug") slug: string,
    @Ip() ip: string,
    @Headers("user-agent") userAgent?: string
  ) {
    const business = await this.repository.getBusiness(slug);

    // `view` is the funnel denominator, so it is recorded server-side on the
    // profile fetch rather than relying on a client call that ad blockers or a
    // failed script would drop.
    if (business?.business?.id) {
      this.analytics.recordEvent({
        businessId: business.business.id,
        type: "view",
        visitorKey: this.analytics.visitorKey(ip, userAgent)
      });
    }

    return { data: business };
  }

  @Patch(":slug")
  @UseGuards(ManzilAuthGuard)
  @Roles("business_owner", "admin")
  async updateBusiness(
    @Param("slug") slug: string,
    @Body() body: BusinessUpdateDto,
    @Req() request: ManzilRequest
  ) {
    return {
      data: {
        business: await this.repository.updateBusiness(slug, body, request.manzilActor!)
      }
    };
  }

  @Post(":slug/reviews")
  @ThrottleWrite()
  @UseGuards(ManzilAuthGuard)
  @RequireAuth()
  async createReview(
    @Param("slug") slug: string,
    @Body() body: ReviewCreateDto,
    @Req() request: ManzilRequest
  ) {
    return {
      data: {
        review: await this.repository.createReview(
          {
            businessSlug: slug,
            rating: body.rating,
            text: body.text
          },
          request.manzilActor!
        )
      }
    };
  }
}
