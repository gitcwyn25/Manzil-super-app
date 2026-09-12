import type { BusinessPlatform, Locale } from "@manzil/shared";
import type { CSSProperties } from "react";
import Link from "next/link";
import { Icon } from "../vm/icons";
import { MarketplaceCard } from "../discover/marketplace-card";
import {
  TRAVEL_ACTIVITIES_ROOT,
  TRAVEL_ACTIVITY_CATEGORIES,
  type TravelActivityCategory,
  localizeTravel
} from "../../lib/travel-activities";

const uiCopy = {
  uz: {
    eyebrow: "MANZIL · TOSHKENT",
    browse: "Travel & Activities bo'limini ko'rish",
    searchPlaceholder: "Joy yoki mashg'ulotni qidiring",
    search: "Qidirish",
    viewAll: "Barcha joylarni ko'rish",
    categories: "Kategoriyalarni ko'rish",
    categoryCount: "bo'lim",
    explore: "Ko'rish",
    allPlaces: "Barcha joylar",
    allPlacesDescription: "Travel & Activities ichidagi barcha sahifalar va joylarni bir joyda ko'ring.",
    placesIn: "bo'yicha joylar",
    inTashkent: "Toshkentda",
    noPlacesTitle: "Bu bo'limga hali joylar qo'shilmagan",
    noPlacesBody: "Sahifa tayyor. Ishonchli joylar qo'shilganda manzil, ish vaqti, narx va sharhlar shu yerda ko'rinadi.",
    suggest: "Joy qo'shishni taklif qilish",
    browseDiscover: "Mavjud katalogni ko'rish",
    compareTitle: "Yaxshi tanlov uchun kerakli ma'lumotlar",
    compareBody: "Har bir sahifa joylashuv, ish vaqti, narx, qulayliklar va haqiqiy jamoa sharhlarini bir joyga yig'ish uchun tuzilgan.",
    askTitle: "Mahalliylardan so'rang",
    askBody: "Siz biladigan joy bu ro'yxatda yo'qmi? Uni tavsiya qiling yoki biznes egasiga sahifa ochish imkonini bering.",
    related: "O'xshash bo'limlar",
    allCount: "15 ta bo'lim"
  },
  ru: {
    eyebrow: "MANZIL · ТАШКЕНТ",
    browse: "Открыть раздел путешествий и досуга",
    searchPlaceholder: "Найти место или занятие",
    search: "Найти",
    viewAll: "Посмотреть все места",
    categories: "Категории",
    categoryCount: "разделов",
    explore: "Открыть",
    allPlaces: "Все места",
    allPlacesDescription: "Все страницы и места раздела «Путешествия и досуг» в одном месте.",
    placesIn: "мест в категории",
    inTashkent: "в Ташкенте",
    noPlacesTitle: "В этом разделе пока нет мест",
    noPlacesBody: "Страница готова. Когда появятся подтверждённые места, здесь будут адрес, часы, цены и отзывы.",
    suggest: "Предложить место",
    browseDiscover: "Открыть текущий каталог",
    compareTitle: "Информация для уверенного выбора",
    compareBody: "Каждая страница объединяет адрес, часы работы, цены, удобства и настоящие отзывы сообщества.",
    askTitle: "Спросите местных",
    askBody: "Не нашли знакомое место? Предложите его или помогите владельцу открыть страницу.",
    related: "Похожие разделы",
    allCount: "15 разделов"
  },
  en: {
    eyebrow: "MANZIL · TASHKENT",
    browse: "Browse Travel & Activities",
    searchPlaceholder: "Search a place or activity",
    search: "Search",
    viewAll: "View all places",
    categories: "Browse categories",
    categoryCount: "categories",
    explore: "Explore",
    allPlaces: "All places",
    allPlacesDescription: "Browse every page and place in Travel & Activities from one index.",
    placesIn: "places in",
    inTashkent: "in Tashkent",
    noPlacesTitle: "No places listed here yet",
    noPlacesBody: "The page is ready. Once trusted places are added, this is where you will see addresses, hours, prices, and reviews.",
    suggest: "Suggest a place",
    browseDiscover: "Browse the current catalog",
    compareTitle: "The details that make choosing easier",
    compareBody: "Each page is designed to bring location, hours, price, amenities, and genuine community reviews together.",
    askTitle: "Ask locals",
    askBody: "Know a place that is missing? Suggest it or help the owner create a page.",
    related: "Related categories",
    allCount: "15 categories"
  }
} as const;

function SearchForm({ locale, action, query = "" }: { locale: Locale; action: string; query?: string }) {
  const copy = uiCopy[locale];

  return (
    <form className="travel-search" action={action} method="get" role="search">
      <Icon aria-hidden="true" className="travel-search__icon" name="search" size={19} />
      <input
        aria-label={copy.searchPlaceholder}
        defaultValue={query}
        name="q"
        placeholder={copy.searchPlaceholder}
        type="search"
      />
      <button type="submit">{copy.search}</button>
    </form>
  );
}

