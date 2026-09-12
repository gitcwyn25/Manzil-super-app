import type { BusinessPlatform, Locale } from "@manzil/shared";
import Link from "next/link";
import type { CSSProperties } from "react";
import { Icon } from "../vm/icons";
import { MarketplaceCard } from "../discover/marketplace-card";
import {
  BUSINESS_CATEGORY_GROUPS,
  type GroupDefinition,
  type LeafDefinition,
  localizeBusinessCategory
} from "../../lib/business-categories";

const commonCopy = {
  uz: {
    eyebrow: "MANZIL · TOSHKENT",
    allCategories: "Barcha kategoriyalar",
    browse: "Kategoriyalarni ko'rish",
    searchPlaceholder: "Joy yoki xizmatni qidiring",
    search: "Qidirish",
    viewAll: "Barcha joylarni ko'rish",
    browseAll: "Barchasini ko'rish",
    places: "joylar",
    inTashkent: "Toshkentda",
    noPlacesTitle: "Bu bo'limga hali joylar qo'shilmagan",
    noPlacesBody: "Sahifa tayyor. Ishonchli joylar qo'shilganda manzil, ish vaqti, narx va sharhlar shu yerda ko'rinadi.",
    suggest: "Joy qo'shishni taklif qilish",
    discover: "Mavjud katalogni ko'rish",
    askTitle: "Mahalliylardan so'rang",
    askBody: "Siz biladigan joy bu ro'yxatda yo'qmi? Uni tavsiya qiling yoki biznes egasiga sahifa ochish imkonini bering.",
    related: "O'xshash kategoriyalar"
  },
  ru: {
    eyebrow: "MANZIL · ТАШКЕНТ",
    allCategories: "Все категории",
    browse: "Категории",
    searchPlaceholder: "Найти место или услугу",
    search: "Найти",
    viewAll: "Посмотреть все места",
    browseAll: "Открыть всё",
    places: "мест",
    inTashkent: "в Ташкенте",
    noPlacesTitle: "В этом разделе пока нет мест",
    noPlacesBody: "Страница готова. Когда появятся подтверждённые места, здесь будут адрес, часы, цены и отзывы.",
    suggest: "Предложить место",
    discover: "Открыть текущий каталог",
    askTitle: "Спросите местных",
    askBody: "Не нашли знакомое место? Предложите его или помогите владельцу открыть страницу.",
    related: "Похожие категории"
  },
  en: {
    eyebrow: "MANZIL · TASHKENT",
    allCategories: "All categories",
    browse: "Browse categories",
    searchPlaceholder: "Search a place or service",
    search: "Search",
    viewAll: "View all places",
    browseAll: "Browse all",
    places: "places",
    inTashkent: "in Tashkent",
    noPlacesTitle: "No places listed here yet",
    noPlacesBody: "The page is ready. Once trusted places are added, this is where you will see addresses, hours, prices, and reviews.",
    suggest: "Suggest a place",
    discover: "Browse the current catalog",
    askTitle: "Ask locals",
    askBody: "Know a place that is missing? Suggest it or help the owner create a page.",
    related: "Related categories"
  }
} as const;

function SearchForm({ locale, action, query = "" }: { locale: Locale; action: string; query?: string }) {
  const copy = commonCopy[locale];

  return (
    <form className="travel-search" action={action} method="get" role="search">
      <Icon aria-hidden="true" className="travel-search__icon" name="search" size={19} />
      <input aria-label={copy.searchPlaceholder} defaultValue={query} name="q" placeholder={copy.searchPlaceholder} type="search" />
      <button type="submit">{copy.search}</button>
    </form>
  );
}

function CategoryIcon({ icon, accent }: { icon: GroupDefinition["icon"]; accent: string }) {
  return (
    <span className="travel-category-card__icon" style={{ "--travel-accent": accent } as CSSProperties}>
      <Icon aria-hidden="true" name={icon} size={21} />
    </span>
  );
}

function GroupCard({ group, locale }: { group: GroupDefinition; locale: Locale }) {
  return (
    <Link
      className="travel-category-card"
      href={`/${locale}/categories/${group.rootSlug}`}
      style={{ "--travel-accent": group.accent } as CSSProperties}
    >
      <CategoryIcon accent={group.accent} icon={group.icon} />
      <span className="travel-category-card__body">
        <strong>{localizeBusinessCategory(group.label, locale)}</strong>
        <span>{localizeBusinessCategory(group.description, locale)}</span>
      </span>
      <Icon aria-hidden="true" className="travel-category-card__arrow" name="arrow_forward" size={17} />
    </Link>
  );
}

