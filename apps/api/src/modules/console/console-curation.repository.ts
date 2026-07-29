import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException
} from "@nestjs/common";
import type { LegalDocumentKind, ModerationStatus } from "@prisma/client";
import { CacheService } from "../cache/cache.service";
import { PrismaService } from "../prisma.service";
import { requireReason, writeAudit } from "./audit.util";

type ActorCtx = { adminId: string; ip?: string | null };

const LEGAL_KINDS: LegalDocumentKind[] = [
  "terms_of_service",
  "privacy_policy",
  "contract_template"
];

/**
 * Admin operations for the business-detail control centre, legal document
 * publishing, and the category taxonomy.
 *
 * Separate from `ConsoleRepository` (already ~560 lines) so each file stays
 * something you can hold in your head; both share the same audit and cache
 * conventions.
 */
@Injectable()
export class ConsoleCurationRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService
  ) {}

  /* ================= Business detail ================= */

  /**
   * Everything the business-detail page shows, in one round trip: profile,
   * moderation state, legal/contract records, that business's pending photos,
   * and an activity summary.
   */
  async getBusinessDetail(id: string) {
    const business = await this.prisma.business.findUnique({
      where: { id },
      include: {
        category: { select: { id: true, slug: true, nameEn: true } },
        claimedByUser: { select: { id: true, displayName: true, email: true, phone: true } },
        subscription: { select: { plan: true, status: true, renewsAt: true } },
        photos: {
          where: { moderationStatus: "pending" },
          orderBy: { createdAt: "desc" },
          take: 50,
          select: { id: true, publicUrl: true, storageKey: true, createdAt: true, reviewId: true }
        },
        legalAcceptances: {
          orderBy: { acceptedAt: "desc" },
          include: {
            document: { select: { kind: true, version: true, locale: true, title: true } },
            user: { select: { displayName: true } }
          }
        },
        contracts: {
          orderBy: { generatedAt: "desc" },
          include: { document: { select: { version: true } } }
        }
      }
    });

    if (!business) {
      throw new NotFoundException("Business not found");
    }

    const [visitCount, bookingCount, reviewCount, customerCount] = await Promise.all([
      this.prisma.businessVisit.count({ where: { businessId: id } }),
      this.prisma.booking.count({ where: { businessId: id } }),
      this.prisma.review.count({ where: { businessId: id, moderationStatus: "approved" } }),
      this.prisma.customer.count({ where: { businessId: id } })
    ]);

    return {
      business: {
        id: business.id,
        slug: business.slug,
        name: business.name,
        categoryId: business.categoryId,
        categoryName: business.category.nameEn,
        descriptionUz: business.descriptionUz,
        address: business.address,
        district: business.district,
        city: business.city,
        phone: business.phone,
        email: business.email,
        website: business.website,
        instagram: business.instagram,
        telegram: business.telegram,
        legalName: business.legalName,
        taxId: business.taxId,
        priceTier: business.priceTier,
        status: business.status,
        verificationStatus: business.verificationStatus,
        featured: business.featured,
        claimedAt: business.claimedAt?.toISOString() ?? null,
        createdAt: business.createdAt.toISOString(),
        avgRating: Number(business.avgRating),
        reviewCount: business.reviewCount,
        owner: business.claimedByUser,
        subscription: business.subscription
          ? {
              plan: business.subscription.plan,
              status: business.subscription.status,
              renewsAt: business.subscription.renewsAt?.toISOString() ?? null
            }
          : null
      },
      pendingPhotos: business.photos.map((photo) => ({
        id: photo.id,
        publicUrl: photo.publicUrl,
        storageKey: photo.storageKey,
        isReviewPhoto: Boolean(photo.reviewId),
        createdAt: photo.createdAt.toISOString()
      })),
      legal: {
        acceptances: business.legalAcceptances.map((acceptance) => ({
          id: acceptance.id,
          kind: acceptance.document.kind,
          version: acceptance.document.version,
          locale: acceptance.document.locale,
          title: acceptance.document.title,
          acceptedAt: acceptance.acceptedAt.toISOString(),
          acceptedBy: acceptance.user.displayName,
          ipAddress: acceptance.ipAddress
        })),
        contracts: business.contracts.map((contract) => ({
          id: contract.id,
          contractNo: contract.contractNo,
          templateVersion: contract.document.version,
          generatedAt: contract.generatedAt.toISOString(),
          hasFile: Boolean(contract.storageKey)
        }))
      },
      activity: { visitCount, bookingCount, reviewCount, customerCount }
    };
  }

  /**
   * Customers plus review authors for one business, merged into a single
   * list keyed by `User.id`. A `Customer` row is only mergeable when it has a
   * linked `userId` (a walk-in known solely by phone can't be tied to a
   * review account); every `Review` always has one. A person present in both
   * sources appears once, with `sources` showing which the row came from.
   */
  async getBusinessConsumers(businessId: string) {
    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
      select: { id: true }
    });
    if (!business) {
      throw new NotFoundException("Business not found");
    }

    const [customers, reviews] = await Promise.all([
      this.prisma.customer.findMany({
        where: { businessId },
        include: { user: { select: { id: true, displayName: true, email: true, phone: true } } },
        orderBy: { lastVisitAt: "desc" }
      }),
      this.prisma.review.findMany({
        where: { businessId },
        include: { user: { select: { id: true, displayName: true, email: true, phone: true } } },
        orderBy: { createdAt: "desc" }
      })
    ]);

    type Source = "customer" | "reviewer";
    type Merged = {
      userId: string | null;
      name: string | null;
      email: string | null;
      phone: string | null;
      sources: Set<Source>;
      customer: {
        id: string;
        visitCount: number;
        totalSpend: number;
        loyaltyPoints: number;
        lastVisitAt: string | null;
        tags: string[];
      } | null;
    };

    const byKey = new Map<string, Merged>();

    for (const c of customers) {
      // No linked account: this walk-in can't be matched to a review author,
      // so it gets its own key rather than being merged on phone alone — a
      // typed-in phone number is not proof of owning that reviewer's account.
      const key = c.userId ?? `customer:${c.id}`;
      const entry: Merged = byKey.get(key) ?? {
        userId: c.userId,
        name: c.user?.displayName ?? c.name ?? null,
        email: c.user?.email ?? null,
        phone: c.user?.phone ?? c.phone,
        sources: new Set<Source>(),
        customer: null
      };
      entry.sources.add("customer");
      entry.customer = {
        id: c.id,
        visitCount: c.visitCount,
        totalSpend: Number(c.totalSpend),
        loyaltyPoints: c.loyaltyPoints,
        lastVisitAt: c.lastVisitAt?.toISOString() ?? null,
        tags: c.tags
      };
      byKey.set(key, entry);
    }

    const reviewAgg = new Map<string, { count: number; totalRating: number; lastReviewAt: Date }>();

    for (const r of reviews) {
      const key = r.userId;
      const entry: Merged = byKey.get(key) ?? {
        userId: r.userId,
        name: r.user.displayName,
        email: r.user.email,
        phone: r.user.phone,
        sources: new Set<Source>(),
        customer: null
      };
      entry.sources.add("reviewer");
      byKey.set(key, entry);

      const agg = reviewAgg.get(key) ?? { count: 0, totalRating: 0, lastReviewAt: r.createdAt };
      agg.count += 1;
      agg.totalRating += r.rating;
      if (r.createdAt > agg.lastReviewAt) agg.lastReviewAt = r.createdAt;
      reviewAgg.set(key, agg);
    }

    const consumers = [...byKey.entries()].map(([key, entry]) => {
      const agg = reviewAgg.get(key);
      return {
        userId: entry.userId,
        name: entry.name,
        email: entry.email,
        phone: entry.phone,
        sources: [...entry.sources],
        customer: entry.customer,
        reviews: agg
          ? {
              count: agg.count,
              avgRating: Math.round((agg.totalRating / agg.count) * 10) / 10,
              lastReviewAt: agg.lastReviewAt.toISOString()
            }
          : null
      };
    });

    return { consumers, totalCount: consumers.length };
  }

  /**
   * Sets the landing-page featured flag.
   *
   * Audited like any other business mutation — featuring is editorial placement
   * on the public homepage, so who promoted whom, and when, has to be answerable.
   */
  async setBusinessFeatured(id: string, featured: boolean, ctx: ActorCtx) {
    const result = await this.prisma.$transaction(async (tx) => {
      const before = await tx.business.findUnique({
        where: { id },
        select: { featured: true }
      });

      if (!before) {
        throw new NotFoundException("Business not found");
      }

      const after = await tx.business.update({ where: { id }, data: { featured } });

      await writeAudit(tx, {
        actorId: ctx.adminId,
        action: featured ? "business.feature" : "business.unfeature",
        targetType: "business",
        targetId: id,
        beforeState: { featured: before.featured },
        afterState: { featured: after.featured },
        ipAddress: ctx.ip
      });

      return { id, featured: after.featured };
    });

    await this.cache.invalidate("businesses", "home");
    return result;
  }

  /** Approve or reject one photo. Rejection requires a reason, like every other destructive admin action. */
  async moderatePhoto(
    photoId: string,
    decision: "approve" | "reject",
    reason: string | undefined,
    ctx: ActorCtx
  ) {
    const validReason = decision === "reject" ? requireReason(reason) : null;

    const result = await this.prisma.$transaction(async (tx) => {
      const before = await tx.photo.findUnique({ where: { id: photoId } });

      if (!before) {
        throw new NotFoundException("Photo not found");
      }

      const moderationStatus: ModerationStatus = decision === "approve" ? "approved" : "rejected";
      const after = await tx.photo.update({
        where: { id: photoId },
        data: { moderationStatus }
      });

      await writeAudit(tx, {
        actorId: ctx.adminId,
        action: `media.${decision}`,
        targetType: "photo",
        targetId: photoId,
        beforeState: { moderationStatus: before.moderationStatus },
        afterState: { moderationStatus: after.moderationStatus },
        reason: validReason,
        ipAddress: ctx.ip
      });

      return { id: photoId, moderationStatus: after.moderationStatus };
    });

    await this.cache.invalidate("businesses");
    return result;
  }

  /* ================= Legal documents ================= */

  async listLegalDocuments() {
    const documents = await this.prisma.legalDocument.findMany({
      orderBy: [{ kind: "asc" }, { createdAt: "desc" }],
      include: { _count: { select: { acceptances: true, contracts: true } } }
    });

    return documents.map((document) => ({
      id: document.id,
      kind: document.kind,
      version: document.version,
      locale: document.locale,
      title: document.title,
      body: document.body,
      publishedAt: document.publishedAt?.toISOString() ?? null,
      acceptanceCount: document._count.acceptances,
      contractCount: document._count.contracts,
      createdAt: document.createdAt.toISOString()
    }));
  }

  /**
   * Publishes a new document version.
   *
   * Always a new row, never an edit of an existing one: an acceptance points at
   * a specific version, so editing published text in place would retroactively
   * change what everyone who already accepted had agreed to. The unique
   * constraint on (kind, version, locale) makes that a conflict rather than a
   * silent overwrite.
   */
  async publishLegalDocument(
    input: { kind: string; version: string; locale?: string; title: string; body: string },
    ctx: ActorCtx
  ) {
    if (!LEGAL_KINDS.includes(input.kind as LegalDocumentKind)) {
      throw new BadRequestException(`kind must be one of: ${LEGAL_KINDS.join(", ")}`);
    }

    const kind = input.kind as LegalDocumentKind;
    const version = input.version.trim();
    const locale = (input.locale ?? "uz").trim();
    const title = input.title.trim();

    if (!version) throw new BadRequestException("version is required");
    if (!title) throw new BadRequestException("title is required");
    if (!input.body.trim()) throw new BadRequestException("body is required");

    const existing = await this.prisma.legalDocument.findUnique({
      where: { kind_version_locale: { kind, version, locale } }
    });

    if (existing) {
      throw new ConflictException(
        `${kind} version ${version} (${locale}) already exists. Publish a new version rather than editing it.`
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const document = await tx.legalDocument.create({
        data: { kind, version, locale, title, body: input.body, publishedAt: new Date() }
      });

      await writeAudit(tx, {
        actorId: ctx.adminId,
        action: "legal.publish",
        targetType: "legal_document",
        targetId: document.id,
        afterState: { kind: document.kind, version: document.version, locale: document.locale },
        ipAddress: ctx.ip
      });

      return {
        id: document.id,
        kind: document.kind,
        version: document.version,
        locale: document.locale
      };
    });
  }

  /* ================= Categories ================= */

  async listCategories() {
    const categories = await this.prisma.category.findMany({
      orderBy: { nameEn: "asc" },
      include: { _count: { select: { businesses: true } } }
    });

    return categories.map((category) => ({
      id: category.id,
      slug: category.slug,
      nameUz: category.nameUz,
      nameRu: category.nameRu,
      nameEn: category.nameEn,
      parentId: category.parentId,
      businessCount: category._count.businesses
    }));
  }

  async upsertCategory(
    input: {
      id?: string;
      slug: string;
      nameUz: string;
      nameRu: string;
      nameEn: string;
      parentId?: string | null;
    },
    ctx: ActorCtx
  ) {
    const slug = input.slug.trim().toLowerCase();

    // The slug appears in public URLs and is matched against by the landing
    // page's category filter, so it is constrained rather than sanitised.
    if (!/^[a-z0-9-]+$/.test(slug)) {
      throw new BadRequestException("slug may contain only lowercase letters, digits, and hyphens");
    }

    if (input.parentId && input.parentId === input.id) {
      throw new BadRequestException("A category cannot be its own parent");
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const before = input.id ? await tx.category.findUnique({ where: { id: input.id } }) : null;

      if (input.id && !before) {
        throw new NotFoundException("Category not found");
      }

      const data = {
        slug,
        nameUz: input.nameUz.trim(),
        nameRu: input.nameRu.trim(),
        nameEn: input.nameEn.trim(),
        parentId: input.parentId ?? null
      };

      const category = before
        ? await tx.category.update({ where: { id: before.id }, data })
        : await tx.category.create({ data });

      await writeAudit(tx, {
        actorId: ctx.adminId,
        action: before ? "category.update" : "category.create",
        targetType: "category",
        targetId: category.id,
        beforeState: before ? { slug: before.slug, nameEn: before.nameEn } : undefined,
        afterState: { slug: category.slug, nameEn: category.nameEn },
        ipAddress: ctx.ip
      });

      return { id: category.id, slug: category.slug };
    });

    await this.cache.invalidate("businesses", "home");
    return result;
  }
}
