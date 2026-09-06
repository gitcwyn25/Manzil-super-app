import type { Locale } from "@manzil/shared";
import type { Metadata } from "next";
import { CleverPricing } from "../../../../components/home/clever-pricing";
import { JsonLd } from "../../../../components/json-ld";
import { getLandingCopy } from "../../../../lib/landing-copy";
import { routeMetadata } from "../../../../lib/seo";
import { routeBreadcrumb } from "../../../../lib/structured-data";

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return routeMetadata("pricing", locale);
}

export default async function BusinessPricingPage({
  params
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const landingCopy = getLandingCopy(locale);

  return (
    <>
      <JsonLd data={routeBreadcrumb(locale, ["home", "business", "pricing"])} />
      <CleverPricing copy={landingCopy.pricing} />
    </>
  );
}
