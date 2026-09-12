import type { Locale } from "@manzil/shared";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BusinessCategoryLeafPage } from "../../../../../components/business-categories/business-categories-page";
import { JsonLd } from "../../../../../components/json-ld";
import { getBusinessesForStandaloneCategory } from "../../../../../lib/business-category-data";
import { BUSINESS_CATEGORY_GROUPS, findBusinessCategory, localizeBusinessCategory } from "../../../../../lib/business-categories";
import { pageMetadata } from "../../../../../lib/seo";
import { breadcrumbSchema } from "../../../../../lib/structured-data";

export const dynamicParams = false;

export function generateStaticParams() {
  return (["uz", "ru", "en"] as Locale[]).flatMap((locale) =>
    BUSINESS_CATEGORY_GROUPS.flatMap((group) =>
      group.categories.map((category) => ({ locale, group: group.rootSlug, category: category.slug }))
    )
  );
}

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale; group: string; category: string }> }): Promise<Metadata> {
  const { locale, group: groupSlug, category: categorySlug } = await params;
  const found = findBusinessCategory(categorySlug);
  if (!found || found.group.rootSlug !== groupSlug) return {};
  const title = localizeBusinessCategory(found.category.label, locale);
  return pageMetadata({ locale, path: `/categories/${groupSlug}/${categorySlug}`, title, description: localizeBusinessCategory(found.group.description, locale) });
}

export default async function CategoryLeafPage({
  params,
  searchParams
}: {
  params: Promise<{ locale: Locale; group: string; category: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const [{ locale, group: groupSlug, category: categorySlug }, query] = await Promise.all([params, searchParams]);
  const found = findBusinessCategory(categorySlug);
  if (!found || found.group.rootSlug !== groupSlug) notFound();
  const searchQuery = query.q?.trim() ?? "";
  const businesses = await getBusinessesForStandaloneCategory(found.category.slug, searchQuery);
  const title = localizeBusinessCategory(found.category.label, locale);
  return (
    <>
      <JsonLd data={breadcrumbSchema(locale, [{ name: locale === "uz" ? "Kategoriyalar" : locale === "ru" ? "Категории" : "Categories", path: "/categories" }, { name: localizeBusinessCategory(found.group.label, locale), path: `/categories/${found.group.rootSlug}` }, { name: title, path: `/categories/${found.group.rootSlug}/${found.category.slug}` }])} />
      <BusinessCategoryLeafPage businesses={businesses} category={found.category} group={found.group} locale={locale} />
    </>
  );
}
