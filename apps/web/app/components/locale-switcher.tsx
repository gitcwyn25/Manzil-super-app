"use client";

import type { Locale } from "@manzil/shared";
import { locales } from "@manzil/shared";
import { usePathname } from "next/navigation";

const localeLabels: Record<Locale, string> = {
  uz: "🇺🇿 UZ",
  ru: "🇷🇺 RU",
  en: "🇬🇧 EN"
};

export function LocaleSwitcher({ locale }: { locale: Locale }) {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);
  const rest = segments.slice(1).join("/");

  return (
    <div className="locale-switcher" aria-label="Til tanlash">
      {locales.map((item) => {
        const href = rest ? `/${item}/${rest}` : `/${item}`;
        return (
          <a
            className={item === locale ? "language-button active" : "language-button"}
            href={href}
            key={item}
            hrefLang={item}
          >
            {localeLabels[item]}
          </a>
        );
      })}
    </div>
  );
}
