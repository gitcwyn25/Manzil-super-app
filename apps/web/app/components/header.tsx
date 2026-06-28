import type { Locale } from "@manzil/shared";
import { getUiCopy } from "@manzil/shared";
import { HeaderAuth } from "./header-auth";
import { LocaleSwitcher } from "./locale-switcher";
import { SiteNav } from "./site-nav";

export function Header({ locale }: { locale: Locale }) {
  const copy = getUiCopy(locale);

  return (
    <header className="site-header glass-bar">
      <a className="brand" href={`/${locale}`} aria-label="Manzil bosh sahifa">
        <span className="brand-mark">M</span>
        <span>Manzil</span>
      </a>
      <SiteNav locale={locale} />
      <div className="header-actions">
        <LocaleSwitcher locale={locale} />
        <HeaderAuth locale={locale} />
        <a className="ghost-button" href={`/${locale}/business/pricing`}>{copy.nav.business}</a>
        <a className="primary-button small" href={`/${locale}/discover`}>{copy.nav.search}</a>
      </div>
    </header>
  );
}
