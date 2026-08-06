import type { Locale } from "@manzil/shared";
import { BentoBusinessGrid } from "../../components/home/bento-business-grid";
import { FeatureTrio } from "../../components/home/feature-trio";
import { HeroConcierge } from "../../components/home/hero-concierge";
import { getHomeFeed } from "../../lib/api";
import { getLandingCopy } from "../../lib/landing-copy";

/**
 * Home — the Vibrant Marketplace AI-discovery landing (task A2).
 *
 * Three movements: the green concierge hero (D6 — the one green brand
 * moment), the honest AI-concierge feature trio (D9 — replaces
 * AudienceFeatures; StoreBadges is removed, the app is unlaunched), and the
 * bento business grid built from real getHomeFeed data. The retired hero
 * carousel/Aperture/download sections have no counterpart in the approved
 * design.
 */
export default async function LandingPage({
  params
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const copy = getLandingCopy(locale);
  const feed = await getHomeFeed(locale);

  // Featured first, then recent arrivals, deduplicated — so the bento's large
  // slot receives featured[0] ?? justJoined[0] (D10: live featured[] is empty
  // today, and the grid must degrade rather than blank).
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

      <HeroConcierge copy={copy.hero} locale={locale} />
      <FeatureTrio copy={copy.features} />
      <BentoBusinessGrid businesses={ranked} copy={copy.bento} locale={locale} />
    </>
  );
}