function LeafCard({ category, group, locale }: { category: LeafDefinition; group: GroupDefinition; locale: Locale }) {
  return (
    <Link
      className="travel-category-card"
      href={`/${locale}/categories/${group.rootSlug}/${category.slug}`}
      style={{ "--travel-accent": category.color ?? group.accent } as CSSProperties}
    >
      <CategoryIcon accent={category.color ?? group.accent} icon={category.icon ?? "circle"} />
      <span className="travel-category-card__body">
        <strong>{localizeBusinessCategory(category.label, locale)}</strong>
        <span>{localizeBusinessCategory(group.description, locale)}</span>
      </span>
      <Icon aria-hidden="true" className="travel-category-card__arrow" name="arrow_forward" size={17} />
    </Link>
  );
}

function EmptyPlaces({ locale }: { locale: Locale }) {
  const copy = commonCopy[locale];
  return (
    <div className="travel-empty-state">
      <span className="travel-empty-state__icon" aria-hidden="true"><Icon name="compass" size={28} /></span>
      <h2>{copy.noPlacesTitle}</h2>
      <p>{copy.noPlacesBody}</p>
      <div className="travel-empty-state__actions">
        <Link className="travel-button travel-button--primary" href={`/${locale}/business/register`}>
          {copy.suggest}<Icon aria-hidden="true" name="arrow_forward" size={17} />
        </Link>
        <Link className="travel-button travel-button--ghost" href={`/${locale}/discover`}>{copy.discover}</Link>
      </div>
    </div>
  );
}

function CommunityPrompt({ locale }: { locale: Locale }) {
  const copy = commonCopy[locale];
  return (
    <section className="travel-community-card" aria-labelledby="category-community-title">
      <div className="travel-community-card__icon" aria-hidden="true"><Icon name="users" size={24} /></div>
      <div>
        <p className="travel-kicker">{copy.askTitle}</p>
        <h2 id="category-community-title">{copy.askTitle}</h2>
        <p>{copy.askBody}</p>
      </div>
      <Link className="travel-button travel-button--light" href={`/${locale}/business/register`}>
        {copy.suggest}<Icon aria-hidden="true" name="arrow_forward" size={17} />
      </Link>
    </section>
  );
}

function Results({ locale, businesses }: { locale: Locale; businesses: BusinessPlatform[] }) {
  if (businesses.length === 0) return <EmptyPlaces locale={locale} />;
  return (
    <div className="travel-business-grid">
      {businesses.map((business) => <MarketplaceCard business={business} key={business.slug} locale={locale} />)}
    </div>
  );
}

export function BusinessCategoriesHub({ locale }: { locale: Locale }) {
  const copy = commonCopy[locale];
  return (
    <div className="travel-page">
      <section className="travel-hero travel-hero--hub">
        <div className="container travel-hero__inner">
          <div className="travel-hero__copy">
            <p className="travel-kicker">{copy.eyebrow}</p>
            <h1>{copy.allCategories}</h1>
            <p className="travel-hero__lead">{locale === "uz" ? "Toshkentdagi biznes va xizmatlarni yo'nalish bo'yicha toping." : locale === "ru" ? "Находите бизнесы и услуги Ташкента по категориям." : "Find Tashkent businesses and services by category."}</p>
            <SearchForm locale={locale} action={`/${locale}/categories/places`} />
          </div>
          <div className="travel-hero__note">
            <span className="travel-hero__note-icon" aria-hidden="true"><Icon name="grid" size={30} /></span>
            <strong>{BUSINESS_CATEGORY_GROUPS.length}</strong>
            <span>{copy.browse}</span>
          </div>
        </div>
      </section>
      <main className="container travel-content">
        <section className="travel-section" aria-labelledby="all-category-groups-title">
          <div className="travel-section__heading"><div><p className="travel-kicker">{copy.browse}</p><h2 id="all-category-groups-title">{copy.allCategories}</h2></div></div>
          <div className="travel-category-grid">{BUSINESS_CATEGORY_GROUPS.map((group) => <GroupCard group={group} key={group.rootSlug} locale={locale} />)}</div>
        </section>
        <CommunityPrompt locale={locale} />
      </main>
    </div>
  );
}

