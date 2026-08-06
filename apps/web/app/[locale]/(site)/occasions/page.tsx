import type { Locale } from "@manzil/shared";
import { getUiCopy } from "@manzil/shared";
import Link from "next/link";
import { pickLocalized } from "../../../lib/locale-text";
import { getOccasions } from "../../../lib/api";

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
      <div className="section-heading">
        <p className="section-kicker">{copy.occasions.kicker}</p>
        <h1>{copy.occasions.pageTitle}</h1>
        <p>{copy.occasions.pageBody}</p>
      </div>
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
