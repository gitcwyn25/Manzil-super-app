"use client";

import type { Locale } from "@manzil/shared";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { getBusinessCopy } from "../lib/business-copy";

// The public header has one deliberate link set: Home, Discover, Docs,
// and For Business. Authenticated workspace/admin destinations stay out.
const links = [
  { key: "home" as const, href: (locale: Locale) => `/${locale}` },
  { key: "discover" as const, href: (locale: Locale) => `/${locale}/discover` },
  { key: "docs" as const, href: (locale: Locale) => `/${locale}/docs` },
  { key: "forBusiness" as const, href: (locale: Locale) => `/${locale}/business` }
];

export function SiteNav({ locale }: { locale: Locale }) {
  const pathname = usePathname();
  const copy = getBusinessCopy(locale);

  return (
    <nav className="desktop-nav d-none d-lg-flex" aria-label="Main navigation">
      {links.map((link) => {
        const href = link.href(locale);
        const active = pathname === href || (link.key !== "home" && pathname.startsWith(`${href}/`));
        const label =
          link.key === "home"
            ? copy.nav.home
            : link.key === "docs"
              ? locale === "uz"
                ? "Hujjatlar"
                : locale === "ru"
                  ? "Документы"
                  : "Docs"
              : copy.nav[link.key as keyof typeof copy.nav];

        return (
          <Link className={active ? "active" : undefined} href={href} key={link.key}>
            {label}
          </Link>
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
  discover: (
    <svg aria-hidden="true" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  ),
  docs: (
    <svg aria-hidden="true" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M6 3h9l3 3v15H6z" />
      <path d="M15 3v4h4M9 12h6M9 16h6" />
    </svg>
  ),
  events: (
    <svg aria-hidden="true" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
      <rect x="4" y="5" width="16" height="16" rx="2" />
      <path d="M8 3v4M16 3v4M4 10.5h16" />
    </svg>
  ),
  admin: (
    <svg aria-hidden="true" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M12 2 4 5.5v5.6c0 4.9 3.4 9.5 8 10.9 4.6-1.4 8-6 8-10.9V5.5L12 2Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  )
};

// The offcanvas mobile nav remains in the DOM for shell-boundary coverage.
export function MobileSiteNav({ locale }: { locale: Locale }) {
  const pathname = usePathname();
  const copy = getBusinessCopy(locale);

  const mobileLinks = [
    { key: "home" as const, href: `/${locale}`, label: copy.nav.home },
    { key: "discover" as const, href: `/${locale}/discover`, label: copy.nav.discover },
    { key: "docs" as const, href: `/${locale}/docs`, label: locale === "uz" ? "Hujjatlar" : locale === "ru" ? "Документы" : "Docs" },
    { key: "forBusiness" as const, href: `/${locale}/business`, label: copy.nav.forBusiness }
  ];

  return (
    <nav className="mobile-nav" aria-label="Mobil navigatsiya">
      {mobileLinks.map((link) => (
        <Link
          className={pathname === link.href || (link.key === "home" && pathname === `/${locale}`) ? "active" : undefined}
          href={link.href}
          key={link.key}
        >
          {mobileIcons[link.key]}
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
