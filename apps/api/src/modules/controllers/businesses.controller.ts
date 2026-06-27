import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import type { ReviewCreateRequest } from "@manzil/shared";
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

  @Post(":slug/reviews")
  async createReview(@Param("slug") slug: string, @Body() body: Omit<ReviewCreateRequest, "businessSlug">) {
    return {
      data: {
        review: await this.repository.createReview({
          businessSlug: slug,
          rating: Number(body.rating),
          text: body.text
        })
      }
    };
  }
}
