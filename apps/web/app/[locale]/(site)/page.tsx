import type { Locale } from "@manzil/shared";
import type { Metadata } from "next";
import { CleverFaq } from "../../components/home/clever-faq";
import { CleverHero } from "../../components/home/clever-hero";
import { GurmanVideoSection } from "../../components/home/gurman-video-section";
import { ManzilStory } from "../../components/home/manzil-story";
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
 * 2. Mobile story: discovery, everyday needs, human experience, and sharing.
 * 3. Directory boundary: real listings belong to Discover only.
 * 4. FAQ and final path selection.
 */
export default async function LandingPage({
  params
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const copy = getLandingCopy(locale);

  return (
    <>
      <div aria-hidden="true" className="page-reveal">
        <span className="page-reveal-panel" />
        <span className="page-reveal-panel second" />
      </div>

      <CleverHero copy={copy.hero} locale={locale} />
      <ManzilStory copy={copy.story} />
      <GurmanVideoSection copy={copy.gurman} locale={locale} />
      <CleverFaq copy={copy.faq} />
    </>
  );
}
