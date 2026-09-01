"use client";

import type { Locale } from "@manzil/shared";
import { useEffect, useState } from "react";

export function GurmanSearchingState({ locale }: { locale: Locale }) {
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    {
      uz: "Kategoriyalarni tekshirish",
      ru: "Проверка категорий",
      en: "Checking categories"
    },
    {
      uz: "Mos joylarni saralash",
      ru: "Подбор подходящих мест",
      en: "Filtering matching places"
    },
    {
      uz: "Sharhlar va ma'lumotlarni solishtirish",
      ru: "Сравнение отзывов и рейтингов",
      en: "Comparing reviews and details"
    }
  ];

  useEffect(() => {
    const t1 = setTimeout(() => setActiveStep(1), 350);
    const t2 = setTimeout(() => setActiveStep(2), 700);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  return (
    <div className="g-searching-container">
      {/* Status Header */}
      <div className="g-searching-header">
        <div className="g-searching-spinner">
          <span className="g-searching-spinner__pulse" />
        </div>
        <div>
          <h3 className="g-searching-title">
            {locale === "uz"
              ? "Manzil katalogidan izlayapman…"
              : locale === "ru"
              ? "Ищу в каталоге Manzil…"
              : "Searching Manzil catalogue…"}
          </h3>
          <p className="g-searching-subtitle">
            {locale === "uz"
              ? "Toshkentdagi haqiqiy joylar va sharhlar asosida"
              : locale === "ru"
              ? "На основе реальных заведений и отзывов в Ташкенте"
              : "Based on real verified places and reviews in Tashkent"}
          </p>
        </div>
      </div>

      {/* 3 Status Steps */}
      <div className="g-searching-steps">
        {steps.map((step, idx) => {
          const isDone = idx < activeStep;
          const isCurrent = idx === activeStep;
          return (
            <div
              key={idx}
              className={`g-searching-step ${isDone ? "is-done" : ""} ${isCurrent ? "is-current" : ""}`}
            >
              <div className="g-searching-step__dot">
                {isDone ? "✓" : idx + 1}
              </div>
              <span className="g-searching-step__label">{step[locale] ?? step.uz}</span>
            </div>
          );
        })}
      </div>

      {/* Card Silhouettes */}
      <div className="g-silhouettes-stack">
        {[1, 2, 3].map((i) => (
          <div key={i} className="g-silhouette-card g-pulse">
            <div className="g-silhouette-card__media" />
            <div className="g-silhouette-card__body">
              <div className="g-silhouette-line g-silhouette-line--short" />
              <div className="g-silhouette-line g-silhouette-line--title" />
              <div className="g-silhouette-line g-silhouette-line--desc" />
              <div className="g-silhouette-line g-silhouette-line--reason" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
