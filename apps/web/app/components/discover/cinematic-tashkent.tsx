"use client";

import type { BusinessPlatform, Locale, Occasion } from "@manzil/shared";
import Link from "next/link";
import { pickLocalized } from "../../lib/locale-text";

const TASHKENT_HERO_BG = "https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=2000&q=85";

const ANCIENT_IMG = "https://images.unsplash.com/photo-1569154941061-e231b4725ef1?auto=format&fit=crop&w=1200&q=80";
const MODERN_IMG = "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1200&q=80";

const DISTRICTS = [
  "Chilonzor",
  "Mirobod",
  "Yunusobod",
  "Yakkasaroy",
  "Shayxontohur",
  "Mirzo Ulug'bek",
  "Olmazor",
  "Uchtepa",
  "Sergeli"
];

export function CinematicTashkent({
  locale,
  businesses,
  occasions
}: {
  locale: Locale;
  businesses: BusinessPlatform[];
  occasions: Occasion[];
}) {
  return (
    <>
      {/* 1. HERO SECTION WITH REAL TASHKENT SCENERY */}
      <section className="tashkent-cinema-hero" aria-label="Toshkent shahri">
        <div className="tashkent-cinema-hero__bg">
          <img
            alt="Toshkent shahar panoramasi"
            className="tashkent-cinema-hero__bg-img"
            src={TASHKENT_HERO_BG}
          />
          <div className="tashkent-cinema-hero__overlay" />
        </div>

        <div className="tashkent-cinema-hero__content">
          <div className="tashkent-cinema-hero__eyebrow">
            <span>✨</span>
            <span>Toshkent Shahri · Sara Maskanlar</span>
          </div>

          <h1 className="tashkent-cinema-hero__title">TOSHKENT</h1>

          <p className="tashkent-cinema-hero__desc">
            Qadimiy Chorsu va Hazrati Imom an&apos;analari, zamonaviy Tashkent City ritmi va shaharning barcha sara maskanlari bitta qulay platformada.
          </p>

          {/* District Navigation Pills */}
          <div className="tashkent-cinema-hero__districts">
            {DISTRICTS.map((district) => (
              <a
                className="tashkent-cinema-hero__district-pill"
                href="#catalog"
                key={district}
              >
                📍 {district}
              </a>
            ))}
          </div>

          {/* Verified Stats */}
          <div className="tashkent-cinema-hero__stats-row">
            <div className="tashkent-cinema-hero__stat-item">
              <div className="tashkent-cinema-hero__stat-num">1,450+</div>
              <div className="tashkent-cinema-hero__stat-lbl">Sara maskanlar</div>
            </div>
            <div className="tashkent-cinema-hero__stat-item">
              <div className="tashkent-cinema-hero__stat-num">12 ta</div>
              <div className="tashkent-cinema-hero__stat-lbl">Toshkent tumanlari</div>
            </div>
            <div className="tashkent-cinema-hero__stat-item">
              <div className="tashkent-cinema-hero__stat-num">100%</div>
              <div className="tashkent-cinema-hero__stat-lbl">Haqiqiy sharhlar</div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. DUAL SHOWCASE: ANCIENT HERITAGE & MODERN LIFESTYLE */}
      <section className="tashkent-dual-showcase">
        <div className="container">
          <div className="tashkent-dual-showcase__grid">
            
            {/* Ancient Heritage Card */}
            <a className="tashkent-dual-showcase__card" href="#catalog">
              <img
                alt="Qadimiy Toshkent madaniyati"
                className="tashkent-dual-showcase__card-bg"
                src={ANCIENT_IMG}
              />
              <div className="tashkent-dual-showcase__card-overlay" />
              <div className="tashkent-dual-showcase__card-content">
                <span className="tashkent-dual-showcase__card-tag">Qadimiy Meros</span>
                <h3 className="tashkent-dual-showcase__card-title">Sharqona Lazzat va Milliy Taomlar</h3>
                <p className="tashkent-dual-showcase__card-desc">
                  Hazrati Imom va Chorsu bozorining asriy an&apos;analari, mashhur to&apos;y oshi va mehmondo&apos;st choyxonalar.
                </p>
              </div>
            </a>

            {/* Modern Lifestyle Card */}
            <a className="tashkent-dual-showcase__card" href="#catalog">
              <img
                alt="Zamonaviy Toshkent hayoti"
                className="tashkent-dual-showcase__card-bg"
                src={MODERN_IMG}
              />
              <div className="tashkent-dual-showcase__card-overlay" />
              <div className="tashkent-dual-showcase__card-content">
                <span className="tashkent-dual-showcase__card-tag">Zamonaviy Ritm</span>
                <h3 className="tashkent-dual-showcase__card-title">Shinam Qahvaxonalar & Xizmatlar</h3>
                <p className="tashkent-dual-showcase__card-desc">
                  Tashkent City va zamonaviy markazlardagi maxsus qahva maskanlari, premium avtomoykalar va sokin lounge zallari.
                </p>
              </div>
            </a>

          </div>
        </div>
      </section>
    </>
  );
}
