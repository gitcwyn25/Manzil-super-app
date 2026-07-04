import { BadRequestException, Body, Controller, Get, Param, Post, Query, Req, UseGuards } from "@nestjs/common";
import type { ClaimStatus, ModerationStatus, ReportStatus } from "@prisma/client";
import type { ManzilRequest } from "../auth/auth.types";
import { ManzilAuthGuard } from "../auth/manzil-auth.guard";
import { Roles } from "../auth/roles.decorator";
import { DatabaseRepository } from "../repositories/database.repository";

const CLAIM_STATUSES = ["pending", "approved", "rejected"] as const;
const REPORT_STATUSES = ["open", "resolved", "rejected"] as const;
const MODERATION_STATUSES = ["pending", "approved", "rejected"] as const;

function parseEnum<T extends string>(value: string | undefined, allowed: readonly T[], fallback: T): T {
  if (value === undefined || value === "") {
    return fallback;
  }

  if (!allowed.includes(value as T)) {
    throw new BadRequestException(`Invalid value "${value}". Allowed: ${allowed.join(", ")}`);
  }

  return value as T;
}

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
  async claims(@Query("status") status?: string) {
    return {
      data: {
        claims: await this.repository.listClaims(parseEnum<ClaimStatus>(status, CLAIM_STATUSES, "pending"))
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
  async moderationQueue(@Query("status") status?: string) {
    return {
      data: {
        reports: await this.repository.listModerationReports(
          parseEnum<ReportStatus>(status, REPORT_STATUSES, "open")
        )
      }
    };
  }

  @Post("reports/:id/resolve")
  async resolveReport(
    @Param("id") id: string,
    @Body() body: { moderationStatus?: string }
  ) {
    return {
      data: {
        report: await this.repository.resolveReport(
          id,
          parseEnum<ModerationStatus>(body.moderationStatus, MODERATION_STATUSES, "rejected")
        )
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
