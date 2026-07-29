import type { Locale } from "@manzil/shared";
import { AudienceFeatures } from "../../components/audience-features";
import { Aperture } from "../../components/motion/aperture";
import { Reveal } from "../../components/motion/reveal";
import { HeroBusinesses } from "../../components/hero-businesses";
import { HomeSections } from "../../components/home-sections";
import { StoreBadges } from "../../components/store-badges";
import { getAudienceSamples } from "../../lib/audience-samples";
import { getHomeFeed } from "../../lib/api";
import { getLandingCopy } from "../../lib/landing-copy";

export default async function LandingPage({
  params
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const copy = getLandingCopy(locale);
  const feed = await getHomeFeed(locale);
  const liveCount = feed.sections?.justJoined.length ?? 0;

  // Featured first, then recent arrivals, deduplicated — the hero should lead
  // with the editorially chosen places and fall back to real inventory rather
  // than to an illustration.
  const heroBusinesses = [
    ...(feed.sections?.featured ?? []),
    ...(feed.sections?.justJoined ?? [])
  ]
    .filter((card, i, all) => all.findIndex((other) => other.slug === card.slug) === i)
    .slice(0, 6);

  return (
    <>
      {/* Shape reveal on load */}
      <div aria-hidden="true" className="page-reveal">
        <span className="page-reveal-panel" />
        <span className="page-reveal-panel second" />
      </div>

      {/* ============ HERO — the platform's own statement, on its own ground.
           A business photograph behind this headline read as that business's
           advertisement rather than Manzil's promise, and put marketing type
           over a photo nobody chose for legibility. The businesses get their
           own section below, where a photo means what it says. ============ */}
      <section className="lp-hero lp-hero--plain">
        <div className="lp-hero-content">
          <h1 className="lp-title">
            <span className="lp-title-line">{copy.titleLine1}</span>
            <span className="lp-title-line delay">{copy.titleLine2}</span>
          </h1>
          <p className="lp-sub">{copy.subtitle}</p>
          <a className="lp-cta" href={`/${locale}/discover`}>{copy.cta}</a>
        </div>
        <div className="lp-hero-aperture">
          <Aperture live={liveCount > 0} label={copy.badge} />
        </div>
      </section>

      {/* The showcase, standing on its own so a business photo is unmistakably
          the business's, not a backdrop for someone else's headline. */}
      {heroBusinesses.length > 0 ? (
        <section className="lp-showcase">
          <HeroBusinesses
            businesses={heroBusinesses}
            copy={{
              regionLabel: copy.heroCarouselLabel,
              goToLabel: copy.heroGoTo,
              newLabel: copy.heroNew
            }}
            locale={locale}
          />
        </section>
      ) : null}

      {/* Businesses come before the marketing copy. A directory whose homepage
          shows no businesses is asking visitors to take the directory on faith. */}
      {feed.sections ? (
        <section className="lp-band lp-band--businesses">
          <HomeSections locale={locale} sections={feed.sections} />
        </section>
      ) : null}

      {/* ============ FEATURES — serif headline + audience toggle bento ============ */}
      <section className="lp-features" id="features">
        <Reveal variant="fade-up">
          <h2 className="lp-features-title">
            {copy.featuresTitle1}
            <br />
            {copy.featuresTitle2}
          </h2>
        </Reveal>
        <Reveal delay={120} variant="fade-up">
          <p className="lp-features-sub">{copy.featuresSubtitle}</p>
        </Reveal>
        <Reveal delay={200} variant="fade-up">
          <AudienceFeatures content={copy.audience} samples={getAudienceSamples(locale)} />
        </Reveal>
      </section>

      {/* ============ APP DOWNLOAD — quiet, spacious ============ */}
      <section className="lp-download" id="download">
        <Reveal variant="fade-up">
          <div className="lp-download-inner">
            <div>
              <h2>{copy.downloadTitle}</h2>
              <p>{copy.downloadText}</p>
            </div>
            <StoreBadges androidLabel={copy.android} iosLabel={copy.ios} soonLabel={copy.comingSoon} variant="light" />
          </div>
        </Reveal>
      </section>
    </>
  );
}
