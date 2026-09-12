import type { Locale } from "@manzil/shared";
import type { Metadata } from "next";
import { BusinessCategoriesHub } from "../../../components/business-categories/business-categories-page";
import { JsonLd } from "../../../components/json-ld";
import { pageMetadata } from "../../../lib/seo";
import { breadcrumbSchema } from "../../../lib/structured-data";

const copy = {
  uz: { title: "Toshkentdagi barcha kategoriyalar", description: "Toshkentdagi restoranlar, xizmatlar, sog'liq, go'zallik, sayohat va boshqa bizneslarni kategoriya bo'yicha toping." },
  ru: { title: "Все категории Ташкента", description: "Находите рестораны, услуги, здоровье, красоту, путешествия и другие бизнесы Ташкента по категориям." },
  en: { title: "All Tashkent business categories", description: "Browse restaurants, services, health, beauty, travel, and more in Tashkent by category." }
} as const;

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const { locale } = await params;
  return pageMetadata({ locale, path: "/categories", title: copy[locale].title, description: copy[locale].description });
}

export default async function CategoriesPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  return (
    <>
      <JsonLd data={breadcrumbSchema(locale, [{ name: locale === "uz" ? "Bosh sahifa" : locale === "ru" ? "Главная" : "Home", path: "" }, { name: copy[locale].title, path: "/categories" }])} />
      <BusinessCategoriesHub locale={locale} />
    </>
  );
}
