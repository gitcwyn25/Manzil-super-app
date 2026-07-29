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

        {/* Owners here reach us on Telegram, not email — the bot is listed as a
            peer of the phone numbers rather than tucked under "apps". */}
        <nav aria-label={copy.footer.contact} className="lp-footer-col">
          <h4>{copy.footer.contact}</h4>
          <a href="tel:+998885861124">+998 88 586 11 24</a>
          <a href="tel:+998914971207">+998 91 497 12 07</a>
          <a href="https://t.me/manzilbiz_bot" rel="noopener noreferrer" target="_blank">
            @manzilbiz_bot
          </a>
          <a href="mailto:tursunovsunnatilla223@gmail.com">tursunovsunnatilla223@gmail.com</a>
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
