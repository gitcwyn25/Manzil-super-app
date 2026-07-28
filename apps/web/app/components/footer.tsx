import type { Locale } from "@manzil/shared";
import { getBusinessCopy } from "../lib/business-copy";
import { getLandingCopy } from "../lib/landing-copy";
import { MobileSiteNav } from "./site-nav";

export function MobileNav({ locale }: { locale: Locale }) {
  return <MobileSiteNav locale={locale} />;
}

export function Footer({ locale }: { locale: Locale }) {
  const copy = getBusinessCopy(locale);
  const landing = getLandingCopy(locale);
  const year = new Date().getFullYear();

  return (
    <footer className="lp-footer">
      <div className="lp-footer-inner">
        <div className="lp-footer-brand">
          <div>
            <strong>Manzil<span aria-hidden="true" className="brand-dot" /></strong>
            <p>{copy.footer.tagline}</p>
          </div>
        </div>

        <nav aria-label={copy.footer.product} className="lp-footer-col">
          <h4>{copy.footer.product}</h4>
          <a href={`/${locale}/business`}>{copy.nav.forBusiness}</a>
          <a href={`/${locale}/dashboard`}>{copy.footer.dashboard}</a>
          <a href={`/${locale}/waitlist/city`}>{copy.footer.otherCities}</a>
        </nav>

        <nav aria-label={copy.footer.apps} className="lp-footer-col">
          <h4>{copy.footer.apps}</h4>
          <a href={`/${locale}#download`}>{landing.ios}</a>
          <a href={`/${locale}#download`}>{landing.android}</a>
        </nav>
      </div>

      <div className="lp-footer-base">
        <span>© {year} Manzil. {copy.footer.rights}</span>
        {/* Intentionally low-key: the admin console entry point. */}
        <a className="lp-footer-admin" href={`/${locale}/admin`}>{copy.nav.admin}</a>
      </div>
    </footer>
  );
}
