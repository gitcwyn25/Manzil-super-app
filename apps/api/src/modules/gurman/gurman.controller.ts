import { Body, Controller, Post } from "@nestjs/common";
import { ThrottleGurman } from "../security/throttle.config";
import { GurmanAskDto } from "./gurman.dto";
import { GurmanService } from "./gurman.service";

@Controller("gurman")
export class GurmanController {
  constructor(private readonly gurman: GurmanService) {}

  /**
   * Public by design, not an oversight: `/concierge` on the web has no auth
   * wall — `apps/web/middleware.ts` protects only `/:locale/admin(.*)` — so
   * gating this behind sign-in would break the anonymous-browsing feature it
   * serves. `ThrottleGurman` (10 requests / 15 min, 30 min block) is
   * therefore the primary cost control here, not a secondary one.
   */
  @Post("ask")
  @ThrottleGurman()
  async ask(@Body() body: GurmanAskDto) {
    const result = await this.gurman.ask(body.query, body.locale);
    return { data: result };
  }
}
