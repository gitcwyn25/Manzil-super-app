import type { Locale } from "@manzil/shared";
import type { HomeCard, HomeSections as Sections } from "../lib/api";
import { formatReviewCount } from "../lib/format";
import { DealBadge } from "./vm/deal-badge";
import { Icon, type IconName } from "./vm/icons";
import { PriceTierBadge } from "./vm/price-tier-badge";
import { RatingLine } from "./vm/rating-line";
import { SectionHeader } from "./vm/section-header";

type SectionCopy = {
  featured: string;
  featuredSub: string;
  featuredBadge: string;
  justJoined: string;
  justJoinedSub: string;
  categories: string;
  categoriesSub: string;
  viewAll: string;
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
    featuredBadge: "Tanlangan",
    justJoined: "Yangi qo'shilganlar",
    justJoinedSub: "Platformaga endigina qo'shilgan bizneslar",
    categories: "Turkumlar bo'yicha",
    categoriesSub: "Toshkentdagi joylarni turkum bo'yicha ko'ring",
    viewAll: "Barchasini ko'rish",
    beFirst: "Birinchi bo'ling",
    beFirstHint: "Bu turkumda hali biznes yo'q",
    places: "ta joy",
    addBusiness: "Biznesingizni qo'shing"
  },
  ru: {
    featured: "Избранные места",
    featuredSub: "Бизнесы, отобранные командой Manzil",
    featuredBadge: "Избранное",
    justJoined: "Только присоединились",
    justJoinedSub: "Бизнесы, недавно появившиеся на платформе",
    categories: "По категориям",
    categoriesSub: "Смотрите места Ташкента по категориям",
    viewAll: "Смотреть все",
    beFirst: "Будьте первым",
    beFirstHint: "В этой категории пока нет бизнесов",
    places: "мест",
    addBusiness: "Добавьте свой бизнес"
  },
  en: {
    featured: "Featured places",
    featuredSub: "Hand-picked by the Manzil team",
    featuredBadge: "Featured",
    justJoined: "Just joined",
    justJoinedSub: "Businesses that recently arrived on the platform",
    categories: "Explore by category",
    categoriesSub: "Browse Tashkent's places by category",
    viewAll: "View all",
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

// The Category entity carries no image or icon (api-map gap): visuals come
// from this static slug map — inline-SVG glyph + a gradient art class defined
// in _discover.scss — with a neutral default for any future slug.
const CATEGORY_ICONS: Record<string, IconName> = {
  auto: "car",
  beauty: "scissors",
  cafes: "coffee",
  repairs: "wrench",
  restaurants: "utensils"
};

/**
 * The Master Card (Vibrant Marketplace DealCard): image block carrying the
 * rating chip (top-left), the gated featured badge (top-right) and the
 * priceTier chip (bottom-left, the only honest price signal per D7); body
 * with name, district-and-category meta line and a review-count footer with
 * the circular hover-fill arrow.
 *
 * `.home-card` on the anchor and `.home-card__rating` on the rating element
 * are e2e welds — RatingLine renders the localized "New" chip at
 * reviewCount 0, never "0.0 ★". The mock's fabricated price footers
 * ($12.00, "20% OFF", "Day Pass") are cut: no deals entity exists.
 */
function Card({
  business,
  locale,
  featuredLabel
}: {
  business: HomeCard;
  locale: Locale;
  featuredLabel: string;
}) {
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
        <RatingLine
          avgRating={business.avgRating}
          className="home-card__rating"
          locale={locale}
          reviewCount={business.reviewCount}
          showCount={false}
        />
        {business.featured ? <DealBadge className="home-card__flag" label={featuredLabel} /> : null}
        <PriceTierBadge className="home-card__price" tier={business.priceTier} />
      </span>
      <span className="home-card__text">
        <span className="home-card__name">{business.name}</span>
        <span className="home-card__meta">
          <Icon name="location" size={14} />
          {business.district} · {categoryName(business.category, locale)}
        </span>
        <span className="home-card__foot">
          {business.reviewCount > 0 ? (
            <span className="home-card__reviews">
              {formatReviewCount(business.reviewCount, locale)}
            </span>
          ) : null}
          <span aria-hidden="true" className="home-card__go">
            <Icon name="arrow_forward" size={16} />
          </span>
        </span>
      </span>
    </a>
  );
}

type CategoryItem = Sections["categories"][number];

