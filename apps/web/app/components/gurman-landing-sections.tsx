import type { GurmanLandingCopy } from "../lib/gurman-landing-copy";

function SectionLabel({ children }: { children: string }) {
  return <p className="gurman-landing__eyebrow">{children}</p>;
}

export function GurmanLandingSections({ copy }: { copy: GurmanLandingCopy }) {
  return (
    <>
      <section className="gurman-landing__section gurman-landing__section--intro" id="gurman-how-it-works">
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

      <section className="gurman-landing__section gurman-landing__section--intelligence" id="gurman-intelligence">
        <div className="gurman-landing__section-head gurman-landing__section-head--wide">
          <SectionLabel>{copy.intelligence.eyebrow}</SectionLabel>
          <h2>{copy.intelligence.title}</h2>
          <p>{copy.intelligence.body}</p>
        </div>

        <div className="gurman-landing__intelligence-layers">
          {copy.intelligence.layers.map((layer) => (
            <article className="gurman-landing__intelligence-layer" key={layer.number}>
              <span className="gurman-landing__layer-number">{layer.number}</span>
              <div>
                <h3>{layer.title}</h3>
                <p>{layer.body}</p>
              </div>
            </article>
          ))}
        </div>

        <div className="gurman-landing__pipeline">
          <div className="gurman-landing__pipeline-head">
            <span className="gurman-landing__card-kicker">{copy.intelligence.pipeline.label}</span>
            <span className="gurman-landing__pipeline-rule" aria-hidden="true" />
          </div>
          <div className="gurman-landing__pipeline-steps">
            {copy.intelligence.pipeline.steps.map((step, index) => (
              <div className="gurman-landing__pipeline-step" key={step}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <strong>{step}</strong>
              </div>
            ))}
          </div>
        </div>

        <div className="gurman-landing__principles">
          {copy.intelligence.principles.map((principle) => (
            <article className="gurman-landing__principle" key={principle.title}>
              <span className="gurman-landing__card-kicker">{principle.eyebrow}</span>
              <h3>{principle.title}</h3>
              <p>{principle.body}</p>
            </article>
          ))}
        </div>
        <p className="gurman-landing__intelligence-footer">{copy.intelligence.footer}</p>
      </section>

      <section className="gurman-landing__section gurman-landing__section--memory" id="gurman-memory">
        <div className="gurman-landing__section-head gurman-landing__section-head--wide">
          <SectionLabel>{copy.memory.eyebrow}</SectionLabel>
          <h2>{copy.memory.title}</h2>
          <p>{copy.memory.body}</p>
        </div>

        <div className="gurman-landing__memory-philosophy">
          <div>
            <span className="gurman-landing__card-kicker">{copy.memory.philosophy.label}</span>
            <h3>{copy.memory.philosophy.title}</h3>
            <p>{copy.memory.philosophy.body}</p>
          </div>
          <ul>
            {copy.memory.philosophy.items.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </div>

        <div className="gurman-landing__memory-heading">
          <span className="gurman-landing__card-kicker">{copy.memory.eyebrow}</span>
          <h3>{copy.memory.tiersLabel}</h3>
        </div>
        <div className="gurman-landing__memory-tiers">
          {copy.memory.tiers.map((tier) => (
            <article className="gurman-landing__memory-tier" key={tier.number}>
              <span className="gurman-landing__layer-number">{tier.number}</span>
              <div>
                <h3>{tier.title}</h3>
                <p>{tier.body}</p>
              </div>
            </article>
          ))}
        </div>

        <div className="gurman-landing__memory-diagram">
          <span className="gurman-landing__card-kicker">{copy.memory.diagram.label}</span>
          <div className="gurman-landing__memory-stack">
            {copy.memory.diagram.layers.map((layer, index) => (
              <div className={`gurman-landing__memory-stack-layer gurman-landing__memory-stack-layer--${index + 1}`} key={layer}>
                <span>{String(6 - index).padStart(2, "0")}</span>
                <strong>{layer}</strong>
              </div>
            ))}
          </div>
        </div>

        <div className="gurman-landing__memory-async">
          <div className="gurman-landing__section-head">
            <SectionLabel>{copy.memory.async.label}</SectionLabel>
            <h3>{copy.memory.async.title}</h3>
            <p>{copy.memory.async.body}</p>
          </div>
          <div className="gurman-landing__async-grid">
            {copy.memory.async.cards.map((card) => (
              <article className="gurman-landing__principle" key={card.title}>
                <span className="gurman-landing__card-kicker">{card.eyebrow}</span>
                <h3>{card.title}</h3>
                <p>{card.body}</p>
              </article>
            ))}
          </div>
        </div>
        <p className="gurman-landing__intelligence-footer">{copy.memory.footer}</p>
      </section>

      <section className="gurman-landing__section gurman-landing__section--collaboration" id="gurman-collaboration">
        <div className="gurman-landing__section-head gurman-landing__section-head--wide">
          <SectionLabel>{copy.collaboration.eyebrow}</SectionLabel>
          <h2>{copy.collaboration.title}</h2>
          <p>{copy.collaboration.body}</p>
        </div>

        <div className="gurman-landing__mediator">
          <div>
            <span className="gurman-landing__card-kicker">{copy.collaboration.mediator.label}</span>
            <h3>{copy.collaboration.mediator.title}</h3>
            <p>{copy.collaboration.mediator.body}</p>
          </div>
          <ul>
            {copy.collaboration.mediator.points.map((point) => <li key={point}>{point}</li>)}
          </ul>
        </div>

        <div className="gurman-landing__collaboration-flow">
          <span className="gurman-landing__card-kicker">{copy.collaboration.flow.label}</span>
          <div className="gurman-landing__collaboration-flow-track">
            {copy.collaboration.flow.steps.map((step, index) => (
              <div className="gurman-landing__collaboration-flow-step" key={step}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <strong>{step}</strong>
              </div>
            ))}
          </div>
        </div>

        <div className="gurman-landing__collaboration-grid">
          {copy.collaboration.cards.map((card) => (
            <article className="gurman-landing__collaboration-card" key={card.title}>
              <span className="gurman-landing__card-kicker">{card.eyebrow}</span>
              <h3>{card.title}</h3>
              <p>{card.body}</p>
            </article>
          ))}
        </div>
        <p className="gurman-landing__intelligence-footer">{copy.collaboration.footer}</p>
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
