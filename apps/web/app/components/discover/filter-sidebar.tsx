import type { Category, Locale } from "@manzil/shared";
import { IconField, IconSelect } from "../vm/icon-field";
import { Icon } from "../vm/icons";

/** The three real price tiers — the shared Business type has no "$$$$" (D7). */
const PRICE_TIERS = ["$", "$$", "$$$"] as const;

/** Rating thresholds offered by the mock (4+ and 3+), plus an "any" row. */
const RATING_THRESHOLDS = [4, 3] as const;

type FilterCopy = {
  filters: string;
  searchLabel: string;
  searchPlaceholder: string;
  category: string;
  allCategories: string;
  price: string;
  minRating: string;
  any: string;
  andUp: string;
  apply: string;
  reset: string;
};

const COPY: Record<string, FilterCopy> = {
  uz: {
    filters: "Filtrlar",
    searchLabel: "Qidiruv",
    searchPlaceholder: "Masalan: osh yoki Yunusobod",
    category: "Turkum",
    allCategories: "Hammasi",
    price: "Narx darajasi",
    minRating: "Minimal baho",
    any: "Hammasi",
    andUp: "va yuqori",
    apply: "Filtrlarni qo'llash",
    reset: "Tozalash"
  },
  ru: {
    filters: "Фильтры",
    searchLabel: "Поиск",
    searchPlaceholder: "Например: плов или Юнусабад",
    category: "Категория",
    allCategories: "Все",
    price: "Уровень цен",
    minRating: "Минимальный рейтинг",
    any: "Все",
    andUp: "и выше",
    apply: "Применить фильтры",
    reset: "Сбросить"
  },
  en: {
    filters: "Filters",
    searchLabel: "Search",
    searchPlaceholder: "e.g. plov or Yunusobod",
    category: "Category",
    allCategories: "All",
    price: "Price level",
    minRating: "Minimum rating",
    any: "Any",
    andUp: "& up",
    apply: "Apply filters",
    reset: "Reset"
  }
};

/**
 * The filtered-state sidebar: one white L1 card wrapping a plain GET form
 * into /{locale}/discover, so filtering works with no JS at all (and the
 * `<form>` satisfies the discover.spec.ts search-control locator).
 *
 * Honest degradations per the api-map: a 3-segment price control (no "$$$$"
 * tier exists), no distance filter (geolocation is disabled by policy), and
 * all refinement happens on the returned array — /search accepts only
 * q + category (D11).
 */
export function FilterSidebar({
  categories,
  category,
  locale,
  minRating,
  price,
  query,
  sort
}: {
  categories: Category[];
  category: string;
  locale: Locale;
  minRating?: number;
  price?: string;
  query: string;
  sort?: string;
}) {
  const t = COPY[locale] ?? COPY.uz;
  const trimmed = query.trim();
  const resetHref = `/${locale}/discover${trimmed ? `?q=${encodeURIComponent(trimmed)}` : ""}`;

  return (
    <aside className="vm-filter">
      <form action={`/${locale}/discover`} className="vm-filter__card" method="get">
        <h2 className="vm-filter__title">{t.filters}</h2>

        {sort ? <input name="sort" type="hidden" value={sort} /> : null}

        <div className="vm-filter__group">
          <label className="vm-filter__label" htmlFor="discover-filter-q">
            {t.searchLabel}
          </label>
          <IconField
            defaultValue={query}
            icon="search"
            id="discover-filter-q"
            name="q"
            placeholder={t.searchPlaceholder}
            type="search"
          />
        </div>

        <div className="vm-filter__group">
          <label className="vm-filter__label" htmlFor="discover-filter-category">
            {t.category}
          </label>
          <IconSelect defaultValue={category} icon="grid" id="discover-filter-category" name="category">
            <option value="all">{t.allCategories}</option>
            {categories.map((item) => (
              <option key={item.id} value={item.slug}>
                {item.name[locale] ?? item.name.uz}
              </option>
            ))}
          </IconSelect>
        </div>

        <fieldset className="vm-filter__group">
          <legend className="vm-filter__label">{t.price}</legend>
          <div className="vm-segments">
            {PRICE_TIERS.map((tier) => (
              <label className="vm-segment" key={tier}>
                <input
                  className="vm-segment__input"
                  defaultChecked={price === tier}
                  name="price"
                  type="radio"
                  value={tier}
                />
                <span className="vm-segment__face">{tier}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="vm-filter__group">
          <legend className="vm-filter__label">{t.minRating}</legend>
          <div className="vm-filter__options">
            <label className="vm-rating-option">
              <input defaultChecked={!minRating} name="minRating" type="radio" value="" />
              <span className="vm-rating-option__label">{t.any}</span>
            </label>
            {RATING_THRESHOLDS.map((threshold) => (
              <label className="vm-rating-option" key={threshold}>
                <input
                  defaultChecked={minRating === threshold}
                  name="minRating"
                  type="radio"
                  value={threshold}
                />
                <span aria-hidden="true" className="vm-rating-option__stars">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Icon key={star} name={star <= threshold ? "star_filled" : "star"} size={16} />
                  ))}
                </span>
                <span className="vm-rating-option__label">
                  {threshold}+ {t.andUp}
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="vm-filter__actions">
          <button className="vm-filter__apply" type="submit">
            {t.apply}
          </button>
          <a className="vm-filter__reset" href={resetHref}>
            {t.reset}
          </a>
        </div>
      </form>
    </aside>
  );
}
