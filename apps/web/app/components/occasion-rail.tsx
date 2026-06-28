"use client";

import type { Locale, Occasion } from "@manzil/shared";
import { getUiCopy } from "@manzil/shared";
import { pickLocalized } from "../lib/locale-text";

export function OccasionRail({ occasions, locale }: { occasions: Occasion[]; locale: Locale }) {
  const copy = getUiCopy(locale);

  return (
    <section className="occasion-rail" aria-label={copy.occasions.kicker}>
      <div className="occasion-rail-head section-heading-row">
        <div>
          <p className="section-kicker">{copy.occasions.kicker}</p>
          <h2>{copy.occasions.title}</h2>
        </div>
        <a className="ghost-button" href={`/${locale}/occasions`}>{copy.occasions.all}</a>
      </div>
      <div className="occasion-scroll no-scrollbar">
        {occasions.map((occasion) => (
          <a className="occasion-chip" href={`/${locale}/occasions/${occasion.slug}`} key={occasion.slug}>
            <span className="occasion-emoji" aria-hidden="true">{occasion.emoji}</span>
            <span>{pickLocalized(occasion.name, locale)}</span>
          </a>
        ))}
      </div>
    </section>
  );
}
