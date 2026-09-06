import { Injectable } from "@nestjs/common";
import { PUBLICLY_VISIBLE_BUSINESS } from "../business-visibility";
import { PrismaService } from "../prisma.service";
import type {
  GurmanLocale,
  LiveBusiness,
  RetrievedBusiness,
  RetrievedContext
} from "./gurman.types";

/** DI token. Lets `VectorRetriever` replace this later without touching consumers. */
export const GURMAN_RETRIEVER = "GURMAN_RETRIEVER";

/**
 * What Gurman is allowed to recommend.
 *
 * Deliberately stricter than `DatabaseRepository.search()`, which filters
 * neither status nor merge state: a business the platform has suspended
 * appearing in typed search results is a pre-existing inconsistency, but an AI
 * actively recommending it is a different and worse thing.
 */
export const VISIBLE_BUSINESS_WHERE = PUBLICLY_VISIBLE_BUSINESS;

/** Keeps prompt size bounded as the catalog grows toward the pgvector threshold. */
const MAX_REVIEW_SNIPPETS = 3;

export interface GurmanRetriever {
  retrieve(query: string, locale: GurmanLocale): Promise<RetrievedContext>;
  liveBusinesses(ids: string[]): Promise<Map<string, LiveBusiness>>;
}

/**
 * Returns the entire visible catalog.
 *
 * At 16 businesses this is strictly more accurate than vector search — it
 * retrieves everything, so there is no recall loss. Replace with a
 * `VectorRetriever` behind this same interface when active businesses exceed
 * 200 or the serialised catalog exceeds ~30 KB per request.
 */
@Injectable()
export class CatalogRetriever implements GurmanRetriever {
  constructor(private readonly prisma: PrismaService) {}

  async retrieve(_query: string, locale: GurmanLocale): Promise<RetrievedContext> {
    const rows = await this.prisma.business.findMany({
      where: VISIBLE_BUSINESS_WHERE,
      select: {
        id: true,
        slug: true,
        name: true,
        district: true,
        priceTier: true,
        avgRating: true,
        reviewCount: true,
        descriptionUz: true,
        descriptionRu: true,
        descriptionEn: true,
        // Category names are per-locale columns; there is no single `name`.
        category: { select: { nameUz: true, nameRu: true, nameEn: true } },
        reviews: {
          where: { moderationStatus: "approved" },
          orderBy: { createdAt: "desc" },
          take: MAX_REVIEW_SNIPPETS,
          select: { text: true }
        }
      },
      orderBy: [{ avgRating: "desc" }, { reviewCount: "desc" }]
    });

    return { businesses: rows.map((row) => toRetrievedBusiness(row, locale)) };
  }

  /**
   * Resolves ids to rows that are visible *now*.
   *
   * Called on every serve — including cache hits — so a business suspended
   * after a response was cached disappears from the next response rather than
   * lingering until the entry expires.
   */
  async liveBusinesses(ids: string[]): Promise<Map<string, LiveBusiness>> {
    if (ids.length === 0) {
      return new Map();
    }

    const rows = await this.prisma.business.findMany({
      where: { ...VISIBLE_BUSINESS_WHERE, id: { in: ids } },
      select: { id: true, slug: true, name: true }
    });

    return new Map(rows.map((row) => [row.id, row as LiveBusiness]));
  }
}

type PrismaBusinessRow = {
  id: string;
  slug: string;
  name: string;
  district: string;
  priceTier: string | null;
  avgRating: { toString(): string };
  reviewCount: number;
  descriptionUz: string;
  descriptionRu: string | null;
  descriptionEn: string | null;
  category: { nameUz: string; nameRu: string; nameEn: string } | null;
  reviews: Array<{ text: string | null }>;
};

/**
 * Category name in the asking locale, falling back to Uzbek.
 *
 * Gurman answers in the user's language, so handing the model a category name
 * in a different one invites it to translate — and a translated category name
 * no longer matches anything the user can filter by on the site.
 */
function categoryName(
  category: PrismaBusinessRow["category"],
  locale: GurmanLocale
): string {
  if (!category) {
    return "";
  }

  return locale === "ru" ? category.nameRu : locale === "en" ? category.nameEn : category.nameUz;
}

function toRetrievedBusiness(row: PrismaBusinessRow, locale: GurmanLocale): RetrievedBusiness {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    categoryName: categoryName(row.category, locale),
    district: row.district,
    priceTier: row.priceTier,
    // Prisma returns Decimal; Number() here rather than in the prompt so the
    // serialised context never carries a Decimal's object form.
    avgRating: Number(row.avgRating.toString()),
    reviewCount: row.reviewCount,
    descriptions: {
      uz: row.descriptionUz,
      ru: row.descriptionRu,
      en: row.descriptionEn
    },
    reviewSnippets: row.reviews
      .map((review) => review.text?.trim() ?? "")
      .filter((text) => text.length > 0)
  };
}
