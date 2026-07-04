import { Controller, Get, NotFoundException, Param } from "@nestjs/common";
import { getOccasion, getOccasions } from "@manzil/shared";
import { DatabaseRepository } from "../repositories/database.repository";

@Controller("occasions")
export class OccasionsController {
  constructor(private readonly repository: DatabaseRepository) {}

  @Get()
  async listOccasions() {
    return {
      data: {
        occasions: getOccasions()
      }
    };
  }

  @Get(":slug")
  async getOccasion(@Param("slug") slug: string) {
    const occasion = getOccasion(slug);

    if (!occasion) {
      throw new NotFoundException("Occasion not found");
    }

    const slugs = new Set(occasion.businessSlugs);
    const businesses = (await this.repository.listBusinesses()).filter((business) => slugs.has(business.slug));

    return {
      data: {
        occasion,
        businesses
      }
    };
  }
}
