import type { Locale } from "@manzil/shared";
import { getUiCopy } from "@manzil/shared";
import { BusinessCard } from "../../components/business-card";
import { Reveal, RevealStagger } from "../../components/motion/reveal";
import { SearchControls } from "../../components/search-controls";
import { getHomeFeed, searchBusinesses } from "../../lib/api";
import { HomeSections } from "../../components/home-sections";
import { GurmanHero, type GurmanHeroCopy } from "../../components/gurman-hero";

/**
 * Hero copy per locale.
 *
 * Describes what Gurman AI actually does today — recommends real places from
 * real reviews. It deliberately does not promise the package-maker or the
 * business supervisor, which are planned but not built; a hero that oversells
 * an assistant is the fastest way to lose trust in it.
 */
function gurmanCopy(locale: Locale): GurmanHeroCopy {
  const byLocale: Record<string, GurmanHeroCopy> = {
    uz: {
      badge: "Gurman AI",
      titleLine1: "Qayerga borishni",
      titleLine2: "Gurman bilan toping",
      subtitle:
        "Gurman AI haqiqiy sharhlar va biznes ma'lumotlari asosida sizga mos joyni tavsiya qiladi — o'ylab topilgan bahо emas, faqat real ma'lumot.",
      cta: "Gurman bilan suhbat",
      ctaHref: `/${locale}/concierge`,
      portraitAlt: "Gurman AI — Manzil yordamchisi"
    },
    ru: {
      badge: "Gurman AI",
      titleLine1: "Куда пойти —",
      titleLine2: "подскажет Gurman",
      subtitle:
        "Gurman AI подбирает места на основе реальных отзывов и данных бизнесов — никаких выдуманных оценок, только настоящая информация.",
      cta: "Спросить Gurman",
      ctaHref: `/${locale}/concierge`,
      portraitAlt: "Gurman AI — помощник Manzil"
    },
    en: {
      badge: "Gurman AI",
      titleLine1: "Where to go —",
      titleLine2: "just ask Gurman",
      subtitle:
        "Gurman AI recommends places from real reviews and real business data — no invented scores, only what the data actually says.",
      cta: "Ask Gurman",
      ctaHref: `/${locale}/concierge`,
      portraitAlt: "Gurman AI — the Manzil assistant"
    }
  };

  return byLocale[locale] ?? byLocale.uz;
}

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
      {isBrowsing ? <GurmanHero copy={gurmanCopy(locale)} /> : null}

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
