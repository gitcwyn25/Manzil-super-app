import type { Locale } from "@manzil/shared";
import Link from "next/link";
import { getLandingCopy } from "../lib/landing-copy";
import { HeaderAuth, WorkspaceSwitch } from "./header-auth";
import { LocaleSwitcher } from "./locale-switcher";
import { SiteNav } from "./site-nav";

// Keep in sync with mobile-nav.tsx's `PANEL_ID` / `MENU_LABEL` — see that
// file for why the trigger below carries no React state of its own.
const MOBILE_NAV_PANEL_ID = "mobile-nav-panel";
const MENU_LABEL: Record<Locale, string> = { uz: "Menyu", ru: "Меню", en: "Menu" };

// The lg+ search pill submits a plain GET to /{locale}/discover?q= — the
// discover page already reads ?q= server-side, so search works with no JS.
const SEARCH_LABEL: Record<Locale, string> = {
  uz: "Joy yoki xizmat qidiring",
  ru: "Поиск мест и услуг",
  en: "Search places and services"
};

/**
 * Sticky white nav: logo, centered desktop links, and right-side actions.
 * Stays a server component — the mobile menu trigger is a plain
 * `data-bs-toggle="offcanvas"` button (Bootstrap's own data-api opens the
 * panel mobile-nav.tsx renders elsewhere in the tree), so no client-side
 * state is needed here.
 */
export function Header({ locale }: { locale: Locale }) {
  const copy = getLandingCopy(locale);

  return (
    <header className="site-nav sticky-top" data-shell-nav>
      <div className="container site-nav__row">
        <Link href={`/${locale}`} className="site-nav__brand" aria-label="Manzil">
          <span className="site-nav__logo" aria-hidden="true" />
          Manzil
        </Link>

        <SiteNav locale={locale} />

        <div className="site-nav__actions">
          <form
            action={`/${locale}/discover`}
            className="site-nav__search d-none d-lg-flex"
            method="get"
            role="search"
          >
            <svg aria-hidden="true" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="18" height="18">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
            <input
              aria-label={SEARCH_LABEL[locale]}
              className="site-nav__search-input"
              name="q"
              placeholder={SEARCH_LABEL[locale]}
              type="search"
            />
          </form>
          <LocaleSwitcher locale={locale} />
          <WorkspaceSwitch locale={locale} />
          <HeaderAuth locale={locale} />
          <Link className="site-nav__pill d-none d-lg-inline-flex" href={`/${locale}/business/register`}>
            {copy.cta}
          </Link>
          <button
            type="button"
            className="mobile-nav-toggle d-lg-none"
            data-bs-toggle="offcanvas"
            data-bs-target={`#${MOBILE_NAV_PANEL_ID}`}
            aria-controls={MOBILE_NAV_PANEL_ID}
            aria-label={MENU_LABEL[locale]}
          >
            <svg aria-hidden="true" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2" viewBox="0 0 24 24" width="22" height="22">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}
