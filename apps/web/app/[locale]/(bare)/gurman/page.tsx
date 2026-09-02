import type { Locale } from "@manzil/shared";
import type { Metadata } from "next";
import { Suspense } from "react";
import { GurmanHero } from "../../../components/gurman-hero";
import { GurmanLandingSections } from "../../../components/gurman-landing-sections";
import { GurmanExperience } from "../../../components/concierge/gurman-experience";
import { JsonLd } from "../../../components/json-ld";
import { getHomeFeed } from "../../../lib/api";
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
 * Dedicated Gurman landing page.
 *
 * The page follows the product narrative: explain the intent-first experience,
 * show the evidence and trust model, then let visitors try the existing
 * catalogue workstation. Future capabilities are labelled as roadmap items in
 * the landing copy rather than presented as shipped functionality. This page
 * is statically generated for all three supported locales.
 */
export default async function GurmanLandingPage({
  params
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const copy = getGurmanLandingCopy(locale);
  const breadcrumb = routeBreadcrumb(locale, ["home", "gurman"]);
  const feed = await getHomeFeed(locale).catch(() => ({
    businesses: [],
    occasions: [],
    lists: [],
    feedItems: [],
    socialActivities: [],
    sections: null
  }));

  const businesses = feed.businesses ?? [];

  return (
    <div className="gurman-landing-page">
      <JsonLd data={breadcrumb} />
      <GurmanHero copy={copy.hero} locale={locale} />
      <GurmanLandingSections copy={copy} />

      <section className="gurman-landing__workspace" id="gurman-workstation">
        <div className="gurman-landing__workspace-head">
          <p className="gurman-landing__eyebrow">{locale === "uz" ? "Sinab ko'ring" : locale === "ru" ? "Попробуйте" : "Try Gurman"}</p>
          <h2>{locale === "uz" ? "Istagingizni yozing — tanlovni Gurman qisqartiradi." : locale === "ru" ? "Опишите желание — Gurman сократит выбор." : "Describe what you need — Gurman narrows the choice."}</h2>
          <p>{locale === "uz" ? "Quyidagi ish maydoni hozirgi Manzil katalogi bilan ishlaydi." : locale === "ru" ? "Рабочее пространство ниже работает с текущим каталогом Manzil." : "The workspace below works with the current Manzil catalogue."}</p>
        </div>
        <Suspense fallback={null}>
          <GurmanExperience catalogBusinesses={businesses} locale={locale} />
        </Suspense>
      </section>
    </div>
  );
}
