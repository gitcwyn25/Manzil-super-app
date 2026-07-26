import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException
} from "@nestjs/common";
import { createHash } from "node:crypto";
import type {
  AnnouncementKind,
  AnnouncementStatus,
  PlanTier
} from "@prisma/client";
import { CacheService } from "../cache/cache.service";
import { PrismaService } from "../prisma.service";
import { GeocodingService } from "./geocoding.service";
import { AlertService } from "../alerts/alert.service";
import type { AuthActor } from "../repositories/database.repository";
import { requireOwnedBusiness as resolveOwnedBusiness } from "./business-ownership.util";

export type BusinessRegistrationInput = {
  name: string;
  categorySlug: string;
  descriptionUz: string;
  address: string;
  district: string;
  city?: string;
  phone?: string;
  email?: string;
  website?: string;
  instagram?: string;
  telegram?: string;
  legalName?: string;
  taxId?: string;
  priceTier?: string;
};

export type AnnouncementInput = {
  kind?: AnnouncementKind;
  title: string;
  body: string;
  discountPercent?: number;
  startsAt?: string;
  endsAt?: string;
  status?: AnnouncementStatus;
};

export type PackageInput = {
  name: string;
  description?: string;
  price: number;
  isActive?: boolean;
  sortOrder?: number;
};

const ANNOUNCEMENT_KINDS: AnnouncementKind[] = ["news", "discount", "broadcast"];
const ANNOUNCEMENT_STATUSES: AnnouncementStatus[] = ["draft", "published", "archived"];
const PLAN_TIERS: PlanTier[] = ["free", "pro", "max"];

