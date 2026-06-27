import { Controller, Get } from "@nestjs/common";
import { DemoRepository } from "../repositories/demo.repository";

@Controller("admin")
export class AdminController {
  constructor(private readonly repository: DemoRepository) {}

  @Get("overview")
  overview() {
    const businesses = this.repository.listBusinesses();

    return {
      data: {
        businessCount: businesses.length,
        pendingClaimCount: businesses.filter((business) => business.status !== "claimed").length,
        categoryCount: this.repository.listCategories().length,
        reviewCount: this.repository.listReviews().length,
        flaggedItemCount: 0
      }
    };
  }
}
