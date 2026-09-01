import type { Locale } from "@manzil/shared";
import type { Metadata } from "next";
import { GurmanHeroComposer } from "../../../components/concierge/gurman-hero-composer";
import { JsonLd } from "../../../components/json-ld";
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
 * Dedicated Gurman AI Concierge Page — Pixel-Faithful Hero Composer with Tashkent Metro background.
 */
export default async function ConciergePage({
  params
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const breadcrumb = routeBreadcrumb(locale, ["home", "concierge"]);

  return (
    <div className="gurman-dedicated-page">
      <JsonLd data={breadcrumb} />
      <GurmanHeroComposer locale={locale} />
    </div>
  );
}
