import { Body, Controller, Post } from "@nestjs/common";
import type { ClaimCreateRequest } from "@manzil/shared";
import { DatabaseRepository } from "../repositories/database.repository";

@Controller("claims")
export class ClaimsController {
  constructor(private readonly repository: DatabaseRepository) {}

  @Post()
  async createClaim(@Body() body: ClaimCreateRequest) {
    const claim = await this.repository.createClaim(body);

    return {
      data: {
        id: claim.id,
        status: claim.status
      }
    };
  }
}
