import { Controller, Get, NotFoundException, Param } from "@nestjs/common";
import { getCommunityList, getCommunityLists } from "@manzil/shared";
import { DatabaseRepository } from "../repositories/database.repository";

@Controller("lists")
export class ListsController {
  constructor(private readonly repository: DatabaseRepository) {}

  @Get()
  async listCommunityLists() {
    return {
      data: {
        lists: getCommunityLists()
      }
    };
  }

  @Get(":slug")
  async getCommunityList(@Param("slug") slug: string) {
    const list = getCommunityList(slug);

    if (!list) {
      throw new NotFoundException("List not found");
    }

    const slugs = new Set(list.businessSlugs);
    const businesses = (await this.repository.listBusinesses()).filter((business) => slugs.has(business.slug));

    return {
      data: {
        list,
        businesses
      }
    };
  }
}
