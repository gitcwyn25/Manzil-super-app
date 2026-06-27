import { Body, Controller, Post } from "@nestjs/common";
import type { ClaimCreateRequest } from "@manzil/shared";
import { DemoRepository } from "../repositories/demo.repository";

@Controller("claims")
export class ClaimsController {
  constructor(private readonly repository: DemoRepository) {}

  @Post()
  createClaim(@Body() body: ClaimCreateRequest) {
    const claim = this.repository.createClaim(body);

    return {
      data: {
        id: claim.id,
        status: claim.status
      }
    };
  }
}
