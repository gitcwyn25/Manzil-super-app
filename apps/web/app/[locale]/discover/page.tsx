import type { Locale } from "@manzil/shared";
import { getUiCopy } from "@manzil/shared";
import { BusinessCard } from "../../components/business-card";
import { SearchControls } from "../../components/search-controls";
import { searchBusinesses } from "../../lib/api";

export default async function DiscoverPage({
  params,
  searchParams
}: {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ q?: string; category?: string }>;
}) {
  const [{ locale }, filters] = await Promise.all([params, searchParams]);
  const copy = getUiCopy(locale);
  const category = filters.category ?? "all";
  const query = filters.q ?? "";
  const { businesses: results, categories } = await searchBusinesses(query, category);

  return (
    <section className="section-block container discover-page">
      <div className="section-heading">
        <p className="section-kicker">{copy.search.kicker}</p>
        <h1>{copy.search.title}</h1>
        <p>{copy.search.subtitle}</p>
      </div>
      <SearchControls categories={categories} category={category} locale={locale} query={query} />
      <div className="results-toolbar">
        <p>{copy.search.results(results.length)}</p>
        <div className="segmented-control" aria-label={copy.search.listView}>
          <button className="active" type="button">{copy.search.listView}</button>
          <button type="button">{copy.search.mapView}</button>
        </div>
      </div>
      <div className="business-grid">
        {results.map((business) => (
          <BusinessCard business={business} key={business.id} locale={locale} />
        ))}
      </div>
      {results.length === 0 ? (
        <div className="empty-state">
          <h3>{copy.search.emptyTitle}</h3>
          <p>{copy.search.emptyBody}</p>
        </div>
      ) : null}
    </section>
  );
}
