import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException
} from "@nestjs/common";
import type {
  Business,
  BusinessUpdateInput,
  Category,
  ClaimCreateRequest,
  ModerationQueueItem,
  ReportTargetType,
  Review,
  ReviewCreateRequest,
  ReviewReply,
  UserRole
} from "@manzil/shared";
import type {
  Business as PrismaBusiness,
  Category as PrismaCategory,
  ClaimStatus,
  ModerationStatus,
  ReportStatus,
  Review as PrismaReview,
  User
} from "@prisma/client";
import { CacheService } from "../cache/cache.service";
import { PrismaService } from "../prisma.service";
import { writeAudit } from "../console/audit.util";

const CACHE_NS = {
  categories: "categories",
  businesses: "businesses",
  admin: "admin"
} as const;

const CACHE_TTL = {
  categories: 600,
  businessList: 60,
  search: 60,
  businessDetail: 45,
  adminOverview: 20
} as const;

/**
 * What "publicly visible" means for a business.
 *
 * `suspended` is the state an admin puts a business into when they reject or
 * take one down (`ConsoleRepository.rejectBusiness`), and `mergedIntoId` marks
 * a duplicate folded into another listing (`ConsoleRepository.mergeBusiness`).
 * Without this predicate on the public reads, an admin suspension changed a
 * status column and nothing else: the listing stayed in search, in the
 * directory, and on its own URL.
 *
 * Same rule the home feed, the public photo gallery and the Gurman retriever
 * already apply (`gurman.retriever.ts` exports the identical shape as
 * `VISIBLE_BUSINESS_WHERE`); duplicated here rather than imported so the core
 * repository does not depend on a feature module.
 */
const PUBLICLY_VISIBLE = {
  status: { not: "suspended" },
  mergedIntoId: null
} as const;

type BusinessWithCategory = PrismaBusiness & {
  category: PrismaCategory;
};

type ReviewWithUser = PrismaReview & {
  user: User;
  reply?: {
    id: string;
    reviewId: string;
    businessOwnerId: string;
    text: string;
    createdAt: Date;
    updatedAt: Date;
  } | null;
};

type ReportWithRelations = {
  id: string;
  reporterUserId: string;
  reviewId: string | null;
  photoId: string | null;
  reason: string;
  status: ReportStatus;
  createdAt: Date;
  updatedAt: Date;
  reporter: Pick<User, "id" | "displayName" | "email">;
  review?: (PrismaReview & { business: Pick<PrismaBusiness, "slug"> }) | null;
  photo?: {
    id: string;
    storageKey: string;
    publicUrl: string | null;
    moderationStatus: ModerationStatus;
  } | null;
};

export type AuthActor = {
  userId: string;
  role?: UserRole;
};

