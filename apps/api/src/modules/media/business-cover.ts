import { PUBLICLY_VISIBLE_BUSINESS } from "../business-visibility";
import type { PrismaService } from "../prisma.service";

/**
 * Resolves a single business's approved cover photo URL, or `null` when it
 * has none yet. Consumers (BusinessCard, home-card, HeroBusinesses) render an
 * `<img>` when this returns a URL and keep their gradient fallback otherwise.
 */
export async function getBusinessCover(
  prisma: PrismaService,
  businessId: string
): Promise<string | null> {
  const photo = await prisma.photo.findFirst({
    where: { businessId, isCover: true, moderationStatus: "approved" },
    select: { publicUrl: true }
  });

  return photo?.publicUrl ?? null;
}

/**
 * Batched variant for listing surfaces (home sections, hero carousel,
 * search/discover grids), keyed by slug rather than id since that is what
 * every consumer already has on hand. Slugs with no approved cover are
 * simply absent from the result — callers treat that as "no cover yet".
 */
export async function getBusinessCoversBySlug(
  prisma: PrismaService,
  slugs: string[]
): Promise<Record<string, string>> {
  const uniqueSlugs = [...new Set(slugs.filter(Boolean))];

  if (uniqueSlugs.length === 0) {
    return {};
  }

  const photos = await prisma.photo.findMany({
    where: {
      isCover: true,
      moderationStatus: "approved",
      // The business predicate matters as much as the moderation one: an
      // approved cover belonging to a suspended listing was still being served
      // here after that listing had been taken down (SECURITY-AUDIT F-1).
      business: { slug: { in: uniqueSlugs }, ...PUBLICLY_VISIBLE_BUSINESS }
    },
    select: { publicUrl: true, business: { select: { slug: true } } }
  });

  const covers: Record<string, string> = {};
  for (const photo of photos) {
    if (photo.publicUrl && photo.business?.slug) {
      covers[photo.business.slug] = photo.publicUrl;
    }
  }

  return covers;
}
