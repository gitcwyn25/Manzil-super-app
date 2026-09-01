"use client";

import type { BusinessPlatform, Category, Locale } from "@manzil/shared";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { CategoryStrip, MARKETPLACE_CATEGORIES } from "./category-strip";
import { CuratedSections } from "./curated-sections";
import { DiscoverHero } from "./discover-hero";
import { ExploreTashkentCompact } from "./explore-tashkent-compact";
import { MarketplaceCard } from "./marketplace-card";
import { MarketplaceFilterSidebar, type FilterState, TASHKENT_DISTRICTS } from "./marketplace-filter-sidebar";
import { MarketplaceMobileFilterDrawer } from "./marketplace-mobile-filter-drawer";
import { MarketplaceEmptyState } from "./marketplace-states";

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

  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [activeQuickChip, setActiveQuickChip] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(12);

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
    setFilters((prev) => {
      const next = { ...prev, ...updates };
      updateUrlParams(updates);
      return next;
    });
  };

  const handleQuickChipToggle = (chipKey: string) => {
    if (activeQuickChip === chipKey) {
      setActiveQuickChip(null);
      if (chipKey === "top_rated") handleFilterChange({ ratingMin: 0 });
      if (chipKey === "verified") handleFilterChange({ verifiedOnly: false });
      if (chipKey === "open_now") handleFilterChange({ openNowOnly: false });
    } else {
      setActiveQuickChip(chipKey);
      if (chipKey === "top_rated") handleFilterChange({ ratingMin: 4.8 });
      if (chipKey === "verified") handleFilterChange({ verifiedOnly: true });
      if (chipKey === "open_now") handleFilterChange({ openNowOnly: true });
    }
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setActiveQuickChip(null);
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

  // Filter and Sort Engine
  const filteredAndSortedBusinesses = useMemo(() => {
    let result = [...initialBusinesses];

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

    // 7. Sorting
    if (filters.sortBy === "rating") {
      result.sort((a, b) => (b.avgRating || 0) - (a.avgRating || 0));
    } else if (filters.sortBy === "reviews") {
      result.sort((a, b) => (b.reviewCount || 0) - (a.reviewCount || 0));
    } else if (filters.sortBy === "newest") {
      result.sort((a, b) => (b.foundingBusiness ? 1 : -1));
    }

    return result;
  }, [initialBusinesses, searchQuery, filters]);

  const displayedBusinesses = filteredAndSortedBusinesses.slice(0, visibleCount);
  const totalCount = filteredAndSortedBusinesses.length;
  const hasMore = visibleCount < totalCount;

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

  return (
    <div className="discover-marketplace-root">
      {/* 1. Compact Discovery Hero */}
      <DiscoverHero
        activeQuickChip={activeQuickChip}
        locale={locale}
        onQuickChipToggle={handleQuickChipToggle}
        onSearchChange={setSearchQuery}
        onSearchSubmit={() => updateUrlParams({})}
        searchQuery={searchQuery}
      />

      {/* 2. Responsive 9-Category Discovery Strip */}
      <CategoryStrip
        locale={locale}
        onSelectCategory={(catSlug) => handleFilterChange({ category: catSlug })}
        selectedCategory={filters.category}
      />

      {/* 3. Curated Sections: Best of Tashkent & Weekend Highlights (Shows on default view) */}
      {!searchQuery && filters.category === "all" && filters.district === "all" && (
        <CuratedSections businesses={initialBusinesses} locale={locale} />
      )}

      {/* 4. Main Marketplace Results Area with Filter Sidebar */}
      <section className="mp-results-section container" id="results" aria-label="Natijalar">
        {/* Mobile Sticky Filter / Sort Bar */}
        <div className="mp-mobile-filter-bar">
          <button
            className="mp-mobile-filter-btn"
            onClick={() => setIsMobileDrawerOpen(true)}
            type="button"
          >
            <span>⚙️</span>
            <span>{locale === "uz" ? "Filtrlar" : locale === "ru" ? "Фильтры" : "Filters"}</span>
            {activeChips.length > 0 && <span className="mp-mobile-filter-count">{activeChips.length}</span>}
          </button>

          <select
            aria-label="Tartiblash"
            className="mp-mobile-sort-select"
            onChange={(e) => handleFilterChange({ sortBy: e.target.value })}
            value={filters.sortBy}
          >
            <option value="recommended">{locale === "uz" ? "Tavsiya etilgan" : "Recommended"}</option>
            <option value="rating">{locale === "uz" ? "Reyting bo'yicha" : "Highest Rating"}</option>
            <option value="reviews">{locale === "uz" ? "Eng ko'p sharh" : "Most Reviews"}</option>
            <option value="newest">{locale === "uz" ? "Yangi qo'shilganlar" : "Newest"}</option>
          </select>
        </div>

        {/* Results Header Toolbar (Desktop & Mobile) */}
        <div className="mp-results-header">
          <div className="mp-results-header__left">
            <h2 className="mp-results-header__title">
              {locale === "uz"
                ? "Toshkentdagi tasdiqlangan maskanlar"
                : locale === "ru"
                ? "Проверенные места в Ташкенте"
                : "Verified Places in Tashkent"}
            </h2>
            <span className="mp-results-header__count">
              ({totalCount} {locale === "uz" ? "ta maskan" : locale === "ru" ? "мест" : "places"})
            </span>
          </div>

          <div className="mp-results-header__controls d-none d-md-flex">
            {/* Sort Selector */}
            <div className="mp-sort-dropdown">
              <span className="mp-sort-dropdown__label">
                {locale === "uz" ? "Saralash:" : locale === "ru" ? "Сортировка:" : "Sort by:"}
              </span>
              <select
                aria-label="Saralash"
                className="mp-sort-select"
                onChange={(e) => handleFilterChange({ sortBy: e.target.value })}
                value={filters.sortBy}
              >
                <option value="recommended">{locale === "uz" ? "Tavsiya etilgan" : "Recommended"}</option>
                <option value="rating">{locale === "uz" ? "Reyting (Yuqori)" : "Rating: High to Low"}</option>
                <option value="reviews">{locale === "uz" ? "Ko'p sharhlar" : "Most Reviewed"}</option>
                <option value="newest">{locale === "uz" ? "Yangi maskanlar" : "Newest"}</option>
              </select>
            </div>

            {/* View Mode Toggle (Grid / List) */}
            <div className="mp-view-toggle">
              <button
                aria-label="Grid ko'rinishi"
                className={`mp-view-btn ${viewMode === "grid" ? "is-active" : ""}`}
                onClick={() => setViewMode("grid")}
                type="button"
              >
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                  <path d="M3 3h8v8H3V3zm10 0h8v8h-8V3zM3 13h8v8H3v-8zm10 0h8v8h-8v-8z" />
                </svg>
              </button>
              <button
                aria-label="Ro'yxat ko'rinishi"
                className={`mp-view-btn ${viewMode === "list" ? "is-active" : ""}`}
                onClick={() => setViewMode("list")}
                type="button"
              >
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                  <path d="M4 6h16v2H4V6zm0 5h16v2H4v-2zm0 5h16v2H4v-2z" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Active Filter Removable Chips */}
        {activeChips.length > 0 && (
          <div className="mp-active-filters-row">
            <span className="mp-active-filters-label">
              {locale === "uz" ? "Faol filtrlar:" : locale === "ru" ? "Активные:" : "Active:"}
            </span>
            <div className="mp-active-chips-list">
              {activeChips.map((chip) => (
                <button
                  key={chip.id}
                  className="mp-active-chip"
                  onClick={chip.onRemove}
                  title="O'chirish"
                  type="button"
                >
                  <span>{chip.label}</span>
                  <span className="mp-active-chip__remove">✕</span>
                </button>
              ))}
              <button className="mp-clear-all-btn" onClick={handleResetFilters} type="button">
                {locale === "uz" ? "Barchasini tozalash" : locale === "ru" ? "Очистить всё" : "Clear all"}
              </button>
            </div>
          </div>
        )}

        {/* Two-Column Marketplace Layout */}
        <div className="mp-layout-grid">
          {/* Left Desktop Filter Sidebar */}
          <MarketplaceFilterSidebar
            filters={filters}
            locale={locale}
            onFilterChange={handleFilterChange}
            onResetFilters={handleResetFilters}
            totalCount={totalCount}
          />

          {/* Right Cards Results Grid */}
          <main className="mp-cards-area">
            {totalCount === 0 ? (
              <MarketplaceEmptyState locale={locale} onResetFilters={handleResetFilters} />
            ) : (
              <>
                <div className={`mp-cards-grid mp-cards-grid--${viewMode}`}>
                  {displayedBusinesses.map((biz) => (
                    <MarketplaceCard
                      key={biz.id || biz.slug}
                      business={biz}
                      locale={locale}
                      viewMode={viewMode}
                    />
                  ))}
                </div>

                {/* Load More Button */}
                {hasMore && (
                  <div className="mp-load-more-wrap">
                    <button
                      className="mp-load-more-btn"
                      onClick={() => setVisibleCount((prev) => prev + 12)}
                      type="button"
                    >
                      <span>
                        {locale === "uz"
                          ? `Yana ko'rsatish (${totalCount - visibleCount} ta qoldi)`
                          : locale === "ru"
                          ? `Загрузить ещё (${totalCount - visibleCount})`
                          : `Load More (${totalCount - visibleCount} remaining)`}
                      </span>
                    </button>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </section>

      {/* 5. Compact Explore Tashkent Cultural & Heritage Showcase */}
      <ExploreTashkentCompact locale={locale} />

      {/* 6. Mobile Bottom Sheet Filter Drawer */}
      <MarketplaceMobileFilterDrawer
        filters={filters}
        isOpen={isMobileDrawerOpen}
        locale={locale}
        onClose={() => setIsMobileDrawerOpen(false)}
        onFilterChange={handleFilterChange}
        onResetFilters={handleResetFilters}
        totalCount={totalCount}
      />
    </div>
  );
}
