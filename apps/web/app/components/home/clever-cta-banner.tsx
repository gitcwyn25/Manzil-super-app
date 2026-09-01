import type { CleverCtaCopy } from "../../lib/landing-copy";
import { Reveal } from "../motion/reveal";
import { Icon } from "../vm/icons";

export function CleverCtaBanner({ copy }: { copy: CleverCtaCopy }) {
  return (
    <section className="clever-section clever-cta" id="cta">
      <div className="container">
        <div className="clever-cta-card">
          <div className="clever-cta-card__glow" />

          <Reveal as="div" variant="fade-up">
            <span className="clever-badge clever-badge--glow">
              <Icon name="sparkles" size={14} />
              <span>{copy.badge}</span>
            </span>
          </Reveal>

          <Reveal as="div" delay={80} variant="fade-up">
            <h2 className="clever-cta-card__title">{copy.title}</h2>
          </Reveal>

          <Reveal as="div" delay={160} variant="fade-up">
            <p className="clever-cta-card__subtitle">{copy.subtitle}</p>
          </Reveal>

          <Reveal as="div" delay={240} variant="fade-up">
            <div className="clever-cta-card__actions">
              <a className="clever-btn clever-btn--primary" href={copy.primaryHref}>
                <Icon name="search" size={18} />
                <span>{copy.primaryCta}</span>
                <Icon name="arrow_forward" size={16} />
              </a>
              <a className="clever-btn clever-btn--glass" href={copy.secondaryHref}>
                <Icon name="trending_up" size={18} />
                <span>{copy.secondaryCta}</span>
              </a>
            </div>
          </Reveal>

          <Reveal as="div" delay={320} variant="fade-up">
            <div className="clever-cta-card__perks">
              {copy.perks.map((perk, i) => (
                <span className="clever-cta-card__perk-item" key={i}>
                  <Icon name="verified" size={14} className="clever-cta-card__perk-icon" />
                  <span>{perk}</span>
                </span>
              ))}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
