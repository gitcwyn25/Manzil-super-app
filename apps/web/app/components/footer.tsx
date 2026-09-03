"use client";

import type { Locale } from "@manzil/shared";
import Image from "next/image";
import Link from "next/link";
import { getBusinessCopy } from "../lib/business-copy";
import { Icon } from "./vm/icons";

const A = "/originkit/footer-01";

const FOOTER_DOWNLOAD_TEXT: Record<Locale, { title: string; desc: string; soon: string }> = {
  uz: {
    title: "Manzil ilovasini yuklab oling",
    desc: "Toshkentning barcha sara joylari, haqiqiy sharhlar va Gurman AI shaxsiy konsyerji cho'ntagingizda.",
    soon: "Tez kunda do'konlarda"
  },
  ru: {
    title: "Приложение Manzil — скоро",
    desc: "Лучшие заведения Ташкента, честные отзывы и персональный AI-консьерж Gurman всегда с вами.",
    soon: "Скоро в магазинах приложений"
  },
  en: {
    title: "Download the Manzil App Today",
    desc: "Discover top verified spots across Tashkent and get tailored recommendations with Gurman AI.",
    soon: "Coming soon to the stores"
  }
};

/**
 * Genuine Manzil Mobile Mockup Stage (3 Layered Phone Devices)
 */
