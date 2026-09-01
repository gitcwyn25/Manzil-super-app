import type { CleverProcessCopy } from "../../lib/landing-copy";
import { Reveal } from "../motion/reveal";
import { Icon } from "../vm/icons";

export function CleverProcess({ copy }: { copy: CleverProcessCopy }) {
  return (
    <section className="clever-section clever-process" id="process">
      <div className="container">
        {/* Section Header */}
        <div className="clever-header">
          <Reveal as="div" variant="fade-up">
            <span className="clever-badge">
              <Icon name="schedule" size={14} />
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

        {/* Steps Grid */}
        <div className="clever-process__grid">
          {copy.steps.map((step, idx) => (
            <Reveal as="div" delay={idx * 120} key={step.number} variant="fade-up">
              <div className="clever-step-card">
                <div className="clever-step-card__top">
                  <span className="clever-step-card__number">{step.number}</span>
                  <div className="clever-step-card__icon">
                    <Icon name={step.icon} size={20} />
                  </div>
                </div>
                <h3 className="clever-step-card__title">{step.title}</h3>
                <p className="clever-step-card__desc">{step.description}</p>
                <div className="clever-step-card__glow" />
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
