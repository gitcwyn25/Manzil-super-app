import type { Locale } from "@manzil/shared";
import type { Metadata } from "next";
import { GurmanExperience } from "../../../components/concierge/gurman-experience";
import { JsonLd } from "../../../components/json-ld";
import { getHomeFeed, searchBusinesses } from "../../../lib/api";
import { routeMetadata } from "../../../lib/seo";
import { routeBreadcrumb } from "../../../lib/structured-data";

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return routeMetadata("concierge", locale);
}

/**
 * Gurman AI 2.0 — Local Discovery & Recommendation Workstation.
 * Features: 2-column layout (42%/58%), natural language request composer,
 * structured intent criteria extraction, 3-stage searching status, curated recommendations
 * with transparent "Why Recommended" reasoning, and shortlist/detail drawers.
 */
export default async function ConciergePage({
  params
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const breadcrumb = routeBreadcrumb(locale, ["home", "concierge"]);

  const [feed, searchRes] = await Promise.all([
    getHomeFeed(locale).catch(() => ({
      businesses: [],
      occasions: [],
      lists: [],
      feedItems: [],
      socialActivities: [],
      sections: null
    })),
    searchBusinesses("", "all").catch(() => ({ businesses: [], categories: [] }))
  ]);

  const businesses =
    searchRes.businesses && searchRes.businesses.length > 0
      ? searchRes.businesses
      : feed.businesses && feed.businesses.length > 0
      ? feed.businesses
      : [];

  return (
    <div className="gurman-bare-page">
      <JsonLd data={breadcrumb} />
      <GurmanExperience
        catalogBusinesses={businesses}
        locale={locale}
      />
    </div>
  );
}
