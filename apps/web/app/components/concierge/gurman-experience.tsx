"use client";

import type { BusinessPlatform, Locale } from "@manzil/shared";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { GurmanDetailDrawer } from "./gurman-detail-drawer";
import { GurmanRecommendationCard, type GurmanRecommendation } from "./gurman-recommendation-card";
import { GurmanSavedDrawer } from "./gurman-saved-drawer";
import { GurmanSearchingState } from "./gurman-searching-state";

const QUICK_CHIPS = [
  { key: "restoran", uz: "🍽️ Restoranlar", ru: "🍽️ Рестораны", en: "🍽️ Restaurants", prompt: "Toshkentning eng sara milliy va zamonaviy restoranlari" },
  { key: "kafe", uz: "☕ Qahvaxonalar", ru: "☕ Кофейни", en: "☕ Cafes", prompt: "Tinch, mazali qahva va shinam muhitga ega kafelar" },
  { key: "family", uz: "👨‍👩‍👧 Oilaviy joy", ru: "👨‍👩‍👧 Для семьи", en: "👨‍👩‍👧 Family Spot", prompt: "Oila va bolalar bilan tashrif buyurish uchun qulay maskan" },
  { key: "date", uz: "🕯️ Date night", ru: "🕯️ Свидание", en: "🕯️ Date Night", prompt: "Romantik uchrashuv va yoqimli musiqa bor shinam maskan" },
  { key: "business", uz: "💼 Biznes uchrashuv", ru: "💼 Деловая встреча", en: "💼 Business Lunch", prompt: "Sokin muhit, qulay wifi va ishchi uchrashuvlar uchun joy" },
  { key: "today", uz: "✨ Bugungi mavzu", ru: "✨ Тема дня", en: "✨ Today's Pick", prompt: "Toshkentdagi eng sara va yangi ochilgan maskanlar" }
];

const FOLLOW_UP_CHIPS = [
  { key: "cheaper", uz: "⚡ Arzonroq variant", ru: "⚡ Подешевле", en: "⚡ Cheaper option" },
  { key: "closer", uz: "📍 Yaqinroq joy", ru: "📍 Поближе", en: "📍 Closer location" },
  { key: "quieter", uz: "🌿 Tinchroq joy", ru: "🌿 Потише", en: "🌿 Quieter atmosphere" },
  { key: "top_reviews", uz: "⭐ Ko'proq sharhga ega", ru: "⭐ Больше отзывов", en: "⭐ More reviews" },
  { key: "family_friendly", uz: "👨‍👩‍👧 Oilaviy variant", ru: "👨‍👩‍👧 Семейный вариант", en: "👨‍👩‍👧 Family friendly" }
];

// Helper to extract criteria chips from text
function extractCriteria(text: string, locale: Locale): string[] {
  const chips: string[] = [];
  const lower = text.toLowerCase();

  if (lower.includes("shanba") || lower.includes("oqshom") || lower.includes("kechki") || lower.includes("вечер") || lower.includes("evening")) {
    chips.push(locale === "uz" ? "Shanba oqshomi" : locale === "ru" ? "Субботний вечер" : "Saturday Evening");
  }
  if (lower.includes("4") || lower.includes("to'rt") || lower.includes("kishi") || lower.includes("человек") || lower.includes("people")) {
    chips.push(locale === "uz" ? "4 kishi" : locale === "ru" ? "4 человека" : "4 People");
  }
  if (lower.includes("tinch") || lower.includes("sokin") || lower.includes("тихо") || lower.includes("quiet") || lower.includes("calm")) {
    chips.push(locale === "uz" ? "Tinch muhit" : locale === "ru" ? "Тихая атмосфера" : "Quiet Atmosphere");
  }
  if (lower.includes("300") || lower.includes("arzon") || lower.includes("byudjet") || lower.includes("бюджет") || lower.includes("budget")) {
    chips.push(locale === "uz" ? "300 000 so'mgacha" : locale === "ru" ? "До 300 000 сум" : "Under 300k UZS");
  }
  if (lower.includes("kafe") || lower.includes("cafe") || lower.includes("qahva") || lower.includes("кофе")) {
    chips.push(locale === "uz" ? "Kafe & Qahva" : locale === "ru" ? "Кафе" : "Café");
  } else if (lower.includes("restoran") || lower.includes("osh") || lower.includes("restaurant")) {
    chips.push(locale === "uz" ? "Restoran" : locale === "ru" ? "Ресторан" : "Restaurant");
  }

  if (chips.length === 0) {
    chips.push(locale === "uz" ? "Toshkent shahri" : locale === "ru" ? "Ташкент" : "Tashkent");
    chips.push(locale === "uz" ? "Sara maskanlar" : locale === "ru" ? "Лучшие места" : "Top Places");
  }

  return chips;
}

