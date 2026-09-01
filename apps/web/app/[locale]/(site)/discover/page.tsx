import type { Locale } from "@manzil/shared";
import type { Metadata } from "next";
import { Suspense } from "react";
import { MarketplaceClient } from "../../../components/discover/marketplace-client";
import { MarketplaceSkeletons } from "../../../components/discover/marketplace-states";
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
 * Modern Local-Commerce Marketplace Discover Page
 * Features: Omni-search hero, 9-category discovery strip, curated carousels,
 * multi-dimensional filter sidebar, mobile bottom-sheet drawer, and compact Tashkent landmarks showcase.
 */
export default async function DiscoverPage({
  params
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;

  const [feed, categoriesRes, searchRes] = await Promise.all([
    getHomeFeed(locale).catch(() => ({
      businesses: [],
      occasions: [],
      lists: [],
      feedItems: [],
      socialActivities: [],
      sections: null
    })),
    getCategories().catch(() => []),
    searchBusinesses("", "all").catch(() => ({ businesses: [], categories: [] }))
  ]);

  const businesses =
    searchRes.businesses && searchRes.businesses.length > 0
      ? searchRes.businesses
      : feed.businesses && feed.businesses.length > 0
      ? feed.businesses
      : [];

  const categories = categoriesRes && categoriesRes.length > 0 ? categoriesRes : [];

  return (
    <>
      <JsonLd data={routeBreadcrumb(locale, ["home", "discover"])} />
      <Suspense fallback={<MarketplaceSkeletons />}>
        <MarketplaceClient
          categories={categories}
          initialBusinesses={businesses}
          locale={locale}
        />
      </Suspense>
    </>
  );
}
