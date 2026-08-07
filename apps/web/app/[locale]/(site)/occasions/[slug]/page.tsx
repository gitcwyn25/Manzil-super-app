import type { Locale } from "@manzil/shared";
import { getUiCopy } from "@manzil/shared";
import { notFound } from "next/navigation";
import { BusinessCard } from "../../../../components/business-card";
import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "../../../../components/json-ld";
import { pickLocalized } from "../../../../lib/locale-text";
import { getOccasionPage } from "../../../../lib/api";
import { pageMetadata, ROUTE_SEO } from "../../../../lib/seo";
import { itemListSchema, routeBreadcrumb } from "../../../../lib/structured-data";

/** Empty-state copy: every empty state answers "what can I do next?". */
const EMPTY_COPY: Record<Locale, { body: string; browse: string; add: string }> = {
  uz: {
    body: "Bu voqea uchun hali biror joy belgilanmagan. Katalogni ko'rib chiqing yoki mos biznesni qo'shing — birinchi bo'ling.",
    browse: "Katalogni ko'rish",
    add: "Biznes qo'shish"
  },
  ru: {
    body: "Для этого повода пока не отмечено ни одного места. Посмотрите каталог или добавьте подходящий бизнес — станьте первым.",
    browse: "Смотреть каталог",
    add: "Добавить бизнес"
  },
  en: {
    body: "No places are tagged for this occasion yet. Browse the catalogue, or add a business that fits — be the first.",
    browse: "Browse the catalogue",
    add: "Add a business"
  }
};

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: Locale; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const page = await getOccasionPage(slug).catch(() => null);

  if (!page) {
    return { title: ROUTE_SEO.notFound.title[locale], robots: { index: false, follow: false } };
  }

  return pageMetadata({
    locale,
    path: `/occasions/${slug}`,
    title: pickLocalized(page.occasion.name, locale),
    description: pickLocalized(page.occasion.description, locale)
  });
}

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
    <section className="section-block container vm-occasion-detail">
      <JsonLd
        data={[
          itemListSchema(
            locale,
            pickLocalized(occasion.name, locale),
            businesses.map((business) => ({ name: business.name, slug: business.slug }))
          ),
          routeBreadcrumb(locale, ["home", "occasions"], {
            name: pickLocalized(occasion.name, locale),
            path: `/occasions/${slug}`
          })
        ]}
      />
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
      {businesses.length > 0 ? (
        <div className="business-grid">
          {businesses.map((business) => (
            <BusinessCard business={business} key={business.id} locale={locale} />
          ))}
        </div>
      ) : (
        /* An occasion with no matched businesses used to render the heading
           above an empty grid — a dead end that reads as a broken page. It now
           states the truth (nothing is tagged for this occasion yet) and offers
           the two things a visitor can actually do next. */
        <div className="vm-empty-state">
          <p className="vm-empty-state__body">{EMPTY_COPY[locale].body}</p>
          <div className="vm-empty-state__actions">
            <Link className="btn btn-primary vm-cta" href={`/${locale}/discover`}>
              {EMPTY_COPY[locale].browse}
            </Link>
            <Link className="btn btn-outline-primary" href={`/${locale}/business/register`}>
              {EMPTY_COPY[locale].add}
            </Link>
          </div>
        </div>
      )}
    </section>
  );
}
