import type { Locale } from "@manzil/shared";
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
  const category = filters.category ?? "all";
  const query = filters.q ?? "";
  const { businesses: results, categories } = await searchBusinesses(query, category);

  return (
    <section className="section-block">
      <div className="section-heading">
        <p className="section-kicker">Kashfiyot</p>
        <h1>Joylarni qidiring</h1>
        <p>Restoran, qahva, xizmat yoki tuman nomi bo'yicha qidiring.</p>
      </div>
      <SearchControls categories={categories} category={category} locale={locale} query={query} />
      <div className="results-toolbar">
        <p>{results.length} ta natija</p>
        <div className="segmented-control" aria-label="Natija ko'rinishi">
          <button className="active" type="button">Ro'yxat</button>
          <button type="button">Xarita</button>
        </div>
      </div>
      <div className="business-grid">
        {results.map((business) => (
          <BusinessCard business={business} key={business.id} locale={locale} />
        ))}
      </div>
      {results.length === 0 ? (
        <div className="admin-card">
          <h3>Natija topilmadi</h3>
          <p>Boshqa qidiruv so'zi yoki kategoriya tanlang.</p>
        </div>
      ) : null}
    </section>
  );
}