function CategoryIcon({ category }: { category: TravelActivityCategory }) {
  return (
    <span className="travel-category-card__icon" style={{ "--travel-accent": category.accent } as CSSProperties}>
      <Icon aria-hidden="true" name={category.icon} size={21} />
    </span>
  );
}

function CategoryCard({ category, locale }: { category: TravelActivityCategory; locale: Locale }) {
  const copy = uiCopy[locale];

  return (
    <Link
      className="travel-category-card"
      href={`/${locale}/travel-activities/${category.slug}`}
      style={{ "--travel-accent": category.accent } as CSSProperties}
    >
      <CategoryIcon category={category} />
      <span className="travel-category-card__body">
        <strong>{localizeTravel(category.label, locale)}</strong>
        <span>{localizeTravel(category.description, locale)}</span>
      </span>
      <Icon aria-hidden="true" className="travel-category-card__arrow" name="arrow_forward" size={17} />
      <span className="visually-hidden">{copy.explore}</span>
    </Link>
  );
}

function CommunityPrompt({ locale }: { locale: Locale }) {
  const copy = uiCopy[locale];

  return (
    <section className="travel-community-card" aria-labelledby="travel-community-title">
      <div className="travel-community-card__icon" aria-hidden="true">
        <Icon name="users" size={24} />
      </div>
      <div>
        <p className="travel-kicker">{copy.askTitle}</p>
        <h2 id="travel-community-title">{copy.askTitle}</h2>
        <p>{copy.askBody}</p>
      </div>
      <Link className="travel-button travel-button--light" href={`/${locale}/business/register`}>
        {copy.suggest}
        <Icon aria-hidden="true" name="arrow_forward" size={17} />
      </Link>
    </section>
  );
}

function EmptyPlaces({ locale }: { locale: Locale }) {
  const copy = uiCopy[locale];

  return (
    <div className="travel-empty-state">
      <span className="travel-empty-state__icon" aria-hidden="true">
        <Icon name="compass" size={28} />
      </span>
      <h2>{copy.noPlacesTitle}</h2>
      <p>{copy.noPlacesBody}</p>
      <div className="travel-empty-state__actions">
        <Link className="travel-button travel-button--primary" href={`/${locale}/business/register`}>
          {copy.suggest}
          <Icon aria-hidden="true" name="arrow_forward" size={17} />
        </Link>
        <Link className="travel-button travel-button--ghost" href={`/${locale}/discover`}>
          {copy.browseDiscover}
        </Link>
      </div>
    </div>
  );
}

export function TravelActivitiesHub({ locale }: { locale: Locale }) {
  const copy = uiCopy[locale];

  return (
    <div className="travel-page">
      <section className="travel-hero travel-hero--hub">
        <div className="container travel-hero__inner">
          <div className="travel-hero__copy">
            <p className="travel-kicker">{copy.eyebrow}</p>
            <h1>{localizeTravel(TRAVEL_ACTIVITIES_ROOT.label, locale)}</h1>
            <p className="travel-hero__lead">{localizeTravel(TRAVEL_ACTIVITIES_ROOT.description, locale)}</p>
            <SearchForm locale={locale} action={`/${locale}/travel-activities/places`} />
          </div>
          <div className="travel-hero__note">
            <span className="travel-hero__note-icon" aria-hidden="true">
              <Icon name="compass" size={30} />
            </span>
            <strong>{copy.allCount}</strong>
            <span>{copy.categories}</span>
          </div>
        </div>
      </section>

      <main className="container travel-content">
        <section className="travel-section" aria-labelledby="travel-categories-title">
          <div className="travel-section__heading">
            <div>
              <p className="travel-kicker">{copy.browse}</p>
              <h2 id="travel-categories-title">{copy.categories}</h2>
            </div>
            <Link className="travel-inline-link" href={`/${locale}/travel-activities/places`}>
              {copy.viewAll}
              <Icon aria-hidden="true" name="arrow_forward" size={16} />
            </Link>
          </div>
          <div className="travel-category-grid">
            {TRAVEL_ACTIVITY_CATEGORIES.map((category) => (
              <CategoryCard category={category} key={category.slug} locale={locale} />
            ))}
          </div>
        </section>

        <section className="travel-feature-panel" aria-labelledby="travel-details-title">
          <div className="travel-feature-panel__art" aria-hidden="true">
            <Icon name="location" size={38} />
          </div>
          <div>
            <p className="travel-kicker">{copy.inTashkent}</p>
            <h2 id="travel-details-title">{copy.compareTitle}</h2>
            <p>{copy.compareBody}</p>
          </div>
          <Link className="travel-button travel-button--primary" href={`/${locale}/travel-activities/places`}>
            {copy.viewAll}
            <Icon aria-hidden="true" name="arrow_forward" size={17} />
          </Link>
        </section>

        <CommunityPrompt locale={locale} />
      </main>
    </div>
  );
}

