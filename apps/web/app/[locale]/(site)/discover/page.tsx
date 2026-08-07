import type { BusinessPlatform, Locale } from "@manzil/shared";
import { getUiCopy } from "@manzil/shared";
import { FilterSidebar } from "../../../components/discover/filter-sidebar";
import { ResultsGrid } from "../../../components/discover/results-grid";
import { SortSelect, type SortKey } from "../../../components/discover/sort-select";
import { GurmanHero, type GurmanHeroCopy } from "../../../components/gurman-hero";
import { HomeSections } from "../../../components/home-sections";
import { Reveal } from "../../../components/motion/reveal";
import { NoResultsState } from "../../../components/pxs/state-panel";
import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "../../../components/json-ld";
import { getHomeFeed, searchBusinesses } from "../../../lib/api";
import { selectPlural } from "../../../lib/format";
import { routeMetadata } from "../../../lib/seo";
import { routeBreadcrumb } from "../../../lib/structured-data";

/**
 * Filtered result URLs (`?q=`, `?category=`, `?price=`, `?minRating=`,
 * `?sort=`) are combinatorial: indexing them would spend crawl budget on
 * near-duplicate pages of the same catalogue. They stay `follow` — the links
 * out to business pages are exactly what should be crawled — but `noindex`,
 * and they canonicalise to the unfiltered browse page.
 */
export async function generateMetadata({
  params,
  searchParams
}: {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<Record<string, string | undefined>>;
}): Promise<Metadata> {
  const [{ locale }, filters] = await Promise.all([params, searchParams]);
  const base = routeMetadata("discover", locale);
  const isFiltered = Boolean(
    filters.q?.trim() || (filters.category && filters.category !== "all") || filters.price || filters.minRating
  );

  return isFiltered
    ? { ...base, robots: { index: false, follow: true } }
    : base;
}

/**
 * Planner-hero copy per locale (D8: aspirational energy, honest claims).
 *
 * Gurman AI recommends real places from real reviews — the copy invites the
 * visitor to plan their day WITH Gurman, but never claims generated
 * itineraries, bookings, or match percentages the API cannot produce. The
 * planner input submits to /{locale}/concierge, where the chat actually runs.
 */
function gurmanCopy(locale: Locale): GurmanHeroCopy {
  const byLocale: Record<string, GurmanHeroCopy> = {
    uz: {
      badge: "Gurman AI",
      titleLine1: "Ajoyib kuningizni",
      titleLine2: "Gurman bilan rejalashtiring",
      subtitle:
        "Nima izlayotganingizni yozing — Gurman AI haqiqiy sharhlar va real biznes ma'lumotlari asosida mos joylarni tavsiya qiladi.",
      inputLabel: "Gurman AI uchun savol",
      inputPlaceholder: "Masalan: shanba uchun tinch kafe",
      cta: "Gurmandan so'rash",
      ctaHref: `/${locale}/concierge`,
      trustReviews: "Faqat haqiqiy sharhlar",
      trustPlaces: "Katalogdagi real joylar",
      waitlistCta: "Erta kirish uchun navbat",
      bento: {
        brandTitle: "Gurman AI",
        brandHint: "Sharhlar asosida tavsiya qiladi",
        askTitle: "Siz yozasiz",
        askHint: "Nima izlayotganingizni ayting",
        reviewsTitle: "Haqiqiy sharhlar",
        reviewsHint: "O'ylab topilgan baho yo'q",
        placesTitle: "Real joylar",
        placesHint: "Manzil katalogidan"
      }
    },
    ru: {
      badge: "Gurman AI",
      titleLine1: "Спланируйте свой день",
      titleLine2: "вместе с Gurman",
      subtitle:
        "Напишите, что вы ищете — Gurman AI порекомендует места на основе реальных отзывов и данных бизнесов.",
      inputLabel: "Вопрос для Gurman AI",
      inputPlaceholder: "Например: тихое кафе на субботу",
      cta: "Спросить Gurman",
      ctaHref: `/${locale}/concierge`,
      trustReviews: "Только реальные отзывы",
      trustPlaces: "Реальные места из каталога",
      waitlistCta: "В очередь на ранний доступ",
      bento: {
        brandTitle: "Gurman AI",
        brandHint: "Рекомендует на основе отзывов",
        askTitle: "Вы пишете",
        askHint: "Скажите, что ищете",
        reviewsTitle: "Реальные отзывы",
        reviewsHint: "Никаких выдуманных оценок",
        placesTitle: "Реальные места",
        placesHint: "Из каталога Manzil"
      }
    },
    en: {
      badge: "Gurman AI",
      titleLine1: "Plan your day",
      titleLine2: "with Gurman",
      subtitle:
        "Tell us what you're looking for — Gurman AI recommends places from real reviews and real business data.",
      inputLabel: "Ask Gurman AI",
      inputPlaceholder: "e.g. a quiet café for Saturday",
      cta: "Ask Gurman",
      ctaHref: `/${locale}/concierge`,
      trustReviews: "Real reviews only",
      trustPlaces: "Real places from the catalog",
      waitlistCta: "Join the early-access queue",
      bento: {
        brandTitle: "Gurman AI",
        brandHint: "Recommends from real reviews",
        askTitle: "You ask",
        askHint: "Tell us what you need",
        reviewsTitle: "Real reviews",
        reviewsHint: "No invented scores",
        placesTitle: "Real places",
        placesHint: "From the Manzil catalog"
      }
    }
  };

  return byLocale[locale] ?? byLocale.uz;
}

