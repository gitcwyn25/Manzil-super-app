// Delivered by Originkit · stack: nextjs · styling: tailwind
"use client";

import type { Locale } from "@manzil/shared";
import Link from "next/link";
import Tetris from "./tetris";

type FooterCopy = {
  brandDescription: string;
  columns: Array<{
    title: string;
    links: Array<{ label: string; href: string }>;
  }>;
  socialLabel: string;
  footerLabel: string;
};

const FOOTER_COPY: Record<Locale, FooterCopy> = {
  uz: {
    brandDescription: "Toshkentdagi joylarni haqiqiy sharhlar va Gurman AI bilan toping.",
    columns: [
      {
        title: "Kashf etish",
        links: [
          { label: "Bosh sahifa", href: "/" },
          { label: "Katalog", href: "/discover" },
          { label: "Gurman AI", href: "/concierge" },
          { label: "Hujjatlar", href: "/docs" }
        ]
      },
      {
        title: "Manzil",
        links: [
          { label: "Manzil haqida", href: "/about" },
          { label: "Asoschilar", href: "/founders" },
          { label: "Bog'lanish", href: "/contact" },
          { label: "Biznes uchun", href: "/business" }
        ]
      },
      {
        title: "Ishonch va huquq",
        links: [
          { label: "Foydalanish shartlari", href: "/legal/terms" },
          { label: "Maxfiylik siyosati", href: "/legal/privacy" },
          { label: "Cookie siyosati", href: "/legal/cookies" },
          { label: "Sharhlar qoidalari", href: "/legal/reviews" }
        ]
      }
    ],
    socialLabel: "Ijtimoiy tarmoqlar",
    footerLabel: "Manzil sayti footer'i"
  },
  ru: {
    brandDescription: "Находите места в Ташкенте по честным отзывам и с помощью Gurman AI.",
    columns: [
      {
        title: "Открыть",
        links: [
          { label: "Главная", href: "/" },
          { label: "Каталог", href: "/discover" },
          { label: "Gurman AI", href: "/concierge" },
          { label: "Документы", href: "/docs" }
        ]
      },
      {
        title: "Manzil",
        links: [
          { label: "О Manzil", href: "/about" },
          { label: "Основатели", href: "/founders" },
          { label: "Контакты", href: "/contact" },
          { label: "Для бизнеса", href: "/business" }
        ]
      },
      {
        title: "Доверие и право",
        links: [
          { label: "Условия использования", href: "/legal/terms" },
          { label: "Политика конфиденциальности", href: "/legal/privacy" },
          { label: "Политика cookie", href: "/legal/cookies" },
          { label: "Правила отзывов", href: "/legal/reviews" }
        ]
      }
    ],
    socialLabel: "Социальные сети",
    footerLabel: "Футер сайта Manzil"
  },
  en: {
    brandDescription: "Find places across Tashkent through real reviews and Gurman AI.",
    columns: [
      {
        title: "Explore",
        links: [
          { label: "Home", href: "/" },
          { label: "Discover", href: "/discover" },
          { label: "Gurman AI", href: "/concierge" },
          { label: "Docs", href: "/docs" }
        ]
      },
      {
        title: "Manzil",
        links: [
          { label: "About Manzil", href: "/about" },
          { label: "Founders", href: "/founders" },
          { label: "Contact", href: "/contact" },
          { label: "For business", href: "/business" }
        ]
      },
      {
        title: "Trust & legal",
        links: [
          { label: "Terms of Service", href: "/legal/terms" },
          { label: "Privacy Policy", href: "/legal/privacy" },
          { label: "Cookie Policy", href: "/legal/cookies" },
          { label: "Reviews & rules", href: "/legal/reviews" }
        ]
      }
    ],
    socialLabel: "Social links",
    footerLabel: "Manzil site footer"
  }
};

type SocialIconName = "youtube" | "gmail" | "telegram";

const SOCIAL_LINKS: Array<{
  label: string;
  href: string;
  icon: SocialIconName;
}> = [
  {
    label: "YouTube",
    href: "https://www.youtube.com/@ManzilGroupUz",
    icon: "youtube"
  },
  {
    label: "Gmail",
    href: "mailto:tursunovsunnatilla223@gmail.com",
    icon: "gmail"
  },
  {
    label: "Telegram",
    href: "https://t.me/manzilbiz_bot",
    icon: "telegram"
  }
];

