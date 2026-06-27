import { Body, Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import type { ClaimStatus } from "@prisma/client";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import { DatabaseRepository } from "../repositories/database.repository";

@Controller("admin")
@UseGuards(RolesGuard)
@Roles("admin")
export class AdminController {
  constructor(private readonly repository: DatabaseRepository) {}

  @Get("overview")
  async overview() {
    return {
      data: await this.repository.getAdminOverview()
    };
  }

  @Get("claims")
  async claims(@Query("status") status: ClaimStatus = "pending") {
    return {
      data: {
        claims: await this.repository.listClaims(status)
      }
    };
  }

  @Post("claims/:id/approve")
  async approveClaim(@Param("id") id: string) {
    return {
      data: await this.repository.approveClaim(id)
    };
  }

  @Post("claims/:id/reject")
  async rejectClaim(@Param("id") id: string, @Body() body: { note?: string }) {
    return {
      data: await this.repository.rejectClaim(id, "dev-admin", body.note)
    };
  }
}
