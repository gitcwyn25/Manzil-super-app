import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from "@nestjs/common";
import type { BusinessUpdateInput, ReviewCreateRequest } from "@manzil/shared";
import type { ManzilRequest } from "../auth/auth.types";
import { ManzilAuthGuard } from "../auth/manzil-auth.guard";
import { RequireAuth } from "../auth/require-auth.decorator";
import { Roles } from "../auth/roles.decorator";
import { DatabaseRepository } from "../repositories/database.repository";

@Controller("businesses")
export class BusinessesController {
  constructor(private readonly repository: DatabaseRepository) {}

  @Get()
  async listBusinesses() {
    return {
      data: {
        businesses: await this.repository.listBusinesses()
      }
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
