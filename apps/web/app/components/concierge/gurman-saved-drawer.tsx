"use client";

import type { BusinessPlatform, Locale } from "@manzil/shared";
import Link from "next/link";
import { useEffect } from "react";

export function GurmanSavedDrawer({
  isOpen,
  onClose,
  locale,
  savedBusinesses,
  onRemoveSave
}: {
  isOpen: boolean;
  onClose: () => void;
  locale: Locale;
  savedBusinesses: BusinessPlatform[];
  onRemoveSave: (slug: string) => void;
}) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="g-drawer-backdrop" onClick={onClose}>
      <div
        aria-label="Saqlangan joylar"
        aria-modal="true"
        className="g-drawer g-drawer--saved"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
      >
        {/* Drawer Header */}
        <div className="g-drawer__header">
          <div className="g-drawer__title-row">
            <span className="g-drawer__icon">🔖</span>
            <div>
              <h3 className="g-drawer__title">
                {locale === "uz" ? "Saqlangan joylar" : locale === "ru" ? "Сохраненные места" : "Saved Places"}
              </h3>
              <span className="g-drawer__subtitle">
                {savedBusinesses.length}{" "}
                {locale === "uz" ? "ta maskan saqlandi" : locale === "ru" ? "мест сохранено" : "places saved"}
              </span>
            </div>
          </div>
          <button aria-label="Yopish" className="g-drawer__close-btn" onClick={onClose} type="button">
            ✕
          </button>
        </div>

        {/* Drawer Body */}
        <div className="g-drawer__body">
          {savedBusinesses.length === 0 ? (
            <div className="g-saved-empty">
              <span className="g-saved-empty__icon">🏷️</span>
              <h4 className="g-saved-empty__title">
                {locale === "uz"
                  ? "Hozircha saqlangan joylar yo'q"
                  : locale === "ru"
                  ? "Пока нет сохраненных мест"
                  : "No saved places yet"}
              </h4>
              <p className="g-saved-empty__desc">
                {locale === "uz"
                  ? "Tavsiya qilingan joylar kartasidagi xatcho'p belgisini bosib, ularni bu yerga saqlashingiz mumkin."
                  : locale === "ru"
                  ? "Нажмите на иконку закладки на карточке заведения, чтобы сохранить его сюда."
                  : "Click the bookmark icon on any recommendation card to save places here."}
              </p>
            </div>
          ) : (
            <div className="g-saved-list">
              {savedBusinesses.map((biz) => {
                const cover =
                  biz.coverPhotoUrl ||
                  "https://images.pexels.com/photos/262978/pexels-photo-262978.jpeg?auto=compress&cs=tinysrgb&w=800";
                return (
                  <div key={biz.slug} className="g-saved-item">
                    <img alt={biz.name} className="g-saved-item__img" src={cover} />
                    <div className="g-saved-item__body">
                      <h4 className="g-saved-item__name">{biz.name}</h4>
                      <span className="g-saved-item__meta">
                        📍 {biz.district || "Toshkent"} · ⭐ {(biz.avgRating || 4.8).toFixed(1)}
                      </span>
                      <div className="g-saved-item__actions">
                        <Link
                          className="g-saved-item__link"
                          href={`/${locale}/businesses/${biz.slug}`}
                        >
                          {locale === "uz" ? "Ochish →" : locale === "ru" ? "Открыть →" : "View →"}
                        </Link>
                        <button
                          className="g-saved-item__remove"
                          onClick={() => onRemoveSave(biz.slug)}
                          type="button"
                        >
                          {locale === "uz" ? "O'chirish" : locale === "ru" ? "Удалить" : "Remove"}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Drawer Footer */}
        <div className="g-drawer__footer">
          <Link className="g-btn g-btn--primary g-btn--block" href={`/${locale}/discover`}>
            <span>{locale === "uz" ? "Katalogni ko'rish" : locale === "ru" ? "Смотреть каталог" : "Browse Catalogue"}</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
