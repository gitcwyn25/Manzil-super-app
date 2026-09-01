import type { CleverPricingCopy } from "../../lib/landing-copy";
import { Reveal } from "../motion/reveal";
import { Icon } from "../vm/icons";

export function CleverPricing({ copy }: { copy: CleverPricingCopy }) {
  return (
    <section className="clever-section clever-pricing" id="pricing">
      <div className="container">
        {/* Section Header */}
        <div className="clever-header">
          <Reveal as="div" variant="fade-up">
            <span className="clever-badge">
              <Icon name="star" size={14} />
              <span>{copy.badge}</span>
            </span>
          </Reveal>
          <Reveal as="div" delay={80} variant="fade-up">
            <h2 className="clever-heading">{copy.title}</h2>
          </Reveal>
          <Reveal as="div" delay={160} variant="fade-up">
            <p className="clever-subheading">{copy.subtitle}</p>
          </Reveal>
        </div>

        {/* Pricing Cards Grid */}
        <div className="clever-pricing__grid">
          {copy.tiers.map((tier, idx) => (
            <Reveal as="div" delay={idx * 100} key={tier.id} variant="fade-up">
              <div
                className={`clever-pricing-card ${
                  tier.popular ? "clever-pricing-card--popular" : ""
                }`}
              >
                {tier.popular && (
                  <div className="clever-pricing-card__popular-badge">
                    <Icon name="sparkles" size={12} />
                    <span>Eng Ommabop</span>
                  </div>
                )}

                <div className="clever-pricing-card__head">
                  <h3 className="clever-pricing-card__name">{tier.name}</h3>
                  <p className="clever-pricing-card__tagline">{tier.tagline}</p>
                </div>

                <div className="clever-pricing-card__price-box">
                  <span className="clever-pricing-card__amount">{tier.price}</span>
                  <span className="clever-pricing-card__period">{tier.period}</span>
                </div>

                <div className="clever-pricing-card__cta-wrapper">
                  <a
                    className={`clever-btn ${
                      tier.popular ? "clever-btn--primary" : "clever-btn--outline"
                    } clever-btn--full`}
                    href={tier.ctaHref}
                  >
                    <span>{tier.cta}</span>
                    <Icon name="arrow_forward" size={14} />
                  </a>
                </div>

                <div className="clever-pricing-card__features-title">Kiritilgan imkoniyatlar:</div>
                <ul className="clever-pricing-card__features-list">
                  {tier.features.map((feat, i) => (
                    <li className="clever-pricing-card__feature-item" key={i}>
                      <span className="clever-pricing-card__check">
                        <Icon name="verified" size={14} />
                      </span>
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
