import type { Locale } from "@manzil/shared";
import { getUiCopy } from "@manzil/shared";
import Link from "next/link";
import { pickLocalized } from "../../../lib/locale-text";
import type { Metadata } from "next";
import { JsonLd } from "../../../components/json-ld";
import { getOccasions } from "../../../lib/api";
import { routeMetadata } from "../../../lib/seo";
import { routeBreadcrumb } from "../../../lib/structured-data";

/** Every empty state answers "what can I do next?" rather than dead-ending. */
const EMPTY_COPY: Record<Locale, { body: string; browse: string }> = {
  uz: {
    body: "Voqealar ro'yxati hozircha bo'sh. Katalogdan boshlang — joylarni turkum va tuman bo'yicha ko'rishingiz mumkin.",
    browse: "Katalogni ko'rish"
  },
  ru: {
    body: "Список поводов пока пуст. Начните с каталога — места можно смотреть по категориям и районам.",
    browse: "Смотреть каталог"
  },
  en: {
    body: "The occasions list is empty for now. Start from the catalogue — places are browsable by category and district.",
    browse: "Browse the catalogue"
  }
};

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return routeMetadata("occasions", locale);
}

export default async function OccasionsPage({
  params
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const copy = getUiCopy(locale);
  const occasions = await getOccasions();

  return (
    <section className="section-block container vm-occasions-page">
      <JsonLd data={routeBreadcrumb(locale, ["home", "occasions"])} />
      <div className="section-heading">
        <p className="section-kicker">{copy.occasions.kicker}</p>
        <h1>{copy.occasions.pageTitle}</h1>
        <p>{copy.occasions.pageBody}</p>
      </div>
      {occasions.length === 0 ? (
        /* Also the API-unavailable path: `getOccasions` degrades to [] rather
           than throwing, so a backend blip is an empty state, not a 500. */
        <div className="vm-empty-state">
          <p className="vm-empty-state__body">{EMPTY_COPY[locale].body}</p>
          <div className="vm-empty-state__actions">
            <Link className="btn btn-primary vm-cta" href={`/${locale}/discover`}>
              {EMPTY_COPY[locale].browse}
            </Link>
          </div>
        </div>
      ) : null}
      <div className="occasion-grid">
        {occasions.map((occasion, index) => (
          <Link
            className={`occasion-card occasion-card--art-${index % 3}`}
            href={`/${locale}/occasions/${occasion.slug}`}
            key={occasion.slug}
          >
            <span className="occasion-emoji" aria-hidden="true">{occasion.emoji}</span>
            <div className="occasion-card__caption">
              <h2>{pickLocalized(occasion.name, locale)}</h2>
              <p>{pickLocalized(occasion.description, locale)}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
