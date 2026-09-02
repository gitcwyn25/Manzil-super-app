import type { Locale } from "@manzil/shared";
import type { Metadata } from "next";
import { Suspense } from "react";
import { GurmanExperience } from "../../../components/concierge/gurman-experience";
import { JsonLd } from "../../../components/json-ld";
import { getHomeFeed, searchBusinesses } from "../../../lib/api";
import { routeMetadata } from "../../../lib/seo";
import { routeBreadcrumb } from "../../../lib/structured-data";
import { Section15Hero } from "../../../../../../components/originkit/ui/hero-06/section-15-hero";

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
 * Layout: Originkit Hero 06 spiral/rings visual full-viewport hero,
 * followed by the 2-column discovery workstation.
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

      {/* Originkit Hero 06 — full-viewport spiral + concentric rings + lens visual */}
      <Section15Hero locale={locale} />

      {/* Workstation — 2-column discovery UI; targeted by Hero CTA scroll */}
      <div id="gurman-workstation">
        <Suspense fallback={null}>
          <GurmanExperience
            catalogBusinesses={businesses}
            locale={locale}
          />
        </Suspense>
      </div>
    </div>
  );
}