type ResultsCopy = {
  fallbackTitle: string;
  searchTitle: (query: string) => string;
  countLine: (count: number) => string;
  loadMore: string;
  /** Empty-result actions. A "no results" panel with nothing to click is a
   *  dead end; these are the two things that genuinely help from here. */
  clearFilters: string;
  addBusiness: string;
};

const RESULTS_COPY: Record<string, ResultsCopy> = {
  uz: {
    fallbackTitle: "Barcha joylar",
    searchTitle: (query) => `«${query}» bo'yicha natijalar`,
    countLine: (count) => `${count} ta joy topildi`,
    loadMore: "Yana ko'rsatish",
    clearFilters: "Filtrlarni tozalash",
    addBusiness: "Biznes qo'shish"
  },
  ru: {
    fallbackTitle: "Все места",
    searchTitle: (query) => `Результаты по запросу «${query}»`,
    countLine: (count) =>
      `Найдено ${count} ${selectPlural(count, { one: "место", few: "места", many: "мест", other: "места" }, "ru")}`,
    loadMore: "Показать ещё",
    clearFilters: "Сбросить фильтры",
    addBusiness: "Добавить бизнес"
  },
  en: {
    fallbackTitle: "All places",
    searchTitle: (query) => `Results for "${query}"`,
    countLine: (count) => `${count} ${selectPlural(count, { one: "place", other: "places" }, "en")} found`,
    loadMore: "Show more",
    clearFilters: "Clear filters",
    addBusiness: "Add a business"
  }
};

const PRICE_TIERS = ["$", "$$", "$$$"];

