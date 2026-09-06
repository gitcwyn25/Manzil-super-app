import type { Locale } from "@manzil/shared";
import type { Metadata } from "next";
import Features01 from "@/components/originkit/features-01";
import { BusinessHero01 } from "../../../components/business/business-hero-01";
import { CleverFaq } from "../../../components/home/clever-faq";
import { JsonLd } from "../../../components/json-ld";
import { getLandingCopy } from "../../../lib/landing-copy";
import { routeMetadata } from "../../../lib/seo";
import { routeBreadcrumb } from "../../../lib/structured-data";

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return routeMetadata("business", locale);
}

/**
 * Business Landing Page — Originkit "Hero 01" Architecture.
 */
export default async function BusinessLandingPage({
  params
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const landingCopy = getLandingCopy(locale);

  return (
    <div className="bz-page">
      <JsonLd data={routeBreadcrumb(locale, ["home", "business"])} />

      {/* 1. Hero 01: Mesh Gradient, Spotlight, Annotation, Trust Logos, Live Dashboard Mockup */}
      <BusinessHero01 locale={locale} />

      {/* 2. OriginKit Features 01: dashboard-led business capabilities */}
      <Features01 locale={locale} />

      {/* 3. FAQ Accordion */}
      <CleverFaq copy={landingCopy.faq} />

    </div>
  );
}
