import { Body, Controller, Post, Req, UseGuards } from "@nestjs/common";
import type { ManzilRequest } from "../auth/auth.types";
import { ManzilAuthGuard } from "../auth/manzil-auth.guard";
import { RequireAuth } from "../auth/require-auth.decorator";
import { DatabaseRepository } from "../repositories/database.repository";
import { ThrottleRegister } from "../security/throttle.config";
import { ClaimCreateDto } from "./moderation.dto";

@Controller("claims")
export class ClaimsController {
  constructor(private readonly repository: DatabaseRepository) {}

  /**
   * Rate-limited like registration, because it is the other way a user
   * acquires a business. `createClaim` flips the target to `pending_claim`
   * and writes to the caller's own User row; on the default 300/min a script
   * could walk the unclaimed directory, mass-flip it into a pending state and
   * bury the admin queue. Hijacking an already-claimed business is refused
   * separately, so this is spam control, not the ownership boundary
   * (SECURITY-AUDIT F-4).
   */
  @Post()
  @UseGuards(ManzilAuthGuard)
  @RequireAuth()
  @ThrottleRegister()
  async createClaim(@Body() body: ClaimCreateDto, @Req() request: ManzilRequest) {
    const claim = await this.repository.createClaim(body, request.manzilActor!);

    return {
      data: {
        id: claim.id,
        status: claim.status
      }
    };
  }
}
