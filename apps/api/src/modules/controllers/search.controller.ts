import { Controller, Get, Query } from "@nestjs/common";
import { DatabaseRepository } from "../repositories/database.repository";

@Controller("search")
export class SearchController {
  constructor(private readonly repository: DatabaseRepository) {}

  @Get()
  async search(@Query("q") query = "", @Query("category") category = "all") {
    return {
      data: {
        businesses: await this.repository.search(query, category),
        categories: await this.repository.listCategories()
      }
    };
  }
}