export function BusinessCategoryGroupPage({ group, locale, businesses }: { group: GroupDefinition; locale: Locale; businesses: BusinessPlatform[] }) {
  const copy = commonCopy[locale];
  const title = localizeBusinessCategory(group.label, locale);
  return (
    <div className="travel-page">
      <section className="travel-hero travel-hero--category" style={{ "--travel-accent": group.accent } as CSSProperties}>
        <div className="container travel-hero__inner">
          <div className="travel-hero__copy">
            <Link className="travel-back-link" href={`/${locale}/categories`}><Icon aria-hidden="true" name="arrow_back" size={16} />{copy.allCategories}</Link>
            <p className="travel-kicker">{copy.eyebrow}</p>
            <h1>{title}</h1>
            <p className="travel-hero__lead">{localizeBusinessCategory(group.description, locale)}</p>
            <SearchForm locale={locale} action={`/${locale}/categories/${group.rootSlug}/places`} />
          </div>
          <div className="travel-hero__category-mark" aria-hidden="true"><CategoryIcon accent={group.accent} icon={group.icon} /></div>
        </div>
      </section>
      <main className="container travel-content">
        <section className="travel-section" aria-labelledby="category-leaves-title">
          <div className="travel-section__heading"><div><p className="travel-kicker">{copy.browse}</p><h2 id="category-leaves-title">{title}</h2></div><Link className="travel-inline-link" href={`/${locale}/categories/${group.rootSlug}/places`}>{copy.viewAll}<Icon aria-hidden="true" name="arrow_forward" size={16} /></Link></div>
          <div className="travel-category-grid">{group.categories.map((category) => <LeafCard category={category} group={group} key={category.slug} locale={locale} />)}</div>
        </section>
        <section className="travel-results" aria-labelledby="category-results-title">
          <div className="travel-section__heading"><div><p className="travel-kicker">{copy.inTashkent}</p><h2 id="category-results-title">{title} {copy.places}</h2></div><span className="travel-result-count">{businesses.length}</span></div>
          <Results businesses={businesses} locale={locale} />
        </section>
        <CommunityPrompt locale={locale} />
      </main>
    </div>
  );
}

export function BusinessCategoryLeafPage({ group, category, locale, businesses }: { group: GroupDefinition; category: LeafDefinition; locale: Locale; businesses: BusinessPlatform[] }) {
  const copy = commonCopy[locale];
  const title = localizeBusinessCategory(category.label, locale);
  const related = group.categories.filter((item) => item.slug !== category.slug).slice(0, 6);
  return (
    <div className="travel-page">
      <section className="travel-hero travel-hero--category" style={{ "--travel-accent": category.color ?? group.accent } as CSSProperties}>
        <div className="container travel-hero__inner">
          <div className="travel-hero__copy">
            <Link className="travel-back-link" href={`/${locale}/categories/${group.rootSlug}`}><Icon aria-hidden="true" name="arrow_back" size={16} />{localizeBusinessCategory(group.label, locale)}</Link>
            <p className="travel-kicker">{copy.eyebrow}</p>
            <h1>{title}</h1>
            <p className="travel-hero__lead">{localizeBusinessCategory(group.description, locale)}</p>
            <SearchForm locale={locale} action={`/${locale}/categories/${group.rootSlug}/${category.slug}`} />
          </div>
          <div className="travel-hero__category-mark" aria-hidden="true"><CategoryIcon accent={category.color ?? group.accent} icon={category.icon ?? "circle"} /></div>
        </div>
      </section>
      <main className="container travel-content">
        <section className="travel-results" aria-labelledby="leaf-results-title">
          <div className="travel-section__heading"><div><p className="travel-kicker">{copy.inTashkent}</p><h2 id="leaf-results-title">{title} {copy.places}</h2></div><span className="travel-result-count">{businesses.length}</span></div>
          <Results businesses={businesses} locale={locale} />
        </section>
        <section className="travel-related" aria-labelledby="related-category-title">
          <div className="travel-section__heading"><div><p className="travel-kicker">{copy.browse}</p><h2 id="related-category-title">{copy.related}</h2></div></div>
          <div className="travel-related-grid">{related.map((item) => <LeafCard category={item} group={group} key={item.slug} locale={locale} />)}</div>
        </section>
        <CommunityPrompt locale={locale} />
      </main>
    </div>
  );
}

