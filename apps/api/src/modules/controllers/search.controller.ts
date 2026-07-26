import { Controller, Get, Query } from "@nestjs/common";
import { AnalyticsService } from "../analytics/analytics.service";
import { DatabaseRepository } from "../repositories/database.repository";
import { ThrottleSearch } from "../security/throttle.config";

@Controller("search")
export class SearchController {
  constructor(
    private readonly repository: DatabaseRepository,
    private readonly analytics: AnalyticsService
  ) {}

  @Get()
  @ThrottleSearch()
  async search(@Query("q") query = "", @Query("category") category = "all") {
    const businesses = await this.repository.search(query, category);

    // Logged here rather than inside the repository's cached loader: results
    // are cached, so logging there would record only cache misses and
    // under-report exactly the popular queries the platform dashboard needs.
    this.analytics.recordSearch({
      query,
      categorySlug: category,
      resultCount: businesses.length
    });

    return {
      data: {
        businesses,
        categories: await this.repository.listCategories()
      }
    };
  }
}
