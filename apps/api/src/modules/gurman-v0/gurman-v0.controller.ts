import { Body, Controller, Post } from "@nestjs/common";
import { ThrottleGurman } from "../security/throttle.config";
import { GurmanV0IntentDto } from "./gurman-v0.dto";
import { GurmanV0ResponseComposer } from "./gurman-v0.response-composer";
import { GurmanV0ScoringService } from "./gurman-v0.scoring.service";

@Controller("gurman/v0")
export class GurmanV0Controller {
  constructor(
    private readonly scoring: GurmanV0ScoringService,
    private readonly composer: GurmanV0ResponseComposer
  ) {}

  @Post("plan")
  @ThrottleGurman()
  async plan(@Body() intent: GurmanV0IntentDto) {
    const decision = await this.scoring.score(intent);
    return { data: await this.composer.compose(decision, "en") };
  }
}
