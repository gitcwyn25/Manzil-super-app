import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from "@nestjs/common";
import type { ClaimStatus, ModerationStatus, ReportStatus } from "@prisma/client";
import type { ManzilRequest } from "../auth/auth.types";
import { ManzilAuthGuard } from "../auth/manzil-auth.guard";
import { Roles } from "../auth/roles.decorator";
import { DatabaseRepository } from "../repositories/database.repository";

@Controller("admin")
@UseGuards(ManzilAuthGuard)
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
  async approveClaim(@Param("id") id: string, @Req() request: ManzilRequest) {
    return {
      data: await this.repository.approveClaim(id, request.manzilActor!.userId)
    };
  }

  @Post("claims/:id/reject")
  async rejectClaim(
    @Param("id") id: string,
    @Body() body: { note?: string },
    @Req() request: ManzilRequest
  ) {
    return {
      data: await this.repository.rejectClaim(id, request.manzilActor!.userId, body.note)
    };
  }

  @Get("moderation")
  async moderationQueue(@Query("status") status: ReportStatus = "open") {
    return {
      data: {
        reports: await this.repository.listModerationReports(status)
      }
    };
  }

  @Post("reports/:id/resolve")
  async resolveReport(
    @Param("id") id: string,
    @Body() body: { moderationStatus?: ModerationStatus }
  ) {
    return {
      data: {
        report: await this.repository.resolveReport(id, body.moderationStatus)
      }
    };
  }

  @Post("reports/:id/reject")
  async rejectReport(@Param("id") id: string) {
    return {
      data: {
        report: await this.repository.rejectReport(id)
      }
    };
  }
}
