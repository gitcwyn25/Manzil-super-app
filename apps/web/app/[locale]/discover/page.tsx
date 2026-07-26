import type { Locale } from "@manzil/shared";
import { getUiCopy } from "@manzil/shared";
import { BusinessCard } from "../../components/business-card";
import { Reveal, RevealStagger } from "../../components/motion/reveal";
import { SearchControls } from "../../components/search-controls";
import { getHomeFeed, searchBusinesses } from "../../lib/api";
import { HomeSections } from "../../components/home-sections";

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

  // The curated sections are the *browse* state. Once a visitor has searched or
  // filtered, they have told us what they want — pushing editorial picks above
  // their results would bury the answer they asked for.
  const isBrowsing = query.trim().length === 0 && category === "all";

  const [{ businesses: results, categories }, feed] = await Promise.all([
    searchBusinesses(query, category),
    isBrowsing ? getHomeFeed(locale) : Promise.resolve(null)
  ]);

  return (
    <section className="section-block container discover-page">
      <Reveal variant="fade-up">
        <div className="section-heading">
          <p className="section-kicker">{copy.search.kicker}</p>
          <h1>{copy.search.title}</h1>
          <p>{copy.search.subtitle}</p>
        </div>
      </Reveal>
      <Reveal delay={120} variant="fade-up">
        <SearchControls categories={categories} category={category} locale={locale} query={query} />
      </Reveal>
      {feed?.sections ? (
        <Reveal delay={160} variant="fade-up">
          <HomeSections locale={locale} sections={feed.sections} />
        </Reveal>
      ) : null}

      <Reveal delay={200} variant="fade-in">
        <div className="results-toolbar">
          <p>{copy.search.results(results.length)}</p>
          <div className="segmented-control" aria-label={copy.search.listView}>
            <button className="active" type="button">{copy.search.listView}</button>
            <button type="button">{copy.search.mapView}</button>
          </div>
        </div>
      </Reveal>
      <RevealStagger className="business-grid" start={80} step={80} variant="scale-in">
        {results.map((business) => (
          <BusinessCard business={business} key={business.id} locale={locale} />
        ))}
      </RevealStagger>
      {results.length === 0 ? (
        <div className="empty-state">
          <h3>{copy.search.emptyTitle}</h3>
          <p>{copy.search.emptyBody}</p>
        </div>
      ) : null}
    </section>
  );
}
