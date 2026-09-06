import type { GurmanHowItWorksCopy } from "../../lib/landing-copy";
import VCarousel8 from "../../../../../components/ui/v-carousel-8";
import { Reveal } from "../motion/reveal";
import { Icon } from "../vm/icons";

export function GurmanHowItWorks({
  copy,
  locale,
}: {
  copy: GurmanHowItWorksCopy;
  locale: string;
}) {
  return (
    <section
      aria-labelledby="gurman-how-it-works-title"
      className="gurman-how-it-works"
      id="gurman-how-it-works"
    >
      <div className="gurman-how-it-works__backdrop" aria-hidden="true">
        <span className="gurman-how-it-works__backdrop-line gurman-how-it-works__backdrop-line--one" />
        <span className="gurman-how-it-works__backdrop-line gurman-how-it-works__backdrop-line--two" />
        <span className="gurman-how-it-works__backdrop-ring gurman-how-it-works__backdrop-ring--one" />
        <span className="gurman-how-it-works__backdrop-ring gurman-how-it-works__backdrop-ring--two" />
      </div>

      <div className="container gurman-how-it-works__shell">
        <div className="gurman-how-it-works__layout">
          <div className="gurman-how-it-works__carousel-column">
            <Reveal as="div" variant="fade-up">
              <VCarousel8 copy={copy} />
            </Reveal>
          </div>

          <div className="gurman-how-it-works__editorial">
            <Reveal as="div" variant="fade-up">
              <div className="gurman-how-it-works__eyebrow-row">
                <span className="gurman-how-it-works__eyebrow">{copy.eyebrow}</span>
                <span className="gurman-how-it-works__truth-label">
                  <span className="gurman-how-it-works__truth-dot" aria-hidden="true" />
                  {copy.truthLabel}
                </span>
              </div>
            </Reveal>
            <Reveal as="div" delay={80} variant="fade-up">
              <h2 className="gurman-how-it-works__title" id="gurman-how-it-works-title">
                {copy.title}
              </h2>
            </Reveal>
            <Reveal as="div" delay={160} variant="fade-up">
              <p className="gurman-how-it-works__subtitle">{copy.subtitle}</p>
            </Reveal>

            <Reveal as="div" delay={220} variant="fade-up">
              <div className="gurman-how-it-works__mission">
                <div className="gurman-how-it-works__mission-label">
                  <span>{copy.requestLabel}</span>
                  <span className="gurman-how-it-works__mission-mark" aria-hidden="true">
                    <Icon name="sparkles" size={15} />
                  </span>
                </div>
                <p>{copy.request}</p>
              </div>
            </Reveal>

            <Reveal as="div" delay={280} variant="fade-up">
              <div className="gurman-how-it-works__sequence" aria-label={copy.stageNavigationLabel}>
                {copy.stages.map((stage) => (
                  <div className="gurman-how-it-works__sequence-item" key={stage.id}>
                    <span className="gurman-how-it-works__sequence-number">{stage.number}</span>
                    <span>{stage.label}</span>
                  </div>
                ))}
              </div>
            </Reveal>

            <Reveal as="div" delay={340} variant="fade-up">
              <div className="gurman-how-it-works__signature">
                <span>{copy.signature.label}</span>
                <strong>{copy.signature.lineOne}</strong>
                <strong>{copy.signature.lineTwo}</strong>
              </div>
            </Reveal>

            <Reveal as="div" delay={400} variant="fade-up">
              <div className="gurman-how-it-works__actions">
                <a className="gurman-how-it-works__primary" href={`/${locale}/waitlist/gurman`}>
                  {copy.waitlistCta}
                  <Icon name="arrow_forward" size={16} />
                </a>
                <a className="gurman-how-it-works__secondary" href={`/${locale}/discover`}>
                  {copy.discoverCta}
                </a>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
