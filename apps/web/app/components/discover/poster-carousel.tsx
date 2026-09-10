"use client";

import type { Locale } from "@manzil/shared";
import Link from "next/link";
import { useEffect, useState } from "react";

type PosterCopy = { headline: string; cta: string; label: string };
type PosterSlide = { slug: string; image: string; alt: string; copy: Record<Locale, PosterCopy> };
const copy = (uz: PosterCopy, ru: PosterCopy, en: PosterCopy): Record<Locale, PosterCopy> => ({ uz, ru, en });
const POSTER_SLIDES: PosterSlide[] = [
  { slug: "parking", image: "/discover/posters/parking.png", alt: "A driver finding a parking space on a Tashkent street at dusk", copy: copy({ headline: "Rejalaringiz uchun joy toping", cta: "Avtoturargoh", label: "Avto va xizmatlar" }, { headline: "Найдите место для своих планов", cta: "Парковка", label: "Авто и услуги" }, { headline: "Make room for your plans", cta: "Find parking", label: "Auto & Services" }) },
  { slug: "pet-groomers", image: "/discover/posters/pet-groomers.png", alt: "A pet groomer brushing a happy dog in a bright salon", copy: copy({ headline: "Har bir dumchani quvonch bilan likillatiring", cta: "Uy hayvonlari parvarishi", label: "Ko'proq" }, { headline: "Пусть каждый хвостик виляет от радости", cta: "Груминг", label: "Ещё" }, { headline: "Make every tail wag", cta: "Pet grooming", label: "More" }) },
  { slug: "gyms", image: "/discover/posters/gyms.png", alt: "People training together in a bright neighborhood gym", copy: copy({ headline: "Kuchliroq tartibingizni toping", cta: "Sport zallari", label: "Ko'proq" }, { headline: "Найдите свой путь к силе", cta: "Фитнес-залы", label: "Ещё" }, { headline: "Find your stronger routine", cta: "Find gyms", label: "More" }) },
  { slug: "laundromats", image: "/discover/posters/laundromats.png", alt: "Freshly folded laundry in a clean modern laundromat", copy: copy({ headline: "Toza kiyim, kamroq tashvish", cta: "Kir yuvish joylari", label: "Ko'proq" }, { headline: "Чистая одежда без лишних хлопот", cta: "Прачечные", label: "Ещё" }, { headline: "Fresh clothes, less hassle", cta: "Find laundromats", label: "More" }) },
  { slug: "bars-nightlife", image: "/discover/posters/bars-nightlife.png", alt: "Friends talking together in a warm neighborhood bar", copy: copy({ headline: "Bugungi kechani unutilmas qiling", cta: "Tungi hayot", label: "Sayohat va faoliyat" }, { headline: "Сделайте этот вечер особенным", cta: "Ночная жизнь", label: "Путешествия и досуг" }, { headline: "Make tonight worth going out", cta: "Find nightlife", label: "Travel & Activities" }) },
  { slug: "barbers", image: "/discover/posters/barbers.png", alt: "A barber giving a precise haircut in a classic neighborhood barbershop", copy: copy({ headline: "Aniq kesim, mahalliy mahorat", cta: "Sartaroshlar", label: "Salomatlik va go'zallik" }, { headline: "Точная стрижка, местное мастерство", cta: "Барбершопы", label: "Здоровье и красота" }, { headline: "Sharp cuts, local talent", cta: "Find barbers", label: "Health & Beauty" }) },
  { slug: "physical-therapy", image: "/discover/posters/physical-therapy.png", alt: "A physical therapist guiding an adult through a gentle exercise", copy: copy({ headline: "Ishonch bilan oldinga yuring", cta: "Fizioterapiya", label: "Salomatlik va go'zallik" }, { headline: "Двигайтесь вперёд уверенно", cta: "Физиотерапия", label: "Здоровье и красота" }, { headline: "Move forward with confidence", cta: "Find physical therapy", label: "Health & Beauty" }) },
  { slug: "tires", image: "/discover/posters/tires.png", alt: "A tire specialist inspecting a tire in a clean service center", copy: copy({ headline: "Yo'lni ishonch bilan ushlang", cta: "Shinalar", label: "Avto va xizmatlar" }, { headline: "Уверенно держите дорогу", cta: "Шины", label: "Авто и услуги" }, { headline: "Grip the road with confidence", cta: "Find tires", label: "Auto & Services" }) },
  { slug: "auto-repair", image: "/discover/posters/auto-repair.png", alt: "A mechanic inspecting a car engine in an independent garage", copy: copy({ headline: "Yo'lga yana chiqing", cta: "Avto ta'mirlash", label: "Avto va xizmatlar" }, { headline: "Возвращайтесь на дорогу", cta: "Автосервис", label: "Авто и услуги" }, { headline: "Get back on the road", cta: "Auto repair", label: "Auto & Services" }) },
  { slug: "florists", image: "/discover/posters/florists.png", alt: "A florist arranging a colorful bouquet in a local flower shop", copy: copy({ headline: "Hayotingizga ko'proq gullar qo'shing", cta: "Gul do'konlari", label: "Uy va bog'" }, { headline: "Добавьте в жизнь больше цветов", cta: "Найти цветы", label: "Дом и сад" }, { headline: "Bring more flowers into life", cta: "Find florists", label: "Home & Garden" }) },
  { slug: "home-cleaning", image: "/discover/posters/home-cleaning.png", alt: "A professional cleaner refreshing a bright home interior", copy: copy({ headline: "Toza uyga qayting", cta: "Tozalash xizmatlari", label: "Uy va bog'" }, { headline: "Возвращайтесь в чистый дом", cta: "Уборка домов", label: "Дом и сад" }, { headline: "Come home to clean", cta: "Find cleaners", label: "Home & Garden" }) },
  { slug: "plumbers", image: "/discover/posters/plumbers.png", alt: "A plumber repairing an under-sink pipe connection", copy: copy({ headline: "Oqishni tarqalishidan oldin to'xtating", cta: "Santexniklar", label: "Uy va bog'" }, { headline: "Остановите протечку вовремя", cta: "Сантехники", label: "Дом и сад" }, { headline: "Stop leaks before they spread", cta: "Find plumbers", label: "Home & Garden" }) },
  { slug: "bakeries", image: "/discover/posters/bakeries.png", alt: "A baker presenting fresh bread and pastries in a neighborhood bakery", copy: copy({ headline: "Tandirdan yangi uzilgan", cta: "Nonvoyxonalar", label: "Restoranlar" }, { headline: "Прямо из печи", cta: "Найти пекарни", label: "Рестораны" }, { headline: "Fresh from the oven", cta: "Find bakeries", label: "Restaurants" }) },
  { slug: "coffee-cafes", image: "/discover/posters/coffee-cafes.png", alt: "A barista pouring coffee in a warm independent cafe", copy: copy({ headline: "Kundalik qahvangiz shu yerda", cta: "Qahva topish", label: "Restoranlar" }, { headline: "Ваша ежедневная чашка ждёт", cta: "Найти кофе", label: "Рестораны" }, { headline: "Your daily cup awaits", cta: "Find coffee", label: "Restaurants" }) },
  { slug: "delivery", image: "/discover/posters/delivery.png", alt: "A food courier delivering a meal to an apartment doorway", copy: copy({ headline: "Kechki ovqat yo'lda", cta: "Yetkazib berish", label: "Restoranlar" }, { headline: "Ужин уже в пути", cta: "Доставка", label: "Рестораны" }, { headline: "Dinner is on its way", cta: "Food delivery", label: "Restaurants" }) },
  { slug: "takeout", image: "/discover/posters/takeout.png", alt: "A neighborhood takeout counter handing over a fresh meal", copy: copy({ headline: "Mazali taom, kutishsiz", cta: "Olib ketish", label: "Restoranlar" }, { headline: "Вкусная еда без ожидания", cta: "Еда с собой", label: "Рестораны" }, { headline: "Good food, no waiting", cta: "Takeout", label: "Restaurants" }) }
];

