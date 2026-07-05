import type { Locale } from "@manzil/shared";
import { AnimatedCounter } from "../../components/motion/animated-counter";
import { Reveal, RevealStagger } from "../../components/motion/reveal";
import { getBusinessLandingCopy } from "../../lib/business-landing-copy";

export default async function BusinessLandingPage({
  params
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const copy = getBusinessLandingCopy(locale);
  const plans = [
    { key: "free", plan: copy.plans.free, highlight: false, badge: undefined as string | undefined },
    { key: "pro", plan: copy.plans.pro, highlight: false, badge: undefined as string | undefined },
    { key: "max", plan: copy.plans.max, highlight: true, badge: copy.plans.max.badge }
  ];

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
          {plans.map(({ key, plan, highlight, badge }) => (
            <article className={highlight ? "bz-plan highlight" : "bz-plan"} key={key}>
              {badge ? <span className="bz-plan-badge">{badge}</span> : null}
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
              <a className={highlight ? "bz-btn-primary full" : "bz-btn-ghost full"} href={`/${locale}/business/register`}>
                {plan.cta}
              </a>
            </article>
          ))}
        </RevealStagger>
      </section>
    </div>
  );
}
