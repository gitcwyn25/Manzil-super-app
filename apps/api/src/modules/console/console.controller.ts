import { Body, Controller, Get, Ip, Param, Patch, Post, Query, Req, UseGuards } from "@nestjs/common";
import { ConsoleRepository } from "./console.repository";
import { PermissionGuard, type ConsoleRequest } from "./permission.guard";
import { RequirePermission } from "./require-permission.decorator";

/**
 * Admin console API. Class-level PermissionGuard authorizes every route:
 * the caller must be an active AdminUser, and each handler declares the exact
 * permission it needs. Read endpoints on sensitive data are guarded too.
 */
@Controller("console")
@UseGuards(PermissionGuard)
export class ConsoleController {
  constructor(private readonly repo: ConsoleRepository) {}

  private ctx(request: ConsoleRequest, ip: string) {
    return { adminId: request.adminUser!.id, ip: ip ?? request.socket?.remoteAddress ?? null };
  }

  /* ---------- session / dashboard ---------- */

  @Get("me")
  me(@Req() request: ConsoleRequest) {
    const a = request.adminUser!;
    return { data: { id: a.id, email: a.email, name: a.name, roles: a.roles, permissions: [...a.permissions] } };
  }

  @Get("overview")
  @RequirePermission("analytics.view")
  async overview() {
    return { data: await this.repo.overview() };
  }

  /* ---------- businesses ---------- */

  @Get("businesses")
  @RequirePermission("business.view")
  async businesses(@Query("status") status?: string, @Query("q") q?: string) {
    return { data: { businesses: await this.repo.listBusinesses({ status, q }) } };
  }

  @Get("businesses/:id/duplicates")
  @RequirePermission("business.view")
  async duplicates(@Param("id") id: string) {
    return { data: { duplicates: await this.repo.findDuplicates(id) } };
  }

  @Post("businesses/:id/approve")
  @RequirePermission("business.approve")
  async approveBusiness(@Param("id") id: string, @Req() r: ConsoleRequest, @Ip() ip: string) {
    return { data: await this.repo.approveBusiness(id, this.ctx(r, ip)) };
  }

  @Post("businesses/:id/reject")
  @RequirePermission("business.reject")
  async rejectBusiness(@Param("id") id: string, @Body() body: { reason?: string }, @Req() r: ConsoleRequest, @Ip() ip: string) {
    return { data: await this.repo.rejectBusiness(id, body.reason ?? "", this.ctx(r, ip)) };
  }

  @Patch("businesses/:id")
  @RequirePermission("business.edit")
  async editBusiness(@Param("id") id: string, @Body() body: Record<string, unknown>, @Req() r: ConsoleRequest, @Ip() ip: string) {
    return { data: await this.repo.editBusiness(id, body, this.ctx(r, ip)) };
  }

  @Post("businesses/:id/merge")
  @RequirePermission("business.merge")
  async mergeBusiness(
    @Param("id") id: string,
    @Body() body: { targetId?: string; reason?: string },
    @Req() r: ConsoleRequest,
    @Ip() ip: string
  ) {
    return { data: await this.repo.mergeBusiness(id, body.targetId ?? "", body.reason ?? "", this.ctx(r, ip)) };
  }

  /* ---------- reviews ---------- */

  @Get("reviews")
  @RequirePermission("review.view")
  async reviews(@Query("status") status?: string, @Query("flagged") flagged?: string) {
    return { data: { reviews: await this.repo.listReviews({ status, flagged: flagged === "true" }) } };
  }

  @Post("reviews/:id/approve")
  @RequirePermission("review.approve")
  async approveReview(@Param("id") id: string, @Req() r: ConsoleRequest, @Ip() ip: string) {
    return { data: await this.repo.setReviewModeration(id, "approve", undefined, this.ctx(r, ip)) };
  }

  @Post("reviews/:id/reject")
  @RequirePermission("review.reject")
  async rejectReview(@Param("id") id: string, @Body() body: { reason?: string }, @Req() r: ConsoleRequest, @Ip() ip: string) {
    return { data: await this.repo.setReviewModeration(id, "reject", body.reason, this.ctx(r, ip)) };
  }

  @Post("reviews/:id/delete")
  @RequirePermission("review.delete")
  async deleteReview(@Param("id") id: string, @Body() body: { reason?: string }, @Req() r: ConsoleRequest, @Ip() ip: string) {
    return { data: await this.repo.setReviewModeration(id, "delete", body.reason, this.ctx(r, ip)) };
  }

  /* ---------- users ---------- */

  @Get("users")
  @RequirePermission("user.view")
  async users(@Query("q") q?: string, @Query("status") status?: string) {
    return { data: { users: await this.repo.listUsers({ q, status }) } };
  }

  @Get("users/:id")
  @RequirePermission("user.view")
  async user(@Param("id") id: string) {
    return { data: await this.repo.getUser(id) };
  }

  @Post("users/:id/ban")
  @RequirePermission("user.ban")
  async banUser(@Param("id") id: string, @Body() body: { reason?: string }, @Req() r: ConsoleRequest, @Ip() ip: string) {
    return { data: await this.repo.setUserStatus(id, "ban", body.reason, this.ctx(r, ip)) };
  }

  @Post("users/:id/suspend")
  @RequirePermission("user.suspend")
  async suspendUser(@Param("id") id: string, @Body() body: { reason?: string }, @Req() r: ConsoleRequest, @Ip() ip: string) {
    return { data: await this.repo.setUserStatus(id, "suspend", body.reason, this.ctx(r, ip)) };
  }

  @Post("users/:id/unban")
  @RequirePermission("user.unban")
  async unbanUser(@Param("id") id: string, @Req() r: ConsoleRequest, @Ip() ip: string) {
    return { data: await this.repo.setUserStatus(id, "unban", undefined, this.ctx(r, ip)) };
  }

  /* ---------- plans (dynamic pricing) ---------- */

  @Get("plans")
  @RequirePermission("plan.manage")
  async plans() {
    return { data: { plans: await this.repo.listPlans() } };
  }

  @Patch("plans/:tier")
  @RequirePermission("plan.manage")
  async updatePlan(
    @Param("tier") tier: string,
    @Body() body: Record<string, unknown>,
    @Req() r: ConsoleRequest,
    @Ip() ip: string
  ) {
    return { data: await this.repo.updatePlan(tier, body, this.ctx(r, ip)) };
  }

  @Post("plans/:tier/features")
  @RequirePermission("plan.manage")
  async setPlanFeature(
    @Param("tier") tier: string,
    @Body() body: { key?: string; included?: boolean },
    @Req() r: ConsoleRequest,
    @Ip() ip: string
  ) {
    return { data: await this.repo.setPlanFeature(tier, body.key ?? "", body.included ?? true, this.ctx(r, ip)) };
  }

  /* ---------- audit ---------- */

  @Get("audit")
  @RequirePermission("audit.view")
  async audit(
    @Query("actorId") actorId?: string,
    @Query("action") action?: string,
    @Query("targetType") targetType?: string
  ) {
    return { data: { entries: await this.repo.listAudit({ actorId, action, targetType }) } };
  }
}
