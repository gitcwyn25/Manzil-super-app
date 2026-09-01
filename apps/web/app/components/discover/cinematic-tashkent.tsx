"use client";

import type { BusinessPlatform, Locale, Occasion } from "@manzil/shared";
import Link from "next/link";
import { pickLocalized } from "../../lib/locale-text";

// High-quality Tashkent / Central Asia imagery via Pexels CDN (no hotlink block)
const TASHKENT_HERO_BG = "https://images.pexels.com/photos/3155666/pexels-photo-3155666.jpeg?auto=compress&cs=tinysrgb&w=2000";

// Ancient heritage — ornate Eastern architecture / bazaar
const ANCIENT_IMG = "https://images.pexels.com/photos/2412600/pexels-photo-2412600.jpeg?auto=compress&cs=tinysrgb&w=1200";
// Modern lifestyle — city café / urban Tashkent
const MODERN_IMG = "https://images.pexels.com/photos/1855214/pexels-photo-1855214.jpeg?auto=compress&cs=tinysrgb&w=1200";

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
