import type { Locale } from "@manzil/shared";
import type { HomeCard, HomeSections as Sections } from "../lib/api";
import { PriceTierBadge } from "./vm/price-tier-badge";
import { RatingLine } from "./vm/rating-line";

type SectionCopy = {
  featured: string;
  featuredSub: string;
  justJoined: string;
  justJoinedSub: string;
  categories: string;
  beFirst: string;
  beFirstHint: string;
  places: string;
  addBusiness: string;
};

// Annotated rather than `as const`: with const assertions each locale gets its
// own literal types, so indexing by a Locale variable fails to unify them.
const COPY: Record<string, SectionCopy> = {
  uz: {
    featured: "Tanlangan joylar",
    featuredSub: "Manzil jamoasi tanlagan bizneslar",
    justJoined: "Yangi qo'shilganlar",
    justJoinedSub: "Platformaga endigina qo'shilgan bizneslar",
    categories: "Turkumlar",
    beFirst: "Birinchi bo'ling",
    beFirstHint: "Bu turkumda hali biznes yo'q",
    places: "ta joy",
    addBusiness: "Biznesingizni qo'shing"
  },
  ru: {
    featured: "Избранные места",
    featuredSub: "Бизнесы, отобранные командой Manzil",
    justJoined: "Только присоединились",
    justJoinedSub: "Бизнесы, недавно появившиеся на платформе",
    categories: "Категории",
    beFirst: "Будьте первым",
    beFirstHint: "В этой категории пока нет бизнесов",
    places: "мест",
    addBusiness: "Добавьте свой бизнес"
  },
  en: {
    featured: "Featured places",
    featuredSub: "Hand-picked by the Manzil team",
    justJoined: "Just joined",
    justJoinedSub: "Businesses that recently arrived on the platform",
    categories: "Categories",
    beFirst: "Be the first",
    beFirstHint: "No businesses here yet",
    places: "places",
    addBusiness: "Add your business"
  }
};

function categoryName(
  category: { nameUz: string; nameRu: string; nameEn: string },
  locale: Locale
): string {
  return locale === "ru" ? category.nameRu : locale === "en" ? category.nameEn : category.nameUz;
}

// The Master Card (Vibrant Marketplace): image block with the priceTier chip
// overlaid, then name / meta / rating. `.home-card` on the anchor and
// `.home-card__rating` on the rating element are e2e welds — RatingLine
// renders the localized "New" chip at reviewCount 0, never "0.0 ★".
function Card({ business, locale }: { business: HomeCard; locale: Locale }) {
  return (
    <a className="home-card card-interactive" href={`/${locale}/businesses/${business.slug}`}>
      <span className="home-card__photo">
        {business.coverPhotoUrl ? (
          <img alt="" className="home-card__cover-img" loading="lazy" src={business.coverPhotoUrl} />
        ) : (
          <span aria-hidden="true" className="home-card__initial">
            {business.name.charAt(0)}
          </span>
        )}
        <PriceTierBadge className="home-card__price" tier={business.priceTier} />
      </span>
      <span className="home-card__text">
        <span className="home-card__name">{business.name}</span>
        <span className="home-card__meta">
          {categoryName(business.category, locale)} · {business.district}
        </span>
        <RatingLine
          avgRating={business.avgRating}
          className="home-card__rating"
          locale={locale}
          reviewCount={business.reviewCount}
        />
      </span>
    </a>
  );
}

/**
 * Landing sections built from real data: editorially featured picks, recently
 * joined businesses, and the category grid.
 *
 * Every section self-hides when empty rather than rendering an empty shelf —
 * at low business counts an empty row reads as broken, and omitting it reads
 * as a smaller but intact site.
 */
export function HomeSections({ sections, locale }: { sections: Sections; locale: Locale }) {
  const text = COPY[locale] ?? COPY.uz;

  const hasFeatured = sections.featured.length > 0;
  const hasJustJoined = sections.justJoined.length > 0;
  const hasCategories = sections.categories.length > 0;

  if (!hasFeatured && !hasJustJoined && !hasCategories) {
    return null;
  }

  return (
    <div className="home-sections">
      {hasFeatured ? (
        <section className="home-section">
          <header className="home-section__head">
            <h2>{text.featured}</h2>
            <p>{text.featuredSub}</p>
          </header>
          <div className="home-cards">
            {sections.featured.map((business) => (
              <Card business={business} key={business.slug} locale={locale} />
            ))}
          </div>
        </section>
      ) : null}

      {hasJustJoined ? (
        <section className="home-section">
          <header className="home-section__head">
            <h2>{text.justJoined}</h2>
            <p>{text.justJoinedSub}</p>
          </header>
          <div className="home-cards">
            {sections.justJoined.map((business) => (
              <Card business={business} key={business.slug} locale={locale} />
            ))}
          </div>
        </section>
      ) : null}

      {hasCategories ? (
        <section className="home-section">
          <header className="home-section__head">
            <h2>{text.categories}</h2>
          </header>
          <div className="home-categories">
            {sections.categories.map((category) =>
              category.businessCount > 0 ? (
                <a
                  className="home-category"
                  href={`/${locale}/discover?category=${category.slug}`}
                  key={category.slug}
                >
                  <span className="home-category__name">{categoryName(category, locale)}</span>
                  <span className="home-category__count">
                    {category.businessCount} {text.places}
                  </span>
                </a>
              ) : (
                /* An empty category is an opening, not a dead end: it links to
                   registration rather than to a search with no results. */
                <a
                  className="home-category is-empty"
                  href={`/${locale}/business/register`}
                  key={category.slug}
                  title={text.beFirstHint}
                >
                  <span className="home-category__name">{categoryName(category, locale)}</span>
                  <span className="home-category__count">{text.beFirst}</span>
                </a>
              )
            )}
          </div>
        </section>
      ) : null}
    </div>
  );
}
