import type { CleverBenefitsCopy } from "../../lib/landing-copy";
import { Reveal } from "../motion/reveal";
import { Icon } from "../vm/icons";

export function CleverBenefits({ copy }: { copy: CleverBenefitsCopy }) {
  return (
    <section className="clever-section clever-benefits" id="benefits">
      <div className="container">
        {/* Section Header */}
        <div className="clever-header">
          <Reveal as="div" variant="fade-up">
            <span className="clever-badge">
              <Icon name="sparkles" size={14} />
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

        {/* Bento Grid */}
        <div className="clever-benefits__grid">
          {copy.cards.map((card, i) => (
            <Reveal as="div" delay={i * 90} key={card.tag} variant="fade-up">
              <div className={`clever-card clever-benefits__card clever-benefits__card--${i + 1}`}>
                <div className="clever-card__glow" />
                <div className="clever-card__head">
                  <div className="clever-icon-box">
                    <Icon name={card.icon} size={22} />
                  </div>
                  <span className="clever-card__tag">{card.tag}</span>
                </div>
                <h3 className="clever-card__title">{card.title}</h3>
                <p className="clever-card__desc">{card.description}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