export function BusinessCategoryPlacesPage({ group, locale, businesses, query = "" }: { group: GroupDefinition; locale: Locale; businesses: BusinessPlatform[]; query?: string }) {
  const copy = commonCopy[locale];
  const title = localizeBusinessCategory(group.label, locale);
  return (
    <div className="travel-page">
      <section className="travel-hero travel-hero--category">
        <div className="container travel-hero__inner">
          <div className="travel-hero__copy">
            <Link className="travel-back-link" href={`/${locale}/categories/${group.rootSlug}`}><Icon aria-hidden="true" name="arrow_back" size={16} />{title}</Link>
            <p className="travel-kicker">{copy.eyebrow}</p>
            <h1>{copy.viewAll}</h1>
            <p className="travel-hero__lead">{localizeBusinessCategory(group.description, locale)}</p>
            <SearchForm locale={locale} action={`/${locale}/categories/${group.rootSlug}/places`} query={query} />
          </div>
          <div className="travel-hero__category-mark" aria-hidden="true"><Icon name="grid" size={34} /></div>
        </div>
      </section>
      <main className="container travel-content">
        <section className="travel-results" aria-labelledby="all-group-results-title">
          <div className="travel-section__heading"><div><p className="travel-kicker">{copy.inTashkent}</p><h2 id="all-group-results-title">{title}</h2></div><span className="travel-result-count">{businesses.length}</span></div>
          <Results businesses={businesses} locale={locale} />
        </section>
        <section className="travel-section" aria-labelledby="all-group-categories-title">
          <div className="travel-section__heading"><div><p className="travel-kicker">{copy.browse}</p><h2 id="all-group-categories-title">{title}</h2></div></div>
          <div className="travel-category-grid">{group.categories.map((category) => <LeafCard category={category} group={group} key={category.slug} locale={locale} />)}</div>
        </section>
        <CommunityPrompt locale={locale} />
      </main>
    </div>
  );
}

export function BusinessCategoriesPlacesPage({ locale, businesses, query = "" }: { locale: Locale; businesses: BusinessPlatform[]; query?: string }) {
  const copy = commonCopy[locale];
  return (
    <div className="travel-page">
      <section className="travel-hero travel-hero--category">
        <div className="container travel-hero__inner">
          <div className="travel-hero__copy">
            <Link className="travel-back-link" href={`/${locale}/categories`}><Icon aria-hidden="true" name="arrow_back" size={16} />{copy.allCategories}</Link>
            <p className="travel-kicker">{copy.eyebrow}</p>
            <h1>{copy.viewAll}</h1>
            <p className="travel-hero__lead">{locale === "uz" ? "Toshkentdagi barcha mavjud katalog yozuvlari." : locale === "ru" ? "Все доступные записи каталога Ташкента." : "All currently available catalog listings in Tashkent."}</p>
            <SearchForm locale={locale} action={`/${locale}/categories/places`} query={query} />
          </div>
          <div className="travel-hero__category-mark" aria-hidden="true"><Icon name="grid" size={34} /></div>
        </div>
      </section>
      <main className="container travel-content">
        <section className="travel-results" aria-labelledby="all-places-results-title">
          <div className="travel-section__heading"><div><p className="travel-kicker">{copy.inTashkent}</p><h2 id="all-places-results-title">{copy.viewAll}</h2></div><span className="travel-result-count">{businesses.length}</span></div>
          <Results businesses={businesses} locale={locale} />
        </section>
        <section className="travel-section" aria-labelledby="all-places-categories-title">
          <div className="travel-section__heading"><div><p className="travel-kicker">{copy.browse}</p><h2 id="all-places-categories-title">{copy.allCategories}</h2></div></div>
          <div className="travel-category-grid">{BUSINESS_CATEGORY_GROUPS.map((group) => <GroupCard group={group} key={group.rootSlug} locale={locale} />)}</div>
        </section>
        <CommunityPrompt locale={locale} />
      </main>
    </div>
  );
}
