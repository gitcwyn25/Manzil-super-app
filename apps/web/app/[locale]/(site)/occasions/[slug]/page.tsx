import type { Locale } from "@manzil/shared";
import { getUiCopy } from "@manzil/shared";
import { notFound } from "next/navigation";
import { BusinessCard } from "../../../../components/business-card";
import { pickLocalized } from "../../../../lib/locale-text";
import { getOccasionPage } from "../../../../lib/api";

export default async function OccasionDetailPage({
  params
}: {
  params: Promise<{ locale: Locale; slug: string }>;
}) {
  const { locale, slug } = await params;
  const copy = getUiCopy(locale);
  const page = await getOccasionPage(slug).catch(() => null);

  if (!page) {
    notFound();
  }

  const { occasion, businesses } = page;

  return (
    <section className="section-block container">
      <div className="section-heading">
        <p className="section-kicker">{occasion.emoji} {copy.occasions.packageKicker}</p>
        <h1>{pickLocalized(occasion.name, locale)}</h1>
        <p>{pickLocalized(occasion.description, locale)}</p>
      </div>

      <div className="package-items">
        {occasion.packageItems.map((item) => (
          <span className="package-item" key={pickLocalized(item, locale)}>
            {pickLocalized(item, locale)}
          </span>
        ))}
      </div>

      <div className="section-heading" style={{ marginTop: 40 }}>
        <h2>{copy.occasions.recommended}</h2>
      </div>
      <div className="business-grid">
        {businesses.map((business) => (
          <BusinessCard business={business} key={business.id} locale={locale} />
        ))}
      </div>
    </section>
  );
}
