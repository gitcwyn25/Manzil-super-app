import type { Locale } from "@manzil/shared";
import { getUiCopy } from "@manzil/shared";
import { CommunityListCard } from "../../../components/community-list-card";
import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "../../../components/json-ld";
import { getListsPage } from "../../../lib/api";
import { routeMetadata } from "../../../lib/seo";
import { routeBreadcrumb } from "../../../lib/structured-data";

/** Every empty state answers "what can I do next?" rather than dead-ending. */
const EMPTY_COPY: Record<Locale, { body: string; browse: string }> = {
  uz: {
    body: "Hozircha jamoat ro'yxatlari yo'q. Katalogni ko'rib chiqing va o'zingizga yoqqan joylarni saqlang.",
    browse: "Katalogni ko'rish"
  },
  ru: {
    body: "Пока нет ни одной подборки сообщества. Посмотрите каталог и сохраните места, которые вам нравятся.",
    browse: "Смотреть каталог"
  },
  en: {
    body: "There are no community lists yet. Browse the catalogue and save the places you like.",
    browse: "Browse the catalogue"
  }
};

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return routeMetadata("lists", locale);
}

export default async function ListsPage({
  params
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const copy = getUiCopy(locale);
  const lists = await getListsPage();

  return (
    <section className="section-block container vm-lists-page">
      <JsonLd data={routeBreadcrumb(locale, ["home", "lists"])} />
      <div className="section-heading">
        <p className="section-kicker">{copy.lists.kicker}</p>
        <h1>{copy.lists.title}</h1>
        <p>{copy.lists.body}</p>
      </div>
      {lists.length > 0 ? (
        <div className="list-card-grid">
          {lists.map((list) => (
            <CommunityListCard key={list.slug} list={list} locale={locale} />
          ))}
        </div>
      ) : (
        /* Reached when no list exists yet *or* when the API is unavailable —
           `getListsPage` degrades to [] rather than throwing a 500. Either way
           the visitor gets a next step instead of an empty page. */
        <div className="vm-empty-state">
          <p className="vm-empty-state__body">{EMPTY_COPY[locale].body}</p>
          <div className="vm-empty-state__actions">
            <Link className="btn btn-primary vm-cta" href={`/${locale}/discover`}>
              {EMPTY_COPY[locale].browse}
            </Link>
          </div>
        </div>
      )}
    </section>
  );
}