export default async function DiscoverPage({
  params,
  searchParams
}: {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{
    q?: string;
    category?: string;
    price?: string;
    minRating?: string;
    sort?: string;
  }>;
}) {
  const [{ locale }, filters] = await Promise.all([params, searchParams]);
  const copy = getUiCopy(locale);
  const category = filters.category ?? "all";
  const query = filters.q ?? "";
  const price = filters.price && PRICE_TIERS.includes(filters.price) ? filters.price : undefined;
  const minRating = filters.minRating === "4" ? 4 : filters.minRating === "3" ? 3 : undefined;
  const sort: SortKey = filters.sort === "rating" ? "rating" : "recommended";

  // The curated sections are the *browse* state. Once a visitor has searched
  // or filtered, they have told us what they want — pushing editorial picks
  // above their results would bury the answer they asked for.
  const isBrowsing =
    query.trim().length === 0 && category === "all" && !price && !minRating;

  const [{ businesses: results, categories }, feed] = await Promise.all([
    searchBusinesses(query, category),
    isBrowsing ? getHomeFeed(locale) : Promise.resolve(null)
  ]);

  if (isBrowsing) {
    return (
      <div className="discover-page">
        <JsonLd data={routeBreadcrumb(locale, ["home", "discover"])} />
        <GurmanHero copy={gurmanCopy(locale)} locale={locale} />
        {feed?.sections ? (
          <div className="container discover-page__sections">
            <Reveal delay={120} variant="fade-up">
              <HomeSections locale={locale} sections={feed.sections} />
            </Reveal>
          </div>
        ) : null}
      </div>
    );
  }

  // Filtered/results state. /search accepts only q + category (D11), so
  // price/rating refinement and both sorts run here on the returned array —
  // the first paint is complete without any client JS. qualityScore.overall
  // is a 0-100 scale; ratings scale up to compare in the same space.
  const recommendedScore = (business: BusinessPlatform) =>
    business.qualityScore?.overall ?? business.avgRating * 20;
  const refined = results
    .filter(
      (business) =>
        (!price || business.priceTier === price) &&
        (!minRating || business.avgRating >= minRating)
    )
    .sort((a, b) =>
      sort === "rating" ? b.avgRating - a.avgRating : recommendedScore(b) - recommendedScore(a)
    );

  const t = RESULTS_COPY[locale] ?? RESULTS_COPY.uz;
  const activeCategory =
    category !== "all" ? categories.find((item) => item.slug === category) : undefined;
  const categoryTitle = activeCategory
    ? (activeCategory.name[locale] ?? activeCategory.name.uz)
    : undefined;
  const trimmedQuery = query.trim();
  const title = trimmedQuery
    ? t.searchTitle(trimmedQuery)
    : (categoryTitle ?? t.fallbackTitle);
  const categoryNames = Object.fromEntries(
    categories.map((item) => [item.slug, item.name[locale] ?? item.name.uz])
  );

  return (
    <section className="container discover-results">
      <JsonLd data={routeBreadcrumb(locale, ["home", "discover"])} />
      <div className="discover-results__layout">
        <FilterSidebar
          categories={categories}
          category={category}
          locale={locale}
          minRating={minRating}
          price={price}
          query={query}
          sort={filters.sort === "rating" ? "rating" : undefined}
        />
        <div className="discover-results__main">
          <Reveal variant="fade-up">
            <header className="discover-results__head">
              <div>
                <h1 className="discover-results__title">{title}</h1>
                <p className="discover-results__count">{t.countLine(refined.length)}</p>
              </div>
              <SortSelect
                category={category}
                locale={locale}
                minRating={minRating}
                price={price}
                query={query}
                sort={sort}
              />
            </header>
          </Reveal>
          {refined.length > 0 ? (
            <ResultsGrid
              businesses={refined}
              categoryNames={categoryNames}
              loadMoreLabel={t.loadMore}
              locale={locale}
            />
          ) : (
            <Reveal delay={120} variant="fade-up">
              {/* PXS adoption (Epic 17). The trust audit fixed this dead end by
                  hand — a heading and a sentence with nothing to click became
                  the same copy plus the two things that genuinely help. It then
                  existed as four near-identical copies across Discover, Lists,
                  Occasions and occasion detail, so the fifth surface would have
                  invented a fifth variant. `NoResultsState` is that markup,
                  once. The copy and the actions are unchanged. */}
              <NoResultsState
                actions={
                  <>
                    <Link className="btn btn-primary vm-cta" href={`/${locale}/discover`}>
                      {t.clearFilters}
                    </Link>
                    <Link
                      className="btn btn-outline-primary"
                      href={`/${locale}/business/register`}
                    >
                      {t.addBusiness}
                    </Link>
                  </>
                }
                body={copy.search.emptyBody}
                title={copy.search.emptyTitle}
              />
            </Reveal>
          )}
        </div>
      </div>
    </section>
  );
}
