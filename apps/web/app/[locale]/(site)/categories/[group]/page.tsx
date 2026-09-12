import type { Locale } from "@manzil/shared";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BusinessCategoryGroupPage } from "../../../../components/business-categories/business-categories-page";
import { JsonLd } from "../../../../components/json-ld";
import { getBusinessesForStandaloneCategory } from "../../../../lib/business-category-data";
import { BUSINESS_CATEGORY_GROUPS, findBusinessCategoryGroup, localizeBusinessCategory } from "../../../../lib/business-categories";
import { pageMetadata } from "../../../../lib/seo";
import { breadcrumbSchema } from "../../../../lib/structured-data";

export const dynamicParams = false;

export function generateStaticParams() {
  return (["uz", "ru", "en"] as Locale[]).flatMap((locale) =>
    BUSINESS_CATEGORY_GROUPS.map((group) => ({ locale, group: group.rootSlug }))
  );
}

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale; group: string }> }): Promise<Metadata> {
  const { locale, group: groupSlug } = await params;
  const group = findBusinessCategoryGroup(groupSlug);
  if (!group) return {};
  const title = localizeBusinessCategory(group.label, locale);
  return pageMetadata({ locale, path: `/categories/${group.rootSlug}`, title, description: localizeBusinessCategory(group.description, locale) });
}

export default async function CategoryGroupPage({
  params
}: {
  params: Promise<{ locale: Locale; group: string }>;
}) {
  const { locale, group: groupSlug } = await params;
  const group = findBusinessCategoryGroup(groupSlug);
  if (!group) notFound();
  const businesses = await getBusinessesForStandaloneCategory(group.rootSlug);
  const title = localizeBusinessCategory(group.label, locale);
  return (
    <>
      <JsonLd data={breadcrumbSchema(locale, [{ name: locale === "uz" ? "Kategoriyalar" : locale === "ru" ? "Категории" : "Categories", path: "/categories" }, { name: title, path: `/categories/${group.rootSlug}` }])} />
      <BusinessCategoryGroupPage businesses={businesses} group={group} locale={locale} />
    </>
  );
}
