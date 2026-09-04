import { Body, Controller, Get, Ip, Param, Patch, Post, Query, Req, UseGuards } from "@nestjs/common";
import { ConsoleRepository } from "./console.repository";
import { ConsoleCurationRepository } from "./console-curation.repository";
import { ConsoleNotificationsRepository } from "./console-notifications.repository";
import { ConsoleSupabaseRepository } from "./console-supabase.repository";
import { AnalyticsRepository } from "../analytics/analytics.repository";
import { parseWindow } from "../analytics/analytics.controller";
import { PermissionGuard, type ConsoleRequest } from "./permission.guard";
import { RequirePermission } from "./require-permission.decorator";
import {
  AdminReasonDto,
  ConsoleBusinessEditDto,
  MergeBusinessDto,
  PlanUpdateDto,
  SetPlanFeatureDto
} from "../controllers/moderation.dto";
import {
  ModeratePhotoDto,
  PublishLegalDocumentDto,
  SetFeaturedDto,
  UpsertCategoryDto
} from "./curation.dto";

/**
 * Admin console API. Class-level PermissionGuard authorizes every route:
 * the caller must be an active AdminUser, and each handler declares the exact
 * permission it needs. Read endpoints on sensitive data are guarded too.
 */
@Controller("console")
@UseGuards(PermissionGuard)
export class ConsoleController {
  constructor(
    private readonly repo: ConsoleRepository,
    private readonly analytics: AnalyticsRepository,
    private readonly curation: ConsoleCurationRepository,
    private readonly notificationsRepo: ConsoleNotificationsRepository,
    private readonly supabaseRepo: ConsoleSupabaseRepository
  ) {}

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

  /**
   * Platform-wide analytics.
   *
   * Lives on the console rather than the public `/analytics` controller so it
   * uses the same AdminUser + permission model as every other admin route. The
   * `/analytics` controller authenticates against `User.role`, which is a
   * different identity system — mixing the two on one admin surface is how a
   * permission check ends up bypassed.
   */
  @Get("analytics")
  @RequirePermission("analytics.view")
  async platformAnalytics(@Query("days") days?: string) {
    return { data: await this.analytics.platformOverview(parseWindow(days)) };
  }

  /* ---------- businesses ---------- */

  @Get("businesses")
  @RequirePermission("business.view")
  async businesses(@Query("status") status?: string, @Query("q") q?: string, @Query("take") take?: string) {
    return { data: { businesses: await this.repo.listBusinesses({ status, q, take: take !== undefined ? Number(take) : undefined }) } };
  }

  @Get("businesses/:id/duplicates")
  @RequirePermission("business.view")
  async duplicates(@Param("id") id: string) {
    return { data: { duplicates: await this.repo.findDuplicates(id) } };
  }

  /** Single business control centre: profile, legal/contract records, pending photos, activity. */
  @Get("businesses/:id/detail")
  @RequirePermission("business.view")
  async businessDetail(@Param("id") id: string) {
    return { data: await this.curation.getBusinessDetail(id) };
  }

  /** Customers plus review authors for one business, deduplicated by account. */
  @Get("businesses/:id/consumers")
  @RequirePermission("business.view")
  async businessConsumers(@Param("id") id: string) {
    return { data: await this.curation.getBusinessConsumers(id) };
  }

  @Post("businesses/:id/feature")
  @RequirePermission("business.edit")
  async setFeatured(
    @Param("id") id: string,
    @Body() body: SetFeaturedDto,
    @Req() r: ConsoleRequest,
    @Ip() ip: string
  ) {
    return { data: await this.curation.setBusinessFeatured(id, body.featured, this.ctx(r, ip)) };
  }

  /* ---------- media moderation ---------- */

  /**
   * Photo moderation is per-business rather than a global queue: pending media
   * volume is low at this stage, and reviewing a photo alongside the listing it
   * belongs to gives the moderator the context to judge it. Revisit if the
   * pending count outgrows the business-detail page.
   */
  @Post("photos/:id/moderate")
  @RequirePermission("media.approve")
  async moderatePhoto(
    @Param("id") id: string,
    @Body() body: ModeratePhotoDto,
    @Req() r: ConsoleRequest,
    @Ip() ip: string
  ) {
    return {
      data: await this.curation.moderatePhoto(id, body.decision, body.reason, this.ctx(r, ip))
    };
  }

  /* ---------- legal documents ---------- */

  @Get("legal")
  @RequirePermission("legal.view")
  async legalDocuments() {
    return { data: { documents: await this.curation.listLegalDocuments() } };
  }

  @Post("legal")
  @RequirePermission("legal.publish")
  async publishLegal(
    @Body() body: PublishLegalDocumentDto,
    @Req() r: ConsoleRequest,
    @Ip() ip: string
  ) {
    return { data: await this.curation.publishLegalDocument(body, this.ctx(r, ip)) };
  }

  /* ---------- categories ---------- */

  @Get("categories")
  @RequirePermission("business.view")
  async categories() {
    return { data: { categories: await this.curation.listCategories() } };
  }

  @Post("categories")
  @RequirePermission("category.manage")
  async upsertCategory(
    @Body() body: UpsertCategoryDto,
    @Req() r: ConsoleRequest,
    @Ip() ip: string
  ) {
    return { data: await this.curation.upsertCategory(body, this.ctx(r, ip)) };
  }

