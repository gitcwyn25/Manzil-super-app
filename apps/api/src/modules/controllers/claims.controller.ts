import { Body, Controller, Post, Req, UseGuards } from "@nestjs/common";
import type { ClaimCreateRequest } from "@manzil/shared";
import type { ManzilRequest } from "../auth/auth.types";
import { ManzilAuthGuard } from "../auth/manzil-auth.guard";
import { RequireAuth } from "../auth/require-auth.decorator";
import { DatabaseRepository } from "../repositories/database.repository";

@Controller("claims")
export class ClaimsController {
  constructor(private readonly repository: DatabaseRepository) {}

  @Post()
  @UseGuards(ManzilAuthGuard)
  @RequireAuth()
  async createClaim(@Body() body: ClaimCreateRequest, @Req() request: ManzilRequest) {
    const claim = await this.repository.createClaim(body, request.manzilActor!);

    return {
      data: {
        id: claim.id,
        status: claim.status
      }
    };
  }
}
