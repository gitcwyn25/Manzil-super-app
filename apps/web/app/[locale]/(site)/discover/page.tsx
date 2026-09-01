import type { Locale } from "@manzil/shared";
import type { Metadata } from "next";
import { CinematicTashkent } from "../../../components/discover/cinematic-tashkent";
import { TashkentCatalogSection } from "../../../components/discover/tashkent-catalog-section";
import { JsonLd } from "../../../components/json-ld";
import { getCategories, getHomeFeed, searchBusinesses } from "../../../lib/api";
import { routeMetadata } from "../../../lib/seo";
import { routeBreadcrumb } from "../../../lib/structured-data";

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return routeMetadata("discover", locale);
}

/**
 * Tashkent Discover Page — Cinematic Scroll Experience with Merged Events.
 */
export default async function DiscoverPage({
  params
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;

  const [feed, categoriesRes, searchRes] = await Promise.all([
    getHomeFeed(locale).catch(() => ({ businesses: [], occasions: [], lists: [], feedItems: [], socialActivities: [], sections: null })),
    getCategories().catch(() => []),
    searchBusinesses("", "all").catch(() => ({ businesses: [] }))
  ]);

  const businesses = searchRes.businesses && searchRes.businesses.length > 0 ? searchRes.businesses : feed.businesses;
  const occasions = feed.occasions ?? [];
  const categories = categoriesRes ?? [];

  return (
    <div className="discover-cinema-page">
      <JsonLd data={routeBreadcrumb(locale, ["home", "discover"])} />

      <CinematicTashkent
        businesses={businesses}
        locale={locale}
        occasions={occasions}
      />

      <TashkentCatalogSection
        businesses={businesses}
        categories={categories}
        locale={locale}
        occasions={occasions}
      />
    </div>
  );
}
