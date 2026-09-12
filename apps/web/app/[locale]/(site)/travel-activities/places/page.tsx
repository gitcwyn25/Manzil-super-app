import type { Locale } from "@manzil/shared";
import type { Metadata } from "next";
import { JsonLd } from "../../../../components/json-ld";
import { TravelActivitiesPlacesPage } from "../../../../components/travel-activities/travel-activities-page";
import { searchBusinesses } from "../../../../lib/api";
import { pageMetadata } from "../../../../lib/seo";
import { breadcrumbSchema, itemListSchema } from "../../../../lib/structured-data";
import { TRAVEL_ACTIVITIES_ROOT, localizeTravel } from "../../../../lib/travel-activities";

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return pageMetadata({
    locale,
    path: "/travel-activities/places",
    title: locale === "uz" ? "Barcha joylar" : locale === "ru" ? "Все места" : "All places",
    description: localizeTravel(TRAVEL_ACTIVITIES_ROOT.description, locale)
  });
}

export default async function TravelActivitiesPlacesRoute({
  params,
  searchParams
}: {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const [{ locale }, query] = await Promise.all([params, searchParams]);
  const searchQuery = query.q?.trim() ?? "";
  const result = await searchBusinesses(searchQuery, TRAVEL_ACTIVITIES_ROOT.slug).catch(() => ({ businesses: [], categories: [] }));
  const title = localizeTravel(TRAVEL_ACTIVITIES_ROOT.label, locale);

  return (
    <>
      <JsonLd
        data={[
          breadcrumbSchema(locale, [
            { name: locale === "uz" ? "Bosh sahifa" : locale === "ru" ? "Главная" : "Home", path: "" },
            { name: title, path: "/travel-activities" },
            {
              name: locale === "uz" ? "Barcha joylar" : locale === "ru" ? "Все места" : "All places",
              path: "/travel-activities/places"
            }
          ]),
          ...(result.businesses.length > 0
            ? [itemListSchema(locale, title, result.businesses.map((business) => ({ name: business.name, slug: business.slug })))]
            : [])
        ]}
      />
      <TravelActivitiesPlacesPage locale={locale} businesses={result.businesses} query={searchQuery} />
    </>
  );
}
