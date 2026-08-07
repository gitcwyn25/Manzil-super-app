import type { Locale } from "@manzil/shared";
import { getUiCopy } from "@manzil/shared";
import { notFound } from "next/navigation";
import { BusinessCard } from "../../../../components/business-card";
import type { Metadata } from "next";
import { JsonLd } from "../../../../components/json-ld";
import { formatCount, pickLocalized } from "../../../../lib/locale-text";
import { getListDetail } from "../../../../lib/api";
import { pageMetadata, ROUTE_SEO } from "../../../../lib/seo";
import { itemListSchema, routeBreadcrumb } from "../../../../lib/structured-data";

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: Locale; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const page = await getListDetail(slug).catch(() => null);

  if (!page) {
    return { title: ROUTE_SEO.notFound.title[locale], robots: { index: false, follow: false } };
  }

  return pageMetadata({
    locale,
    path: `/lists/${slug}`,
    title: pickLocalized(page.list.title, locale),
    description: pickLocalized(page.list.description, locale)
  });
}

export default async function ListDetailPage({
  params
}: {
  params: Promise<{ locale: Locale; slug: string }>;
}) {
  const { locale, slug } = await params;
  const copy = getUiCopy(locale);
  const page = await getListDetail(slug).catch(() => null);

  if (!page) {
    notFound();
  }

  const { list, businesses } = page;

  return (
    <section className="section-block container vm-lists-page">
      <JsonLd
        data={[
          itemListSchema(
            locale,
            pickLocalized(list.title, locale),
            businesses.map((business) => ({ name: business.name, slug: business.slug }))
          ),
          routeBreadcrumb(locale, ["home", "lists"], {
            name: pickLocalized(list.title, locale),
            path: `/lists/${slug}`
          })
        ]}
      />
      <div className="section-heading">
        <p className="section-kicker">{list.authorName}</p>
        <h1>{pickLocalized(list.title, locale)}</h1>
        <p>{pickLocalized(list.description, locale)}</p>
        <p>{formatCount(list.followerCount)} {copy.lists.followers}</p>
      </div>
      <div className="tag-row">
        {list.tags.map((tag) => <span key={tag}>{tag}</span>)}
      </div>
      <div className="business-grid" style={{ marginTop: 28 }}>
        {businesses.map((business) => (
          <BusinessCard business={business} key={business.id} locale={locale} />
        ))}
      </div>
    </section>
  );
}
