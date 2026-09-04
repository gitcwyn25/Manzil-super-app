"use client";

import type { Locale } from "@manzil/shared";
import Image from "next/image";
import Link from "next/link";
import { getBusinessCopy } from "../lib/business-copy";
import { Icon } from "./vm/icons";

const A = "/originkit/footer-01";

const FOOTER_MOBILE_TEXT: Record<Locale, { title: string; desc: string; cta: string }> = {
  uz: {
    title: "Gurman mobil ilovasi tayyorlanmoqda",
    desc: "Gurman mahalliy rejalarni tuzishga yordam beradi. Ilova tayyor bo'lganda birinchi bo'lib xabar oling.",
    cta: "Gurman yangiliklariga yozilish"
  },
  ru: {
    title: "Мобильное приложение Gurman готовится",
    desc: "Gurman поможет планировать местные впечатления. Узнайте первым, когда приложение будет готово.",
    cta: "Получать новости Gurman"
  },
  en: {
    title: "Gurman mobile is being built",
    desc: "Gurman will help people plan local experiences. Hear first when the app is ready.",
    cta: "Join Gurman updates"
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
            <span className="manzil-mock-header__status">Namuna</span>
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
                Mahalliy xizmat
              </div>
              <div className="manzil-mock-catalog__item-sub">Profil ma&apos;lumotlari · Namuna</div>
            </div>
            <div className="manzil-mock-catalog__item">
              <div className="manzil-mock-catalog__item-name">
                Mahalliy restoran
              </div>
              <div className="manzil-mock-catalog__item-sub">Profil ma&apos;lumotlari · Namuna</div>
            </div>
            <div className="manzil-mock-catalog__item">
              <div className="manzil-mock-catalog__item-name">
                Mahalliy kafe
              </div>
              <div className="manzil-mock-catalog__item-sub">Profil ma&apos;lumotlari · Namuna</div>
            </div>
          </div>
        </div>
      </div>

      {/* Center Phone: Manzil discovery */}
      <div className="manzil-phone manzil-phone--center">
        <div className="manzil-phone__notch" />
        <div className="manzil-phone__screen">
          <div className="manzil-mock-header">
            <span className="manzil-mock-header__brand">Manzil Discover</span>
            <span className="manzil-mock-header__status">Namuna</span>
          </div>
          <div className="manzil-mock-chat">
            <div className="manzil-mock-chat__user">
              Toshkentda tinch, mazali qahva va desertlari bor joy top.
            </div>
            <div className="manzil-mock-chat__ai-card">
              <div className="manzil-mock-chat__ai-title">Joy profili namunasi</div>
              <div className="manzil-mock-chat__ai-meta">Mavjud ma&apos;lumotlar · Namuna</div>
              <div className="manzil-mock-chat__ai-desc">
                Joy tavsifi, ish vaqti va aloqa ma&apos;lumotlari shu yerda ko&apos;rinadi.
              </div>
              <span className="manzil-mock-chat__ai-btn">Profilni ko&apos;rish →</span>
            </div>
            <div className="manzil-mock-chat__user">
              Rahmat! Ish vaqti qachongacha?
            </div>
          </div>
        </div>
      </div>

      {/* Right Phone: Manzil business profile preview */}
      <div className="manzil-phone manzil-phone--right">
        <div className="manzil-phone__notch" />
        <div className="manzil-phone__screen">
          <div className="manzil-mock-header">
            <span className="manzil-mock-header__brand">Biznes Kabinet</span>
            <span className="manzil-mock-header__status">Namuna</span>
          </div>
          <div className="manzil-mock-profile">
            <div className="manzil-mock-profile__avatar">M</div>
            <div className="manzil-mock-profile__name">Biznes profili namunasi</div>
            <div className="manzil-mock-profile__stats">
              <div>
                <div className="manzil-mock-profile__stat-num">—</div>
                <div>Reyting profili</div>
              </div>
              <div>
                <div className="manzil-mock-profile__stat-num">—</div>
                <div>Ko&apos;rishlar</div>
              </div>
              <div>
                <div className="manzil-mock-profile__stat-num">—</div>
                <div>Sharhlar</div>
              </div>
            </div>
            <div className="manzil-mock-profile__review">
              <strong>💬 Sharhlar:</strong>
              <div>Foydalanuvchi sharhlari shu yerda ko&apos;rinadi.</div>
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
  const t = FOOTER_MOBILE_TEXT[locale] ?? FOOTER_MOBILE_TEXT.uz;

  const navLinks = [
    { label: locale === "uz" ? "Hujjatlar" : locale === "ru" ? "Документы" : "Docs", href: `/${locale}/docs` },
    { label: locale === "uz" ? "Maxfiylik" : locale === "ru" ? "Конфиденциальность" : "Privacy", href: `/${locale}/legal/privacy` },
    { label: businessCopy.nav.discover, href: `/${locale}/discover` },
    { label: businessCopy.nav.forBusiness, href: `/${locale}/business` },
    { label: businessCopy.footer.pricing, href: `/${locale}/business/pricing` },
    { label: businessCopy.footer.dashboard, href: `/${locale}/dashboard` },
    { label: businessCopy.footer.otherCities, href: `/${locale}/waitlist/city` },
  ];

  return (
    <footer className="manzil-footer">
      <div className="manzil-footer__container">
        {/* Product preview and mobile Gurman waitlist */}
        <div id="gurman-mobile" className="manzil-footer__showcase">
          <ManzilPhonesStage />

          <h2 className="manzil-footer__title">{t.title}</h2>
          <p className="manzil-footer__subtitle">{t.desc}</p>

          <Link className="clever-btn clever-btn--primary" href={`/${locale}/waitlist/gurman`}>
            <span>{t.cta}</span>
            <Icon name="arrow_forward" size={16} />
          </Link>
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
              href="https://x.com/ManzilUz"
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
