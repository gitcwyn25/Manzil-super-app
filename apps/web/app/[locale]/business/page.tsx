import type { Locale } from "@manzil/shared";
import { AnimatedCounter } from "../../components/motion/animated-counter";
import { Reveal, RevealStagger } from "../../components/motion/reveal";
import { getBusinessLandingCopy } from "../../lib/business-landing-copy";
import { formatPrice, getPlans } from "../../lib/plans";

type RenderPlan = {
  key: string;
  name: string;
  price: string;
  features: string[];
  cta: string;
  highlight: boolean;
  badge?: string;
};

export default async function BusinessLandingPage({
  params
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const copy = getBusinessLandingCopy(locale);

  // Dynamic, admin-set pricing from the API; falls back to static copy if the
  // API is unreachable at build/request time.
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
        features: p.features.filter((f) => f.included).map((f) => f.label[locale] ?? f.label.uz),
        cta: ctaFor[p.tier] ?? copy.plans.free.cta,
        highlight: p.tier === "max",
        badge: p.tier === "max" ? copy.plans.max.badge : undefined
      }))
    : (["free", "pro", "max"] as const).map((tier) => ({
        key: tier,
        name: copy.plans[tier].name,
        price: copy.plans[tier].price,
        features: [...copy.plans[tier].features],
        cta: copy.plans[tier].cta,
        highlight: tier === "max",
        badge: tier === "max" ? copy.plans.max.badge : undefined
      }));

  return (
    <div className="bz-page">
      {/* ============ HERO — left copy, floating glass shapes right ============ */}
      <section className="bz-hero">
        <div className="bz-hero-copy">
          <Reveal variant="fade-up">
            <h1>
              {copy.heroTitle1}
              <br />
              {copy.heroTitle2}
            </h1>
          </Reveal>
          <Reveal delay={120} variant="fade-up">
            <p>{copy.heroText}</p>
          </Reveal>
          <Reveal delay={220} variant="fade-up">
            <div className="bz-hero-actions">
              <a className="bz-btn-primary" href={`/${locale}/business/register`}>{copy.ctaPrimary}</a>
              <a className="bz-btn-ghost" href={`/${locale}/dashboard`}>{copy.ctaSecondary}</a>
            </div>
          </Reveal>
        </div>

        <div aria-hidden="true" className="bz-hero-visual">
          <span className="bz-glass bz-glass-a"><i /><i /><i /></span>
          <span className="bz-glass bz-glass-b"><i /><i /></span>
          <span className="bz-glass bz-glass-c" />
          <span className="bz-cylinders">
            <i className="c1" /><i className="c2" /><i className="c3" />
            <em className="bz-dish" />
          </span>
          <span className="bz-orb bz-orb-a" />
          <span className="bz-orb bz-orb-b" />
        </div>
      </section>

      {/* ============ DARK ANALYTICS BAND ============ */}
      <Reveal variant="fade-up">
        <section className="bz-band">
          <div className="bz-band-copy">
            <h2>{copy.bandTitle}</h2>
            <p>{copy.bandText}</p>
            <a className="bz-band-cta" href={`/${locale}/dashboard`}>{copy.bandCta}</a>
          </div>
          <div aria-hidden="true" className="bz-band-mock">
            <div className="bz-band-row">
              <span className="bz-band-avatar" />
              <span className="bz-band-lines"><i className="w60" /><i className="w40" /></span>
              <b>+24%</b>
            </div>
            <div className="bz-band-chart">
              <i style={{ height: "30%" }} /><i style={{ height: "55%" }} /><i style={{ height: "42%" }} />
              <i style={{ height: "70%" }} /><i style={{ height: "58%" }} /><i style={{ height: "86%" }} />
            </div>
          </div>
        </section>
      </Reveal>

      {/* ============ STAT CARDS ============ */}
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

      {/* ============ BENTO ============ */}
      <section className="bz-bento-wrap">
        <Reveal variant="fade-up">
          <h2 className="bz-section-title">{copy.bentoTitle}</h2>
        </Reveal>
        <RevealStagger className="bz-bento" step={100} variant="fade-up">
          {copy.bento.map((item) => (
            <article className={item.dark ? "bz-card dark" : "bz-card"} key={item.title}>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </article>
          ))}
        </RevealStagger>
      </section>

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
    </div>
  );
}
