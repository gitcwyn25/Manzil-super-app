"use client";

import type { Locale } from "@manzil/shared";
import { useEffect, useRef } from "react";

const ASSET_ROOT = "/originkit/features-03";

type GuideCopy = {
  eyebrow: string;
  title: string;
  body: string;
  action: string;
  laptopLabel: string;
  phoneLabel: string;
  steps: Array<{ number: string; title: string; body: string }>;
  request: string;
  understood: string;
  result: string;
  reason: string;
  place: string;
  district: string;
  fit: string;
};

const COPY: Record<Locale, GuideCopy> = {
  en: {
    eyebrow: "A clearer way to use Gurman",
    title: "Start with the plan, not the search box.",
    body: "Tell Gurman what you are trying to do. It turns your words into useful constraints, compares real Manzil places, and keeps the reason visible before you decide.",
    action: "Try the workspace",
    laptopLabel: "The decision workspace",
    phoneLabel: "Three simple moves",
    steps: [
      { number: "01", title: "Describe the experience", body: "Say who you are with, where you want to go, and what kind of moment you want." },
      { number: "02", title: "Check what Gurman understood", body: "Review the extracted place, group, mood, and budget before seeing recommendations." },
      { number: "03", title: "Inspect the reason", body: "Open a real catalogue place, see why it fits, then save it or continue refining." }
    ],
    request: "Quiet café for four near Yunusabad, under 300,000 UZS",
    understood: "Gurman understood",
    result: "3 places fit your plan",
    reason: "Why this fits",
    place: "Caravan Coffee",
    district: "Mirobod · real catalogue place",
    fit: "Quiet atmosphere · small group"
  },
  ru: {
    eyebrow: "Понятный способ пользоваться Gurman",
    title: "Начните с плана, а не с поиска.",
    body: "Расскажите Gurman, что хотите сделать. Он превратит слова в условия, сравнит реальные места Manzil и объяснит причину выбора до вашего решения.",
    action: "Открыть рабочее пространство",
    laptopLabel: "Рабочее пространство решения",
    phoneLabel: "Три простых шага",
    steps: [
      { number: "01", title: "Опишите впечатление", body: "Расскажите, с кем вы будете, куда хотите пойти и какой должна быть атмосфера." },
      { number: "02", title: "Проверьте понимание", body: "Посмотрите выбранные место, компанию, настроение и бюджет до рекомендаций." },
      { number: "03", title: "Проверьте причину", body: "Откройте реальное место из каталога, сохраните его или уточните запрос." }
    ],
    request: "Тихое кафе для четырёх рядом с Юнусабадом, до 300 000 сум",
    understood: "Gurman понял",
    result: "Подходят 3 места",
    reason: "Почему подходит",
    place: "Caravan Coffee",
    district: "Мирабад · реальное место из каталога",
    fit: "Тихая атмосфера · небольшая компания"
  },
  uz: {
    eyebrow: "Gurmanni ishlatishning aniq yo'li",
    title: "Qidiruv oynasidan emas, rejadan boshlang.",
    body: "Gurmanga nima qilmoqchi ekaningizni ayting. U so'zlaringizni aniq talablarga aylantiradi, Manzildagi haqiqiy joylarni solishtiradi va qaror oldidan sababni ko'rsatadi.",
    action: "Ish maydonini sinash",
    laptopLabel: "Qaror ish maydoni",
    phoneLabel: "Uchta oddiy qadam",
    steps: [
      { number: "01", title: "Tajribani tasvirlang", body: "Kim bilan borishingizni, qayerga yaqin bo'lishini va qanday kayfiyat istashingizni ayting." },
      { number: "02", title: "Gurman tushunganini tekshiring", body: "Tavsiya olishdan oldin joy, guruh, muhit va byudjetni ko'rib chiqing." },
      { number: "03", title: "Sababni tekshiring", body: "Katalogdagi haqiqiy joyni oching, saqlang yoki so'rovni yanada aniqlashtiring." }
    ],
    request: "Yunusobod yaqinida 4 kishi uchun 300 000 so'mgacha sokin kafe",
    understood: "Gurman tushundi",
    result: "3 ta joy mos keldi",
    reason: "Nega mos",
    place: "Caravan Coffee",
    district: "Mirobod · katalogdagi haqiqiy joy",
    fit: "Sokin muhit · kichik guruh"
  }
};

function clamp(value: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

function smoothstep(start: number, end: number, value: number) {
  const t = clamp((value - start) / Math.max(0.001, end - start));
  return t * t * (3 - 2 * t);
}

function AppHeader({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`g-guide-screen__header${compact ? " g-guide-screen__header--compact" : ""}`}>
      <span className="g-guide-screen__mark">M</span>
      <span>Gurman</span>
      <span className="g-guide-screen__header-dot" />
    </div>
  );
}

