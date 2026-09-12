import type { Locale } from "@manzil/shared";
import type { Metadata } from "next";
import { BusinessCategoriesPlacesPage } from "../../../../components/business-categories/business-categories-page";
import { JsonLd } from "../../../../components/json-ld";
import { getAllStandaloneBusinesses } from "../../../../lib/business-category-data";
import { pageMetadata } from "../../../../lib/seo";
import { breadcrumbSchema } from "../../../../lib/structured-data";

const copy = {
  uz: { title: "Toshkentdagi barcha joylar", description: "Toshkentdagi mavjud Manzil katalog joylarini ko'ring." },
  ru: { title: "Все места Ташкента", description: "Посмотрите доступные места в каталоге Manzil по Ташкенту." },
  en: { title: "All places in Tashkent", description: "Browse the places currently available in the Manzil Tashkent catalog." }
} as const;

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const { locale } = await params;
  return pageMetadata({ locale, path: "/categories/places", title: copy[locale].title, description: copy[locale].description });
}

export default async function CategoriesPlacesPage({
  params,
  searchParams
}: {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const [{ locale }, query] = await Promise.all([params, searchParams]);
  const searchQuery = query.q?.trim() ?? "";
  const businesses = await getAllStandaloneBusinesses(searchQuery);
  return (
    <>
      <JsonLd data={breadcrumbSchema(locale, [{ name: locale === "uz" ? "Kategoriyalar" : locale === "ru" ? "Категории" : "Categories", path: "/categories" }, { name: copy[locale].title, path: "/categories/places" }])} />
      <BusinessCategoriesPlacesPage businesses={businesses} locale={locale} query={searchQuery} />
    </>
  );
}
