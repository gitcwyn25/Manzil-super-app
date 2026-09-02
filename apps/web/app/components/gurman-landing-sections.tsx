import type { GurmanLandingCopy } from "../lib/gurman-landing-copy";

function SectionLabel({ children }: { children: string }) {
  return <p className="gurman-landing__eyebrow">{children}</p>;
}

export function GurmanLandingSections({ copy }: { copy: GurmanLandingCopy }) {
  return (
    <>
      <section className="gurman-landing__section gurman-landing__section--intro">
        <div className="gurman-landing__section-head">
          <SectionLabel>{copy.intro.eyebrow}</SectionLabel>
          <h2>{copy.intro.title}</h2>
          <p>{copy.intro.body}</p>
        </div>

        <div className="gurman-landing__steps" aria-label={copy.intro.eyebrow}>
          {copy.intro.steps.map((step) => (
            <article className="gurman-landing__step" key={step.number}>
              <span className="gurman-landing__step-number">{step.number}</span>
              <h3>{step.title}</h3>
              <p>{step.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="gurman-landing__section gurman-landing__section--trust">
        <div className="gurman-landing__section-head gurman-landing__section-head--narrow">
          <SectionLabel>{copy.trust.eyebrow}</SectionLabel>
          <h2>{copy.trust.title}</h2>
          <p>{copy.trust.body}</p>
        </div>

        <div className="gurman-landing__trust-grid">
          {copy.trust.cards.map((card) => (
            <article className="gurman-landing__trust-card" key={card.title}>
              <span className="gurman-landing__card-kicker">{card.eyebrow}</span>
              <h3>{card.title}</h3>
              <p>{card.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="gurman-landing__section gurman-landing__section--example">
        <div className="gurman-landing__section-head">
          <SectionLabel>{copy.example.eyebrow}</SectionLabel>
          <h2>{copy.example.title}</h2>
          <p>{copy.example.body}</p>
        </div>

        <div className="gurman-landing__example" aria-label={copy.example.eyebrow}>
          <div className="gurman-landing__example-request">
            <span className="gurman-landing__card-kicker">{copy.example.requestLabel}</span>
            <p>“{copy.example.request}”</p>
          </div>
          <div className="gurman-landing__example-arrow" aria-hidden="true">→</div>
          <div className="gurman-landing__example-answer">
            <span className="gurman-landing__card-kicker">{copy.example.resultLabel}</span>
            <p>{copy.example.result}</p>
            <div className="gurman-landing__reason">
              <span className="gurman-landing__reason-mark" aria-hidden="true">✓</span>
              <div>
                <span className="gurman-landing__reason-label">{copy.example.reasonLabel}</span>
                <strong>{copy.example.reason}</strong>
              </div>
            </div>
          </div>
          <p className="gurman-landing__example-note">{copy.example.note}</p>
        </div>
      </section>

      <section className="gurman-landing__section gurman-landing__section--capabilities">
        <div className="gurman-landing__section-head">
          <SectionLabel>{copy.capability.eyebrow}</SectionLabel>
          <h2>{copy.capability.title}</h2>
          <p>{copy.capability.body}</p>
        </div>

        <div className="gurman-landing__capability-grid">
          <article className="gurman-landing__capability-card gurman-landing__capability-card--live">
            <span className="gurman-landing__card-kicker">{copy.capability.liveLabel}</span>
            <ul>
              {copy.capability.live.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </article>
          <article className="gurman-landing__capability-card gurman-landing__capability-card--roadmap">
            <span className="gurman-landing__card-kicker">{copy.capability.roadmapLabel}</span>
            <ul>
              {copy.capability.roadmap.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </article>
        </div>
      </section>

      <section className="gurman-landing__section gurman-landing__section--cta">
        <div className="gurman-landing__cta-card">
          <div>
            <SectionLabel>{copy.cta.eyebrow}</SectionLabel>
            <h2>{copy.cta.title}</h2>
            <p>{copy.cta.body}</p>
          </div>
          <a className="gurman-landing__cta-button" href="#gurman-workstation">
            {copy.cta.button} <span aria-hidden="true">↓</span>
          </a>
        </div>
      </section>
    </>
  );
}
