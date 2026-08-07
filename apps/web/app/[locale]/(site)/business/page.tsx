import type { BusinessPlatform, Locale } from "@manzil/shared";
import { AnimatedCounter } from "../../../components/motion/animated-counter";
import { Reveal, RevealStagger } from "../../../components/motion/reveal";
import {
  AnalyticsMock,
  DashboardMock,
  PromoMock,
  ReviewsMock
} from "../../../components/business/mockups";
import type { Metadata } from "next";
import { JsonLd } from "../../../components/json-ld";
import { getBusinessLandingCopy } from "../../../lib/business-landing-copy";
import { formatPrice, getPlans, planFeatureLabel } from "../../../lib/plans";
import { searchBusinesses } from "../../../lib/api";
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

type RenderPlan = {
  key: string;
  name: string;
  price: string;
  features: string[];
  cta: string;
  highlight: boolean;
  badge?: string;
};

const MOCKS = {
  reviews: ReviewsMock,
  promos: PromoMock,
  analytics: AnalyticsMock
} as const;

/** Curated fallback so the proof strip never renders empty (all real, listed places). */
const FALLBACK_PLACES = [
  { name: "Caravan Coffee", district: "Chilonzor" },
  { name: "Plov Center", district: "Yunusobod" },
  { name: "Bon! Bakery", district: "Mirobod" },
  { name: "City Grill", district: "Yakkasaroy" },
  { name: "Choyxona Milliy", district: "Shayxontohur" },
  { name: "Sweet Home", district: "Mirzo Ulug'bek" }
];

