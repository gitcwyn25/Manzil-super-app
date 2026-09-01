import type { CleverTestimonialsCopy } from "../../lib/landing-copy";
import { Reveal } from "../motion/reveal";
import { Icon } from "../vm/icons";

export function CleverTestimonials({ copy }: { copy: CleverTestimonialsCopy }) {
  return (
    <section className="clever-section clever-testimonials" id="testimonials">
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

        {/* Testimonials Grid */}
        <div className="clever-testimonials__grid">
          {copy.items.map((item, idx) => (
            <Reveal as="div" delay={idx * 110} key={item.name} variant="fade-up">
              <div className="clever-testimonial-card">
                <div className="clever-testimonial-card__stars">
                  {Array.from({ length: item.rating }).map((_, s) => (
                    <Icon className="clever-star-icon" key={s} name="star" size={16} />
                  ))}
                </div>

                <h3 className="clever-testimonial-card__highlight">&ldquo;{item.highlight}&rdquo;</h3>

                <p className="clever-testimonial-card__content">&ldquo;{item.content}&rdquo;</p>

                <div className="clever-testimonial-card__author">
                  <div className="clever-testimonial-card__avatar">{item.avatar}</div>
                  <div className="clever-testimonial-card__meta">
                    <div className="clever-testimonial-card__name">{item.name}</div>
                    <div className="clever-testimonial-card__role">
                      {item.role} &bull; {item.company}
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