export function DiscoverPosterCarousel({ locale }: { locale: Locale }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = POSTER_SLIDES[activeIndex];
  const activeCopy = active.copy[locale] ?? active.copy.en;

  useEffect(() => {
    const timer = window.setInterval(() => setActiveIndex((current) => (current + 1) % POSTER_SLIDES.length), 6500);
    return () => window.clearInterval(timer);
  }, []);

  function move(direction: -1 | 1) {
    setActiveIndex((current) => (current + direction + POSTER_SLIDES.length) % POSTER_SLIDES.length);
  }

  return (
    <section className="discover-poster-section container" aria-label={locale === "uz" ? "Tavsiya etilgan yo'nalishlar" : locale === "ru" ? "Рекомендуемые направления" : "Featured directions"}>
      <div className="discover-poster-carousel">
        <div className="discover-poster-carousel__media">
          <img src={active.image} alt={active.alt} className="discover-poster-carousel__image" />
          <div className="discover-poster-carousel__shade" aria-hidden="true" />
          <div className="discover-poster-carousel__copy">
            <span className="discover-poster-carousel__label">{activeCopy.label}</span>
            <h1>{activeCopy.headline}</h1>
            <Link className="discover-poster-carousel__cta" href={"/" + locale + "/discover?category=" + active.slug}>
              <span>{activeCopy.cta}</span><span aria-hidden="true">↗</span>
            </Link>
          </div>
          <div className="discover-poster-carousel__controls">
            <button type="button" onClick={() => move(-1)} aria-label={locale === "uz" ? "Oldingi poster" : locale === "ru" ? "Предыдущий постер" : "Previous poster"}>←</button>
            <span>{String(activeIndex + 1).padStart(2, "0")} / {String(POSTER_SLIDES.length).padStart(2, "0")}</span>
            <button type="button" onClick={() => move(1)} aria-label={locale === "uz" ? "Keyingi poster" : locale === "ru" ? "Следующий постер" : "Next poster"}>→</button>
          </div>
        </div>
        <div className="discover-poster-carousel__rail" aria-label={locale === "uz" ? "Posterlar" : locale === "ru" ? "Постеры" : "Posters"}>
          {POSTER_SLIDES.map((slide, index) => {
            const slideCopy = slide.copy[locale] ?? slide.copy.en;
            return <button type="button" key={slide.slug} className={"discover-poster-carousel__thumb " + (index === activeIndex ? "is-active" : "")} onClick={() => setActiveIndex(index)} aria-label={slideCopy.cta} aria-pressed={index === activeIndex}><img src={slide.image} alt="" aria-hidden="true" /><span>{slideCopy.cta}</span></button>;
          })}
        </div>
      </div>
    </section>
  );
}
