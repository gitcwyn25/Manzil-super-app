import { Body, Controller, Get, Ip, Param, Post, Query, Req, UseGuards } from "@nestjs/common";
import { BusinessApplicationsRepository } from "./business-applications.repository";
import { BusinessApplicationDecisionDto } from "./business-applications.dto";
import { PermissionGuard, type ConsoleRequest } from "./permission.guard";
import { RequirePermission } from "./require-permission.decorator";

/**
 * Review queue for application-first business onboarding. It deliberately
 * shares the console session, RBAC, and audit boundary with company actions.
 */
@Controller("console")
@UseGuards(PermissionGuard)
export class BusinessApplicationsController {
  constructor(private readonly applications: BusinessApplicationsRepository) {}

  private ctx(request: ConsoleRequest, ip: string) {
    return { adminId: request.adminUser!.id, ip: ip ?? request.socket?.remoteAddress ?? null };
  }

  @Get("business-applications")
  @RequirePermission("business.view")
  async list(@Query("status") status?: string, @Query("q") q?: string, @Query("take") take?: string) {
    return {
      data: await this.applications.listApplications({
        status,
        q,
        take: take ? Number.parseInt(take, 10) : undefined
      })
    };
  }

  @Get("business-applications/:id")
  @RequirePermission("business.view")
  async detail(@Param("id") id: string) {
    return { data: await this.applications.getApplication(id) };
  }

  @Post("business-applications/:id/under-review")
  @RequirePermission("business.approve")
  async underReview(
    @Param("id") id: string,
    @Body() body: BusinessApplicationDecisionDto,
    @Req() request: ConsoleRequest,
    @Ip() ip: string
  ) {
    return { data: await this.applications.transitionApplication(id, "under_review", body.reason, this.ctx(request, ip)) };
  }

  @Post("business-applications/:id/request-changes")
  @RequirePermission("business.approve")
  async requestChanges(
    @Param("id") id: string,
    @Body() body: BusinessApplicationDecisionDto,
    @Req() request: ConsoleRequest,
    @Ip() ip: string
  ) {
    return { data: await this.applications.transitionApplication(id, "changes_requested", body.reason, this.ctx(request, ip)) };
  }

  @Post("business-applications/:id/approve")
  @RequirePermission("business.approve")
  async approve(
    @Param("id") id: string,
    @Body() body: BusinessApplicationDecisionDto,
    @Req() request: ConsoleRequest,
    @Ip() ip: string
  ) {
    return { data: await this.applications.transitionApplication(id, "approved", body.reason, this.ctx(request, ip)) };
  }

  @Post("business-applications/:id/reject")
  @RequirePermission("business.reject")
  async reject(
    @Param("id") id: string,
    @Body() body: BusinessApplicationDecisionDto,
    @Req() request: ConsoleRequest,
    @Ip() ip: string
  ) {
    return { data: await this.applications.transitionApplication(id, "rejected", body.reason, this.ctx(request, ip)) };
  }
}
