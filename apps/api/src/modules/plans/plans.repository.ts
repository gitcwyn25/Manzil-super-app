import { Injectable } from "@nestjs/common";
import type { PlanTier } from "@prisma/client";
import { CacheService } from "../cache/cache.service";
import { PrismaService } from "../prisma.service";

const PLAN_NS = "plans";
const PLAN_TTL = 300;
const ENTITLEMENT_TTL = 120;

export type PublicPlan = {
  tier: PlanTier;
  name: { uz: string; ru: string; en: string };
  priceMonthly: number;
  priceYearly: number | null;
  currency: string;
  photoLimit: number | null;
  staffLimit: number;
  locationLimit: number;
  features: Array<{ key: string; label: { uz: string; ru: string; en: string }; included: boolean }>;
};

@Injectable()
export class PlansRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService
  ) {}

  /** Public, cached plan catalogue — drives the pricing page and plan selection. */
  async listPublicPlans(): Promise<PublicPlan[]> {
    return this.cache.getOrSet(PLAN_NS, "public", PLAN_TTL, async () => {
      const plans = await this.prisma.plan.findMany({
        where: { isActive: true },
        include: { features: true },
        orderBy: { sortOrder: "asc" }
      });

      return plans.map((p) => ({
        tier: p.tier,
        name: { uz: p.nameUz, ru: p.nameRu, en: p.nameEn },
        priceMonthly: Number(p.priceMonthly),
        priceYearly: p.priceYearly ? Number(p.priceYearly) : null,
        currency: p.currency,
        photoLimit: p.photoLimit,
        staffLimit: p.staffLimit,
        locationLimit: p.locationLimit,
        features: p.features.map((f) => ({
          key: f.key,
          label: { uz: f.labelUz ?? f.key, ru: f.labelRu ?? f.key, en: f.labelEn ?? f.key },
          included: f.included
        }))
      }));
    });
  }

  /** The set of entitlement keys granted to a business's current plan. */
  async getEntitlements(businessId: string): Promise<Set<string>> {
    const keys = await this.cache.getOrSet(PLAN_NS, `ent:${businessId}`, ENTITLEMENT_TTL, async () => {
      const sub = await this.prisma.businessSubscription.findUnique({
        where: { businessId },
        select: { plan: true }
      });
      const tier: PlanTier = sub?.plan ?? "free";

      const plan = await this.prisma.plan.findUnique({
        where: { tier },
        include: { features: { where: { included: true }, select: { key: true } } }
      });
      return plan?.features.map((f) => f.key) ?? [];
    });
    return new Set(keys);
  }

  async getPlanLimits(businessId: string): Promise<{ tier: PlanTier; photoLimit: number | null; staffLimit: number; locationLimit: number }> {
    const sub = await this.prisma.businessSubscription.findUnique({
      where: { businessId },
      select: { plan: true }
    });
    const tier: PlanTier = sub?.plan ?? "free";
    const plan = await this.prisma.plan.findUniqueOrThrow({ where: { tier } });
    return { tier, photoLimit: plan.photoLimit, staffLimit: plan.staffLimit, locationLimit: plan.locationLimit };
  }

  /* ---------- admin: dynamic pricing management ---------- */

  async listPlansForAdmin() {
    const plans = await this.prisma.plan.findMany({
      include: { features: { orderBy: { key: "asc" } } },
      orderBy: { sortOrder: "asc" }
    });
    return plans.map((p) => ({
      id: p.id,
      tier: p.tier,
      name: { uz: p.nameUz, ru: p.nameRu, en: p.nameEn },
      priceMonthly: Number(p.priceMonthly),
      priceYearly: p.priceYearly ? Number(p.priceYearly) : null,
      currency: p.currency,
      photoLimit: p.photoLimit,
      staffLimit: p.staffLimit,
      locationLimit: p.locationLimit,
      isActive: p.isActive,
      features: p.features.map((f) => ({ key: f.key, included: f.included }))
    }));
  }

  /** Bust the plan/entitlement caches after an admin edits pricing. */
  async invalidateCache() {
    await this.cache.invalidate(PLAN_NS);
  }
}
