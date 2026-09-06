import type { CleverPricingCopy } from "../../lib/landing-copy";
import { CompanionLoop } from "../media/companion-loop";
import { Reveal } from "../motion/reveal";
import { Icon } from "../vm/icons";

const COMPANION_LOOPS: Record<string, string[]> = {
  free: ["/media/business/wonder-transparent-alpha.webp"],
  pro: [
    "/media/business/wonder-transparent-alpha.webp",
    "/media/business/think-transparent-alpha.webp"
  ],
  max: [
    "/media/business/wonder-transparent-alpha.webp",
    "/media/business/think-transparent-alpha.webp",
    "/media/business/tired-transparent-alpha.webp"
  ]
};

function PricingCompanions({ tierId }: { tierId: string }) {
  const sources = COMPANION_LOOPS[tierId] ?? [];

  return (
    <div
      className={`clever-pricing-card__companions clever-pricing-card__companions--${tierId}`}
      aria-label={`${tierId} plan companions`}
    >
      {sources.map((src) => (
        <CompanionLoop className="companion-loop" key={src} src={src} />
      ))}
    </div>
  );
}

export function CleverPricing({ copy }: { copy: CleverPricingCopy }) {
  return (
    <section className="clever-section clever-pricing" id="pricing">
      <div className="container">
        <div className="clever-header">
          <Reveal as="div" variant="fade-up">
            <h2 className="clever-heading">{copy.title}</h2>
          </Reveal>
          <Reveal as="div" delay={80} variant="fade-up">
            <p className="clever-subheading">{copy.subtitle}</p>
          </Reveal>
        </div>

        <div className="clever-pricing__grid">
          {copy.tiers.map((tier, idx) => (
            <Reveal as="div" delay={idx * 100} key={tier.id} variant="fade-up">
              <div className={`clever-pricing-card clever-pricing-card--${tier.id}`}>
                <div className="clever-pricing-card__head">
                  <h3 className="clever-pricing-card__name">{tier.name}</h3>
                  {tier.id === "free" && (
                    <div className="clever-pricing-card__price-box">
                      <span className="clever-pricing-card__amount">{tier.price}</span>
                      <span className="clever-pricing-card__period">{tier.period}</span>
                    </div>
                  )}
                  <p className="clever-pricing-card__tagline">{tier.tagline}</p>
                </div>

                <PricingCompanions tierId={tier.id} />

                <div className="clever-pricing-card__features-title">
                  {copy.featuresLabel}
                </div>
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

                <div className="clever-pricing-card__cta-wrapper">
                  <a
                    className={`clever-pricing-plan-button clever-pricing-plan-button--${tier.id}`}
                    href={tier.ctaHref}
                  >
                    <span className="clever-pricing-plan-button__label">
                      {tier.cta}
                    </span>
                    {tier.id !== "free" && (
                      <span className="clever-pricing-plan-button__hover-label">
                        {tier.id === "pro" ? "Contact Us" : "Sales"}
                      </span>
                    )}
                    <Icon name="arrow_forward" size={14} />
                  </a>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
