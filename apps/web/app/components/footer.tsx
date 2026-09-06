"use client";

import type { Locale } from "@manzil/shared";
import Link from "next/link";
import { CompanionLoop } from "./media/companion-loop";
import { getBusinessCopy } from "../lib/business-copy";
import { Icon } from "./vm/icons";

const FOOTER_MOBILE_TEXT: Record<Locale, { title: string; desc: string; cta: string }> = {
  uz: {
    title: "Gurman mobil ilovasi tayyorlanmoqda",
    desc: "Gurman mahalliy rejalarni tuzishga yordam beradi. Ilova tayyor bo'lganda birinchi bo'lib xabar oling.",
    cta: "Gurman yangiliklariga yoziling"
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

const FOOTER_FOLLOW_TEXT: Record<Locale, { eyebrow: string; title: string; description: string }> = {
  uz: {
    eyebrow: "Manzil / Aloqa",
    title: "Bizni kuzating",
    description: "Yangiliklar, g'oyalar va Manzilning keyingi qadamlari.",
  },
  ru: {
    eyebrow: "Manzil / Контакты",
    title: "Следите за нами",
    description: "Новости, идеи и следующие шаги Manzil.",
  },
  en: {
    eyebrow: "Manzil / Contact",
    title: "Follow us",
    description: "News, ideas, and the next steps for Manzil.",
  },
};

type FooterIconName = "instagram" | "youtube" | "x" | "gmail" | "telegram" | "phone";

function FooterIcon({ name }: { name: FooterIconName }) {
  if (name === "instagram") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3.5" y="3.5" width="17" height="17" rx="4.5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.7" cy="6.4" r=".8" fill="currentColor" stroke="none" />
      </svg>
    );
  }

  if (name === "youtube") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
        <path d="M21.6 7.2a2.8 2.8 0 0 0-2-2C17.8 4.7 12 4.7 12 4.7s-5.8 0-7.6.5a2.8 2.8 0 0 0-2 2C1.9 8.9 1.9 12 1.9 12s0 3.1.5 4.8a2.8 2.8 0 0 0 2 2c1.8.5 7.6.5 7.6.5s5.8 0 7.6-.5a2.8 2.8 0 0 0 2-2c.5-1.7.5-4.8.5-4.8s0-3.1-.5-4.8ZM10 15.4V8.6l5.8 3.4-5.8 3.4Z" />
      </svg>
    );
  }

  if (name === "x") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <path d="m5 4 14 16M19 4 5 20" />
      </svg>
    );
  }

  if (name === "telegram") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="m21 4-3 17-5.5-5.5L9 18l1.5-5.5L21 4Z" />
        <path d="m10.5 12.5 4.8-4.2" />
      </svg>
    );
  }

  if (name === "phone") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M7.2 3.8 9.6 3l2 4.8-2.2 1.4a14.2 14.2 0 0 0 5.4 5.4l1.4-2.2 4.8 2-.8 2.4a2.2 2.2 0 0 1-2.5 1.5C10.7 17.2 6.8 13.3 5.1 6.3a2.2 2.2 0 0 1 1.5-2.5Z" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none">
      <path d="M3 5.8v12.4h3V8.1L12 12.4l6-4.3v10.1h3V5.8l-3 2.1-6 4.3-6-4.3-3-2.1Z" fill="#EA4335" />
      <path d="M3 5.8v12.4h3V8.1L3 5.8Z" fill="#4285F4" />
      <path d="M18 8.1v10.1h3V5.8l-3 2.3Z" fill="#34A853" />
      <path d="m3 5.8 3 2.3 6 4.3 6-4.3 3-2.3" stroke="#FBBC04" strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function FooterAddress({ icon, label, href, external = false }: { icon: FooterIconName; label: string; href: string; external?: boolean }) {
  return (
    <a className="manzil-footer-follow__link" href={href} target={external ? "_blank" : undefined} rel={external ? "noopener noreferrer" : undefined}>
      <span className="manzil-footer-follow__icon"><FooterIcon name={icon} /></span>
      <span>{label}</span>
    </a>
  );
}

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
  const follow = FOOTER_FOLLOW_TEXT[locale] ?? FOOTER_FOLLOW_TEXT.uz;

  const navLinks = [
    { label: locale === "uz" ? "Hujjatlar" : locale === "ru" ? "Документы" : "Docs", href: `/${locale}/docs` },
    { label: locale === "uz" ? "Maxfiylik" : locale === "ru" ? "Конфиденциальность" : "Privacy", href: `/${locale}/legal/privacy` },
    { label: businessCopy.nav.discover, href: `/${locale}/discover` },
    { label: businessCopy.footer.pricing, href: `/${locale}/business/pricing` },
    { label: businessCopy.footer.dashboard, href: `/${locale}/dashboard` },
    { label: businessCopy.footer.otherCities, href: `/${locale}/waitlist/city` },
  ];

  return (
    <footer className="manzil-footer">
      <div className="manzil-footer__container">
        <div className="manzil-footer__top">
          <section id="gurman-mobile" className="manzil-footer__showcase" aria-labelledby="footer-gurman-title">
            <div className="manzil-footer__phones">
              <ManzilPhonesStage />
            </div>
            <span className="manzil-footer__eyebrow">{t.title}</span>
            <h2 id="footer-gurman-title" className="manzil-footer__title">Gurman mobile</h2>
            <p className="manzil-footer__subtitle">{t.desc}</p>

            <Link className="manzil-footer__cta" href={`/${locale}/waitlist/gurman`}>
              <span className="manzil-footer__cta-icon"><FooterIcon name="gmail" /></span>
              <span>{t.cta}</span>
              <Icon name="arrow_forward" size={16} />
            </Link>
          </section>

          <section className="manzil-footer-follow" aria-labelledby="footer-follow-title">
            <span className="manzil-footer-follow__eyebrow">{follow.eyebrow}</span>
            <h2 id="footer-follow-title">{follow.title}</h2>
            <p>{follow.description}</p>
            <div className="manzil-footer-follow__links">
              <FooterAddress icon="instagram" label="instagram.com" href="https://instagram.com" external />
              <FooterAddress icon="youtube" label="youtube.com/@ManzilGroupUz" href="https://www.youtube.com/@ManzilGroupUz" external />
              <FooterAddress icon="x" label="x.com/ManzilUz" href="https://x.com/ManzilUz" external />
            </div>
            <div className="manzil-footer-follow__contact">
              <FooterAddress icon="gmail" label="tursunovsunnatilla223@gmail.com" href="mailto:tursunovsunnatilla223@gmail.com" />
              <FooterAddress icon="telegram" label="@manzilbiz_bot" href="https://t.me/manzilbiz_bot" external />
              <FooterAddress icon="phone" label="+998 88 586 11 24" href="tel:+998885861124" />
            </div>
          </section>

          <section className="manzil-footer-companions" aria-labelledby="footer-companions-title">
            <span className="manzil-footer-companions__eyebrow">Manzil / {locale === "uz" ? "Jamoa" : locale === "ru" ? "Команда" : "Team"}</span>
            <h2 id="footer-companions-title">{locale === "uz" ? "Hamrohlaringiz bilan tanishing" : locale === "ru" ? "Познакомьтесь с командой" : "Meet your companions"}</h2>
            <div className="manzil-footer-companions__video">
              <CompanionLoop
                alt="Manzil companions together"
                className="companion-loop"
                decorative={false}
                src="/media/founders/together-transparent-alpha.webp"
              />
            </div>
          </section>
        </div>

        <nav aria-label="Footer Navigation" className="manzil-footer-nav">
          {navLinks.map((link) => (
            <Link key={link.label} className="manzil-nav-pill" href={link.href}>
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="manzil-footer-bottom">
          <div className="manzil-footer-bottom__left">
            &copy; {year} Manzil. {businessCopy.footer.rights}
          </div>
        </div>
      </div>
    </footer>
  );
}
