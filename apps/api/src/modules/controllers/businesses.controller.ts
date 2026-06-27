import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import type { ReviewCreateRequest } from "@manzil/shared";
import { DemoRepository } from "../repositories/demo.repository";

@Controller("businesses")
export class BusinessesController {
  constructor(private readonly repository: DemoRepository) {}

  @Get()
  listBusinesses() {
    return {
      data: {
        businesses: this.repository.listBusinesses()
      }
    };
  }

  @Get(":slug")
  getBusiness(@Param("slug") slug: string) {
    return {
      data: this.repository.getBusiness(slug)
    };
  }

  @Post(":slug/reviews")
  createReview(@Param("slug") slug: string, @Body() body: Omit<ReviewCreateRequest, "businessSlug">) {
    return {
      data: {
        review: this.repository.createReview({
          businessSlug: slug,
          rating: Number(body.rating),
          text: body.text
        })
      }
    };
  }
}
