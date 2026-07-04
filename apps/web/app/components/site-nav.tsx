"use client";

import type { Locale } from "@manzil/shared";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { getBusinessCopy } from "../lib/business-copy";

// Admin is intentionally absent here — its entry point lives in the footer.
const links = [
  { key: "home" as const, href: (locale: Locale) => `/${locale}` },
  { key: "forBusiness" as const, href: (locale: Locale) => `/${locale}/business` },
  { key: "dashboard" as const, href: (locale: Locale) => `/${locale}/dashboard` }
];

export function SiteNav({ locale }: { locale: Locale }) {
  const pathname = usePathname();
  const copy = getBusinessCopy(locale);

  return (
    <nav className="desktop-nav" aria-label="Asosiy navigatsiya">
      {links.map((link) => {
        const href = link.href(locale);
        const active = pathname === href || (link.key === "home" && pathname === `/${locale}`);
        return (
          <a className={active ? "active" : undefined} href={href} key={link.key}>
            {copy.nav[link.key]}
          </a>
        );
      })}
    </nav>
  );
}

const mobileIcons: Record<string, ReactNode> = {
  home: (
    <svg aria-hidden="true" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5" />
    </svg>
  ),
  forBusiness: (
    <svg aria-hidden="true" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M4 9h16v10a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V9Z" />
      <path d="M2.5 9 5 4h14l2.5 5M12 14v3" />
    </svg>
  ),
  dashboard: (
    <svg aria-hidden="true" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
      <rect height="8" rx="1.5" width="8" x="3" y="3" />
      <rect height="5" rx="1.5" width="8" x="3" y="15" />
      <rect height="5" rx="1.5" width="8" x="13" y="3" />
      <rect height="8" rx="1.5" width="8" x="13" y="12" />
    </svg>
  ),
  admin: (
    <svg aria-hidden="true" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M12 2 4 5.5v5.6c0 4.9 3.4 9.5 8 10.9 4.6-1.4 8-6 8-10.9V5.5L12 2Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  )
};

export function MobileSiteNav({ locale }: { locale: Locale }) {
  const pathname = usePathname();
  const copy = getBusinessCopy(locale);

  const mobileLinks = [
    { key: "home" as const, href: `/${locale}`, label: copy.nav.home },
    { key: "forBusiness" as const, href: `/${locale}/business`, label: copy.nav.forBusiness },
    { key: "dashboard" as const, href: `/${locale}/dashboard`, label: copy.nav.dashboard }
  ];

  return (
    <nav className="mobile-nav" aria-label="Mobil navigatsiya">
      {mobileLinks.map((link) => (
        <a
          className={pathname === link.href || (link.key === "home" && pathname === `/${locale}`) ? "active" : undefined}
          href={link.href}
          key={link.key}
        >
          {mobileIcons[link.key]}
          {link.label}
        </a>
      ))}
    </nav>
  );
}
