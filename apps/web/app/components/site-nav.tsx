"use client";

import type { Locale } from "@manzil/shared";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { getBusinessCopy } from "../lib/business-copy";

// Admin is intentionally absent here — its entry point lives in the footer.
// Consumer navigation only. "Dashboard" is deliberately absent: a visitor with
// no business has nothing there, and the workspace is reached through the
// signed-in switch in the header instead.
const links = [
  { key: "home" as const, href: (locale: Locale) => `/${locale}` },
  { key: "discover" as const, href: (locale: Locale) => `/${locale}/discover` },
  { key: "forBusiness" as const, href: (locale: Locale) => `/${locale}/business` }
];

// `d-none d-lg-flex` is a Bootstrap `!important` utility, so the responsive
// show/hide split can never lose a cascade tie to globals.css's older
// same-specificity `.desktop-nav` rules — see _chrome.scss for the rest of
// this element's restyle.
export function SiteNav({ locale }: { locale: Locale }) {
  const pathname = usePathname();
  const copy = getBusinessCopy(locale);

  return (
    <nav className="desktop-nav d-none d-lg-flex" aria-label="Asosiy navigatsiya">
      {links.map((link) => {
        const href = link.href(locale);
        const active = pathname === href || (link.key === "home" && pathname === `/${locale}`);
        return (
          <Link className={active ? "active" : undefined} href={href} key={link.key}>
            {copy.nav[link.key]}
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
  admin: (
    <svg aria-hidden="true" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M12 2 4 5.5v5.6c0 4.9 3.4 9.5 8 10.9 4.6-1.4 8-6 8-10.9V5.5L12 2Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  )
};

// `nav.mobile-nav` is the element the shell-boundary e2e suite selects on.
// It lives inside the offcanvas panel rendered by mobile-nav.tsx, so it stays
// in the DOM (open or closed) whenever the site shell is mounted.
export function MobileSiteNav({ locale }: { locale: Locale }) {
  const pathname = usePathname();
  const copy = getBusinessCopy(locale);

  const mobileLinks = [
    { key: "home" as const, href: `/${locale}`, label: copy.nav.home },
    { key: "discover" as const, href: `/${locale}/discover`, label: copy.nav.discover },
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
