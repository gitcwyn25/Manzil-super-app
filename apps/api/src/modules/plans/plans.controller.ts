import { Controller, Get } from "@nestjs/common";
import { PlansRepository } from "./plans.repository";

/** Public, unauthenticated plan catalogue — the pricing page reads this. */
@Controller("plans")
export class PlansController {
  constructor(private readonly plans: PlansRepository) {}

  @Get()
  async list() {
    return { data: { plans: await this.plans.listPublicPlans() } };
  }
}