export default async function BusinessLandingPage({
  params
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const copy = getBusinessLandingCopy(locale);

  // Real, listed Tashkent businesses power the proof strip — and only the
  // proof strip, which states nothing about them beyond "this place is on
  // Manzil". The dashboard mockup carries illustrative figures (view counts,
  // review totals); feeding it a real business name would attribute invented
  // numbers to a named partner, so it always renders its own clearly-labelled
  // sample identity instead. See components/business/mockups.tsx.
  let businesses: BusinessPlatform[] = [];
  try {
    const res = await searchBusinesses("", "all");
    businesses = res.businesses ?? [];
  } catch {
    businesses = [];
  }
  const proof = businesses.length
    ? businesses.slice(0, 6).map((b) => ({ name: b.name, district: b.district }))
    : FALLBACK_PLACES;

  // Dynamic, admin-set pricing from the API; falls back to static copy.
  const apiPlans = await getPlans();
  const ctaFor: Record<string, string> = {
    free: copy.plans.free.cta,
    pro: copy.plans.pro.cta,
    max: copy.plans.max.cta
  };
  const plans: RenderPlan[] = apiPlans.length
    ? apiPlans.map((p) => ({
        key: p.tier,
        name: p.name[locale] ?? p.name.uz,
        price: formatPrice(p.priceMonthly, p.currency, locale),
        // planFeatureLabel drops rows whose label is still a raw entitlement
        // key (`crm.segments`), which used to render verbatim in this table.
        features: p.features
          .filter((f) => f.included)
          .map((f) => planFeatureLabel(f, locale))
          .filter((label): label is string => Boolean(label)),
        cta: ctaFor[p.tier] ?? copy.plans.free.cta,
        highlight: p.tier === "pro",
        badge: p.tier === "pro" ? copy.plans.max.badge : undefined
      }))
    : (["free", "pro", "max"] as const).map((tier) => ({
        key: tier,
        name: copy.plans[tier].name,
        price: copy.plans[tier].price,
        features: [...copy.plans[tier].features],
        cta: copy.plans[tier].cta,
        highlight: tier === "pro",
        badge: tier === "pro" ? copy.plans.max.badge : undefined
      }));

  return (
    <div className="bz-page">
      <JsonLd data={routeBreadcrumb(locale, ["home", "business"])} />
      {/* ============ HERO ============ */}
      {/* The band carries the full-bleed primary-blue gradient (Vibrant
          Marketplace); .bz-hero inside keeps its existing grid geometry. */}
      <section className="bz-hero-band">
        <div className="bz-hero">
          <div className="bz-hero-copy">
            <Reveal variant="fade-up">
              <p className="bz-hero-eyebrow">{copy.heroEyebrow}</p>
            </Reveal>
            <Reveal delay={70} variant="fade-up">
              <h1>
                {copy.heroTitle1}
                <br />
                <span className="bz-hero-accent">{copy.heroTitle2}</span>
              </h1>
            </Reveal>
            <Reveal delay={150} variant="fade-up">
              <p className="bz-hero-text">{copy.heroText}</p>
            </Reveal>
            <Reveal delay={230} variant="fade-up">
              <div className="bz-hero-actions">
                <a className="bz-btn-primary" href={`/${locale}/business/register`}>{copy.ctaPrimary}</a>
                <a className="bz-btn-ghost" href={`/${locale}/dashboard`}>{copy.ctaSecondary}</a>
              </div>
            </Reveal>
            <Reveal delay={320} variant="fade-in">
              <p className="bz-trust">
                <span className="bz-trust-stars">★★★★★</span>
                {copy.trustLine}
              </p>
            </Reveal>
          </div>
          <Reveal className="bz-hero-visual" delay={180} variant="scale-in">
            <DashboardMock locale={locale} />
          </Reveal>
        </div>
      </section>

      {/* ============ PROOF STRIP ============ */}
      <section className="bz-proof">
        <Reveal variant="fade-in">
          <p className="bz-proof-title">{copy.proofTitle}</p>
        </Reveal>
        <RevealStagger as="div" className="bz-proof-row" step={70} variant="fade-up">
          {proof.map((place) => (
            <span className="bz-proof-item" key={`${place.name}-${place.district}`}>
              <b>{place.name}</b>
              <i>{place.district}</i>
            </span>
          ))}
        </RevealStagger>
      </section>

      {/* ============ ALTERNATING FEATURE SECTIONS ============ */}
      <div className="bz-features">
        {copy.features.map((feature, index) => {
          const Mock = MOCKS[feature.mock];
          return (
            <section className={index % 2 === 1 ? "bz-feature reverse" : "bz-feature"} key={feature.title}>
              <Reveal className="bz-feature-copy" variant="fade-up">
                <p className="bz-feature-eyebrow">{feature.eyebrow}</p>
                <h2>{feature.title}</h2>
                <p className="bz-feature-text">{feature.text}</p>
                <ul className="bz-feature-list">
                  {feature.bullets.map((bullet) => (
                    <li key={bullet}>{bullet}</li>
                  ))}
                </ul>
              </Reveal>
              <Reveal className="bz-feature-visual" delay={120} variant={index % 2 === 1 ? "slide-right" : "slide-left"}>
                <Mock locale={locale} />
              </Reveal>
            </section>
          );
        })}
      </div>

      {/* ============ STATS ============
          Renders only when real platform figures exist. Manzil is pre-launch:
          publishing invented totals on the page that converts business owners
          is the one lie that costs the most, so the band hides instead. */}
      {copy.stats.length > 0 && (
        <section className="bz-stats-band">
          <Reveal variant="fade-up">
            <h2 className="bz-section-title">{copy.statsTitle}</h2>
          </Reveal>
          <RevealStagger className="bz-stats" step={90} variant="fade-up">
            {copy.stats.map((stat) => (
              <div className="bz-stat" key={stat.label}>
                <strong>
                  <AnimatedCounter value={stat.value} />
                  {stat.suffix}
                </strong>
                <span>{stat.label}</span>
              </div>
            ))}
          </RevealStagger>
        </section>
      )}

      {/* ============ PRICING ============ */}
      <section className="bz-pricing" id="pricing">
        <Reveal variant="fade-up">
          <h2 className="bz-section-title">{copy.pricingTitle}</h2>
          <p className="bz-section-sub">{copy.pricingText}</p>
        </Reveal>
        <RevealStagger className="bz-plans" step={110} variant="fade-up">
          {plans.map((plan) => (
            <article className={plan.highlight ? "bz-plan highlight" : "bz-plan"} key={plan.key}>
              {plan.badge ? <span className="bz-plan-badge">{plan.badge}</span> : null}
              <h3>{plan.name}</h3>
              <p className="bz-plan-price">
                {plan.price}
                <em>{copy.perMonth}</em>
              </p>
              <ul>
                {plan.features.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
              <a className={plan.highlight ? "bz-btn-primary full" : "bz-btn-ghost full"} href={`/${locale}/business/register`}>
                {plan.cta}
              </a>
            </article>
          ))}
        </RevealStagger>
      </section>

      {/* ============ FINAL CTA ============ */}
      <Reveal variant="fade-up">
        <section className="bz-final">
          <div className="bz-final-inner">
            <h2>{copy.finalTitle}</h2>
            <p>{copy.finalText}</p>
            <a className="bz-final-cta" href={`/${locale}/business/register`}>{copy.finalCta}</a>
          </div>
        </section>
      </Reveal>
    </div>
  );
}
