"use client";

import type { Locale } from "@manzil/shared";

export function MarketplaceSkeletons() {
  return (
    <div className="mp-skeletons-grid">
      {Array.from({ length: 6 }).map((_, idx) => (
        <div key={idx} className="mp-skeleton-card">
          <div className="mp-skeleton-card__media skeleton-pulse" />
          <div className="mp-skeleton-card__body">
            <div className="mp-skeleton-line mp-skeleton-line--short skeleton-pulse" />
            <div className="mp-skeleton-line mp-skeleton-line--title skeleton-pulse" />
            <div className="mp-skeleton-line mp-skeleton-line--desc skeleton-pulse" />
            <div className="mp-skeleton-line mp-skeleton-line--footer skeleton-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function MarketplaceEmptyState({
  locale,
  onResetFilters
}: {
  locale: Locale;
  onResetFilters: () => void;
}) {
  return (
    <div className="mp-empty-state">
      <div className="mp-empty-state__icon">🔍</div>
      <h3 className="mp-empty-state__title">
        {locale === "uz"
          ? "Hech qanday maskan topilmadi"
          : locale === "ru"
          ? "Ничего не найдено"
          : "No places found"}
      </h3>
      <p className="mp-empty-state__desc">
        {locale === "uz"
          ? "Filtrlarni o'zgartirib ko'ring yoki boshqa so'rov orqali qidiring."
          : locale === "ru"
          ? "Попробуйте изменить параметры поиска или сбросить активные фильтры."
          : "Try adjusting your search criteria or resetting active filters."}
      </p>
      <button className="mp-empty-state__btn" onClick={onResetFilters} type="button">
        {locale === "uz"
          ? "Barcha filtrlarni tozalash"
          : locale === "ru"
          ? "Сбросить все фильтры"
          : "Reset all filters"}
      </button>
    </div>
  );
}

export function MarketplaceErrorState({
  locale,
  onRetry
}: {
  locale: Locale;
  onRetry: () => void;
}) {
  return (
    <div className="mp-error-state">
      <div className="mp-error-state__icon">⚠️</div>
      <h3 className="mp-error-state__title">
        {locale === "uz"
          ? "Ma'lumotlarni yuklashda xatolik yuz berdi"
          : locale === "ru"
          ? "Не удалось загрузить данные"
          : "Failed to load marketplace places"}
      </h3>
      <p className="mp-error-state__desc">
        {locale === "uz"
          ? "Tarmoq aloqasini tekshiring va qayta urinib ko'ring."
          : locale === "ru"
          ? "Проверьте интернет-соединение и повторите попытку."
          : "Please check your connection and try again."}
      </p>
      <button className="mp-error-state__btn" onClick={onRetry} type="button">
        {locale === "uz" ? "Qayta urinish" : locale === "ru" ? "Повторить" : "Try Again"}
      </button>
    </div>
  );
}
