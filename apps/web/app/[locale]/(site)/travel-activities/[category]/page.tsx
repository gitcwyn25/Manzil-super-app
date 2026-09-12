import type { Locale } from "@manzil/shared";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JsonLd } from "../../../../components/json-ld";
import { TravelActivityCategoryPage } from "../../../../components/travel-activities/travel-activities-page";
import { searchBusinesses } from "../../../../lib/api";
import { pageMetadata } from "../../../../lib/seo";
import { breadcrumbSchema, itemListSchema } from "../../../../lib/structured-data";
import {
  findTravelActivityCategory,
  TRAVEL_ACTIVITIES_ROOT,
  TRAVEL_ACTIVITY_CATEGORIES,
  localizeTravel
} from "../../../../lib/travel-activities";

export const dynamicParams = false;

export function generateStaticParams() {
  return (["uz", "ru", "en"] as Locale[]).flatMap((locale) =>
    TRAVEL_ACTIVITY_CATEGORIES.map((category) => ({ locale, category: category.slug }))
  );
}

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: Locale; category: string }>;
}): Promise<Metadata> {
  const { locale, category: slug } = await params;
  const category = findTravelActivityCategory(slug);
  if (!category) return {};

  return pageMetadata({
    locale,
    path: `/travel-activities/${category.slug}`,
    title: localizeTravel(category.label, locale),
    description: localizeTravel(category.description, locale)
  });
}

export default async function TravelActivityCategoryRoute({
  params,
  searchParams
}: {
  params: Promise<{ locale: Locale; category: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const [{ locale, category: slug }, query] = await Promise.all([params, searchParams]);
  const category = findTravelActivityCategory(slug);
  if (!category) notFound();

  const searchQuery = query.q?.trim() ?? "";
  const result = await searchBusinesses(searchQuery, category.apiCategory ?? category.slug).catch(() => ({ businesses: [], categories: [] }));
  const rootTitle = localizeTravel(TRAVEL_ACTIVITIES_ROOT.label, locale);
  const categoryTitle = localizeTravel(category.label, locale);
  const homeLabel = locale === "uz" ? "Bosh sahifa" : locale === "ru" ? "Главная" : "Home";

  return (
    <>
      <JsonLd
        data={[
          breadcrumbSchema(locale, [
            { name: homeLabel, path: "" },
            { name: rootTitle, path: "/travel-activities" },
            { name: categoryTitle, path: `/travel-activities/${category.slug}` }
          ]),
          ...(result.businesses.length > 0
            ? [itemListSchema(locale, categoryTitle, result.businesses.map((business) => ({ name: business.name, slug: business.slug })))]
            : [])
        ]}
      />
      <TravelActivityCategoryPage
        category={category}
        businesses={result.businesses}
        locale={locale}
        query={searchQuery}
      />
    </>
  );
}
