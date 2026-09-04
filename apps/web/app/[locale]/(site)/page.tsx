import type { Locale } from "@manzil/shared";
import type { Metadata } from "next";
import { BentoBusinessGrid } from "../../components/home/bento-business-grid";
import { CleverBenefits } from "../../components/home/clever-benefits";
import { CleverCtaBanner } from "../../components/home/clever-cta-banner";
import { CleverFaq } from "../../components/home/clever-faq";
import { CleverFeatures } from "../../components/home/clever-features";
import { CleverHero } from "../../components/home/clever-hero";
import { CleverProcess } from "../../components/home/clever-process";
import { GurmanPreview } from "../../components/home/gurman-preview";
import { getHomeFeed } from "../../lib/api";
import { getLandingCopy } from "../../lib/landing-copy";
import { routeMetadata } from "../../lib/seo";

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return routeMetadata("home", locale);
}

/**
 * Home — one Manzil system with a clear current/future boundary:
 * 1. Hero: Discover is live; Gurman is mobile/future.
 * 2. Benefits: factual directory value.
 * 3. Directory proof: real getHomeFeed data.
 * 4. GurmanPreview: static mobile planning concept and waitlist path.
 * 5. Features: Discover and business capabilities.
 * 6. Process: how the current directory supports a decision.
 * 7. FAQ and final path selection.
 */
export default async function LandingPage({
  params
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const copy = getLandingCopy(locale);
  const feed = await getHomeFeed(locale);

  const ranked = [
    ...(feed.sections?.featured ?? []),
    ...(feed.sections?.justJoined ?? [])
  ].filter((card, i, all) => all.findIndex((other) => other.slug === card.slug) === i);

  return (
    <>
      <div aria-hidden="true" className="page-reveal">
        <span className="page-reveal-panel" />
        <span className="page-reveal-panel second" />
      </div>

      <CleverHero copy={copy.hero} locale={locale} />
      <CleverBenefits copy={copy.benefits} />
      <BentoBusinessGrid businesses={ranked} copy={copy.bento} locale={locale} />
      <GurmanPreview copy={copy.gurman} locale={locale} />
      <CleverFeatures copy={copy.features} locale={locale} />
      <CleverProcess copy={copy.process} />
      <CleverFaq copy={copy.faq} />
      <CleverCtaBanner copy={copy.homeCta} />
    </>
  );
}
