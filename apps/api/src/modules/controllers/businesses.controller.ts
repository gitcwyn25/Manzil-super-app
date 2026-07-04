import { Body, Controller, Get, Headers, Ip, Param, Patch, Post, Req, UseGuards } from "@nestjs/common";
import type { BusinessUpdateInput, ReviewCreateRequest } from "@manzil/shared";
import type { ManzilRequest } from "../auth/auth.types";
import { ManzilAuthGuard } from "../auth/manzil-auth.guard";
import { RequireAuth } from "../auth/require-auth.decorator";
import { Roles } from "../auth/roles.decorator";
import { CrmRepository } from "../crm/crm.repository";
import { DatabaseRepository } from "../repositories/database.repository";

@Controller("businesses")
export class BusinessesController {
  constructor(
    private readonly repository: DatabaseRepository,
    private readonly crm: CrmRepository
  ) {}

  /** Public, anonymous visit tracking for CRM analytics. */
  @Post(":slug/visit")
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
  async getBusiness(@Param("slug") slug: string) {
    return {
      data: await this.repository.getBusiness(slug)
    };
  }

  @Patch(":slug")
  @UseGuards(ManzilAuthGuard)
  @Roles("business_owner", "admin")
  async updateBusiness(
    @Param("slug") slug: string,
    @Body() body: BusinessUpdateInput,
    @Req() request: ManzilRequest
  ) {
    return {
      data: {
        business: await this.repository.updateBusiness(slug, body, request.manzilActor!)
      }
    };
  }

  @Post(":slug/reviews")
  @UseGuards(ManzilAuthGuard)
  @RequireAuth()
  async createReview(
    @Param("slug") slug: string,
    @Body() body: Omit<ReviewCreateRequest, "businessSlug">,
    @Req() request: ManzilRequest
  ) {
    return {
      data: {
        review: await this.repository.createReview(
          {
            businessSlug: slug,
            rating: Number(body.rating),
            text: body.text
          },
          request.manzilActor!
        )
      }
    };
  }
}
