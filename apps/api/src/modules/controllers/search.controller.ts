import { Controller, Get, Query } from "@nestjs/common";
import { DemoRepository } from "../repositories/demo.repository";

@Controller("search")
export class SearchController {
  constructor(private readonly repository: DemoRepository) {}

  @Get()
  search(@Query("q") query = "", @Query("category") category = "all") {
    return {
      data: {
        businesses: this.repository.search(query, category),
        categories: this.repository.listCategories()
      }
    };
  }
}
