import type { Locale } from "@manzil/shared";
import type { Metadata } from "next";
import { BentoBusinessGrid } from "../../components/home/bento-business-grid";
import { CleverBenefits } from "../../components/home/clever-benefits";
import { CleverCtaBanner } from "../../components/home/clever-cta-banner";
import { CleverFaq } from "../../components/home/clever-faq";
import { CleverFeatures } from "../../components/home/clever-features";
import { CleverHero } from "../../components/home/clever-hero";
import { CleverPricing } from "../../components/home/clever-pricing";
import { CleverProcess } from "../../components/home/clever-process";
import { CleverWaitlistCard } from "../../components/home/clever-waitlist-card";
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
 * Home — Originkit "Clever" Template Architecture with Manzil Catalog & AI Grounding.
 *
 * Full section sequence:
 * 1. CleverHero: Avatar badge, headline, dual CTAs, trust perks, Canvas 2D background, chat card.
 * 2. CleverBenefits: bento grid highlighting catalog trust, speed, and business reach.
 * 3. CleverFeatures: Interactive tabbed switcher for the Smart Directory and Business Hub.
 * 4. CleverProcess: 3-step numbered workflow timeline.
 * 5. BentoBusinessGrid: Real live business catalog feed from getHomeFeed(locale).
 * 6. CleverPricing: 3-tier business pricing cards (Free / Pro / Enterprise).
 * 7. CleverWaitlistCard: City expansion early-access interactive card.
 * 8. CleverFaq: Interactive collapsible Q&A accordion.
 * 9. CleverCtaBanner: Final high-conversion bottom banner.
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
      {/* Shape reveal on load */}
      <div aria-hidden="true" className="page-reveal">
        <span className="page-reveal-panel" />
        <span className="page-reveal-panel second" />
      </div>

      <CleverHero copy={copy.hero} locale={locale} />
      <CleverBenefits copy={copy.benefits} />
      <CleverFeatures copy={copy.features} locale={locale} />
      <CleverProcess copy={copy.process} />
      <BentoBusinessGrid businesses={ranked} copy={copy.bento} locale={locale} />
      <CleverPricing copy={copy.pricing} />
      <CleverWaitlistCard copy={copy.waitlist} />
      <CleverFaq copy={copy.faq} />
      <CleverCtaBanner copy={copy.finalCta} />
    </>
  );
}
