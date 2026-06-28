import type { Locale } from "@manzil/shared";
import { getUiCopy } from "@manzil/shared";
import { MobileSiteNav } from "./site-nav";

export function MobileNav({ locale }: { locale: Locale }) {
  return <MobileSiteNav locale={locale} />;
}

export function Footer({ locale }: { locale: Locale }) {
  const copy = getUiCopy(locale);

  return (
    <footer className="site-footer">
      <div>
        <strong>Manzil</strong>
        <p>{copy.brand.tagline}</p>
      </div>
      <div className="footer-links">
        <a href={`/${locale}/discover`}>{copy.footer.discover}</a>
        <a href={`/${locale}/concierge`}>{copy.footer.concierge}</a>
        <a href={`/${locale}/profile`}>{copy.footer.profile}</a>
        <a href={`/${locale}/business/pricing`}>{copy.footer.business}</a>
      </div>
    </footer>
  );
}