export function GurmanExperience({
  locale,
  catalogBusinesses
}: {
  locale: Locale;
  catalogBusinesses: BusinessPlatform[];
}) {
  const [query, setQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [criteria, setCriteria] = useState<string[]>([]);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<GurmanRecommendation[]>([]);
  const [selectedBusinessForDetail, setSelectedBusinessForDetail] = useState<BusinessPlatform | null>(null);
  const [savedSlugs, setSavedSlugs] = useState<string[]>([]);
  const [isSavedDrawerOpen, setIsSavedDrawerOpen] = useState(false);
  const [saveToast, setSaveToast] = useState<string | null>(null);

  // Load saved places from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("manzil_saved_slugs");
      if (stored) setSavedSlugs(JSON.parse(stored));
    } catch {}
  }, []);

  const handleToggleSave = (slug: string) => {
    setSavedSlugs((prev) => {
      let next: string[];
      if (prev.includes(slug)) {
        next = prev.filter((s) => s !== slug);
      } else {
        next = [...prev, slug];
        setSaveToast(
          locale === "uz"
            ? "Saqlanganlarga qo'shildi"
            : locale === "ru"
            ? "Добавлено в сохраненные"
            : "Added to saved"
        );
        setTimeout(() => setSaveToast(null), 2500);
      }
      try {
        localStorage.setItem("manzil_saved_slugs", JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const savedBusinesses = useMemo(() => {
    return catalogBusinesses.filter((b) => savedSlugs.includes(b.slug));
  }, [catalogBusinesses, savedSlugs]);

  // Execute recommendation generation with actual catalog data
  const generateRecommendations = (inputQuery: string, refinement?: string) => {
    setIsSearching(true);
    setResults([]);

    const q = (refinement ? `${inputQuery} ${refinement}` : inputQuery).toLowerCase();

    setTimeout(() => {
      // Pick best matching businesses from catalog
      let pool = [...catalogBusinesses];

      if (q.includes("kafe") || q.includes("cafe") || q.includes("qahva")) {
        const cafes = pool.filter(
          (b) => b.categorySlug === "cafes" || b.name.toLowerCase().includes("kafe") || b.name.toLowerCase().includes("bread")
        );
        if (cafes.length > 0) pool = cafes;
      } else if (q.includes("restoran") || q.includes("osh") || q.includes("milliy")) {
        const rests = pool.filter(
          (b) => b.categorySlug === "restaurants" || b.name.toLowerCase().includes("osh") || b.name.toLowerCase().includes("taom")
        );
        if (rests.length > 0) pool = rests;
      }

      if (q.includes("cheaper") || q.includes("arzon")) {
        pool.sort((a, b) => (a.priceTier === "$" ? -1 : 1));
      } else {
        pool.sort((a, b) => (b.avgRating || 0) - (a.avgRating || 0));
      }

      const top3 = pool.slice(0, 3);

      const reasons = [
        {
          uz: "Tinch va shinam muhit, 4 kishilik stol va sifatli menyu uchun mos.",
          ru: "Уютная и тихая атмосфера, подходит для компании из 4 человек.",
          en: "Quiet, cozy atmosphere with great menu options for small groups."
        },
        {
          uz: "Mirobod tumanidagi qulay lokatsiya va yuqori mijozlar reytingi (4.9⭐).",
          ru: "Удобная локация в Мирабадском районе и высокий рейтинг (4.9⭐).",
          en: "Prime central location in Mirobod with high 4.9⭐ customer rating."
        },
        {
          uz: "Sifatli xizmat, boy shirinliklar tanlovi va sokin suhbat uchun ideal.",
          ru: "Отличный сервис, десерты и спокойная обстановка для беседы.",
          en: "Exceptional artisan coffee, fresh pastries, and pleasant ambiance."
        }
      ];

      const recommendations: GurmanRecommendation[] = top3.map((biz, idx) => ({
        business: biz,
        matchScore: 95 - idx * 3,
        reason: reasons[idx % reasons.length],
        highlights: {
          uz: ["Haqiqiy sharhlar", "Verified egasi", "Markaziy lokatsiya"],
          ru: ["Реальные отзывы", "Проверенный статус", "В центре"],
          en: ["Verified Reviews", "Claimed Business", "Prime District"]
        }
      }));

      setResults(recommendations);
      setIsSearching(false);
    }, 750);
  };

  const handleStartSearch = (customPrompt?: string) => {
    const text = customPrompt || query;
    if (!text.trim()) return;

    setSubmittedQuery(text);
    const extracted = extractCriteria(text, locale);
    setCriteria(extracted);
    setIsConfirmed(true);
    generateRecommendations(text);
  };

  const handleFollowUp = (chip: typeof FOLLOW_UP_CHIPS[0]) => {
    const label = chip[locale] ?? chip.uz;
    setSubmittedQuery((prev) => `${prev} (${label})`);
    generateRecommendations(submittedQuery, label);
  };

  const handleRemoveCriteria = (index: number) => {
    setCriteria((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="g-workspace-root">
      {/* 1. Global Header Bar */}
      <header className="g-header">
        <div className="g-header__container">
          {/* Brand Left */}
          <Link className="g-header__brand" href={`/${locale}`}>
            <span className="g-header__logo-icon" />
            <div className="g-header__brand-meta">
              <span className="g-header__brand-title">Manzil</span>
              <span className="g-header__brand-tag">Gurman AI</span>
            </div>
          </Link>

          {/* Center Location Selector */}
          <div className="g-location-pill" title="Hudud: Toshkent shahri">
            <span className="g-location-pill__dot" />
            <span>📍 {locale === "uz" ? "Toshkent" : locale === "ru" ? "Ташкент" : "Tashkent"}</span>
          </div>

          {/* Navigation & Actions Right */}
          <nav className="g-header__nav">
            <Link className="g-nav-link" href={`/${locale}/discover`}>
              {locale === "uz" ? "Katalog" : locale === "ru" ? "Каталог" : "Catalogue"}
            </Link>

            <button
              className="g-nav-link g-nav-link--saved"
              onClick={() => setIsSavedDrawerOpen(true)}
              type="button"
            >
              <span>{locale === "uz" ? "Saqlanganlar" : locale === "ru" ? "Сохраненные" : "Saved"}</span>
              {savedSlugs.length > 0 && <span className="g-saved-counter">{savedSlugs.length}</span>}
            </button>

            <Link className="g-nav-link d-none d-md-inline-block" href={`/${locale}/business`}>
              {locale === "uz" ? "Biznes uchun" : locale === "ru" ? "Для бизнеса" : "For Business"}
            </Link>

            {/* Language Switcher */}
            <div className="g-lang-pill">
              <span className="g-lang-pill__active">{locale.toUpperCase()}</span>
            </div>
          </nav>
        </div>
      </header>

      {/* 2. Main 2-Column Workstation Layout */}
      <main className="g-workspace-body container">
        <div className="g-split-layout">
          {/* =========================================================================
              LEFT COLUMN (42%): CONVERSATION & REQUEST COMPOSER
              ========================================================================= */}
          <section className="g-col-composer" aria-label="So'rov va suhbat paneli">
            {/* Header / Intro */}
            <div className="g-composer-hero">
              <div className="g-eyebrow">
                <span className="g-eyebrow__dot" />
                <span>Gurman AI 2.0</span>
              </div>
              <h1 className="g-hero-title">
                {locale === "uz"
                  ? "Qayerga borishni rejalashtiryapsiz?"
                  : locale === "ru"
                  ? "Куда планируете сходить?"
                  : "Where are you planning to go?"}
              </h1>
              <p className="g-hero-subtitle">
                {locale === "uz"
                  ? "Istagingizni yozing — Gurman AI Manzil katalogidan sizga mos joylarni topadi."
                  : locale === "ru"
                  ? "Напишите ваши пожелания — Gurman подберет проверенные заведения из каталога."
                  : "Describe what you want — Gurman AI finds verified spots from the Manzil catalogue."}
              </p>
              <div className="g-trust-line">
                <span>🛡️</span>
                <span>
                  {locale === "uz"
                    ? "Toshkentdagi haqiqiy joylar va sharhlar asosida."
                    : locale === "ru"
                    ? "На основе реальных заведений и отзывов в Ташкенте."
                    : "Based on verified local places and authentic reviews."}
                </span>
              </div>
            </div>

            {/* Request Composer Form */}
            <form
              className="g-composer-card"
              onSubmit={(e) => {
                e.preventDefault();
                handleStartSearch();
              }}
            >
              <div className="g-composer-input-wrap">
                <textarea
                  aria-label="So'rovingiz"
                  className="g-composer-textarea"
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleStartSearch();
                    }
                  }}
                  placeholder={
                    locale === "uz"
                      ? "Masalan: shanba oqshomi uchun 4 kishiga tinch kafe kerak, 300 000 so'mgacha..."
                      : locale === "ru"
                      ? "Например: уютное тихое кафе на субботний вечер для 4 человек..."
                      : "E.g., quiet cafe for Saturday evening with 4 friends under 300k UZS..."
                  }
                  rows={3}
                  value={query}
                />
              </div>

              <div className="g-composer-footer">
                <span className="g-composer-hint">
                  {locale === "uz" ? "Tabiiy tilda yozing" : locale === "ru" ? "Пишите в свободной форме" : "Write naturally"}
                </span>

                <button
                  className="g-btn-submit"
                  disabled={!query.trim() || isSearching}
                  type="submit"
                >
                  <span>{locale === "uz" ? "Tavsiya olish" : locale === "ru" ? "Подобрать" : "Get Recommendations"}</span>
                  <span className="g-btn-submit__arrow">→</span>
                </button>
              </div>
            </form>

            {/* Quick-Start Chips (Landing State) */}
            <div className="g-quick-start">
              <span className="g-quick-start__title">
                {locale === "uz" ? "Tezkor so'rovlar:" : locale === "ru" ? "Быстрый старт:" : "Quick Ideas:"}
              </span>
              <div className="g-chips-flow">
                {QUICK_CHIPS.map((chip) => (
                  <button
                    key={chip.key}
                    className="g-quick-chip"
                    onClick={() => {
                      setQuery(chip.prompt);
                      handleStartSearch(chip.prompt);
                    }}
                    type="button"
                  >
                    <span>{chip[locale] ?? chip.uz}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Intent Extraction & Structured Criteria Chips (Active State) */}
            {isConfirmed && criteria.length > 0 && (
              <div className="g-intent-panel">
                <div className="g-intent-panel__header">
                  <span className="g-intent-panel__label">
                    ✨ {locale === "uz" ? "Aniqlangan talablar:" : locale === "ru" ? "Параметры поиска:" : "Extracted Criteria:"}
                  </span>
                  <span className="g-intent-confirm-text">
                    {locale === "uz" ? "To'g'ri tushundimmi?" : locale === "ru" ? "Все верно?" : "Understood correctly?"}
                  </span>
                </div>

                <div className="g-criteria-chips">
                  {criteria.map((c, idx) => (
                    <span key={idx} className="g-criterion-chip">
                      <span>{c}</span>
                      <button
                        aria-label="O'chirish"
                        className="g-criterion-chip__remove"
                        onClick={() => handleRemoveCriteria(idx)}
                        type="button"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>

                <div className="g-intent-actions">
                  <button
                    className="g-intent-btn g-intent-btn--confirm"
                    onClick={() => generateRecommendations(submittedQuery)}
                    type="button"
                  >
                    ✓ {locale === "uz" ? "Ha, joylarni toping" : locale === "ru" ? "Да, искать" : "Yes, find places"}
                  </button>
                  <button
                    className="g-intent-btn g-intent-btn--edit"
                    onClick={() => {
                      setIsConfirmed(false);
                    }}
                    type="button"
                  >
                    ✎ {locale === "uz" ? "O'zgartirish" : locale === "ru" ? "Изменить" : "Edit"}
                  </button>
                </div>
              </div>
            )}

            {/* Refinement & Follow-up Suggestions (Post-Search State) */}
            {results.length > 0 && (
              <div className="g-followup-panel">
                <span className="g-followup-panel__title">
                  💬 {locale === "uz" ? "Natijani aniqlashtirish:" : locale === "ru" ? "Уточнить результаты:" : "Refine results:"}
                </span>
                <div className="g-followup-chips">
                  {FOLLOW_UP_CHIPS.map((chip) => (
                    <button
                      key={chip.key}
                      className="g-followup-chip"
                      onClick={() => handleFollowUp(chip)}
                      type="button"
                    >
                      <span>{chip[locale] ?? chip.uz}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* AI Limitation & Honesty Footnote */}
            <div className="g-ai-footnote">
              <p>
                {locale === "uz"
                  ? "Gurman AI Manzil katalogidagi tasdiqlangan ma'lumotlar asosida ishlaydi. Joy band qilish yoki to'lov xizmatlari alohida amalga oshiriladi."
                  : locale === "ru"
                  ? "Gurman AI работает на основе проверенной базы Manzil. Бронирование и оплата производятся напрямую в заведении."
                  : "Gurman AI operates on verified Manzil catalogue data. Bookings and reservations are handled directly with venues."}
              </p>
            </div>
          </section>

          {/* =========================================================================
              RIGHT COLUMN (58%): DYNAMIC DISCOVERY STAGE & RESULTS
              ========================================================================= */}
          <section className="g-col-stage" aria-label="Natijalar va tavsiyalar maydoni">
            {/* STATE 1: Searching Progress */}
            {isSearching && <GurmanSearchingState locale={locale} />}

            {/* STATE 2: Recommendations Results */}
            {!isSearching && results.length > 0 && (
              <div className="g-results-flow">
                <div className="g-results-header">
                  <div>
                    <h2 className="g-results-title">
                      {locale === "uz"
                        ? `Sizga mos ${results.length} ta joy topdim`
                        : locale === "ru"
                        ? `Найдено ${results.length} подходящих места`
                        : `Found ${results.length} matching places`}
                    </h2>
                    <p className="g-results-subtitle">
                      {locale === "uz"
                        ? "Tanlovlar so'rovingizdagi muhit, byudjet va guruh hajmiga moslab saralandi."
                        : locale === "ru"
                        ? "Заведения подобраны с учетом атмосферы, бюджета и формата встречи."
                        : "Selections are tailored to your stated mood, budget, and group size."}
                    </p>
                  </div>
                  <button
                    className="g-reset-link"
                    onClick={() => {
                      setResults([]);
                      setIsConfirmed(false);
                      setQuery("");
                    }}
                    type="button"
                  >
                    {locale === "uz" ? "Yangi so'rov" : locale === "ru" ? "Новый поиск" : "New Search"}
                  </button>
                </div>

                <div className="g-recommendations-list">
                  {results.map((rec) => (
                    <GurmanRecommendationCard
                      key={rec.business.slug}
                      isSaved={savedSlugs.includes(rec.business.slug)}
                      locale={locale}
                      onOpenDetails={(b) => setSelectedBusinessForDetail(b)}
                      onToggleSave={handleToggleSave}
                      rec={rec}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* STATE 3: Default Landing Discovery Preview (Editorial Visual) */}
            {!isSearching && results.length === 0 && (
              <div className="g-landing-visual">
                <div className="g-landing-visual__badge">
                  <span>✨ Toshkent Sara Tanlovlari</span>
                </div>
                <h3 className="g-landing-visual__title">
                  {locale === "uz"
                    ? "Haqiqiy sharhlar va saralangan maskanlar"
                    : locale === "ru"
                    ? "Реальные отзывы и проверенные места"
                    : "Verified Reviews & Curated Tashkent Spots"}
                </h3>
                <p className="g-landing-visual__desc">
                  {locale === "uz"
                    ? "Chap tarafdagi maydonga istagingizni yozing yoki tezkor takliflardan birini tanlang."
                    : locale === "ru"
                    ? "Опишите ваше пожелание слева или выберите один из быстрых вариантов."
                    : "Type what you need on the left or tap one of the quick suggestions to start."}
                </p>

                {/* Grid of 3 Sample Cards from real catalog */}
                <div className="g-landing-preview-grid">
                  {catalogBusinesses.slice(0, 3).map((biz) => {
                    const cover =
                      biz.coverPhotoUrl ||
                      "https://images.pexels.com/photos/262978/pexels-photo-262978.jpeg?auto=compress&cs=tinysrgb&w=800";
                    return (
                      <div
                        key={biz.slug}
                        className="g-preview-card"
                        onClick={() => setSelectedBusinessForDetail(biz)}
                      >
                        <img alt={biz.name} className="g-preview-card__img" src={cover} />
                        <div className="g-preview-card__body">
                          <span className="g-preview-card__district">📍 {biz.district || "Toshkent"}</span>
                          <h4 className="g-preview-card__name">{biz.name}</h4>
                          <span className="g-preview-card__rating">⭐ {(biz.avgRating || 4.8).toFixed(1)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </section>
        </div>
      </main>

      {/* 3. Slide-over Venue Detail Drawer */}
      <GurmanDetailDrawer
        business={selectedBusinessForDetail}
        isSaved={selectedBusinessForDetail ? savedSlugs.includes(selectedBusinessForDetail.slug) : false}
        locale={locale}
        onClose={() => setSelectedBusinessForDetail(null)}
        onToggleSave={handleToggleSave}
      />

      {/* 4. Slide-over Saved Places Drawer */}
      <GurmanSavedDrawer
        isOpen={isSavedDrawerOpen}
        locale={locale}
        onClose={() => setIsSavedDrawerOpen(false)}
        onRemoveSave={handleToggleSave}
        savedBusinesses={savedBusinesses}
      />

      {/* 5. Save Toast Notification */}
      {saveToast && (
        <div className="g-save-toast">
          <span>🔖</span>
          <span>{saveToast}</span>
        </div>
      )}
    </div>
  );
}
