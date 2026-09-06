"use client";

import type { Locale } from "@manzil/shared";
import Link from "next/link";
import { LocaleSwitcher } from "./locale-switcher";
import { SiteNav } from "./site-nav";

const MOBILE_NAV_PANEL_ID = "mobile-nav-panel";
const MENU_LABEL: Record<Locale, string> = { uz: "Menyu", ru: "Меню", en: "Menu" };

/**
 * Shared liquid-glass site header: logo at left, the four public destinations
 * in the center, and language/theme controls at right. Account, dashboard,
 * start, and search actions stay out of this public navigation surface.
 */
export function Header({ locale }: { locale: Locale }) {
  return (
    <header className="site-nav sticky-top clever-nav-wrapper" data-shell-nav>
      <div className="container site-nav__row clever-nav-row">
        <Link href={`/${locale}`} className="site-nav__brand clever-brand" aria-label="Manzil home">
          <span className="site-nav__logo clever-logo" aria-hidden="true" />
        </Link>

        <SiteNav locale={locale} />

        <div className="site-nav__actions clever-nav-actions">
          <LocaleSwitcher locale={locale} />

          <button
            type="button"
            className="mobile-nav-toggle d-lg-none clever-mobile-toggle"
            data-bs-toggle="offcanvas"
            data-bs-target={`#${MOBILE_NAV_PANEL_ID}`}
            aria-controls={MOBILE_NAV_PANEL_ID}
            aria-label={MENU_LABEL[locale]}
          >
            <svg
              aria-hidden="true"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              width="22"
              height="22"
            >
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}
