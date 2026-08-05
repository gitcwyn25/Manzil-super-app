import type { Locale } from "@manzil/shared";
import Link from "next/link";
import { getBusinessCopy } from "../lib/business-copy";
import { getLandingCopy } from "../lib/landing-copy";

/**
 * Dark ink-gradient footer on Bootstrap's grid: brand blurb, product, apps
 * and contact columns, then a legal row with the (quiet) admin entry point.
 *
 * `footer.tsx:54`'s old `/{locale}/admin` link resolved to nothing even
 * before this rewrite (the admin page is deleted; only untracked components
 * exist) — restoring that route is out of scope here, so the link is kept
 * exactly as it was.
 */
export function Footer({ locale }: { locale: Locale }) {
  const copy = getBusinessCopy(locale);
  const landing = getLandingCopy(locale);
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="container">
        <div className="row g-4">
          <div className="col-12 col-lg-4">
            <Link href={`/${locale}`} className="site-footer__brand">
              <span className="site-nav__logo" aria-hidden="true" />
              <span className="h5 mb-0">Manzil</span>
            </Link>
            <p className="site-footer__tagline">{copy.footer.tagline}</p>
          </div>

          <div className="col-6 col-lg-2">
            <h4 className="site-footer__heading text-uppercase">{copy.footer.product}</h4>
            <nav aria-label={copy.footer.product} className="site-footer__links">
              <Link href={`/${locale}/business`}>{copy.nav.forBusiness}</Link>
              <Link href={`/${locale}/dashboard`}>{copy.footer.dashboard}</Link>
              <Link href={`/${locale}/waitlist/city`}>{copy.footer.otherCities}</Link>
            </nav>
          </div>

          <div className="col-6 col-lg-2">
            <h4 className="site-footer__heading text-uppercase">{copy.footer.apps}</h4>
            <nav aria-label={copy.footer.apps} className="site-footer__links">
              <Link href={`/${locale}#download`}>{landing.ios}</Link>
              <Link href={`/${locale}#download`}>{landing.android}</Link>
            </nav>
          </div>

          {/* Owners here reach us on Telegram, not email — the bot is listed as a
              peer of the phone numbers rather than tucked under "apps". */}
          <div className="col-12 col-lg-4">
            <h4 className="site-footer__heading text-uppercase">{copy.footer.contact}</h4>
            <nav aria-label={copy.footer.contact} className="site-footer__links">
              <a href="tel:+998885861124">+998 88 586 11 24</a>
              <a href="tel:+998914971207">+998 91 497 12 07</a>
              <a href="https://t.me/manzilbiz_bot" rel="noopener noreferrer" target="_blank">
                @manzilbiz_bot
              </a>
              <a href="mailto:tursunovsunnatilla223@gmail.com">tursunovsunnatilla223@gmail.com</a>
            </nav>
          </div>
        </div>

        <div className="site-footer__legal">
          <span>
            © {year} Manzil. {copy.footer.rights}{" "}
            {/* Intentionally low-key: the admin console entry point. */}
            <Link className="site-footer__admin" href={`/${locale}/admin`}>{copy.nav.admin}</Link>
          </span>
          <span className="site-footer__locales">UZ · RU · EN</span>
        </div>
      </div>
    </footer>
  );
}