function ManzilPhonesStage() {
  return (
    <div className="manzil-phones-stage" aria-hidden="true">
      {/* Left Phone: Manzil Discover Catalog */}
      <div className="manzil-phone manzil-phone--left">
        <div className="manzil-phone__notch" />
        <div className="manzil-phone__screen">
          <div className="manzil-mock-header">
            <span className="manzil-mock-header__brand">Manzil Katalog</span>
            <span className="manzil-mock-header__status">Toshkent</span>
          </div>
          <div className="manzil-mock-catalog">
            <div className="manzil-mock-catalog__search">🔍 Qidiruv: kafe, restoran...</div>
            <div className="manzil-mock-catalog__chips">
              <span className="manzil-mock-catalog__chip manzil-mock-catalog__chip--active">Barchasi</span>
              <span className="manzil-mock-catalog__chip">Qahva</span>
              <span className="manzil-mock-catalog__chip">Milliy</span>
              <span className="manzil-mock-catalog__chip">Avtoyuvish</span>
            </div>
            <div className="manzil-mock-catalog__item">
              <div className="manzil-mock-catalog__item-name">
                Iwash Avtomoyka <Icon name="verified" size={12} className="text-primary" />
              </div>
              <div className="manzil-mock-catalog__item-sub">⭐ 4.9 (240 sharh) · Yunusobod</div>
            </div>
            <div className="manzil-mock-catalog__item">
              <div className="manzil-mock-catalog__item-name">
                Rayhon Milliy Taomlar <Icon name="verified" size={12} className="text-primary" />
              </div>
              <div className="manzil-mock-catalog__item-sub">⭐ 4.8 (512 sharh) · Chilonzor</div>
            </div>
            <div className="manzil-mock-catalog__item">
              <div className="manzil-mock-catalog__item-name">
                Breadly Bakery <Icon name="verified" size={12} className="text-primary" />
              </div>
              <div className="manzil-mock-catalog__item-sub">⭐ 4.9 (189 sharh) · Mirobod</div>
            </div>
          </div>
        </div>
      </div>

      {/* Center Phone: Gurman AI Concierge Live Chat */}
      <div className="manzil-phone manzil-phone--center">
        <div className="manzil-phone__notch" />
        <div className="manzil-phone__screen">
          <div className="manzil-mock-header">
            <span className="manzil-mock-header__brand">Gurman AI</span>
            <span className="manzil-mock-header__status">Online</span>
          </div>
          <div className="manzil-mock-chat">
            <div className="manzil-mock-chat__user">
              Toshkentda tinch, mazali qahva va desertlari bor joy tavsiya qil.
            </div>
            <div className="manzil-mock-chat__ai-card">
              <div className="manzil-mock-chat__ai-title">✨ Tavsiya: Breadly Bakery & Café</div>
              <div className="manzil-mock-chat__ai-meta">⭐ 4.9 (189 sharhlar) · Mirobod tumani</div>
              <div className="manzil-mock-chat__ai-desc">
                Mehmonlar sharhlariga ko'ra sokin atmosfera, yangi kruassanlar va ajoyib espresso.
              </div>
              <span className="manzil-mock-chat__ai-btn">Marshrutni ko'rish →</span>
            </div>
            <div className="manzil-mock-chat__user">
              Rahmat! Ish vaqti qachongacha?
            </div>
          </div>
        </div>
      </div>

      {/* Right Phone: Manzil Business Verified Profile */}
      <div className="manzil-phone manzil-phone--right">
        <div className="manzil-phone__notch" />
        <div className="manzil-phone__screen">
          <div className="manzil-mock-header">
            <span className="manzil-mock-header__brand">Biznes Kabinet</span>
            <span className="manzil-mock-header__status">Verified</span>
          </div>
          <div className="manzil-mock-profile">
            <div className="manzil-mock-profile__avatar">VL</div>
            <div className="manzil-mock-profile__name">Vanilla Lounge Café</div>
            <div className="manzil-mock-profile__stats">
              <div>
                <div className="manzil-mock-profile__stat-num">4.9 ★</div>
                <div>Reyting</div>
              </div>
              <div>
                <div className="manzil-mock-profile__stat-num">1.4k</div>
                <div>Ko'rishlar</div>
              </div>
              <div>
                <div className="manzil-mock-profile__stat-num">86</div>
                <div>Sharhlar</div>
              </div>
            </div>
            <div className="manzil-mock-profile__review">
              <strong>💬 So'nggi sharh:</strong>
              <div>&ldquo;Gurman AI orqali topib keldik, qahva va xizmat a'lo darajada!&rdquo;</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Footer({ locale }: { locale: Locale }) {
  const businessCopy = getBusinessCopy(locale);
  const year = new Date().getFullYear();
  const t = FOOTER_DOWNLOAD_TEXT[locale] ?? FOOTER_DOWNLOAD_TEXT.uz;

  const navLinks = [
    { label: locale === "uz" ? "Hujjatlar" : locale === "ru" ? "Документы" : "Docs", href: `/${locale}/docs` },
    { label: locale === "uz" ? "Maxfiylik" : locale === "ru" ? "Конфиденциальность" : "Privacy", href: `/${locale}/legal/privacy` },
    { label: businessCopy.nav.discover, href: `/${locale}/discover` },
    { label: businessCopy.nav.concierge, href: `/${locale}/concierge` },
    { label: businessCopy.nav.forBusiness, href: `/${locale}/business` },
    { label: businessCopy.footer.pricing, href: `/${locale}/business/pricing` },
    { label: businessCopy.footer.dashboard, href: `/${locale}/dashboard` },
    { label: businessCopy.footer.otherCities, href: `/${locale}/waitlist/city` },
  ];

  return (
    <footer className="manzil-footer">
      <div className="manzil-footer__container">
        {/* Phones Hero & App Download Showcase */}
        <div id="download" className="manzil-footer__showcase">
          <ManzilPhonesStage />

          <h2 className="manzil-footer__title">{t.title}</h2>
          <p className="manzil-footer__subtitle">{t.desc}</p>

          <div className="manzil-store-row" aria-label={t.soon}>
            {/* Store listings are not live yet: these are informational badges, not dead links. */}
            <span aria-label={`Google Play — ${t.soon}`} className="manzil-store-btn" role="img">
              <Image
                src={`${A}/google-play.svg`}
                alt=""
                width={28}
                height={28}
                aria-hidden="true"
              />
              <span className="manzil-store-btn__meta">
                <span className="manzil-store-btn__eyebrow">GET IT ON</span>
                <span className="manzil-store-btn__label">Google Play</span>
              </span>
            </span>

            <span aria-label={`App Store — ${t.soon}`} className="manzil-store-btn" role="img">
              <Image
                src={`${A}/app-store.svg`}
                alt=""
                width={28}
                height={28}
                aria-hidden="true"
              />
              <span className="manzil-store-btn__meta">
                <span className="manzil-store-btn__eyebrow">Download on the</span>
                <span className="manzil-store-btn__label">App Store</span>
              </span>
            </span>
          </div>
          <p className="manzil-store-status">{t.soon}</p>
        </div>

        {/* Contact Bar */}
        <div className="manzil-contact-bar">
          <a
            className="manzil-contact-pill"
            href="mailto:tursunovsunnatilla223@gmail.com"
          >
            <Image
              src={`${A}/email.svg`}
              alt=""
              width={18}
              height={18}
              aria-hidden="true"
            />
            <span>tursunovsunnatilla223@gmail.com</span>
          </a>
          <a
            className="manzil-contact-pill"
            href="https://t.me/manzilbiz_bot"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span>💬 @manzilbiz_bot</span>
          </a>
          <a
            className="manzil-contact-pill"
            href="tel:+998885861124"
          >
            <span>📞 +998 88 586 11 24</span>
          </a>
        </div>

        {/* Capsule Navigation Links */}
        <nav aria-label="Footer Navigation" className="manzil-footer-nav">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              className="manzil-nav-pill"
              href={link.href}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Bottom Legal Row */}
        <div className="manzil-footer-bottom">
          <div className="manzil-footer-bottom__left">
            &copy; {year} Manzil. {businessCopy.footer.rights}
          </div>

          {/* Social Channels */}
          <div className="manzil-footer-bottom__socials">
            <a
              aria-label="Telegram"
              className="manzil-footer-bottom__social-btn"
              href="https://t.me/manzilbiz_bot"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Image
                src={`${A}/email.svg`}
                alt=""
                width={18}
                height={18}
                aria-hidden="true"
              />
            </a>
            <a
              aria-label="Instagram"
              className="manzil-footer-bottom__social-btn"
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Image
                src={`${A}/instagram.svg`}
                alt=""
                width={18}
                height={18}
                aria-hidden="true"
              />
            </a>
            <a
              aria-label="LinkedIn"
              className="manzil-footer-bottom__social-btn"
              href="https://linkedin.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Image
                src={`${A}/linkedin.svg`}
                alt=""
                width={18}
                height={18}
                aria-hidden="true"
              />
            </a>
            <a
              aria-label="X"
              className="manzil-footer-bottom__social-btn"
              href="https://x.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Image
                src={`${A}/twitter.svg`}
                alt=""
                width={18}
                height={18}
                aria-hidden="true"
              />
            </a>
          </div>

          <div className="manzil-footer-bottom__links">
            <Link href={`/${locale}/business/plans`}>
              {businessCopy.nav.forBusiness}
            </Link>
            <span>&bull;</span>
            <Link href={`/${locale}/admin`}>
              {businessCopy.nav.admin}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
