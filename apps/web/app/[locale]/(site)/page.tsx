import type { Locale } from "@manzil/shared";
import type { Metadata } from "next";
import { CleverFaq } from "../../components/home/clever-faq";
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
 * 1. Mobile story: discovery, everyday needs, human experience, and sharing.
 * 2. Directory boundary: real listings belong to Discover only.
 * 3. FAQ and final path selection.
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

      <ManzilStory copy={copy.story} />
      <GurmanVideoSection copy={copy.gurman} locale={locale} />
      <CleverFaq copy={copy.faq} />
    </>
  );
}
