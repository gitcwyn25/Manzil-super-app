"use client";

import type { BusinessPlatform, Category, Locale } from "@manzil/shared";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import {
  BUSINESS_CATEGORY_PARENT_BY_SLUG,
  CategoryStrip,
  MARKETPLACE_CATEGORIES,
  MARKETPLACE_PARENT_CATEGORY_SLUGS
} from "./category-strip";
import { DiscoverHero } from "./discover-hero";
import { DiscoverPosterCarousel } from "./poster-carousel";
import { ExploreTashkentCompact } from "./explore-tashkent-compact";
import { MarketplaceEmptyState } from "./marketplace-states";
import { MarketplaceFilterSidebar, type FilterState } from "./marketplace-filter-sidebar";
import { MarketplaceMobileFilterDrawer } from "./marketplace-mobile-filter-drawer";
import { ResultsGrid } from "./results-grid";
import { DotPattern } from "../../../components/ui/dot-pattern";

function isPresentableBusiness(business: BusinessPlatform): boolean {
  const searchable = [
    business.name,
    business.description?.uz,
    business.description?.ru,
    business.description?.en
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  // Keep explicit test fixtures out of the public discovery experience.
  return !searchable.includes("synthetic qa") && !searchable.includes("e2e sample business");
}

function isOpenNow(hours: string | null | undefined): boolean | null {
  if (!hours) {
    return null;
  }

  const match = hours.match(/(\\d{1,2}):(\\d{2})\\s*[-–—]\\s*(\\d{1,2}):(\\d{2})/);
  if (!match) {
    return null;
  }

  const [, startHour, startMinute, endHour, endMinute] = match;
  const nowParts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Tashkent",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23"
  }).formatToParts(new Date());
  const nowHour = Number(nowParts.find((part) => part.type === "hour")?.value);
  const nowMinute = Number(nowParts.find((part) => part.type === "minute")?.value);
  const current = nowHour * 60 + nowMinute;
  const start = Number(startHour) * 60 + Number(startMinute);
  const end = Number(endHour) * 60 + Number(endMinute);

  if (![current, start, end].every(Number.isFinite)) {
    return null;
  }

  return start <= end ? current >= start && current < end : current >= start || current < end;
}

