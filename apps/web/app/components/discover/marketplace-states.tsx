"use client";

import type { Locale } from "@manzil/shared";
import Link from "next/link";

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
      <h3 className="mp-empty-state__title">
        {locale === "uz"
          ? "Bu filtrda hozircha maskan yo'q"
          : locale === "ru"
          ? "В этом фильтре пока нет мест"
          : "No places match these filters"}
      </h3>
      <p className="mp-empty-state__desc">
        {locale === "uz"
          ? "Filtrlarni tozalang yoki sevimli maskaningizni Manzil'ga qo'shishni taklif qiling."
          : locale === "ru"
          ? "Сбросьте фильтры или предложите любимое место для каталога Manzil."
          : "Reset the filters or suggest a favourite place for the Manzil catalogue."}
      </p>
      <div className="mp-empty-state__actions">
        <button className="mp-empty-state__btn" onClick={onResetFilters} type="button">
          {locale === "uz"
            ? "Filtrlarni tozalash"
            : locale === "ru"
            ? "Сбросить фильтры"
            : "Reset filters"}
        </button>
        <Link className="mp-empty-state__link" href={`/${locale}/business/register`}>
          {locale === "uz"
            ? "Biznesni qo'shish"
            : locale === "ru"
            ? "Добавить бизнес"
            : "Add a business"}
        </Link>
      </div>
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
