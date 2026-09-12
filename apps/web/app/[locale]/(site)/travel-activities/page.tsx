import type { Locale } from "@manzil/shared";
import type { Metadata } from "next";
import { JsonLd } from "../../../components/json-ld";
import { TravelActivitiesHub } from "../../../components/travel-activities/travel-activities-page";
import { pageMetadata } from "../../../lib/seo";
import { breadcrumbSchema } from "../../../lib/structured-data";
import { TRAVEL_ACTIVITIES_ROOT, localizeTravel } from "../../../lib/travel-activities";

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const title = localizeTravel(TRAVEL_ACTIVITIES_ROOT.label, locale);
  return pageMetadata({
    locale,
    path: "/travel-activities",
    title,
    description: localizeTravel(TRAVEL_ACTIVITIES_ROOT.description, locale)
  });
}

export default async function TravelActivitiesPage({
  params
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const title = localizeTravel(TRAVEL_ACTIVITIES_ROOT.label, locale);

  return (
    <>
      <JsonLd
        data={breadcrumbSchema(locale, [
          { name: locale === "uz" ? "Bosh sahifa" : locale === "ru" ? "Главная" : "Home", path: "" },
          { name: title, path: "/travel-activities" }
        ])}
      />
      <TravelActivitiesHub locale={locale} />
    </>
  );
}
