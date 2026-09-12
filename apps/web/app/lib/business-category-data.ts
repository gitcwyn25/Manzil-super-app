import type { BusinessPlatform } from "@manzil/shared";
import { searchBusinesses } from "./api";
import {
  MARKETPLACE_CATEGORY_SLUGS,
  MARKETPLACE_PARENT_CATEGORY_SLUGS
} from "./business-categories";

function uniqueBusinesses(items: BusinessPlatform[]): BusinessPlatform[] {
  const seen = new Set<string>();
  return items.filter((business) => {
    if (seen.has(business.slug)) return false;
    seen.add(business.slug);
    return true;
  });
}

export async function getBusinessesForStandaloneCategory(
  slug: string,
  query = ""
): Promise<BusinessPlatform[]> {
  const categorySlugs = MARKETPLACE_CATEGORY_SLUGS[slug] ??
    MARKETPLACE_PARENT_CATEGORY_SLUGS[slug] ??
    [];

  if (categorySlugs.length === 0) return [];

  const responses = await Promise.all(
    categorySlugs.map((categorySlug) => searchBusinesses(query, categorySlug).catch(() => ({ businesses: [] })))
  );

  return uniqueBusinesses(responses.flatMap((response) => response.businesses));
}

export async function getAllStandaloneBusinesses(query = ""): Promise<BusinessPlatform[]> {
  const response = await searchBusinesses(query, "all").catch(() => ({ businesses: [] }));
  return response.businesses;
}
