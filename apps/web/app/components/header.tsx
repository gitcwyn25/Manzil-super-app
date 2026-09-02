import type { Locale } from "@manzil/shared";
import Link from "next/link";
import { getLandingCopy } from "../lib/landing-copy";
import { HeaderAuth, WorkspaceSwitch } from "./header-auth";
import { LocaleSwitcher } from "./locale-switcher";
import { SiteNav } from "./site-nav";
import { ThemeSwitcher } from "./theme-switcher";

const MOBILE_NAV_PANEL_ID = "mobile-nav-panel";
const MENU_LABEL: Record<Locale, string> = { uz: "Menyu", ru: "Меню", en: "Menu" };

const SEARCH_LABEL: Record<Locale, string> = {
  uz: "Joy yoki xizmat qidiring…",
  ru: "Поиск мест и услуг…",
  en: "Search places & services…"
};

/**
 * Clever-styled floating glass header: brand logo, center pill nav links, search, and action pills.
 */
export function Header({ locale }: { locale: Locale }) {
  const copy = getLandingCopy(locale);

  return (
    <header className="site-nav sticky-top clever-nav-wrapper" data-shell-nav>
      <div className="container site-nav__row clever-nav-row">
        {/* Brand Logo */}
        <Link href={`/${locale}`} className="site-nav__brand clever-brand" aria-label="Manzil">
          <span className="site-nav__logo clever-logo" aria-hidden="true" />
          <span className="clever-brand-text">Manzil</span>
        </Link>

        {/* Center Pill Navigation */}
        <SiteNav locale={locale} />

        {/* Right Actions */}
        <div className="site-nav__actions clever-nav-actions">
          <form
            action={`/${locale}/discover`}
            className="site-nav__search clever-nav-search d-none d-xl-flex"
            method="get"
            role="search"
          >
            <svg
              aria-hidden="true"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              width="16"
              height="16"
              className="clever-search-icon"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
            <input
              aria-label={SEARCH_LABEL[locale]}
              className="site-nav__search-input clever-search-input"
              name="q"
              placeholder={SEARCH_LABEL[locale]}
              type="search"
            />
          </form>

          <LocaleSwitcher locale={locale} />
          <ThemeSwitcher locale={locale} />
          <WorkspaceSwitch locale={locale} />
          <HeaderAuth locale={locale} />

          <Link
            className="clever-btn clever-btn--primary clever-btn--sm d-none d-lg-inline-flex"
            href={`/${locale}/business/register`}
          >
            <span>{copy.cta}</span>
          </Link>

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
