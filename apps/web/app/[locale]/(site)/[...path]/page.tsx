import type { Locale } from "@manzil/shared";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DocumentationHub, DocumentationPage } from "../../../components/documentation";
import { docByPath, docs, type DocId } from "../../../lib/docs";
import { pageMetadata } from "../../../lib/seo";

type RouteParams = { locale: Locale; path: string[] };

const documentPaths: Array<string[]> = [
  ["docs"],
  ["about"],
  ["founders"],
  ["contact"],
  ["trust"],
  ["legal", "terms"],
  ["legal", "privacy"],
  ["legal", "cookies"],
  ["legal", "reviews"],
  ["legal", "ai-transparency"]
];

export function generateStaticParams() {
  return (["uz", "ru", "en"] as Locale[]).flatMap((locale) =>
    documentPaths.map((path) => ({ locale, path }))
  );
}

export async function generateMetadata({
  params
}: {
  params: Promise<RouteParams>;
}): Promise<Metadata> {
  const { locale, path } = await params;
  const id = docByPath(path);

  if (id === "hub") {
    return pageMetadata({
      locale,
      path: "/docs",
      title: locale === "uz" ? "Manzil hujjatlari" : locale === "ru" ? "Документы Manzil" : "Manzil documentation",
      description:
        locale === "uz"
          ? "Manzil kompaniyasi, ishonch, xizmatlardan foydalanish va Gurman AI haqida aniq ma’lumotlar."
          : locale === "ru"
            ? "Понятная информация о Manzil, доверии, использовании сервиса и Gurman AI."
            : "Clear information about Manzil, trust, using the service, and Gurman AI."
    });
  }

  if (!id) return {};

  const doc = docs[id];
  return pageMetadata({
    locale,
    path: doc.path,
    title: doc.title[locale],
    description: doc.description[locale],
    type: doc.legal ? "article" : "website"
  });
}

export default async function DocumentationRoute({
  params
}: {
  params: Promise<RouteParams>;
}) {
  const { locale, path } = await params;
  const id = docByPath(path);

  if (id === "hub") return <DocumentationHub locale={locale} />;
  if (!id) notFound();

  return <DocumentationPage id={id as DocId} locale={locale} />;
}
