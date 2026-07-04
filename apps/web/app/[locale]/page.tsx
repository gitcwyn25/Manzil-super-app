import type { Locale } from "@manzil/shared";
import { AudienceFeatures } from "../components/audience-features";
import { Reveal } from "../components/motion/reveal";
import { ScenicBackdrop } from "../components/scenic-hero";
import { StoreBadges } from "../components/store-badges";
import { getLandingCopy } from "../lib/landing-copy";

export default async function LandingPage({
  params
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const copy = getLandingCopy(locale);

  return (
    <>
      {/* Shape reveal on load */}
      <div aria-hidden="true" className="page-reveal">
        <span className="page-reveal-panel" />
        <span className="page-reveal-panel second" />
      </div>

      {/* ============ HERO — full-bleed scenic landscape, serif headline ============ */}
      <section className="lp-hero">
        <ScenicBackdrop />
        <div className="lp-hero-content">
          <a className="lp-pill" href={`/${locale}/business/pricing`}>
            <span className="lp-pill-dot" />
            {copy.badge}
            <svg aria-hidden="true" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="13" height="13"><path d="m9 6 6 6-6 6" /></svg>
          </a>
          <h1 className="lp-title">
            <span className="lp-title-line">{copy.titleLine1}</span>
            <span className="lp-title-line delay">{copy.titleLine2}</span>
          </h1>
          <p className="lp-sub">{copy.subtitle}</p>
          <a className="lp-cta" href={`/${locale}/dashboard`}>{copy.cta}</a>
        </div>
        <p className="lp-hero-footnote">{copy.heroFootnote}</p>
      </section>

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
          <AudienceFeatures content={copy.audience} />
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