  @Post("businesses/:id/approve")
  @RequirePermission("business.approve")
  async approveBusiness(@Param("id") id: string, @Req() r: ConsoleRequest, @Ip() ip: string) {
    return { data: await this.repo.approveBusiness(id, this.ctx(r, ip)) };
  }

  @Post("businesses/:id/reject")
  @RequirePermission("business.reject")
  async rejectBusiness(@Param("id") id: string, @Body() body: AdminReasonDto, @Req() r: ConsoleRequest, @Ip() ip: string) {
    return { data: await this.repo.rejectBusiness(id, body.reason ?? "", this.ctx(r, ip)) };
  }

  @Patch("businesses/:id")
  @RequirePermission("business.edit")
  async editBusiness(@Param("id") id: string, @Body() body: ConsoleBusinessEditDto, @Req() r: ConsoleRequest, @Ip() ip: string) {
    return { data: await this.repo.editBusiness(id, { ...body }, this.ctx(r, ip)) };
  }

  @Post("businesses/:id/merge")
  @RequirePermission("business.merge")
  async mergeBusiness(
    @Param("id") id: string,
    @Body() body: MergeBusinessDto,
    @Req() r: ConsoleRequest,
    @Ip() ip: string
  ) {
    return { data: await this.repo.mergeBusiness(id, body.targetId, body.reason ?? "", this.ctx(r, ip)) };
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
  async rejectReview(@Param("id") id: string, @Body() body: AdminReasonDto, @Req() r: ConsoleRequest, @Ip() ip: string) {
    return { data: await this.repo.setReviewModeration(id, "reject", body.reason, this.ctx(r, ip)) };
  }

  @Post("reviews/:id/delete")
  @RequirePermission("review.delete")
  async deleteReview(@Param("id") id: string, @Body() body: AdminReasonDto, @Req() r: ConsoleRequest, @Ip() ip: string) {
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
  async banUser(@Param("id") id: string, @Body() body: AdminReasonDto, @Req() r: ConsoleRequest, @Ip() ip: string) {
    return { data: await this.repo.setUserStatus(id, "ban", body.reason, this.ctx(r, ip)) };
  }

  @Post("users/:id/suspend")
  @RequirePermission("user.suspend")
  async suspendUser(@Param("id") id: string, @Body() body: AdminReasonDto, @Req() r: ConsoleRequest, @Ip() ip: string) {
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
    @Body() body: PlanUpdateDto,
    @Req() r: ConsoleRequest,
    @Ip() ip: string
  ) {
    return { data: await this.repo.updatePlan(tier, body, this.ctx(r, ip)) };
  }

  @Post("plans/:tier/features")
  @RequirePermission("plan.manage")
  async setPlanFeature(
    @Param("tier") tier: string,
    @Body() body: SetPlanFeatureDto,
    @Req() r: ConsoleRequest,
    @Ip() ip: string
  ) {
    return { data: await this.repo.setPlanFeature(tier, body.key, body.included ?? true, this.ctx(r, ip)) };
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

  /* ---------- notifications ---------- */

  @Get("notifications")
  @RequirePermission("notification.view")
  async notifications(@Query("unread") unread?: string, @Query("limit") limit?: string) {
    const parsedLimit = limit !== undefined ? Number(limit) : undefined;
    return {
      data: await this.notificationsRepo.list({
        unread: unread === "true",
        limit: parsedLimit
      })
    };
  }

  // NOTE: this literal route MUST be declared before "notifications/:id/read"
  // — Nest matches routes in declaration order, and the dynamic segment would
  // otherwise swallow "read-all" as an :id.
  @Post("notifications/read-all")
  @RequirePermission("notification.view")
  async markAllNotificationsRead(@Req() r: ConsoleRequest, @Ip() ip: string) {
    return { data: await this.notificationsRepo.markAllRead(this.ctx(r, ip)) };
  }

  @Post("notifications/:id/read")
  @RequirePermission("notification.view")
  async markNotificationRead(@Param("id") id: string, @Req() r: ConsoleRequest, @Ip() ip: string) {
    return { data: await this.notificationsRepo.markRead(id, this.ctx(r, ip)) };
  }

  /* ---------- read-only Supabase browser ----------
   * Every handler below is read-only: no endpoint accepts a SQL string, and
   * `:table` is checked against a hardcoded allowlist before it ever reaches
   * Prisma (see ConsoleSupabaseRepository). Every call is audited — browsing
   * production data, including other people's PII, is an auditable act. */

  @Get("supabase/overview")
  @RequirePermission("supabase.view")
  async supabaseOverview(@Req() r: ConsoleRequest, @Ip() ip: string) {
    return { data: await this.supabaseRepo.overview(this.ctx(r, ip)) };
  }

  @Get("supabase/storage")
  @RequirePermission("supabase.view")
  async supabaseStorage(@Req() r: ConsoleRequest, @Ip() ip: string) {
    return { data: await this.supabaseRepo.storageOverview(this.ctx(r, ip)) };
  }

  @Get("supabase/tables/:table")
  @RequirePermission("supabase.view")
  async supabaseTable(
    @Param("table") table: string,
    @Query("limit") limit: string | undefined,
    @Query("offset") offset: string | undefined,
    @Req() r: ConsoleRequest,
    @Ip() ip: string
  ) {
    return {
      data: await this.supabaseRepo.tableRows(table, Number(limit ?? 50), Number(offset ?? 0), this.ctx(r, ip))
    };
  }
}
