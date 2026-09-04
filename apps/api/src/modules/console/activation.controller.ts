import { Body, Controller, Get, Ip, Param, Patch, Post, Query, Req, UseFilters, UseGuards } from "@nestjs/common";
import { PermissionGuard, type ConsoleRequest } from "./permission.guard";
import { RequirePermission } from "./require-permission.decorator";
import { ActivationRepository } from "./activation.repository";
import { ActivationSchemaFilter } from "./activation-schema.filter";
import {
  OutboxRetryDto,
  SignatureProfileDto,
  WaitlistAssignmentDto,
  WaitlistCompanyConnectionDto,
  WaitlistEmailDraftDto,
  WaitlistTransitionDto
} from "./activation.dto";

/**
 * Merchant activation control-room endpoints. This controller deliberately
 * lives beside the existing console controller so every route uses the same
 * AdminUser session, permission guard, and audit boundary.
 */
@Controller("console")
@UseGuards(PermissionGuard)
@UseFilters(ActivationSchemaFilter)
export class ActivationController {
  constructor(private readonly activation: ActivationRepository) {}

  private ctx(request: ConsoleRequest, ip: string) {
    return { adminId: request.adminUser!.id, ip: ip ?? request.socket?.remoteAddress ?? null };
  }

  @Get("waitlist")
  @RequirePermission("waitlist.view")
  async waitlist(
    @Query("status") status?: string,
    @Query("topic") topic?: string,
    @Query("q") q?: string,
    @Query("assignedAdminId") assignedAdminId?: string,
    @Query("take") take?: string
  ) {
    return {
      data: await this.activation.listWaitlist({
        status,
        topic,
        q,
        assignedAdminId,
        take: take !== undefined ? Number(take) : undefined
      })
    };
  }

  @Post("waitlist/:id/transition")
  @RequirePermission("waitlist.manage")
  async transitionWaitlist(
    @Param("id") id: string,
    @Body() body: WaitlistTransitionDto,
    @Req() request: ConsoleRequest,
    @Ip() ip: string
  ) {
    return {
      data: await this.activation.transitionWaitlist(
        id,
        body.status,
        body.reason,
        this.ctx(request, ip),
        body.expectedUpdatedAt
      )
    };
  }

  @Patch("waitlist/:id/assignment")
  @RequirePermission("waitlist.manage")
  async assignWaitlist(
    @Param("id") id: string,
    @Body() body: WaitlistAssignmentDto,
    @Req() request: ConsoleRequest,
    @Ip() ip: string
  ) {
    return {
      data: await this.activation.assignWaitlist(
        id,
        body.adminId,
        this.ctx(request, ip),
        body.expectedUpdatedAt
      )
    };
  }

  @Post("waitlist/:id/connect")
  @RequirePermission("business.connect")
  async connectCompany(
    @Param("id") id: string,
    @Body() body: WaitlistCompanyConnectionDto,
    @Req() request: ConsoleRequest,
    @Ip() ip: string
  ) {
    return {
      data: await this.activation.connectCompany(
        id,
        body.businessId,
        body.reason,
        this.ctx(request, ip),
        body.expectedUpdatedAt
      )
    };
  }

  @Post("waitlist/:id/email-drafts")
  @RequirePermission("outbox.create")
  async queueEmailDraft(
    @Param("id") id: string,
    @Body() body: WaitlistEmailDraftDto,
    @Req() request: ConsoleRequest,
    @Ip() ip: string
  ) {
    return {
      data: await this.activation.queueEmailDraft(id, body ?? {}, this.ctx(request, ip))
    };
  }

  @Get("outbox")
  @RequirePermission("outbox.view")
  async outbox(
    @Query("status") status?: string,
    @Query("waitlistSignupId") waitlistSignupId?: string,
    @Query("take") take?: string
  ) {
    return {
      data: await this.activation.listOutbox({
        status,
        waitlistSignupId,
        take: take !== undefined ? Number(take) : undefined
      })
    };
  }

  @Post("outbox/:id/retry")
  @RequirePermission("outbox.retry")
  async retryOutbox(
    @Param("id") id: string,
    @Body() body: OutboxRetryDto,
    @Req() request: ConsoleRequest,
    @Ip() ip: string
  ) {
    return {
      data: await this.activation.retryOutbox(id, body.reason, this.ctx(request, ip))
    };
  }

  @Get("signature")
  @RequirePermission("signature.view")
  async signature(@Req() request: ConsoleRequest) {
    return { data: await this.activation.currentSignature(request.adminUser!.id) };
  }

  @Post("signature")
  @RequirePermission("signature.create")
  async activateSignature(
    @Body() body: SignatureProfileDto,
    @Req() request: ConsoleRequest,
    @Ip() ip: string
  ) {
    return {
      data: await this.activation.activateSignature(
        request.adminUser!.id,
        body.title,
        this.ctx(request, ip)
      )
    };
  }
}