@Injectable()
export class CrmRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
    private readonly geocoding: GeocodingService,
    private readonly alerts: AlertService
  ) {}

  /* ------------------------------------------------------------------ */
  /* Registration                                                        */
  /* ------------------------------------------------------------------ */

  async registerBusiness(input: BusinessRegistrationInput, actor: AuthActor) {
    const name = input.name?.trim();
    const description = input.descriptionUz?.trim();
    const address = input.address?.trim();
    const district = input.district?.trim();

    if (!name || name.length < 2 || name.length > 120) {
      throw new BadRequestException("Business name must be 2–120 characters");
    }

    if (!description || description.length < 10) {
      throw new BadRequestException("Description must be at least 10 characters");
    }

    if (!address || !district) {
      throw new BadRequestException("Address and district are required");
    }

    if (input.taxId && !/^\d{9}$/.test(input.taxId.trim())) {
      throw new BadRequestException("Tax ID (STIR/INN) must be 9 digits");
    }

    if (input.website && !/^https?:\/\/.+\..+/.test(input.website.trim())) {
      throw new BadRequestException("Website must be a valid http(s) URL");
    }

    const category = await this.prisma.category.findUnique({
      where: { slug: input.categorySlug }
    });

    if (!category) {
      throw new BadRequestException("Unknown category");
    }

    const slug = await this.uniqueSlug(name);
    const geo = await this.geocoding.geocode(address, district, input.city ?? "Tashkent");

    // Single transaction: user row, business, and its ownership claim either
    // all exist afterwards or none do — no orphan businesses on failure.
    const business = await this.prisma.$transaction(async (tx) => {
      await tx.user.upsert({
        where: { id: actor.userId },
        update: actor.role === "admin" ? {} : { role: "business_owner" },
        create: {
          id: actor.userId,
          displayName: "Business Owner",
          locale: "uz",
          role: "business_owner"
        }
      });

      const created = await tx.business.create({
        data: {
          slug,
          name,
          categoryId: category.id,
          descriptionUz: description,
          address,
          district,
          city: input.city?.trim() || "Tashkent",
          phone: input.phone?.trim() || null,
          email: input.email?.trim() || null,
          website: input.website?.trim() || null,
          instagram: input.instagram?.trim() || null,
          telegram: input.telegram?.trim() || null,
          legalName: input.legalName?.trim() || null,
          taxId: input.taxId?.trim() || null,
          priceTier: input.priceTier ?? "$$",
          lat: geo?.lat,
          lng: geo?.lng,
          status: "pending_claim",
          createdByUserId: actor.userId
        }
      });

      // The registrant's ownership request goes through the same admin claim
      // queue as claims on existing listings.
      await tx.claim.create({
        data: {
          businessId: created.id,
          userId: actor.userId,
          verificationMethod: "registration",
          note: input.taxId ? `STIR: ${input.taxId}` : undefined
        }
      });

      return created;
    });

    await this.cache.invalidate("businesses", "admin");

    this.alerts.dispatch({
      kind: "business_awaiting_approval",
      title: `New business awaiting approval: ${business.name}`,
      detail: `${business.district}, ${business.city}`
    });

    return {
      id: business.id,
      slug: business.slug,
      name: business.name,
      status: business.status,
      geocoded: Boolean(geo),
      lat: geo?.lat ?? null,
      lng: geo?.lng ?? null
    };
  }

  /* ------------------------------------------------------------------ */
  /* Ownership guard                                                     */
  /* ------------------------------------------------------------------ */

  private async requireOwnedBusiness(slug: string, actor: AuthActor) {
    return resolveOwnedBusiness(this.prisma, slug, actor);
  }

  /* ------------------------------------------------------------------ */
  /* Announcements (news / discounts / broadcasts)                       */
  /* ------------------------------------------------------------------ */

  async listAnnouncements(slug: string, actor: AuthActor) {
    const business = await this.requireOwnedBusiness(slug, actor);

    return this.prisma.announcement.findMany({
      where: { businessId: business.id },
      orderBy: { createdAt: "desc" },
      take: 100
    });
  }

  async createAnnouncement(slug: string, input: AnnouncementInput, actor: AuthActor) {
    const business = await this.requireOwnedBusiness(slug, actor);
    this.validateAnnouncement(input);

    const announcement = await this.prisma.announcement.create({
      data: {
        businessId: business.id,
        kind: input.kind ?? "news",
        status: input.status ?? "draft",
        title: input.title.trim(),
        body: input.body.trim(),
        discountPercent: input.kind === "discount" ? input.discountPercent : null,
        startsAt: input.startsAt ? new Date(input.startsAt) : null,
        endsAt: input.endsAt ? new Date(input.endsAt) : null
      }
    });

    await this.cache.invalidate("businesses");
    return announcement;
  }

  async updateAnnouncement(id: string, input: Partial<AnnouncementInput>, actor: AuthActor) {
    const existing = await this.prisma.announcement.findUnique({
      where: { id },
      include: { business: { select: { slug: true } } }
    });

    if (!existing) {
      throw new NotFoundException("Announcement not found");
    }

    await this.requireOwnedBusiness(existing.business.slug, actor);

    if (input.title !== undefined || input.body !== undefined) {
      this.validateAnnouncement({
        title: input.title ?? existing.title,
        body: input.body ?? existing.body,
        kind: input.kind ?? existing.kind,
        discountPercent: input.discountPercent ?? existing.discountPercent ?? undefined,
        status: input.status
      });
    }

    if (input.status && !ANNOUNCEMENT_STATUSES.includes(input.status)) {
      throw new BadRequestException("Invalid announcement status");
    }

    const announcement = await this.prisma.announcement.update({
      where: { id },
      data: {
        ...(input.kind ? { kind: input.kind } : {}),
        ...(input.status ? { status: input.status } : {}),
        ...(input.title !== undefined ? { title: input.title.trim() } : {}),
        ...(input.body !== undefined ? { body: input.body.trim() } : {}),
        ...(input.discountPercent !== undefined ? { discountPercent: input.discountPercent } : {}),
        ...(input.startsAt !== undefined ? { startsAt: input.startsAt ? new Date(input.startsAt) : null } : {}),
        ...(input.endsAt !== undefined ? { endsAt: input.endsAt ? new Date(input.endsAt) : null } : {})
      }
    });

    await this.cache.invalidate("businesses");
    return announcement;
  }

  async deleteAnnouncement(id: string, actor: AuthActor) {
    const existing = await this.prisma.announcement.findUnique({
      where: { id },
      include: { business: { select: { slug: true } } }
    });

    if (!existing) {
      throw new NotFoundException("Announcement not found");
    }

    await this.requireOwnedBusiness(existing.business.slug, actor);
    await this.prisma.announcement.delete({ where: { id } });
    await this.cache.invalidate("businesses");

    return { deleted: true };
  }

  private validateAnnouncement(input: AnnouncementInput) {
    if (!input.title?.trim() || input.title.trim().length < 3 || input.title.trim().length > 160) {
      throw new BadRequestException("Title must be 3–160 characters");
    }

    if (!input.body?.trim() || input.body.trim().length < 3 || input.body.trim().length > 4000) {
      throw new BadRequestException("Body must be 3–4000 characters");
    }

    if (input.kind && !ANNOUNCEMENT_KINDS.includes(input.kind)) {
      throw new BadRequestException("Invalid announcement kind");
    }

    if (input.kind === "discount") {
      const percent = Number(input.discountPercent);
      if (!Number.isInteger(percent) || percent < 1 || percent > 99) {
        throw new BadRequestException("Discount percent must be an integer between 1 and 99");
      }
    }
  }

  /* ------------------------------------------------------------------ */
  /* Packages (services & prices)                                        */
  /* ------------------------------------------------------------------ */

  async listPackages(slug: string, actor: AuthActor) {
    const business = await this.requireOwnedBusiness(slug, actor);

    return this.prisma.businessPackage.findMany({
      where: { businessId: business.id },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      take: 200
    });
  }

  async createPackage(slug: string, input: PackageInput, actor: AuthActor) {
    const business = await this.requireOwnedBusiness(slug, actor);
    this.validatePackage(input);

    const created = await this.prisma.businessPackage.create({
      data: {
        businessId: business.id,
        name: input.name.trim(),
        description: input.description?.trim() || null,
        price: input.price,
        isActive: input.isActive ?? true,
        sortOrder: input.sortOrder ?? 0
      }
    });

    await this.cache.invalidate("businesses");
    return created;
  }

  async updatePackage(id: string, input: Partial<PackageInput>, actor: AuthActor) {
    const existing = await this.prisma.businessPackage.findUnique({
      where: { id },
      include: { business: { select: { slug: true } } }
    });

    if (!existing) {
      throw new NotFoundException("Package not found");
    }

    await this.requireOwnedBusiness(existing.business.slug, actor);

    if (input.name !== undefined || input.price !== undefined) {
      this.validatePackage({
        name: input.name ?? existing.name,
        price: input.price ?? Number(existing.price)
      });
    }

    const updated = await this.prisma.businessPackage.update({
      where: { id },
      data: {
        ...(input.name !== undefined ? { name: input.name.trim() } : {}),
        ...(input.description !== undefined ? { description: input.description?.trim() || null } : {}),
        ...(input.price !== undefined ? { price: input.price } : {}),
        ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
        ...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {})
      }
    });

    await this.cache.invalidate("businesses");
    return updated;
  }

  async deletePackage(id: string, actor: AuthActor) {
    const existing = await this.prisma.businessPackage.findUnique({
      where: { id },
      include: { business: { select: { slug: true } } }
    });

    if (!existing) {
      throw new NotFoundException("Package not found");
    }

    await this.requireOwnedBusiness(existing.business.slug, actor);
    await this.prisma.businessPackage.delete({ where: { id } });
    await this.cache.invalidate("businesses");

    return { deleted: true };
  }

  private validatePackage(input: PackageInput) {
    if (!input.name?.trim() || input.name.trim().length < 2 || input.name.trim().length > 140) {
      throw new BadRequestException("Package name must be 2–140 characters");
    }

    const price = Number(input.price);
    if (!Number.isFinite(price) || price < 0 || price > 1_000_000_000) {
      throw new BadRequestException("Price must be a non-negative number");
    }
  }

  /* ------------------------------------------------------------------ */
  /* Statistics                                                          */
  /* ------------------------------------------------------------------ */

  async getStats(slug: string, actor: AuthActor) {
    const business = await this.requireOwnedBusiness(slug, actor);
    const since = new Date();
    since.setDate(since.getDate() - 30);

    const [full, ratingRows, visitRows, announcementCounts, packageCount, reviewsLastWeek] = await Promise.all([
      this.prisma.business.findUniqueOrThrow({
        where: { id: business.id },
        select: { avgRating: true, reviewCount: true, name: true, slug: true, status: true }
      }),
      this.prisma.review.groupBy({
        by: ["rating"],
        where: { businessId: business.id, moderationStatus: "approved" },
        _count: { rating: true }
      }),
      this.prisma.businessVisit.findMany({
        where: { businessId: business.id, createdAt: { gte: since } },
        select: { createdAt: true, visitorKey: true }
      }),
      this.prisma.announcement.groupBy({
        by: ["status"],
        where: { businessId: business.id },
        _count: { status: true }
      }),
      this.prisma.businessPackage.count({ where: { businessId: business.id, isActive: true } }),
      this.prisma.review.count({
        where: {
          businessId: business.id,
          moderationStatus: "approved",
          createdAt: { gte: new Date(Date.now() - 7 * 24 * 3600 * 1000) }
        }
      })
    ]);

    // Visits grouped per day (last 30 days), plus unique visitors.
    const dayBuckets = new Map<string, number>();
    const uniqueVisitors = new Set<string>();
    for (let i = 29; i >= 0; i -= 1) {
      const day = new Date();
      day.setDate(day.getDate() - i);
      dayBuckets.set(day.toISOString().slice(0, 10), 0);
    }
    for (const visit of visitRows) {
      const key = visit.createdAt.toISOString().slice(0, 10);
      dayBuckets.set(key, (dayBuckets.get(key) ?? 0) + 1);
      uniqueVisitors.add(visit.visitorKey);
    }

    const distribution: Record<string, number> = { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 };
    for (const row of ratingRows) {
      distribution[String(row.rating)] = row._count.rating;
    }

    const announcements: Record<string, number> = { draft: 0, published: 0, archived: 0 };
    for (const row of announcementCounts) {
      announcements[row.status] = row._count.status;
    }

    return {
      business: {
        name: full.name,
        slug: full.slug,
        status: full.status,
        avgRating: Number(full.avgRating),
        reviewCount: full.reviewCount
      },
      reviews: {
        total: full.reviewCount,
        lastSevenDays: reviewsLastWeek,
        distribution
      },
      visits: {
        totalLast30Days: visitRows.length,
        uniqueLast30Days: uniqueVisitors.size,
        daily: [...dayBuckets.entries()].map(([date, count]) => ({ date, count }))
      },
      announcements,
      activePackages: packageCount
    };
  }

  /* ------------------------------------------------------------------ */
  /* Subscription                                                        */
  /* ------------------------------------------------------------------ */

  async chooseSubscription(slug: string, plan: string, actor: AuthActor) {
    const business = await this.requireOwnedBusiness(slug, actor);

    if (!PLAN_TIERS.includes(plan as PlanTier)) {
      throw new BadRequestException(`Plan must be one of: ${PLAN_TIERS.join(", ")}`);
    }

    const tier = plan as PlanTier;
    const renewsAt = new Date();
    renewsAt.setMonth(renewsAt.getMonth() + 1);

    // Paid plans start as invoice_pending until a payment provider
    // (Payme/Click) confirms the charge.
    const subscription = await this.prisma.businessSubscription.upsert({
      where: { businessId: business.id },
      update: {
        plan: tier,
        status: tier === "free" ? "active" : "invoice_pending",
        renewsAt: tier === "free" ? null : renewsAt
      },
      create: {
        businessId: business.id,
        plan: tier,
        status: tier === "free" ? "active" : "invoice_pending",
        renewsAt: tier === "free" ? null : renewsAt
      }
    });

    return subscription;
  }

  async getSubscription(slug: string, actor: AuthActor) {
    const business = await this.requireOwnedBusiness(slug, actor);
    return this.prisma.businessSubscription.findUnique({
      where: { businessId: business.id }
    });
  }

  /* ------------------------------------------------------------------ */
  /* Visits (public tracking)                                            */
  /* ------------------------------------------------------------------ */

  async recordVisit(slug: string, rawKey: string, source = "web") {
    const business = await this.prisma.business.findUnique({
      where: { slug },
      select: { id: true }
    });

    if (!business) {
      throw new NotFoundException("Business not found");
    }

    const visitorKey = createHash("sha256").update(rawKey).digest("hex").slice(0, 32);

    // One visit per visitor per business per hour — keeps refresh spam out.
    const recently = await this.prisma.businessVisit.findFirst({
      where: {
        businessId: business.id,
        visitorKey,
        createdAt: { gte: new Date(Date.now() - 3600 * 1000) }
      },
      select: { id: true }
    });

    if (recently) {
      return { recorded: false };
    }

    await this.prisma.businessVisit.create({
      data: {
        businessId: business.id,
        visitorKey,
        source: source.slice(0, 24)
      }
    });

    return { recorded: true };
  }

  /* ------------------------------------------------------------------ */
  /* Helpers                                                             */
  /* ------------------------------------------------------------------ */

  private async uniqueSlug(name: string) {
    const base =
      name
        .toLowerCase()
        .replace(/['’ʻ`]/g, "")
        .replace(/[^a-z0-9а-яё]+/gi, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 60) || "business";

    let candidate = base;
    for (let attempt = 0; attempt < 20; attempt += 1) {
      const exists = await this.prisma.business.findUnique({
        where: { slug: candidate },
        select: { id: true }
      });
      if (!exists) {
        return candidate;
      }
      candidate = `${base}-${Math.random().toString(36).slice(2, 6)}`;
    }

    throw new ConflictException("Could not allocate a unique slug");
  }
}
