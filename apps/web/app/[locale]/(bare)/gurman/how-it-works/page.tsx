import type { Locale } from "@manzil/shared";
import type { Metadata } from "next";
import { GurmanCinematicStory } from "../../../../components/gurman-cinematic-story";
import { JsonLd } from "../../../../components/json-ld";
import { getGurmanLandingCopy } from "../../../../lib/gurman-landing-copy";
import { routeMetadata } from "../../../../lib/seo";
import { routeBreadcrumb } from "../../../../lib/structured-data";

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return routeMetadata("gurman", locale);
}

/**
 * The detailed explanation uses the same cinematic story as the landing page.
 * There is no second, static architecture document to read through: the
 * intelligence, memory, and collaboration chapters reveal themselves while
 * the visitor scrolls.
 */
export default async function GurmanHowItWorksPage({
  params
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const copy = getGurmanLandingCopy(locale);
  const breadcrumb = routeBreadcrumb(locale, ["home", "gurman"]);

  return (
    <div className="gurman-landing-page gurman-how-it-works-page gurman-cinematic-page">
      <JsonLd data={breadcrumb} />
      <GurmanCinematicStory copy={copy} locale={locale} />
    </div>
  );
}
