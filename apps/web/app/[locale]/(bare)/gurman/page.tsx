import type { Locale } from "@manzil/shared";
import type { Metadata } from "next";
import { GurmanCinematicStory } from "../../../components/gurman-cinematic-story";
import { JsonLd } from "../../../components/json-ld";
import { getGurmanLandingCopy } from "../../../lib/gurman-landing-copy";
import { routeMetadata } from "../../../lib/seo";
import { routeBreadcrumb } from "../../../lib/structured-data";

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return routeMetadata("gurman", locale);
}

/**
 * The public Gurman landing page is a focused scroll story. The intelligence,
 * memory, and collaboration details are revealed as chapters rather than
 * presented as a long static document.
 */
export default async function GurmanLandingPage({
  params
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const copy = getGurmanLandingCopy(locale);
  const breadcrumb = routeBreadcrumb(locale, ["home", "gurman"]);

  return (
    <div className="gurman-landing-page gurman-cinematic-page">
      <JsonLd data={breadcrumb} />
      <GurmanCinematicStory copy={copy} locale={locale} />
    </div>
  );
}