@Injectable()
export class DatabaseRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService
  ) {}

  async listCategories(): Promise<Category[]> {
    return this.cache.getOrSet(CACHE_NS.categories, "all", CACHE_TTL.categories, async () => {
      const categories = await this.prisma.category.findMany({
        orderBy: [{ parentId: "asc" }, { nameUz: "asc" }]
      });

      return categories.map((category) => this.mapCategory(category));
    });
  }

  async search(query = "", category = "all"): Promise<Business[]> {
    const normalizedQuery = query.trim();
    const cacheKey = `q=${normalizedQuery.toLowerCase().slice(0, 80)}|c=${category}`;

    return this.cache.getOrSet(CACHE_NS.businesses, `search:${cacheKey}`, CACHE_TTL.search, () =>
      this.searchUncached(normalizedQuery, category)
    );
  }

  private async searchUncached(normalizedQuery: string, category: string): Promise<Business[]> {
    const where = {
      ...PUBLICLY_VISIBLE,
      ...(category !== "all" ? { category: { slug: category } } : {}),
      ...(normalizedQuery.length > 0
        ? {
            OR: [
              { name: { contains: normalizedQuery, mode: "insensitive" as const } },
              { district: { contains: normalizedQuery, mode: "insensitive" as const } },
              { address: { contains: normalizedQuery, mode: "insensitive" as const } },
              { descriptionUz: { contains: normalizedQuery, mode: "insensitive" as const } },
              { descriptionRu: { contains: normalizedQuery, mode: "insensitive" as const } },
              { descriptionEn: { contains: normalizedQuery, mode: "insensitive" as const } }
            ]
          }
        : {})
    };

    const businesses = await this.prisma.business.findMany({
      where,
      include: { category: true },
      orderBy: [{ avgRating: "desc" }, { reviewCount: "desc" }, { name: "asc" }],
      take: 200
    });

    return businesses.map((business) => this.mapBusiness(business));
  }

  async listBusinesses(): Promise<Business[]> {
    return this.cache.getOrSet(CACHE_NS.businesses, "list", CACHE_TTL.businessList, async () => {
      const businesses = await this.prisma.business.findMany({
        where: PUBLICLY_VISIBLE,
        include: { category: true },
        orderBy: [{ avgRating: "desc" }, { reviewCount: "desc" }, { name: "asc" }],
        take: 500
      });

      return businesses.map((business) => this.mapBusiness(business));
    });
  }

  /** Businesses claimed by the acting owner, with their recent reviews for the portal. */
  async listOwnedBusinesses(actor: AuthActor): Promise<{ businesses: Business[]; reviews: Review[] }> {
    // Show both approved (claimed) businesses and ones the user just
    // registered that are still awaiting admin approval — otherwise the
    // dashboard reports "no business" right after registration.
    const owned = await this.prisma.business.findMany({
      where: {
        OR: [
          { claimedByUserId: actor.userId },
          { createdByUserId: actor.userId, status: "pending_claim" }
        ]
      },
      include: { category: true },
      orderBy: { name: "asc" },
      take: 50
    });

    if (owned.length === 0) {
      return { businesses: [], reviews: [] };
    }

    const slugByBusinessId = new Map(owned.map((business) => [business.id, business.slug]));
    const reviews = await this.prisma.review.findMany({
      where: {
        businessId: { in: owned.map((business) => business.id) },
        moderationStatus: "approved"
      },
      include: { user: true, reply: true },
      orderBy: { createdAt: "desc" },
      take: 50
    });

    return {
      // Owner-scoped read: the dashboard's settings form prefills legalName and
      // taxId, so this is one of the two places they are allowed out.
      businesses: owned.map((business) => this.mapBusiness(business, { includeLegalIdentity: true })),
      reviews: reviews.map((review) => this.mapReview(review, slugByBusinessId.get(review.businessId) ?? ""))
    };
  }

  async getBusiness(slug: string): Promise<{ business: Business; reviews: Review[] }> {
    return this.cache.getOrSet(CACHE_NS.businesses, `detail:${slug}`, CACHE_TTL.businessDetail, async () => {
      // findFirst, not findUnique: the slug alone no longer decides visibility —
      // a suspended or merged-away listing must 404 here exactly as it already
      // does on the public photo gallery, rather than serving a full profile.
      const business = await this.prisma.business.findFirst({
        where: { slug, ...PUBLICLY_VISIBLE },
        include: { category: true }
      });

      if (!business) {
        throw new NotFoundException("Business not found");
      }

      return {
        business: this.mapBusiness(business),
        reviews: await this.getBusinessReviews(slug)
      };
    });
  }

  async updateBusiness(
    slug: string,
    input: BusinessUpdateInput & {
      email?: string;
      website?: string;
      instagram?: string;
      telegram?: string;
      legalName?: string;
      taxId?: string;
    },
    actor: AuthActor
  ) {
    const business = await this.prisma.business.findUnique({
      where: { slug },
      include: { category: true }
    });

    if (!business) {
      throw new NotFoundException("Business not found");
    }

    this.assertCanManageBusiness(business, actor);

    const updatedBusiness = await this.prisma.business.update({
      where: { id: business.id },
      data: {
        name: input.name,
        descriptionUz: input.description?.uz,
        descriptionRu: input.description?.ru,
        descriptionEn: input.description?.en,
        address: input.address,
        district: input.district,
        phone: input.phone,
        email: input.email,
        website: input.website,
        instagram: input.instagram,
        telegram: input.telegram,
        legalName: input.legalName,
        taxId: input.taxId,
        hoursJson: input.hours ? { weekdays: input.hours } : undefined,
        priceTier: input.priceTier
      },
      include: { category: true }
    });

    await this.cache.invalidate(CACHE_NS.businesses);

    // Ownership was asserted above, so echoing the legal identity back is the
    // owner reading their own submission — not a public response.
    return this.mapBusiness(updatedBusiness, { includeLegalIdentity: true });
  }

  async listReviews(): Promise<Review[]> {
    const reviews = await this.prisma.review.findMany({
      include: { user: true, business: true },
      orderBy: { createdAt: "desc" }
    });

    return reviews.map((review) => this.mapReview(review, review.business.slug));
  }

  async getUserById(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      locale: user.locale,
      role: user.role
    };
  }

  async createReview(input: ReviewCreateRequest, actor: AuthActor): Promise<Review> {
    const rating = Math.round(Number(input.rating));
    const text = input.text?.trim();

    if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
      throw new BadRequestException("Rating must be an integer between 1 and 5");
    }

    if (!text || text.length < 3) {
      throw new BadRequestException("Review text must be at least 3 characters");
    }

    if (text.length > 4000) {
      throw new BadRequestException("Review text must be at most 4000 characters");
    }

    const business = await this.prisma.business.findUnique({
      where: { slug: input.businessSlug }
    });

    if (!business) {
      throw new NotFoundException("Business not found");
    }

    const review = await this.prisma.review.upsert({
      where: {
        businessId_userId: {
          businessId: business.id,
          userId: actor.userId
        }
      },
      update: {
        rating,
        text,
        moderationStatus: "approved"
      },
      create: {
        businessId: business.id,
        userId: actor.userId,
        rating,
        text,
        moderationStatus: "approved"
      },
      include: { user: true }
    });

    await this.refreshBusinessRating(business.id);
    await this.cache.invalidate(CACHE_NS.businesses, CACHE_NS.admin);

    return this.mapReview(review, business.slug);
  }

  async createReviewReply(reviewId: string, rawText: string, actor: AuthActor): Promise<ReviewReply> {
    const text = rawText?.trim();

    if (!text || text.length < 2 || text.length > 4000) {
      throw new BadRequestException("Reply text must be between 2 and 4000 characters");
    }

    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
      include: {
        business: {
          include: { category: true }
        }
      }
    });

    if (!review) {
      throw new NotFoundException("Review not found");
    }

    this.assertCanManageBusiness(review.business, actor);

    const reply = await this.prisma.reviewReply.upsert({
      where: { reviewId },
      update: { text },
      create: {
        reviewId,
        businessOwnerId: actor.userId,
        text
      }
    });

    await this.cache.invalidate(CACHE_NS.businesses);

    return this.mapReviewReply(reply);
  }

  async createReviewReport(reviewId: string, rawReason: string, actor: AuthActor): Promise<ModerationQueueItem> {
    const reason = rawReason?.trim();

    if (!reason || reason.length < 3 || reason.length > 1000) {
      throw new BadRequestException("Report reason must be between 3 and 1000 characters");
    }

    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
      select: { id: true }
    });

    if (!review) {
      throw new NotFoundException("Review not found");
    }

    const report = await this.prisma.report.create({
      data: {
        reporterUserId: actor.userId,
        reviewId,
        reason
      },
      include: this.reportInclude()
    });

    await this.prisma.review.update({
      where: { id: reviewId },
      data: { moderationStatus: "pending" }
    });

    await this.cache.invalidate(CACHE_NS.businesses, CACHE_NS.admin);

    return this.mapReport(report);
  }

  async listModerationReports(status: ReportStatus = "open"): Promise<ModerationQueueItem[]> {
    const reports = await this.prisma.report.findMany({
      where: { status },
      include: this.reportInclude(),
      orderBy: { createdAt: "desc" }
    });

    return reports.map((report) => this.mapReport(report));
  }

  /**
   * Resolves a report and applies the moderation decision to the reported
   * review/photo.
   *
   * Wrapped in a transaction so the review/photo status change, the report
   * status change, and the audit row commit together. Previously these were
   * three independent writes: a failure between them could leave a review
   * hidden with its report still open, and nothing recorded who did it.
   */
  async resolveReport(
    reportId: string,
    moderationStatus: ModerationStatus = "rejected",
    adminId = "dev-admin"
  ): Promise<ModerationQueueItem> {
    const admin = await this.ensureAdminUser(adminId);

    const updatedReport = await this.prisma.$transaction(async (tx) => {
      const report = await tx.report.findUnique({
        where: { id: reportId },
        include: this.reportInclude()
      });

      if (!report) {
        throw new NotFoundException("Report not found");
      }

      if (report.reviewId) {
        await tx.review.update({
          where: { id: report.reviewId },
          data: { moderationStatus }
        });
      }

      if (report.photoId) {
        await tx.photo.update({
          where: { id: report.photoId },
          data: { moderationStatus }
        });
      }

      const resolved = await tx.report.update({
        where: { id: reportId },
        data: { status: "resolved" },
        include: this.reportInclude()
      });

      await writeAudit(tx, {
        actorId: admin.id,
        action: "report.resolve",
        targetType: "report",
        targetId: reportId,
        beforeState: { reportStatus: report.status },
        afterState: {
          reportStatus: resolved.status,
          moderationStatus,
          reviewId: report.reviewId,
          photoId: report.photoId
        }
      });

      return resolved;
    });

    await this.cache.invalidate(CACHE_NS.businesses, CACHE_NS.admin);

    return this.mapReport(updatedReport);
  }

  async rejectReport(reportId: string, adminId = "dev-admin"): Promise<ModerationQueueItem> {
    const admin = await this.ensureAdminUser(adminId);

    const report = await this.prisma.$transaction(async (tx) => {
      const before = await tx.report.findUnique({ where: { id: reportId } });

      if (!before) {
        throw new NotFoundException("Report not found");
      }

      const updated = await tx.report.update({
        where: { id: reportId },
        data: { status: "rejected" },
        include: this.reportInclude()
      });

      await writeAudit(tx, {
        actorId: admin.id,
        action: "report.reject",
        targetType: "report",
        targetId: reportId,
        beforeState: { reportStatus: before.status },
        afterState: { reportStatus: updated.status }
      });

      return updated;
    });

    await this.cache.invalidate(CACHE_NS.businesses, CACHE_NS.admin);

    return this.mapReport(report);
  }

  async createClaim(input: ClaimCreateRequest, actor: AuthActor) {
    const business = await this.findClaimBusiness(input);

    if (!business) {
      throw new NotFoundException("Business not found for claim");
    }

    // A claimed business belongs to its verified owner. New claims must not
    // hijack it or silently flip its public status back to pending.
    if (business.status === "claimed" && business.claimedByUserId) {
      if (business.claimedByUserId === actor.userId) {
        throw new ConflictException("You already own this business");
      }
      throw new ConflictException("This business is already claimed by a verified owner");
    }

    const existingPendingClaim = await this.prisma.claim.findFirst({
      where: {
        businessId: business.id,
        userId: actor.userId,
        status: "pending"
      },
      select: { id: true, status: true }
    });

    if (existingPendingClaim) {
      return {
        id: existingPendingClaim.id,
        status: existingPendingClaim.status,
        businessName: business.name
      };
    }

    const user = await this.prisma.user.update({
      where: { id: actor.userId },
      data: {
        phone: input.phone,
        displayName: input.ownerName,
        ...(actor.role === "consumer" ? { role: "business_owner" } : {})
      }
    });

    const claim = await this.prisma.claim.create({
      data: {
        businessId: business.id,
        userId: user.id,
        verificationMethod: "manual",
        note: input.note
      }
    });

    await this.prisma.business.update({
      where: { id: business.id },
      data: { status: "pending_claim" }
    });

    await this.cache.invalidate(CACHE_NS.businesses, CACHE_NS.admin);

    return {
      id: claim.id,
      status: claim.status,
      businessName: business.name
    };
  }

  async syncUser(input: {
    clerkId?: string;
    existingUserId?: string;
    email?: string;
    displayName?: string;
    locale?: string;
  }) {
    const displayName = input.displayName?.trim() || undefined;
    const locale = input.locale && ["uz", "ru", "en"].includes(input.locale) ? input.locale : undefined;

    if (input.clerkId) {
      const user = await this.upsertUserByClerkId(input.clerkId, {
        email: input.email,
        displayName,
        locale
      });
      return this.mapUserSummary(user);
    }

    if (input.existingUserId) {
      // Dev-header actors: keep a stable local row keyed by the dev user id.
      const user = await this.prisma.user.upsert({
        where: { id: input.existingUserId },
        update: {
          ...(displayName ? { displayName } : {}),
          ...(locale ? { locale } : {})
        },
        create: {
          id: input.existingUserId,
          displayName: displayName ?? "Manzil User",
          locale: locale ?? "uz"
        }
      });
      return this.mapUserSummary(user);
    }

    throw new BadRequestException("An authenticated identity is required to sync a user");
  }

  private async upsertUserByClerkId(
    clerkId: string,
    fields: { email?: string; displayName?: string; locale?: string }
  ) {
    try {
      return await this.prisma.user.upsert({
        where: { clerkId },
        update: {
          ...(fields.email ? { email: fields.email } : {}),
          ...(fields.displayName ? { displayName: fields.displayName } : {}),
          ...(fields.locale ? { locale: fields.locale } : {})
        },
        create: {
          clerkId,
          email: fields.email,
          displayName: fields.displayName ?? "Manzil User",
          locale: fields.locale ?? "uz"
        }
      });
    } catch (error: unknown) {
      // P2002 = unique violation. The email may already belong to a row
      // created before Clerk linked it (e.g. seeded users) — link that row
      // to the Clerk id instead of failing the whole login.
      if (this.isUniqueViolation(error) && fields.email) {
        const existingByEmail = await this.prisma.user.findUnique({
          where: { email: fields.email }
        });

        if (existingByEmail && !existingByEmail.clerkId) {
          return this.prisma.user.update({
            where: { id: existingByEmail.id },
            data: {
              clerkId,
              ...(fields.displayName ? { displayName: fields.displayName } : {}),
              ...(fields.locale ? { locale: fields.locale } : {})
            }
          });
        }

        // Fall back to syncing without the conflicting email.
        return this.prisma.user.upsert({
          where: { clerkId },
          update: {
            ...(fields.displayName ? { displayName: fields.displayName } : {}),
            ...(fields.locale ? { locale: fields.locale } : {})
          },
          create: {
            clerkId,
            displayName: fields.displayName ?? "Manzil User",
            locale: fields.locale ?? "uz"
          }
        });
      }

      throw error;
    }
  }

  private isUniqueViolation(error: unknown): boolean {
    return (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: string }).code === "P2002"
    );
  }

  private mapUserSummary(user: User) {
    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      locale: user.locale,
      role: user.role
    };
  }

  async getAdminOverview() {
    return this.cache.getOrSet(CACHE_NS.admin, "overview", CACHE_TTL.adminOverview, async () => {
      const [businessCount, pendingClaimCount, categoryCount, reviewCount, flaggedReviewCount, flaggedPhotoCount] =
        await this.prisma.$transaction([
          this.prisma.business.count(),
          this.prisma.claim.count({ where: { status: "pending" } }),
          this.prisma.category.count(),
          this.prisma.review.count(),
          this.prisma.review.count({ where: { moderationStatus: "pending" } }),
          this.prisma.photo.count({ where: { moderationStatus: "pending" } })
        ]);

      return {
        businessCount,
        pendingClaimCount,
        categoryCount,
        reviewCount,
        flaggedItemCount: flaggedReviewCount + flaggedPhotoCount
      };
    });
  }

  async listClaims(status: ClaimStatus = "pending") {
    const claims = await this.prisma.claim.findMany({
      where: { status },
      include: {
        business: {
          include: { category: true }
        },
        user: true,
        reviewedByAdmin: true
      },
      orderBy: { createdAt: "desc" }
    });

    return claims.map((claim) => ({
      id: claim.id,
      status: claim.status,
      verificationMethod: claim.verificationMethod,
      note: claim.note,
      createdAt: claim.createdAt.toISOString(),
      updatedAt: claim.updatedAt.toISOString(),
      business: this.mapBusiness(claim.business),
      requester: {
        id: claim.user.id,
        displayName: claim.user.displayName,
        email: claim.user.email,
        phone: claim.user.phone,
        role: claim.user.role
      },
      reviewedByAdmin: claim.reviewedByAdmin
        ? {
            id: claim.reviewedByAdmin.id,
            displayName: claim.reviewedByAdmin.displayName
          }
        : null
    }));
  }

  async approveClaim(claimId: string, adminId = "dev-admin") {
    const admin = await this.ensureAdminUser(adminId);

    const result = await this.prisma.$transaction(async (tx) => {
      const claim = await tx.claim.findUnique({
        where: { id: claimId },
        include: {
          business: { include: { category: true } },
          user: true
        }
      });

      if (!claim) {
        throw new NotFoundException("Claim not found");
      }

      if (claim.status !== "pending") {
        throw new ConflictException(`Claim is already ${claim.status}`);
      }

      const [updatedClaim, updatedBusiness, updatedUser] = await Promise.all([
        tx.claim.update({
          where: { id: claimId },
          data: {
            status: "approved",
            reviewedByAdminId: admin.id
          }
        }),
        tx.business.update({
          where: { id: claim.businessId },
          data: {
            status: "claimed",
            claimedByUserId: claim.userId,
            // The "just joined" moment for the landing page: approval is when
            // the business actually became real on the platform, not when its
            // row was seeded or its claim submitted. Only set on first
            // approval, so a re-claim later does not resurface an old business
            // as new.
            claimedAt: claim.business.claimedAt ?? new Date()
          },
          include: { category: true }
        }),
        tx.user.update({
          where: { id: claim.userId },
          data: { role: "business_owner" }
        })
      ]);

      await tx.claim.updateMany({
        where: {
          businessId: claim.businessId,
          id: { not: claimId },
          status: "pending"
        },
        data: {
          status: "rejected",
          reviewedByAdminId: admin.id
        }
      });

      // Approving a claim transfers ownership of a business AND elevates the
      // claimant to business_owner. Both are exactly the kind of privileged
      // change AuditLog exists to record; written inside the transaction so the
      // audit row and the mutation cannot diverge.
      await writeAudit(tx, {
        actorId: admin.id,
        action: "claim.approve",
        targetType: "claim",
        targetId: claimId,
        beforeState: {
          claimStatus: claim.status,
          businessStatus: claim.business.status,
          businessClaimedByUserId: claim.business.claimedByUserId,
          userRole: claim.user.role
        },
        afterState: {
          claimStatus: updatedClaim.status,
          businessStatus: updatedBusiness.status,
          businessClaimedByUserId: updatedBusiness.claimedByUserId,
          userRole: updatedUser.role
        }
      });

      return {
        id: updatedClaim.id,
        status: updatedClaim.status,
        business: this.mapBusiness(updatedBusiness),
        owner: {
          id: updatedUser.id,
          displayName: updatedUser.displayName,
          email: updatedUser.email,
          phone: updatedUser.phone,
          role: updatedUser.role
        }
      };
    });

    await this.cache.invalidate(CACHE_NS.businesses, CACHE_NS.admin);

    return result;
  }

  async rejectClaim(claimId: string, adminId = "dev-admin", note?: string) {
    const admin = await this.ensureAdminUser(adminId);

    const result = await this.prisma.$transaction(async (tx) => {
      const claim = await tx.claim.findUnique({
        where: { id: claimId },
        include: { business: { include: { category: true } } }
      });

      if (!claim) {
        throw new NotFoundException("Claim not found");
      }

      const updatedClaim = await tx.claim.update({
        where: { id: claimId },
        data: {
          status: "rejected",
          reviewedByAdminId: admin.id,
          note: note ?? claim.note
        }
      });

      const approvedClaimCount = await tx.claim.count({
        where: {
          businessId: claim.businessId,
          status: "approved"
        }
      });

      const pendingClaimCount = await tx.claim.count({
        where: {
          businessId: claim.businessId,
          status: "pending"
        }
      });

      const business =
        approvedClaimCount === 0 && pendingClaimCount === 0
          ? await tx.business.update({
              where: { id: claim.businessId },
              data: {
                status: "unclaimed",
                claimedByUserId: null
              },
              include: { category: true }
            })
          : claim.business;

      await writeAudit(tx, {
        actorId: admin.id,
        action: "claim.reject",
        targetType: "claim",
        targetId: claimId,
        beforeState: { claimStatus: claim.status, businessStatus: claim.business.status },
        afterState: { claimStatus: updatedClaim.status, businessStatus: business.status },
        reason: note ?? null
      });

      return {
        id: updatedClaim.id,
        status: updatedClaim.status,
        business: this.mapBusiness(business)
      };
    });

    await this.cache.invalidate(CACHE_NS.businesses, CACHE_NS.admin);

    return result;
  }

  private async getBusinessReviews(slug: string): Promise<Review[]> {
    const reviews = await this.prisma.review.findMany({
      where: {
        business: { slug },
        moderationStatus: "approved"
      },
      include: { user: true, reply: true },
      orderBy: { createdAt: "desc" }
    });

    return reviews.map((review) => this.mapReview(review, slug));
  }

  private async findClaimBusiness(input: ClaimCreateRequest) {
    if (input.businessSlug) {
      return this.prisma.business.findUnique({ where: { slug: input.businessSlug } });
    }

    return this.prisma.business.findFirst({
      where: {
        name: {
          contains: input.businessName,
          mode: "insensitive"
        }
      }
    });
  }

  private async refreshBusinessRating(businessId: string) {
    const aggregate = await this.prisma.review.aggregate({
      where: {
        businessId,
        moderationStatus: "approved"
      },
      _avg: { rating: true },
      _count: { rating: true }
    });

    await this.prisma.business.update({
      where: { id: businessId },
      data: {
        avgRating: aggregate._avg.rating ?? 0,
        reviewCount: aggregate._count.rating
      }
    });
  }

  private assertCanManageBusiness(
    business: Pick<PrismaBusiness, "claimedByUserId">,
    actor: AuthActor
  ) {
    if (actor.role === "admin") {
      return;
    }

    if (actor.role === "business_owner" && actor.userId && business.claimedByUserId === actor.userId) {
      return;
    }

    throw new ForbiddenException("Only the claimed owner or an admin can manage this business");
  }

  private ensureAdminUser(adminId: string) {
    return this.prisma.user.upsert({
      where: { id: adminId },
      update: {
        role: "admin"
      },
      create: {
        id: adminId,
        displayName: "Development Admin",
        email: "admin@manzil.local",
        locale: "uz",
        role: "admin"
      }
    });
  }

  private mapCategory(category: PrismaCategory): Category {
    return {
      id: category.id,
      slug: category.slug,
      name: {
        uz: category.nameUz,
        ru: category.nameRu,
        en: category.nameEn
      },
      parentId: category.parentId ?? undefined
    };
  }

  /**
   * Serialises a business for an API response.
   *
   * `legalName` and `taxId` (the Uzbek STIR) are the business's *legal identity*
   * — collected once at registration to generate the contract, never intended
   * for a public profile. They are therefore opt-in via `includeLegalIdentity`,
   * which only the owner-scoped paths (`listOwnedBusinesses`, `updateBusiness`)
   * pass. Every public path — search, the business list, the profile detail,
   * curated lists and occasions — gets the default and never sees them.
   *
   * The distinction matters because the public paths are also the cached ones:
   * a single leaked field there is served to everyone for the life of the entry.
   */
  private mapBusiness(
    business: BusinessWithCategory,
    options: { includeLegalIdentity?: boolean } = {}
  ): Business {
    return {
      id: business.id,
      slug: business.slug,
      name: business.name,
      categorySlug: business.category.slug,
      description: {
        uz: business.descriptionUz,
        ru: business.descriptionRu ?? business.descriptionUz,
        en: business.descriptionEn ?? business.descriptionUz
      },
      address: business.address,
      district: business.district,
      city: "Tashkent",
      phone: business.phone ?? undefined,
      lat: business.lat ? Number(business.lat) : undefined,
      lng: business.lng ? Number(business.lng) : undefined,
      hours: this.formatHours(business.hoursJson),
      priceTier: this.mapPriceTier(business.priceTier),
      status: business.status,
      avgRating: Number(business.avgRating),
      reviewCount: business.reviewCount,
      photo: "business",
      tags: [business.district, business.category.nameUz],
      foundingBusiness: business.status === "claimed",
      // Public contact channels — a business publishes these to be reached on.
      email: business.email ?? undefined,
      website: business.website ?? undefined,
      instagram: business.instagram ?? undefined,
      telegram: business.telegram ?? undefined,
      // Owner-only legal identity.
      ...(options.includeLegalIdentity
        ? {
            legalName: business.legalName ?? undefined,
            taxId: business.taxId ?? undefined
          }
        : {})
    } as Business;
  }

  private mapReview(review: ReviewWithUser, businessSlug: string): Review {
    return {
      id: review.id,
      businessSlug,
      authorName: review.user.displayName,
      authorBadge: review.user.role === "business_owner" ? "Business owner" : undefined,
      rating: review.rating,
      text: review.text,
      locale: review.user.locale as Review["locale"],
      createdAt: review.createdAt.toISOString(),
      helpfulCount: review.helpfulCount,
      // Reflects a completed booking by this reviewer at this business — see
      // ReviewTrustRepository.linkBookingToReview for what has to hold before
      // bookingId is ever set. A badge that is not tied to a real transaction
      // would launder unverified reviews as trustworthy.
      verifiedVisit: Boolean(review.bookingId),
      reply: review.reply ? this.mapReviewReply(review.reply) : undefined
    };
  }

  private mapReviewReply(reply: {
    id: string;
    reviewId: string;
    businessOwnerId: string;
    text: string;
    createdAt: Date;
    updatedAt: Date;
  }): ReviewReply {
    return {
      id: reply.id,
      reviewId: reply.reviewId,
      businessOwnerId: reply.businessOwnerId,
      text: reply.text,
      createdAt: reply.createdAt.toISOString(),
      updatedAt: reply.updatedAt.toISOString()
    };
  }

  private reportInclude() {
    return {
      reporter: {
        select: {
          id: true,
          displayName: true,
          email: true
        }
      },
      review: {
        include: {
          business: {
            select: {
              slug: true
            }
          }
        }
      },
      photo: {
        select: {
          id: true,
          storageKey: true,
          publicUrl: true,
          moderationStatus: true
        }
      }
    } as const;
  }

  private mapReport(report: ReportWithRelations): ModerationQueueItem {
    const targetType: ReportTargetType = report.reviewId ? "review" : "photo";
    const targetId = report.reviewId ?? report.photoId ?? report.id;

    return {
      id: report.id,
      targetType,
      targetId,
      reason: report.reason,
      status: report.status,
      createdAt: report.createdAt.toISOString(),
      updatedAt: report.updatedAt.toISOString(),
      reporter: {
        id: report.reporter.id,
        displayName: report.reporter.displayName,
        email: report.reporter.email ?? undefined
      },
      review: report.review
        ? {
            id: report.review.id,
            businessSlug: report.review.business.slug,
            text: report.review.text,
            rating: report.review.rating,
            moderationStatus: report.review.moderationStatus
          }
        : undefined,
      photo: report.photo
        ? {
            id: report.photo.id,
            storageKey: report.photo.storageKey,
            publicUrl: report.photo.publicUrl ?? undefined,
            moderationStatus: report.photo.moderationStatus
          }
        : undefined
    };
  }

  private formatHours(hoursJson: unknown): string {
    if (!hoursJson || typeof hoursJson !== "object") {
      return "Hours not listed";
    }

    const hours = hoursJson as Record<string, string>;
    return hours.weekdays ?? hours.daily ?? Object.values(hours)[0] ?? "Hours not listed";
  }

  private mapPriceTier(priceTier: string | null): Business["priceTier"] {
    if (priceTier === "$" || priceTier === "$$" || priceTier === "$$$") {
      return priceTier;
    }

    if (priceTier === "budget") {
      return "$";
    }

    if (priceTier === "premium" || priceTier === "luxury") {
      return "$$$";
    }

    return "$$";
  }
}