function SocialIcon({ name }: { name: SocialIconName }) {
  if (name === "youtube") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="size-full" fill="currentColor">
        <path d="M21.6 7.2a2.8 2.8 0 0 0-2-2C17.8 4.7 12 4.7 12 4.7s-5.8 0-7.6.5a2.8 2.8 0 0 0-2 2C1.9 8.9 1.9 12 1.9 12s0 3.1.5 4.8a2.8 2.8 0 0 0 2 2c1.8.5 7.6.5 7.6.5s5.8 0 7.6-.5a2.8 2.8 0 0 0 2-2c.5-1.7.5-4.8.5-4.8s0-3.1-.5-4.8ZM10 15.4V8.6l5.8 3.4-5.8 3.4Z" />
      </svg>
    );
  }

  if (name === "gmail") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="size-full" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="m4 7 8 6 8-6" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-full" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="m21 4-3 17-5.5-5.5L9 18l1.5-5.5L21 4Z" />
      <path d="m10.5 12.5 4.8-4.2" />
    </svg>
  );
}

const SOCIAL_SHADOW =
  "0px 17px 2.5px rgba(0,0,0,0), 0px 11px 2px rgba(0,0,0,0.01), 0px 6px 2px rgba(0,0,0,0.05), 0px 3px 1.5px rgba(0,0,0,0.09), 0px 1px 1px rgba(0,0,0,0.1)";

export function Footer({ locale }: { locale: Locale }) {
  const copy = FOOTER_COPY[locale] ?? FOOTER_COPY.uz;
  const localizedColumns = copy.columns.map((column) => ({
    ...column,
    links: column.links.map((link) => ({ ...link, href: `/${locale}${link.href}` }))
  }));

  return (
    <footer
      aria-label={copy.footerLabel}
      className="manzil-footer-02-card relative isolate mx-auto w-full overflow-hidden rounded-[12px]"
    >
      <div className="manzil-footer-02-content relative z-10 flex flex-col gap-8 px-4 pt-10 pb-[300px] ipad:gap-12 ipad:px-12 ipad:pt-12 ipad:pb-[320px] desktop-sm:flex-row desktop-sm:items-stretch desktop-sm:justify-between desktop-sm:gap-0 desktop-sm:px-14 desktop-sm:pt-[72px] desktop-sm:pb-[300px]">
        <div className="flex w-full flex-col gap-6 ipad:gap-8 desktop-sm:w-[190px] desktop-sm:shrink-0 desktop-sm:justify-between desktop-sm:gap-0">
          <div className="flex flex-col gap-2 ipad:gap-4">
            <p className="font-hedvig text-[24px] leading-[1.1] tracking-[-0.96px] text-white/90">
              Manzil
            </p>
            <p className="manzil-footer-02-muted font-sans text-[14px] leading-[1.4]">
              {copy.brandDescription}
            </p>
          </div>

          <ul className="flex items-center gap-4" aria-label={copy.socialLabel}>
            {SOCIAL_LINKS.map((social, index) => (
              <li
                key={social.label}
                className="animate-social-slide-up will-change-transform"
                style={{ animationDelay: `${index * 120}ms` }}
              >
                <a
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className="manzil-footer-02-social relative inline-flex size-10 touch-manipulation items-center justify-center rounded-full transition-opacity duration-200 ease before:absolute before:inset-[-6px] before:content-[''] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white [-webkit-tap-highlight-color:transparent] [@media(hover:hover)_and_(pointer:fine)]:hover:opacity-80"
                  style={{ boxShadow: SOCIAL_SHADOW }}
                >
                  <span className="relative size-5 overflow-clip">
                    <SocialIcon name={social.icon} />
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>

        <nav
          aria-label={copy.footerLabel}
          className="grid w-full grid-cols-2 gap-x-8 gap-y-8 ipad:grid-cols-3 ipad:gap-8 desktop-sm:flex desktop-sm:w-[650px] desktop-sm:shrink-0 desktop-sm:gap-10"
        >
          {localizedColumns.map((column) => (
            <div key={column.title} className="flex min-w-0 flex-col gap-4 desktop-sm:flex-1">
              <p className="font-hedvig text-[18px] leading-normal text-white">
                {column.title}
              </p>
              <ul className="flex flex-col gap-4">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      aria-label={link.label}
                      className="relative inline-flex items-center font-sans text-[16px] leading-normal text-white/80 touch-manipulation transition-opacity duration-200 ease before:absolute before:-inset-y-2 before:-inset-x-1 before:content-[''] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white desktop-sm:text-[14px] [-webkit-tap-highlight-color:transparent] [@media(hover:hover)_and_(pointer:fine)]:hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>

      <div aria-hidden="true" className="manzil-footer-02-board pointer-events-none absolute inset-x-0 bottom-0 z-0 h-[268px] overflow-hidden">
        <Tetris
          boardColor="#212121"
          colors={["#FDF9ED"]}
          cellSize={20}
          gap={0}
          rounded={20}
          dropSpeed={1}
          movement={2}
          startFilled={true}
        />
      </div>
    </footer>
  );
}
