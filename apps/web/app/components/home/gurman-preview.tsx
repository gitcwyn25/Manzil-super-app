import type { Locale } from "@manzil/shared";
import type { GurmanPreviewCopy } from "../../lib/landing-copy";
import { Reveal } from "../motion/reveal";
import { Icon } from "../vm/icons";

export function GurmanPreview({
  copy,
  locale
}: {
  copy: GurmanPreviewCopy;
  locale: Locale;
}) {
  return (
    <section className="clever-section gurman-preview" id="gurman-mobile">
      <div className="container gurman-preview__container">
        <Reveal as="div" variant="fade-up">
          <div className="gurman-preview__copy">
            <span className="clever-badge clever-badge--dark">
              <Icon name="sparkles" size={14} />
              <span>{copy.eyebrow}</span>
            </span>
            <h2 className="clever-heading">{copy.title}</h2>
            <p className="clever-subheading">{copy.description}</p>
            <p className="gurman-preview__boundary">
              <Icon name="help_circle" size={16} />
              <span>{copy.boundary}</span>
            </p>
            <a className="clever-btn clever-btn--primary" href={`/${locale}/waitlist/gurman`}>
              <Icon name="mail" size={18} />
              <span>{copy.cta}</span>
              <Icon name="arrow_forward" size={16} />
            </a>
          </div>
        </Reveal>

        <Reveal as="div" delay={120} variant="fade-up">
          <div className="gurman-preview__device-wrap">
            <div className="gurman-preview__device" aria-label={copy.previewFooter} role="img">
              <div className="gurman-preview__device-island" />
              <div className="gurman-preview__device-topbar">
                <span className="gurman-preview__brand">Gurman</span>
                <span className="clever-status clever-status--preview">{copy.status}</span>
              </div>

              <div className="gurman-preview__workspace">
                <span className="gurman-preview__workspace-kicker">{copy.previewSubtitle}</span>
                <h3>{copy.previewTitle}</h3>
                <div className="gurman-preview__plan-line">
                  <span className="gurman-preview__plan-dot" />
                  <span>{copy.previewSubtitle}</span>
                </div>
              </div>

              <div className="gurman-preview__chips" aria-hidden="true">
                {copy.chips.map((chip) => (
                  <span className="gurman-preview__chip" key={chip}>{chip}</span>
                ))}
              </div>

              <div className="gurman-preview__footer">
                <Icon name="lock" size={14} />
                <span>{copy.previewFooter}</span>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
