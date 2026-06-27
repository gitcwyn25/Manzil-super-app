import { Injectable, NotFoundException } from "@nestjs/common";
import type { Business, Category, ClaimCreateRequest, Review, ReviewCreateRequest } from "@manzil/shared";
import type {
  Business as PrismaBusiness,
  Category as PrismaCategory,
  ClaimStatus,
  Review as PrismaReview,
  User
} from "@prisma/client";
import { PrismaService } from "../prisma.service";

type BusinessWithCategory = PrismaBusiness & {
  category: PrismaCategory;
};

type ReviewWithUser = PrismaReview & {
  user: User;
};

@Injectable()
export class DatabaseRepository {
  constructor(private readonly prisma: PrismaService) {}

  async listCategories(): Promise<Category[]> {
    const categories = await this.prisma.category.findMany({
      orderBy: [{ parentId: "asc" }, { nameUz: "asc" }]
    });

    return categories.map((category) => this.mapCategory(category));
  }

  async search(query = "", category = "all"): Promise<Business[]> {
    const normalizedQuery = query.trim();
    const where = {
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
      orderBy: [{ avgRating: "desc" }, { reviewCount: "desc" }, { name: "asc" }]
    });

    return businesses.map((business) => this.mapBusiness(business));
  }

  async listBusinesses(): Promise<Business[]> {
    const businesses = await this.prisma.business.findMany({
      include: { category: true },
      orderBy: [{ avgRating: "desc" }, { reviewCount: "desc" }, { name: "asc" }]
    });

    return businesses.map((business) => this.mapBusiness(business));
  }

  async getBusiness(slug: string): Promise<{ business: Business; reviews: Review[] }> {
    const business = await this.prisma.business.findUnique({
      where: { slug },
      include: { category: true }
    });

    if (!business) {
      throw new NotFoundException("Business not found");
    }

    return {
      business: this.mapBusiness(business),
      reviews: await this.getBusinessReviews(slug)
    };
  }

  async listReviews(): Promise<Review[]> {
    const reviews = await this.prisma.review.findMany({
      include: { user: true, business: true },
      orderBy: { createdAt: "desc" }
    });

    return reviews.map((review) => this.mapReview(review, review.business.slug));
  }

  async createReview(input: ReviewCreateRequest): Promise<Review> {
    const business = await this.prisma.business.findUnique({
      where: { slug: input.businessSlug }
    });

    if (!business) {
      throw new NotFoundException("Business not found");
    }

    const user = await this.prisma.user.upsert({
      where: { email: "demo-reviewer@manzil.local" },
      update: {},
      create: {
        email: "demo-reviewer@manzil.local",
        displayName: "Demo Reviewer",
        locale: "uz"
      }
    });

    const review = await this.prisma.review.upsert({
      where: {
        businessId_userId: {
          businessId: business.id,
          userId: user.id
        }
      },
      update: {
        rating: Math.round(input.rating),
        text: input.text,
        moderationStatus: "approved"
      },
      create: {
        businessId: business.id,
        userId: user.id,
        rating: Math.round(input.rating),
        text: input.text,
        moderationStatus: "approved"
      },
      include: { user: true }
    });

    await this.refreshBusinessRating(business.id);

    return this.mapReview(review, business.slug);
  }

  async createClaim(input: ClaimCreateRequest) {
    const business = await this.findClaimBusiness(input);

    if (!business) {
      throw new NotFoundException("Business not found for claim");
    }

    const user = await this.prisma.user.upsert({
      where: { phone: input.phone },
      update: {
        displayName: input.ownerName
      },
      create: {
        phone: input.phone,
        displayName: input.ownerName,
        locale: "uz",
        role: "business_owner"
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

    return {
      id: claim.id,
      status: claim.status,
      businessName: business.name
    };
  }

  async syncUser(input: { clerkId?: string; email?: string; displayName?: string; locale?: string }) {
    const user = input.clerkId
      ? await this.prisma.user.upsert({
          where: { clerkId: input.clerkId },
          update: {
            email: input.email,
            displayName: input.displayName ?? "Manzil User",
            locale: input.locale ?? "uz"
          },
          create: {
            clerkId: input.clerkId,
            email: input.email,
            displayName: input.displayName ?? "Manzil User",
            locale: input.locale ?? "uz"
          }
        })
      : await this.prisma.user.create({
          data: {
            email: input.email,
            displayName: input.displayName ?? "Manzil User",
            locale: input.locale ?? "uz"
          }
        });

    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      locale: user.locale,
      role: user.role
    };
  }

  async getAdminOverview() {
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

    return this.prisma.$transaction(async (tx) => {
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
            claimedByUserId: claim.userId
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
  }

  async rejectClaim(claimId: string, adminId = "dev-admin", note?: string) {
    const admin = await this.ensureAdminUser(adminId);

    return this.prisma.$transaction(async (tx) => {
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

      return {
        id: updatedClaim.id,
        status: updatedClaim.status,
        business: this.mapBusiness(business)
      };
    });
  }

  private async getBusinessReviews(slug: string): Promise<Review[]> {
    const reviews = await this.prisma.review.findMany({
      where: {
        business: { slug },
        moderationStatus: "approved"
      },
      include: { user: true },
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

  private mapBusiness(business: BusinessWithCategory): Business {
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
      foundingBusiness: business.status === "claimed"
    };
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
      helpfulCount: review.helpfulCount
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