export function MarketplaceClient({
  locale,
  initialBusinesses,
  categories
}: {
  locale: Locale;
  initialBusinesses: BusinessPlatform[];
  categories: Category[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Read initial states from URL params
  const initialCategory = searchParams.get("category") || "all";
  const initialDistrict = searchParams.get("district") || "all";
  const initialQuery = searchParams.get("q") || "";
  const initialSort = searchParams.get("sort") || "recommended";
  const initialRating = Number(searchParams.get("rating")) || 0;
  const initialPrice = searchParams.get("price") || "all";
  const initialVerified = searchParams.get("verified") === "true";
  const initialOpenNow = searchParams.get("opennow") === "true";

  const presentableBusinesses = useMemo(
    () => initialBusinesses.filter(isPresentableBusiness),
    [initialBusinesses]
  );

  const categoryNames = useMemo(
    () =>
      Object.fromEntries(
        categories.map((category) => [
          category.slug,
          category.name[locale] ?? category.name.uz
        ])
      ),
    [categories, locale]
  );

  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  const [filters, setFilters] = useState<FilterState>({
    category: initialCategory,
    district: initialDistrict,
    ratingMin: initialRating,
    priceTier: initialPrice,
    verifiedOnly: initialVerified,
    openNowOnly: initialOpenNow,
    sortBy: initialSort
  });

  // Sync state with URL without full page reload
  const updateUrlParams = (newFilters: Partial<FilterState>, newQuery?: string) => {
    const params = new URLSearchParams(searchParams.toString());
    const q = newQuery !== undefined ? newQuery : searchQuery;
    if (q) params.set("q", q);
    else params.delete("q");

    const merged = { ...filters, ...newFilters };
    if (merged.category && merged.category !== "all") params.set("category", merged.category);
    else params.delete("category");

    if (merged.district && merged.district !== "all") params.set("district", merged.district);
    else params.delete("district");

    if (merged.ratingMin > 0) params.set("rating", String(merged.ratingMin));
    else params.delete("rating");

    if (merged.priceTier && merged.priceTier !== "all") params.set("price", merged.priceTier);
    else params.delete("price");

    if (merged.verifiedOnly) params.set("verified", "true");
    else params.delete("verified");

    if (merged.openNowOnly) params.set("opennow", "true");
    else params.delete("opennow");

    if (merged.sortBy && merged.sortBy !== "recommended") params.set("sort", merged.sortBy);
    else params.delete("sort");

    const qs = params.toString();
    router.replace(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
  };

  const handleFilterChange = (updates: Partial<FilterState>) => {
    const next = { ...filters, ...updates };
    setFilters(next);
    updateUrlParams(updates);
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    const resetState: FilterState = {
      category: "all",
      district: "all",
      ratingMin: 0,
      priceTier: "all",
      verifiedOnly: false,
      openNowOnly: false,
      sortBy: "recommended"
    };
    setFilters(resetState);
    router.replace(pathname, { scroll: false });
  };

  const handleCategorySelect = (categorySlug: string) => {
    if (categorySlug === "all") {
      router.push(`/${locale}/categories`);
      return;
    }

    const groupSlug = BUSINESS_CATEGORY_PARENT_BY_SLUG[categorySlug] ?? categorySlug;
    const destination = categorySlug === groupSlug
      ? `/${locale}/categories/${groupSlug}`
      : `/${locale}/categories/${groupSlug}/${categorySlug}`;
    router.push(destination);
  };

  // Filter and Sort Engine
  const filteredAndSortedBusinesses = useMemo(() => {
    let result = [...presentableBusinesses];

    // 1. Text Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((b) => {
        const name = b.name.toLowerCase();
        const district = (b.district || "").toLowerCase();
        const descUz = (b.description?.uz || "").toLowerCase();
        const descRu = (b.description?.ru || "").toLowerCase();
        const descEn = (b.description?.en || "").toLowerCase();
        const tags = (b.tags || []).map((t) => t.toLowerCase());
        return (
          name.includes(q) ||
          district.includes(q) ||
          descUz.includes(q) ||
          descRu.includes(q) ||
          descEn.includes(q) ||
          tags.some((t) => t.includes(q))
        );
      });
    }

    // 2. Category Filter
    if (filters.category !== "all") {
      result = result.filter((b) => {
        if (filters.category === "restaurants") {
          return b.categorySlug === "restaurants" || b.name.toLowerCase().includes("osh") || b.name.toLowerCase().includes("taom");
        }
        if (filters.category === "cafes") {
          return b.categorySlug === "cafes" || b.name.toLowerCase().includes("kafe") || b.name.toLowerCase().includes("cafe");
        }
        if (filters.category === "auto") {
          return b.categorySlug === "auto" || b.name.toLowerCase().includes("moyka") || b.name.toLowerCase().includes("avto");
        }
        const parentCategorySlugs = MARKETPLACE_PARENT_CATEGORY_SLUGS[filters.category];
        if (parentCategorySlugs) {
          return parentCategorySlugs.includes(b.categorySlug || "");
        }
        return b.categorySlug === filters.category;
      });
    }

    // 3. District Filter
    if (filters.district !== "all") {
      result = result.filter((b) => b.district === filters.district);
    }

    // 4. Rating Filter
    if (filters.ratingMin > 0) {
      result = result.filter((b) => (b.avgRating || 0) >= filters.ratingMin);
    }

    // 5. Price Tier Filter
    if (filters.priceTier !== "all") {
      result = result.filter((b) => b.priceTier === filters.priceTier);
    }

    // 6. Verified Only
    if (filters.verifiedOnly) {
      result = result.filter((b) => b.status === "claimed" || Boolean(b.foundingBusiness));
    }

    // 7. Open-now filter. Unknown or malformed hours are excluded rather than
    // being presented as currently open.
    if (filters.openNowOnly) {
      result = result.filter((b) => isOpenNow(b.hours) === true);
    }

    // 8. Sorting
    if (filters.sortBy === "rating") {
      result.sort((a, b) => (b.avgRating || 0) - (a.avgRating || 0));
    } else if (filters.sortBy === "reviews") {
      result.sort((a, b) => (b.reviewCount || 0) - (a.reviewCount || 0));
    } else if (filters.sortBy === "newest") {
      result.sort((a, b) => (b.foundingBusiness ? 1 : -1));
    }

    return result;
  }, [presentableBusinesses, searchQuery, filters]);

  const totalCount = filteredAndSortedBusinesses.length;

  // Active filter badges
  const activeChips = useMemo(() => {
    const list: { id: string; label: string; onRemove: () => void }[] = [];

    if (searchQuery) {
      list.push({
        id: "q",
        label: `"${searchQuery}"`,
        onRemove: () => {
          setSearchQuery("");
          updateUrlParams({}, "");
        }
      });
    }

    if (filters.category !== "all") {
      const catObj = MARKETPLACE_CATEGORIES.find((c) => c.slug === filters.category);
      list.push({
        id: "cat",
        label: catObj ? catObj.name[locale] ?? catObj.name.en : filters.category,
        onRemove: () => handleFilterChange({ category: "all" })
      });
    }

    if (filters.district !== "all") {
      list.push({
        id: "dist",
        label: `📍 ${filters.district}`,
        onRemove: () => handleFilterChange({ district: "all" })
      });
    }

    if (filters.ratingMin > 0) {
      list.push({
        id: "rate",
        label: `⭐ ${filters.ratingMin}+`,
        onRemove: () => handleFilterChange({ ratingMin: 0 })
      });
    }

    if (filters.priceTier !== "all") {
      list.push({
        id: "price",
        label: `💰 ${filters.priceTier}`,
        onRemove: () => handleFilterChange({ priceTier: "all" })
      });
    }

    if (filters.verifiedOnly) {
      list.push({
        id: "ver",
        label: "🛡️ Verified",
        onRemove: () => handleFilterChange({ verifiedOnly: false })
      });
    }

    if (filters.openNowOnly) {
      list.push({
        id: "open",
        label: "🟢 Open Now",
        onRemove: () => handleFilterChange({ openNowOnly: false })
      });
    }

    return list;
  }, [searchQuery, filters, locale]);

  const sortValue = filters.sortBy === "rating" ? "rating" : "recommended";
  const resultsTitle = searchQuery
    ? locale === "uz"
      ? "Qidiruv natijalari"
      : locale === "ru"
      ? "Результаты поиска"
      : "Search results"
    : locale === "uz"
    ? "Toshkentdagi maskanlar"
    : locale === "ru"
    ? "Места в Ташкенте"
    : "Places in Tashkent";
  const sortLabel = locale === "uz" ? "Saralash" : locale === "ru" ? "Сортировка" : "Sort by";
  const recommendedLabel = locale === "uz" ? "Tavsiya etilgan" : locale === "ru" ? "Рекомендуемые" : "Recommended";
  const ratingLabel = locale === "uz" ? "Eng yuqori baho" : locale === "ru" ? "Высокий рейтинг" : "Highest rated";
  const filterLabel = locale === "uz" ? "Filtrlar" : locale === "ru" ? "Фильтры" : "Filters";

  return (
    <div className="discover-marketplace-root">
      <DotPattern
        className="discover-dot-pattern"
        width={24}
        height={24}
        x={1}
        y={1}
        cx={1}
        cy={1}
        cr={0.9}
      />
      <div className="discover-marketplace-content">
        {/* 1–3. Full-bleed editorial hero: poster background with search and categories layered on top. */}
        <DiscoverPosterCarousel locale={locale}>
          <DiscoverHero
            locale={locale}
            onSearchChange={setSearchQuery}
            onSearchSubmit={(query) => updateUrlParams({}, query)}
            searchQuery={searchQuery}
          />

          <CategoryStrip
            locale={locale}
            onSelectCategory={handleCategorySelect}
            onViewAll={() => router.push(`/${locale}/categories/places`)}
            selectedCategory={filters.category}
          />
        </DiscoverPosterCarousel>

        <section aria-labelledby="discover-results-title" className="mp-results-section">
          <div className="mp-mobile-filter-bar">
            <button
              className="mp-mobile-filter-btn"
              onClick={() => setIsMobileDrawerOpen(true)}
              type="button"
            >
              <span>{filterLabel}</span>
              {activeChips.length > 0 ? (
                <span className="mp-mobile-filter-count">{activeChips.length}</span>
              ) : null}
            </button>
            <label className="mp-sort-dropdown">
              <span className="sr-only">{sortLabel}</span>
              <select
                aria-label={sortLabel}
                className="mp-mobile-sort-select"
                onChange={(event) => handleFilterChange({ sortBy: event.target.value })}
                value={sortValue}
              >
                <option value="recommended">{recommendedLabel}</option>
                <option value="rating">{ratingLabel}</option>
              </select>
            </label>
          </div>

          {activeChips.length > 0 ? (
            <div className="mp-active-filters-row">
              <span className="mp-active-filters-label">{filterLabel}:</span>
              <div className="mp-active-chips-list">
                {activeChips.map((chip) => (
                  <button className="mp-active-chip" key={chip.id} onClick={chip.onRemove} type="button">
                    <span>{chip.label}</span>
                    <span aria-hidden="true" className="mp-active-chip__remove">×</span>
                  </button>
                ))}
                <button className="mp-clear-all-btn" onClick={handleResetFilters} type="button">
                  {locale === "uz" ? "Barchasini tozalash" : locale === "ru" ? "Сбросить всё" : "Clear all"}
                </button>
              </div>
            </div>
          ) : null}

          <div className="mp-results-header">
            <div className="mp-results-header__left">
              <h2 className="mp-results-header__title" id="discover-results-title">{resultsTitle}</h2>
              <span className="mp-results-header__count">
                {locale === "uz" ? `${totalCount} ta natija` : locale === "ru" ? `Найдено: ${totalCount}` : `${totalCount} results`}
              </span>
            </div>
            <label className="mp-sort-dropdown d-none d-sm-flex">
              <span className="mp-sort-dropdown__label">{sortLabel}:</span>
              <select
                aria-label={sortLabel}
                className="mp-sort-select"
                onChange={(event) => handleFilterChange({ sortBy: event.target.value })}
                value={sortValue}
              >
                <option value="recommended">{recommendedLabel}</option>
                <option value="rating">{ratingLabel}</option>
              </select>
            </label>
          </div>

          <div className="mp-layout-grid">
            <MarketplaceFilterSidebar
              filters={filters}
              locale={locale}
              onFilterChange={handleFilterChange}
              onResetFilters={handleResetFilters}
              totalCount={totalCount}
            />
            <div className="mp-cards-area">
              {totalCount > 0 ? (
                <ResultsGrid
                  businesses={filteredAndSortedBusinesses}
                  categoryNames={categoryNames}
                  loadMoreLabel={locale === "uz" ? "Yana ko'rsatish" : locale === "ru" ? "Показать ещё" : "Load more"}
                  locale={locale}
                />
              ) : (
                <MarketplaceEmptyState locale={locale} onResetFilters={handleResetFilters} />
              )}
            </div>
          </div>
        </section>

        <MarketplaceMobileFilterDrawer
          filters={filters}
          isOpen={isMobileDrawerOpen}
          locale={locale}
          onClose={() => setIsMobileDrawerOpen(false)}
          onFilterChange={handleFilterChange}
          onResetFilters={handleResetFilters}
          totalCount={totalCount}
        />

        {/* Compact Explore Tashkent Cultural & Heritage Showcase */}
        <ExploreTashkentCompact locale={locale} />
      </div>
    </div>
  );
}
