import { Injectable } from "@nestjs/common";
import { CacheService } from "../cache/cache.service";
import { PrismaService } from "../prisma.service";

const CACHE_NS = "home";
const CACHE_TTL_SECONDS = 120;

/** Landing-page sections are read constantly and change slowly; a short TTL absorbs that. */
@Injectable()
export class HomeRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService
  ) {}

  async getHomeFeed(locale = "uz") {
    return this.cache.getOrSet(CACHE_NS, `feed:${locale}`, CACHE_TTL_SECONDS, () =>
      this.getHomeFeedUncached()
    );
  }

  private async getHomeFeedUncached() {
    const [justJoined, featured, categories, totalBusinesses] = await Promise.all([
      /**
       * "Just joined" is driven by `claimedAt`, not `createdAt`.
       *
       * `createdAt` is when a row was seeded — most listings were imported, so
       * ordering by it would fill this section with businesses that never
       * joined anything. `claimedAt` is set when an owner's claim is approved,
       * which is the moment the business actually arrived on the platform.
       */
      this.prisma.business.findMany({
        where: { claimedAt: { not: null }, status: "claimed", mergedIntoId: null },
        orderBy: { claimedAt: "desc" },
        take: 12,
        include: { category: { select: { slug: true, nameUz: true, nameRu: true, nameEn: true } } }
      }),

      // Editorial, not algorithmic: at low business counts a ranked feed reads
      // as sparse, while a hand-picked row reads as intentional.
      this.prisma.business.findMany({
        where: { featured: true, status: "claimed", mergedIntoId: null },
        orderBy: [{ avgRating: "desc" }, { reviewCount: "desc" }],
        take: 8,
        include: { category: { select: { slug: true, nameUz: true, nameRu: true, nameEn: true } } }
      }),

      this.prisma.category.findMany({
        orderBy: { nameEn: "asc" },
        include: {
          _count: {
            select: { businesses: { where: { status: "claimed", mergedIntoId: null } } }
          }
        }
      }),

      this.prisma.business.count({ where: { status: "claimed", mergedIntoId: null } })
    ]);

    return {
      justJoined: justJoined.map((business) => this.mapCard(business)),
      featured: featured.map((business) => this.mapCard(business)),
      categories: categories.map((category) => ({
        slug: category.slug,
        nameUz: category.nameUz,
        nameRu: category.nameRu,
        nameEn: category.nameEn,
        // Drives the "be the first to list here" prompt on empty categories —
        // an empty cell would read as broken, an invitation reads as an opening.
        businessCount: category._count.businesses
      })),
      totalBusinesses
    };
  }

  private mapCard(business: {
    slug: string;
    name: string;
    district: string;
    city: string;
    priceTier: string | null;
    avgRating: unknown;
    reviewCount: number;
    claimedAt: Date | null;
    featured: boolean;
    category: { slug: string; nameUz: string; nameRu: string; nameEn: string };
  }) {
    return {
      slug: business.slug,
      name: business.name,
      district: business.district,
      city: business.city,
      priceTier: business.priceTier,
      avgRating: Number(business.avgRating),
      reviewCount: business.reviewCount,
      claimedAt: business.claimedAt?.toISOString() ?? null,
      featured: business.featured,
      category: business.category
    };
  }
}