/**
 * One bento tile. `hero` is the 2x2 photo-weight tile, `tile` the 1x1
 * icon-chip tile, `wide` a col-span-2 variant used only when it tessellates
 * (last tile, even remainder). Every tile keeps the `.home-category` weld;
 * an empty category gets `.is-empty` and links to registration — an opening,
 * not a dead end.
 */
function CategoryTile({
  category,
  locale,
  text,
  variant
}: {
  category: CategoryItem;
  locale: Locale;
  text: SectionCopy;
  variant: "hero" | "tile" | "wide";
}) {
  const isEmpty = category.businessCount === 0;
  const icon = CATEGORY_ICONS[category.slug] ?? "storefront";
  const art = CATEGORY_ICONS[category.slug] ? category.slug : "default";
  const classes = [
    "home-category",
    `home-category--${variant}`,
    `home-category--art-${art}`,
    isEmpty ? "is-empty" : null
  ]
    .filter(Boolean)
    .join(" ");
  const href = isEmpty
    ? `/${locale}/business/register`
    : `/${locale}/discover?category=${category.slug}`;

  return (
    <a className={classes} href={href} title={isEmpty ? text.beFirstHint : undefined}>
      {variant === "hero" ? (
        <Icon className="home-category__glyph" name={icon} size={96} />
      ) : (
        <span className="home-category__chip">
          <Icon name={icon} size={18} />
        </span>
      )}
      <span className="home-category__caption">
        <span className="home-category__name">{categoryName(category, locale)}</span>
        <span className="home-category__count">
          {isEmpty ? text.beFirst : `${category.businessCount} ${text.places}`}
        </span>
      </span>
      {variant === "hero" ? (
        <span aria-hidden="true" className="home-category__arrow">
          <Icon name="arrow_forward" size={18} />
        </span>
      ) : null}
    </a>
  );
}

/**
 * Landing sections built from real data: the category bento, then the curated
 * card rows (featured picks, recently joined) on a white slab.
 *
 * Every card row self-hides when empty rather than rendering an empty shelf —
 * at low business counts an empty row reads as broken, and omitting it reads
 * as a smaller but intact site. Categories always render: an empty category
 * is a registration invitation, not a gap.
 */
export function HomeSections({
  sections,
  locale,
  categoriesViewAllHref
}: {
  sections: Sections;
  locale: Locale;
  /** Optional "View all" target for the categories header (used on home). */
  categoriesViewAllHref?: string;
}) {
  const text = COPY[locale] ?? COPY.uz;

  const hasFeatured = sections.featured.length > 0;
  const hasJustJoined = sections.justJoined.length > 0;
  const hasCategories = sections.categories.length > 0;

  if (!hasFeatured && !hasJustJoined && !hasCategories) {
    return null;
  }

  // Populated categories first: the visual weight of the hero tile should go
  // to a category a visitor can actually open.
  const ordered = [...sections.categories].sort((a, b) => b.businessCount - a.businessCount);

  return (
    <div className="home-sections">
      {hasCategories ? (
        <section className="home-section">
          <SectionHeader
            subtitle={text.categoriesSub}
            title={text.categories}
            viewAllHref={categoriesViewAllHref}
            viewAllLabel={categoriesViewAllHref ? text.viewAll : undefined}
          />
          <div className="home-categories home-categories--bento">
            {ordered.map((category, index) => (
              <CategoryTile
                category={category}
                key={category.slug}
                locale={locale}
                text={text}
                variant={
                  index === 0
                    ? "hero"
                    : index === ordered.length - 1 && ordered.length % 2 === 0
                      ? "wide"
                      : "tile"
                }
              />
            ))}
          </div>
        </section>
      ) : null}

      {hasFeatured || hasJustJoined ? (
        <div className="home-slab">
          {hasFeatured ? (
            <section className="home-section">
              <SectionHeader subtitle={text.featuredSub} title={text.featured} />
              <div className="home-cards">
                {sections.featured.map((business) => (
                  <Card
                    business={business}
                    featuredLabel={text.featuredBadge}
                    key={business.slug}
                    locale={locale}
                  />
                ))}
              </div>
            </section>
          ) : null}

          {hasJustJoined ? (
            <section className="home-section">
              <SectionHeader subtitle={text.justJoinedSub} title={text.justJoined} />
              <div className="home-cards">
                {sections.justJoined.map((business) => (
                  <Card
                    business={business}
                    featuredLabel={text.featuredBadge}
                    key={business.slug}
                    locale={locale}
                  />
                ))}
              </div>
            </section>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
