import type { Locale } from "@manzil/shared";
import type { GurmanLandingCopy } from "../lib/gurman-landing-copy";

export function GurmanLandingOverview({ copy, locale }: { copy: GurmanLandingCopy; locale: Locale }) {
  return (
    <section className="gurman-overview" id="gurman-try">
      <div className="gurman-overview__intro">
        <p className="gurman-landing__eyebrow">{copy.trust.eyebrow}</p>
        <h2>{copy.trust.title}</h2>
        <p>{copy.trust.body}</p>
      </div>

      <div className="gurman-overview__grid">
        {copy.trust.cards.map((card, index) => (
          <article className="gurman-overview__card" key={card.title}>
            <span className="gurman-overview__index">0{index + 1}</span>
            <span className="gurman-landing__card-kicker">{card.eyebrow}</span>
            <h3>{card.title}</h3>
            <p>{card.body}</p>
          </article>
        ))}
      </div>

      <div className="gurman-overview__actions">
        <a className="gurman-overview__primary" href={`/${locale}/concierge`}>
          {copy.cta.button} <span aria-hidden="true">→</span>
        </a>
        <a className="gurman-overview__secondary" href={`/${locale}/gurman/how-it-works`}>
          {copy.hero.howItWorksCta} <span aria-hidden="true">↗</span>
        </a>
      </div>
    </section>
  );
}