function PhoneMockup({ copy, variant }: { copy: GuideCopy; variant: "ask" | "decide" }) {
  return (
    <div className={`g-guide-phone g-guide-phone--${variant}`}>
      <div className="g-guide-phone__frame" aria-hidden="true">
        <img alt="" src={`${ASSET_ROOT}/phone-frame.svg`} />
      </div>
      <div className="g-guide-phone__glare" aria-hidden="true">
        <img alt="" src={`${ASSET_ROOT}/phone-glare.svg`} />
      </div>
      <div className="g-guide-phone__screen">
        <AppHeader />
        {variant === "ask" ? (
          <>
            <span className="g-guide-screen__eyebrow">Gurman AI</span>
            <h3>{copy.request.split(",")[0]}</h3>
            <div className="g-guide-screen__input">{copy.request}</div>
            <span className="g-guide-screen__hint">Natural language is enough</span>
            <span className="g-guide-screen__button">Get recommendations <b>↗</b></span>
          </>
        ) : (
          <>
            <span className="g-guide-screen__eyebrow">{copy.understood}</span>
            <div className="g-guide-screen__criteria">
              <span>4 people</span><span>Quiet</span><span>Under 300k</span>
            </div>
            <h3>{copy.result}</h3>
            <div className="g-guide-screen__place">
              <strong>{copy.place}</strong>
              <small>{copy.district}</small>
              <span>{copy.reason}</span>
              <em>{copy.fit}</em>
            </div>
          </>
        )}
      </div>
      <div className="g-guide-phone__island" aria-hidden="true">
        <img alt="" src={`${ASSET_ROOT}/phone-island.svg`} />
      </div>
    </div>
  );
}

function LaptopMockup({ copy }: { copy: GuideCopy }) {
  return (
    <div className="g-guide-laptop" aria-label={copy.laptopLabel}>
      <div className="g-guide-laptop__screen">
        <div className="g-guide-laptop__chrome"><span /><span /><span /><b>Gurman / workspace</b></div>
        <div className="g-guide-laptop__body">
          <aside>
            <strong>Gurman</strong>
            <small>Plan a place</small>
            <span className="is-active">01&nbsp; Describe</span>
            <span>02&nbsp; Understand</span>
            <span>03&nbsp; Decide</span>
          </aside>
          <div className="g-guide-laptop__content">
            <p className="g-guide-screen__eyebrow">{copy.understood}</p>
            <h3>{copy.request}</h3>
            <div className="g-guide-laptop__chips"><span>Yunusabad</span><span>4 people</span><span>Quiet</span><span>Under 300k</span></div>
            <div className="g-guide-laptop__divider" />
            <div className="g-guide-laptop__result-head"><strong>{copy.result}</strong><small>Based on real catalogue records</small></div>
            <div className="g-guide-laptop__result">
              <div className="g-guide-laptop__result-avatar">CC</div>
              <div><strong>{copy.place}</strong><small>{copy.district}</small></div>
              <div className="g-guide-laptop__result-reason"><span>{copy.reason}</span><b>{copy.fit}</b></div>
            </div>
            <div className="g-guide-laptop__result g-guide-laptop__result--muted"><div className="g-guide-laptop__result-avatar">TS</div><div><strong>Another real place</strong><small>Tashkent · catalogue record</small></div><div className="g-guide-laptop__result-score">4.7</div></div>
          </div>
        </div>
      </div>
      <div className="g-guide-laptop__base" />
    </div>
  );
}

export function GurmanWorkspaceGuide({ locale }: { locale: Locale }) {
  const copy = COPY[locale];
  const guideRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const guide = guideRef.current;
    if (!guide) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    let current = 0;

    const update = () => {
      frame = 0;
      const rect = guide.getBoundingClientRect();
      const viewport = Math.max(1, window.innerHeight);
      const distance = Math.max(1, guide.offsetHeight - viewport);
      const travelled = clamp(-rect.top, 0, distance);
      const target = travelled / distance;
      // Scroll-driven motion must stay aligned with the scroll position. The
      // previous easing formula used the wrong direction and kept the guide at
      // its initial state for most of the page; CSS transitions then added a
      // second layer of lag.
      current = target;

      const request = smoothstep(0, 0.25, current) * (1 - smoothstep(0.34, 0.56, current));
      const understand = smoothstep(0.3, 0.56, current) * (1 - smoothstep(0.63, 0.79, current));
      const decide = smoothstep(0.61, 0.82, current) * (1 - smoothstep(0.9, 1, current));

      guide.style.setProperty("--guide-progress", current.toFixed(4));
      guide.style.setProperty("--guide-request", request.toFixed(4));
      guide.style.setProperty("--guide-understand", understand.toFixed(4));
      guide.style.setProperty("--guide-decide", decide.toFixed(4));
      guide.classList.toggle("is-ready", current > 0.92);

      if (Math.abs(target - current) > 0.002) requestTick();
    };

    const requestTick = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };

    const onScroll = () => requestTick();
    const onResize = () => requestTick();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    reduceMotion.addEventListener?.("change", onResize);
    requestTick();

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      reduceMotion.removeEventListener?.("change", onResize);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <section ref={guideRef} className="gurman-workspace-guide" id="gurman-onboarding">
      <div className="gurman-workspace-guide__stage">
        <div className="gurman-workspace-guide__intro">
          <div>
            <p className="gurman-workspace-guide__eyebrow">{copy.eyebrow}</p>
            <h2>{copy.title}</h2>
          </div>
          <p>{copy.body}</p>
        </div>

        <div className="gurman-workspace-guide__devices">
          <LaptopMockup copy={copy} />
          <div className="gurman-workspace-guide__phones">
            <PhoneMockup copy={copy} variant="ask" />
            <PhoneMockup copy={copy} variant="decide" />
          </div>
        </div>

        <div className="gurman-workspace-guide__caption">
          <p>{copy.phoneLabel}</p>
          <div className="gurman-workspace-guide__steps">
            {copy.steps.map((step) => (
              <article key={step.number}>
                <span>{step.number}</span>
                <div><h3>{step.title}</h3><p>{step.body}</p></div>
              </article>
            ))}
          </div>
          <a className="gurman-workspace-guide__action" href="#gurman-workstation">
            {copy.action} <span aria-hidden="true">↓</span>
          </a>
        </div>
      </div>
    </section>
  );
}