export function TravelActivityCategoryPage({
  locale,
  category,
  businesses,
  query = ""
}: {
  locale: Locale;
  category: TravelActivityCategory;
  businesses: BusinessPlatform[];
  query?: string;
}) {
  const copy = uiCopy[locale];
  const related = TRAVEL_ACTIVITY_CATEGORIES.filter((item) => item.slug !== category.slug).slice(0, 4);
  const title = localizeTravel(category.label, locale);

  return (
    <div className="travel-page">
      <section className="travel-hero travel-hero--category" style={{ "--travel-accent": category.accent } as CSSProperties}>
        <div className="container travel-hero__inner">
          <div className="travel-hero__copy">
            <Link className="travel-back-link" href={`/${locale}/travel-activities`}>
              <Icon aria-hidden="true" name="arrow_back" size={16} />
              {localizeTravel(TRAVEL_ACTIVITIES_ROOT.label, locale)}
            </Link>
            <p className="travel-kicker">{copy.eyebrow}</p>
            <h1>{title}</h1>
            <p className="travel-hero__lead">{localizeTravel(category.description, locale)}</p>
            <SearchForm locale={locale} action={`/${locale}/travel-activities/${category.slug}`} query={query} />
          </div>
          <div className="travel-hero__category-mark" aria-hidden="true">
            <CategoryIcon category={category} />
          </div>
        </div>
      </section>

      <main className="container travel-content">
        <section className="travel-results" aria-labelledby="travel-results-title">
          <div className="travel-section__heading">
            <div>
              <p className="travel-kicker">{copy.inTashkent}</p>
              <h2 id="travel-results-title">{title} {copy.placesIn}</h2>
            </div>
            <span className="travel-result-count">{businesses.length}</span>
          </div>

          {businesses.length > 0 ? (
            <div className="travel-business-grid">
              {businesses.map((business) => (
                <MarketplaceCard business={business} key={business.slug} locale={locale} />
              ))}
            </div>
          ) : (
            <EmptyPlaces locale={locale} />
          )}
        </section>

        <section className="travel-related" aria-labelledby="travel-related-title">
          <div className="travel-section__heading">
            <div>
              <p className="travel-kicker">{copy.browse}</p>
              <h2 id="travel-related-title">{copy.related}</h2>
            </div>
            <Link className="travel-inline-link" href={`/${locale}/travel-activities`}>
              {copy.viewAll}
              <Icon aria-hidden="true" name="arrow_forward" size={16} />
            </Link>
          </div>
          <div className="travel-related-grid">
            {related.map((item) => (
              <CategoryCard category={item} key={item.slug} locale={locale} />
            ))}
          </div>
        </section>

        <CommunityPrompt locale={locale} />
      </main>
    </div>
  );
}

export function TravelActivitiesPlacesPage({
  locale,
  businesses,
  query = ""
}: {
  locale: Locale;
  businesses: BusinessPlatform[];
  query?: string;
}) {
  const copy = uiCopy[locale];
  const title = localizeTravel(TRAVEL_ACTIVITIES_ROOT.label, locale);

  return (
    <div className="travel-page">
      <section className="travel-hero travel-hero--category">
        <div className="container travel-hero__inner">
          <div className="travel-hero__copy">
            <Link className="travel-back-link" href={`/${locale}/travel-activities`}>
              <Icon aria-hidden="true" name="arrow_back" size={16} />
              {title}
            </Link>
            <p className="travel-kicker">{copy.eyebrow}</p>
            <h1>{copy.allPlaces}</h1>
            <p className="travel-hero__lead">{copy.allPlacesDescription}</p>
            <SearchForm locale={locale} action={`/${locale}/travel-activities/places`} query={query} />
          </div>
          <div className="travel-hero__category-mark" aria-hidden="true">
            <Icon name="grid" size={34} />
          </div>
        </div>
      </section>

      <main className="container travel-content">
        <section className="travel-results" aria-labelledby="travel-all-results-title">
          <div className="travel-section__heading">
            <div>
              <p className="travel-kicker">{copy.inTashkent}</p>
              <h2 id="travel-all-results-title">{title}</h2>
            </div>
            <span className="travel-result-count">{businesses.length}</span>
          </div>
          {businesses.length > 0 ? (
            <div className="travel-business-grid">
              {businesses.map((business) => (
                <MarketplaceCard business={business} key={business.slug} locale={locale} />
              ))}
            </div>
          ) : (
            <EmptyPlaces locale={locale} />
          )}
        </section>

        <section className="travel-section" aria-labelledby="travel-all-categories-title">
          <div className="travel-section__heading">
            <div>
              <p className="travel-kicker">{copy.browse}</p>
              <h2 id="travel-all-categories-title">{copy.categories}</h2>
            </div>
          </div>
          <div className="travel-category-grid">
            {TRAVEL_ACTIVITY_CATEGORIES.map((category) => (
              <CategoryCard category={category} key={category.slug} locale={locale} />
            ))}
          </div>
        </section>

        <CommunityPrompt locale={locale} />
      </main>
    </div>
  );
}
