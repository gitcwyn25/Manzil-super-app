import { Injectable, NotFoundException, ConflictException, BadRequestException } from "@nestjs/common";
import type { BusinessStatus, ModerationStatus, PlanTier, ReportStatus, UserStatus } from "@prisma/client";
import { CacheService } from "../cache/cache.service";
import { PrismaService } from "../prisma.service";
import { PlansRepository } from "../plans/plans.repository";
import { requireReason, writeAudit } from "./audit.util";

type ActorCtx = { adminId: string; ip?: string | null };

@Injectable()
export class ConsoleRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
    private readonly plans: PlansRepository
  ) {}

  /* ================= Plans (dynamic pricing) ================= */

  async listPlans() {
    return this.plans.listPlansForAdmin();
  }

  async updatePlan(
    tier: string,
    input: {
      priceMonthly?: number;
      priceYearly?: number | null;
      nameUz?: string;
      nameRu?: string;
      nameEn?: string;
      photoLimit?: number | null;
      staffLimit?: number;
      locationLimit?: number;
      isActive?: boolean;
    },
    ctx: ActorCtx
  ) {
    const PLAN_TIERS: PlanTier[] = ["free", "pro", "max"];
    if (!PLAN_TIERS.includes(tier as PlanTier)) throw new BadRequestException("Unknown plan tier");
    if (input.priceMonthly !== undefined && (!Number.isFinite(input.priceMonthly) || input.priceMonthly < 0 || input.priceMonthly > 1_000_000_000)) {
      throw new BadRequestException("priceMonthly must be between 0 and 1,000,000,000");
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const before = await tx.plan.findUnique({ where: { tier: tier as PlanTier } });
      if (!before) throw new NotFoundException("Plan not found");

      const after = await tx.plan.update({
        where: { tier: tier as PlanTier },
        data: {
          ...(input.priceMonthly !== undefined ? { priceMonthly: input.priceMonthly } : {}),
          ...(input.priceYearly !== undefined ? { priceYearly: input.priceYearly } : {}),
          ...(input.nameUz !== undefined ? { nameUz: input.nameUz } : {}),
          ...(input.nameRu !== undefined ? { nameRu: input.nameRu } : {}),
          ...(input.nameEn !== undefined ? { nameEn: input.nameEn } : {}),
          ...(input.photoLimit !== undefined ? { photoLimit: input.photoLimit } : {}),
          ...(input.staffLimit !== undefined ? { staffLimit: input.staffLimit } : {}),
          ...(input.locationLimit !== undefined ? { locationLimit: input.locationLimit } : {}),
          ...(input.isActive !== undefined ? { isActive: input.isActive } : {})
        }
      });

      await writeAudit(tx, {
        actorId: ctx.adminId,
        action: "plan.update",
        targetType: "plan",
        targetId: tier,
        beforeState: { priceMonthly: Number(before.priceMonthly), isActive: before.isActive },
        afterState: { priceMonthly: Number(after.priceMonthly), isActive: after.isActive },
        ipAddress: ctx.ip
      });

      return { tier, priceMonthly: Number(after.priceMonthly), isActive: after.isActive };
    });

    // Dynamic pricing takes effect immediately across public + entitlement caches.
    await this.plans.invalidateCache();
    return result;
  }

  async setPlanFeature(tier: string, key: string, included: boolean, ctx: ActorCtx) {
    const trimmedKey = key?.trim();
    if (!trimmedKey) throw new BadRequestException("Feature key is required");

    const result = await this.prisma.$transaction(async (tx) => {
      const plan = await tx.plan.findUnique({ where: { tier: tier as PlanTier } });
      if (!plan) throw new NotFoundException("Plan not found");

      await tx.planFeature.upsert({
        where: { planId_key: { planId: plan.id, key: trimmedKey } },
        update: { included },
        create: { planId: plan.id, key: trimmedKey, included }
      });

      await writeAudit(tx, {
        actorId: ctx.adminId,
        action: "plan.feature.set",
        targetType: "plan",
        targetId: tier,
        afterState: { key: trimmedKey, included },
        ipAddress: ctx.ip
      });

      return { tier, key: trimmedKey, included };
    });

    await this.plans.invalidateCache();
    return result;
  }

  /* ================= Businesses ================= */

  async listBusinesses(params: { status?: string; q?: string; take?: number }) {
    const take = Math.min(params.take ?? 50, 100);
    const status = ["unclaimed", "pending_claim", "claimed", "suspended"].includes(params.status ?? "")
      ? (params.status as BusinessStatus)
      : undefined;
    const q = params.q?.trim();

    const items = await this.prisma.business.findMany({
      where: {
        ...(status ? { status } : {}),
        mergedIntoId: null,
        ...(q
          ? {
              OR: [
                { name: { contains: q, mode: "insensitive" } },
                { address: { contains: q, mode: "insensitive" } },
                { district: { contains: q, mode: "insensitive" } }
              ]
            }
          : {})
      },
      include: { category: true, claimedByUser: { select: { id: true, email: true, displayName: true } } },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      take
    });

    return items.map((b) => ({
      id: b.id,
      slug: b.slug,
      name: b.name,
      status: b.status,
      category: b.category.nameEn,
      district: b.district,
      address: b.address,
      phone: b.phone,
      avgRating: Number(b.avgRating),
      reviewCount: b.reviewCount,
      owner: b.claimedByUser,
      createdAt: b.createdAt.toISOString()
    }));
  }

  /** Fuzzy duplicate detection: same district, similar name (trigram-ish via ILIKE tokens). */
  async findDuplicates(businessId: string) {
    const target = await this.prisma.business.findUnique({ where: { id: businessId } });
    if (!target) throw new NotFoundException("Business not found");

    const tokens = target.name.toLowerCase().split(/\s+/).filter((t) => t.length >= 3).slice(0, 4);
    if (tokens.length === 0) return [];

    const candidates = await this.prisma.business.findMany({
      where: {
        id: { not: businessId },
        mergedIntoId: null,
        district: target.district,
        OR: tokens.map((t) => ({ name: { contains: t, mode: "insensitive" as const } }))
      },
      select: { id: true, slug: true, name: true, address: true, status: true, reviewCount: true },
      take: 20
    });

    // score by shared tokens + geo proximity when coords exist
    return candidates
      .map((c) => {
        const cTokens = new Set(c.name.toLowerCase().split(/\s+/));
        const overlap = tokens.filter((t) => cTokens.has(t)).length;
        return { ...c, score: overlap / tokens.length };
      })
      .sort((a, b) => b.score - a.score);
  }

  async approveBusiness(id: string, ctx: ActorCtx) {
    return this.prisma.$transaction(async (tx) => {
      const before = await tx.business.findUnique({ where: { id } });
      if (!before) throw new NotFoundException("Business not found");
      if (before.status === "claimed") throw new ConflictException("Business already approved/claimed");

      const after = await tx.business.update({ where: { id }, data: { status: "claimed" } });
      await writeAudit(tx, {
        actorId: ctx.adminId,
        action: "business.approve",
        targetType: "business",
        targetId: id,
        beforeState: { status: before.status },
        afterState: { status: after.status },
        ipAddress: ctx.ip
      });
      return { id, status: after.status };
    });
  }

  async rejectBusiness(id: string, reason: string, ctx: ActorCtx) {
    const validReason = requireReason(reason);
    return this.prisma.$transaction(async (tx) => {
      const before = await tx.business.findUnique({ where: { id } });
      if (!before) throw new NotFoundException("Business not found");

      const after = await tx.business.update({ where: { id }, data: { status: "suspended" } });
      await writeAudit(tx, {
        actorId: ctx.adminId,
        action: "business.reject",
        targetType: "business",
        targetId: id,
        beforeState: { status: before.status },
        afterState: { status: after.status },
        reason: validReason,
        ipAddress: ctx.ip
      });
      return { id, status: after.status };
    });
  }

  async editBusiness(id: string, patch: Record<string, unknown>, ctx: ActorCtx) {
    const allowed = ["name", "address", "district", "phone", "email", "website", "priceTier"] as const;
    const data: Record<string, unknown> = {};
    for (const key of allowed) if (patch[key] !== undefined) data[key] = patch[key];
    if (Object.keys(data).length === 0) throw new BadRequestException("No editable fields provided");

    return this.prisma.$transaction(async (tx) => {
      const before = await tx.business.findUnique({ where: { id } });
      if (!before) throw new NotFoundException("Business not found");

      const after = await tx.business.update({ where: { id }, data });
      await writeAudit(tx, {
        actorId: ctx.adminId,
        action: "business.edit",
        targetType: "business",
        targetId: id,
        beforeState: Object.fromEntries(Object.keys(data).map((k) => [k, (before as Record<string, unknown>)[k]])),
        afterState: data,
        ipAddress: ctx.ip
      });
      await this.cache.invalidate("businesses");
      return { id, updated: Object.keys(data) };
    });
  }

  async mergeBusiness(sourceId: string, targetId: string, reason: string, ctx: ActorCtx) {
    const validReason = requireReason(reason);
    if (sourceId === targetId) throw new BadRequestException("Cannot merge a business into itself");

    return this.prisma.$transaction(async (tx) => {
      const [source, target] = await Promise.all([
        tx.business.findUnique({ where: { id: sourceId } }),
        tx.business.findUnique({ where: { id: targetId } })
      ]);
      if (!source || !target) throw new NotFoundException("Source or target business not found");
      if (source.mergedIntoId) throw new ConflictException("Source is already merged");

      // Move reviews/photos to target, then mark source merged + suspended.
      await tx.review.updateMany({ where: { businessId: sourceId }, data: { businessId: targetId } }).catch(() => undefined);
      await tx.photo.updateMany({ where: { businessId: sourceId }, data: { businessId: targetId } });
      const after = await tx.business.update({
        where: { id: sourceId },
        data: { mergedIntoId: targetId, status: "suspended" }
      });

      await writeAudit(tx, {
        actorId: ctx.adminId,
        action: "business.merge",
        targetType: "business",
        targetId: sourceId,
        beforeState: { status: source.status, mergedIntoId: null },
        afterState: { status: after.status, mergedIntoId: targetId },
        reason: validReason,
        ipAddress: ctx.ip
      });
      await this.cache.invalidate("businesses");
      return { merged: sourceId, into: targetId };
    });
  }

  /* ================= Reviews ================= */

  async listReviews(params: { status?: string; flagged?: boolean; take?: number }) {
    const take = Math.min(params.take ?? 50, 100);
    const status = ["pending", "approved", "rejected"].includes(params.status ?? "")
      ? (params.status as ModerationStatus)
      : undefined;

    // Reviews that are pending OR have open reports (flagged).
    const reviews = await this.prisma.review.findMany({
      where: {
        ...(status ? { moderationStatus: status } : {}),
        ...(params.flagged ? { reports: { some: { status: "open" as ReportStatus } } } : {})
      },
      include: {
        user: { select: { id: true, email: true, displayName: true, status: true } },
        business: { select: { slug: true, name: true } },
        reports: { where: { status: "open" }, select: { id: true, reason: true } }
      },
      orderBy: { createdAt: "desc" },
      take
    });

    // Spam signal: posting velocity per user in the last 24h.
    const userIds = [...new Set(reviews.map((r) => r.userId))];
    const velocity = new Map<string, number>();
    if (userIds.length) {
      const since = new Date(Date.now() - 24 * 3600 * 1000);
      const grouped = await this.prisma.review.groupBy({
        by: ["userId"],
        where: { userId: { in: userIds }, createdAt: { gte: since } },
        _count: { userId: true }
      });
      for (const g of grouped) velocity.set(g.userId, g._count.userId);
    }

    return reviews.map((r) => ({
      id: r.id,
      rating: r.rating,
      text: r.text,
      moderationStatus: r.moderationStatus,
      createdAt: r.createdAt.toISOString(),
      business: r.business,
      author: r.user,
      openReports: r.reports,
      spam: { last24hReviews: velocity.get(r.userId) ?? 0 }
    }));
  }

  async setReviewModeration(
    id: string,
    action: "approve" | "reject" | "delete",
    reason: string | undefined,
    ctx: ActorCtx
  ) {
    return this.prisma.$transaction(async (tx) => {
      const before = await tx.review.findUnique({ where: { id } });
      if (!before) throw new NotFoundException("Review not found");

      if (action === "delete") {
        const validReason = requireReason(reason);
        await tx.report.updateMany({ where: { reviewId: id, status: "open" }, data: { status: "resolved" } });
        await tx.review.delete({ where: { id } });
        await writeAudit(tx, {
          actorId: ctx.adminId,
          action: "review.delete",
          targetType: "review",
          targetId: id,
          beforeState: { rating: before.rating, text: before.text, moderationStatus: before.moderationStatus },
          afterState: null,
          reason: validReason,
          ipAddress: ctx.ip
        });
        await this.refreshRating(tx, before.businessId);
        return { id, deleted: true };
      }

      const status: ModerationStatus = action === "approve" ? "approved" : "rejected";
      const validReason = action === "reject" ? requireReason(reason) : reason?.trim() || null;
      const after = await tx.review.update({ where: { id }, data: { moderationStatus: status } });
      await tx.report.updateMany({ where: { reviewId: id, status: "open" }, data: { status: "resolved" } });
      await writeAudit(tx, {
        actorId: ctx.adminId,
        action: action === "approve" ? "review.approve" : "review.reject",
        targetType: "review",
        targetId: id,
        beforeState: { moderationStatus: before.moderationStatus },
        afterState: { moderationStatus: after.moderationStatus },
        reason: validReason,
        ipAddress: ctx.ip
      });
      await this.refreshRating(tx, before.businessId);
      return { id, moderationStatus: after.moderationStatus };
    });
  }

  private async refreshRating(tx: Parameters<Parameters<PrismaService["$transaction"]>[0]>[0], businessId: string) {
    const agg = await tx.review.aggregate({
      where: { businessId, moderationStatus: "approved" },
      _avg: { rating: true },
      _count: { rating: true }
    });
    await tx.business.update({
      where: { id: businessId },
      data: { avgRating: agg._avg.rating ?? 0, reviewCount: agg._count.rating }
    });
    await this.cache.invalidate("businesses");
  }

  /* ================= Users ================= */

  async listUsers(params: { q?: string; status?: string; take?: number }) {
    const take = Math.min(params.take ?? 50, 100);
    const status = ["active", "suspended", "banned"].includes(params.status ?? "")
      ? (params.status as UserStatus)
      : undefined;
    const q = params.q?.trim();

    const users = await this.prisma.user.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(q
          ? {
              OR: [
                { email: { contains: q, mode: "insensitive" } },
                { displayName: { contains: q, mode: "insensitive" } },
                { phone: { contains: q } }
              ]
            }
          : {})
      },
      select: {
        id: true, email: true, displayName: true, phone: true, role: true, status: true,
        createdAt: true, _count: { select: { reviews: true, businesses: true } }
      },
      orderBy: { createdAt: "desc" },
      take
    });

    return users.map((u) => ({
      id: u.id,
      email: u.email,
      displayName: u.displayName,
      phone: u.phone,
      role: u.role,
      status: u.status,
      reviewCount: u._count.reviews,
      businessCount: u._count.businesses,
      createdAt: u.createdAt.toISOString()
    }));
  }

  async getUser(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        reviews: {
          select: { id: true, rating: true, text: true, createdAt: true, business: { select: { slug: true, name: true } } },
          orderBy: { createdAt: "desc" },
          take: 25
        },
        businesses: { select: { id: true, slug: true, name: true, status: true } }
      }
    });
    if (!user) throw new NotFoundException("User not found");

    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      phone: user.phone,
      role: user.role,
      status: user.status,
      bannedAt: user.bannedAt?.toISOString() ?? null,
      bannedReason: user.bannedReason,
      clerkId: user.clerkId,
      createdAt: user.createdAt.toISOString(),
      businesses: user.businesses,
      timeline: user.reviews.map((r) => ({
        type: "review" as const,
        id: r.id,
        rating: r.rating,
        text: r.text,
        business: r.business,
        at: r.createdAt.toISOString()
      }))
    };
  }

  async setUserStatus(
    id: string,
    action: "ban" | "suspend" | "unban",
    reason: string | undefined,
    ctx: ActorCtx
  ) {
    return this.prisma.$transaction(async (tx) => {
      const before = await tx.user.findUnique({ where: { id } });
      if (!before) throw new NotFoundException("User not found");
      if (before.role === "admin") throw new ConflictException("Cannot change status of an admin account");

      let data: { status: UserStatus; bannedAt: Date | null; bannedReason: string | null };
      let auditAction: string;
      let validReason: string | null = null;

      if (action === "unban") {
        data = { status: "active", bannedAt: null, bannedReason: null };
        auditAction = "user.unban";
      } else {
        validReason = requireReason(reason);
        data = {
          status: action === "ban" ? "banned" : "suspended",
          bannedAt: new Date(),
          bannedReason: validReason
        };
        auditAction = action === "ban" ? "user.ban" : "user.suspend";
      }

      const after = await tx.user.update({ where: { id }, data });
      await writeAudit(tx, {
        actorId: ctx.adminId,
        action: auditAction,
        targetType: "user",
        targetId: id,
        beforeState: { status: before.status },
        afterState: { status: after.status },
        reason: validReason,
        ipAddress: ctx.ip
      });
      return { id, status: after.status, clerkId: after.clerkId };
    });
  }

  /* ================= Audit ================= */

  async listAudit(params: { actorId?: string; action?: string; targetType?: string; take?: number }) {
    const take = Math.min(params.take ?? 100, 200);
    const rows = await this.prisma.auditLog.findMany({
      where: {
        ...(params.actorId ? { actorId: params.actorId } : {}),
        ...(params.action ? { action: params.action } : {}),
        ...(params.targetType ? { targetType: params.targetType } : {})
      },
      include: { actor: { select: { email: true, name: true } } },
      orderBy: { createdAt: "desc" },
      take
    });

    return rows.map((r) => ({
      id: r.id,
      action: r.action,
      targetType: r.targetType,
      targetId: r.targetId,
      reason: r.reason,
      beforeState: r.beforeState,
      afterState: r.afterState,
      ipAddress: r.ipAddress,
      actor: r.actor,
      createdAt: r.createdAt.toISOString()
    }));
  }

  /* ================= Dashboard counts ================= */

  async overview() {
    const [pendingBusinesses, flaggedReviews, bannedUsers, admins] = await this.prisma.$transaction([
      this.prisma.business.count({ where: { status: "pending_claim" } }),
      this.prisma.review.count({ where: { reports: { some: { status: "open" } } } }),
      this.prisma.user.count({ where: { status: "banned" } }),
      this.prisma.adminUser.count({ where: { isActive: true } })
    ]);
    return { pendingBusinesses, flaggedReviews, bannedUsers, admins };
  }
}
