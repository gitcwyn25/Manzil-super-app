"use client";

import type { Locale } from "@manzil/shared";
import { getUiCopy } from "@manzil/shared";
import { usePathname } from "next/navigation";

const links = [
  { key: "feed" as const, href: (locale: Locale) => `/${locale}` },
  { key: "discover" as const, href: (locale: Locale) => `/${locale}/discover` },
  { key: "concierge" as const, href: (locale: Locale) => `/${locale}/concierge` },
  { key: "lists" as const, href: (locale: Locale) => `/${locale}/lists` },
  { key: "profile" as const, href: (locale: Locale) => `/${locale}/profile` }
];

export function SiteNav({ locale }: { locale: Locale }) {
  const pathname = usePathname();
  const copy = getUiCopy(locale);

  return (
    <nav className="desktop-nav" aria-label="Asosiy navigatsiya">
      {links.map((link) => {
        const href = link.href(locale);
        const active = pathname === href || (link.key === "feed" && pathname === `/${locale}`);
        return (
          <a className={active ? "active" : undefined} href={href} key={link.key}>
            {copy.nav[link.key]}
          </a>
        );
      })}
    </nav>
  );
}

export function MobileSiteNav({ locale }: { locale: Locale }) {
  const pathname = usePathname();
  const copy = getUiCopy(locale);

  const mobileLinks = [
    { key: "feed" as const, href: `/${locale}`, label: copy.nav.feed },
    { key: "discover" as const, href: `/${locale}/discover`, label: copy.nav.discover },
    { key: "concierge" as const, href: `/${locale}/concierge`, label: copy.nav.concierge },
    { key: "profile" as const, href: `/${locale}/profile`, label: copy.nav.profile }
  ];

  return (
    <nav className="mobile-nav" aria-label="Mobil navigatsiya">
      {mobileLinks.map((link) => (
        <a
          className={pathname === link.href || (link.key === "feed" && pathname === `/${locale}`) ? "active" : undefined}
          href={link.href}
          key={link.key}
        >
          {link.label}
        </a>
      ))}
    </nav>
  );
}
