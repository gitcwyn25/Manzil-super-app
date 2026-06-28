import type { Locale } from "@manzil/shared";
import { getUiCopy } from "@manzil/shared";
import { CommunityListCard } from "../../components/community-list-card";
import { getListsPage } from "../../lib/api";

export default async function ListsPage({
  params
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const copy = getUiCopy(locale);
  const lists = await getListsPage();

  return (
    <section className="section-block container">
      <div className="section-heading">
        <p className="section-kicker">{copy.lists.kicker}</p>
        <h1>{copy.lists.title}</h1>
        <p>{copy.lists.body}</p>
      </div>
      <div className="list-card-grid">
        {lists.map((list) => (
          <CommunityListCard key={list.slug} list={list} locale={locale} />
        ))}
      </div>
    </section>
  );
}
