import type { Locale } from "@manzil/shared";
import { getLandingCopy } from "../lib/landing-copy";
import { HeaderAuth } from "./header-auth";
import { LocaleSwitcher } from "./locale-switcher";
import { ScrollHeader } from "./motion/scroll-header";
import { SiteNav } from "./site-nav";

export function Header({ locale }: { locale: Locale }) {
  const copy = getLandingCopy(locale);

  return (
    <ScrollHeader>
      <div className="header-left">
        <a className="brand" href={`/${locale}`} aria-label="Manzil">
          Manzil<span aria-hidden="true" className="brand-dot" />
        </a>
        <SiteNav locale={locale} />
      </div>
      <div className="header-actions">
        <LocaleSwitcher locale={locale} />
        <HeaderAuth locale={locale} />
        <a className="header-cta" href={`/${locale}/dashboard`}>{copy.cta}</a>
      </div>
    </ScrollHeader>
  );
}
