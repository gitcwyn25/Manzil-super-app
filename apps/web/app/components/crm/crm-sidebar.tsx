"use client";

import type { Locale } from "@manzil/shared";
import { usePathname } from "next/navigation";
import { useCallback } from "react";
import { BootstrapOffcanvas } from "../bootstrap-offcanvas";
import { Icon, type IconName } from "../vm/icons";

type MenuItem = {
  key: string;
  label: string;
  href: string;
  exact?: boolean;
};

// Keep in sync with the hamburger's `data-bs-target` below — the trigger and
// the panel share no React state, exactly like header.tsx / mobile-nav.tsx:
// Bootstrap's own data-api (wired up by BootstrapOffcanvas's dynamic import)
// drives open/close.
const DRAWER_ID = "ws-nav-drawer";

// The real 8-route workspace list mapped onto the shared inline-SVG icon set
// (D12) — no Material Symbols, no icon font.
const ITEM_ICONS: Record<string, IconName> = {
  overview: "grid",
  bookings: "calendar",
  announcements: "campaign",
  packages: "tag",
  reviews: "star",
  analytics: "chart",
  customers: "users",
  settings: "settings"
};

/**
 * Workspace chrome for /dashboard: the 256px light rail (desktop) plus the
 * mobile top bar + drawer. Per tests/e2e/shell-boundary.spec.ts the mobile
 * chrome is workspace-own — it never uses the consumer nav.mobile-nav class,
 * and the rail's pinned bottom block is a <div>, never a <footer>.
 */
export function CrmSidebar({
  locale,
  businessName,
  businessSlug,
  planLabel,
  partnerPortalLabel,
  menuLabel,
  items,
  bottomItems,
  viewPublicLabel,
  upgradeLabel
}: {
  locale: Locale;
  businessName: string;
  businessSlug: string;
  planLabel: string;
  partnerPortalLabel: string;
  menuLabel: string;
  items: MenuItem[];
  bottomItems: MenuItem[];
  viewPublicLabel: string;
  upgradeLabel: string;
}) {
  const pathname = usePathname();
  // Bootstrap's data-api owns the drawer state; React never tracks it.
  const onClose = useCallback(() => {}, []);

  const upgradeHref = `/${locale}/business/plans?business=${businessSlug}`;
  const publicHref = `/${locale}/businesses/${businessSlug}`;

  const renderLink = (item: MenuItem) => {
    const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
    return (
      <a className={active ? "ws-nav-link active" : "ws-nav-link"} href={item.href} key={item.key}>
        <Icon name={ITEM_ICONS[item.key] ?? "grid"} size={20} />
        {item.label}
      </a>
    );
  };

  const publicLink = (
    <a className="ws-nav-link" href={publicHref}>
      <Icon name="storefront" size={20} />
      {viewPublicLabel}
    </a>
  );

  return (
    <>
      {/* Mobile top bar (<md): brand + hamburger opening the drawer. */}
      <header className="ws-topbar">
        <a className="ws-topbar__brand" href={`/${locale}/dashboard`}>
          <span aria-hidden="true" className="ws-topbar__logo" />
          <span>{businessName}</span>
        </a>
        <button
          aria-controls={DRAWER_ID}
          aria-label={menuLabel}
          className="ws-topbar__toggle"
          data-bs-target={`#${DRAWER_ID}`}
          data-bs-toggle="offcanvas"
          type="button"
        >
          <svg aria-hidden="true" fill="none" height="22" stroke="currentColor" strokeLinecap="round" strokeWidth="2" viewBox="0 0 24 24" width="22">
            <path d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        </button>
      </header>

      {/* Desktop rail (≥md). */}
      <aside className="ws-rail">
        <div className="ws-rail__brand">
          <a aria-label="Manzil" className="ws-rail__tile" href={`/${locale}`}>
            <span aria-hidden="true" className="ws-rail__logo" />
          </a>
          <strong className="ws-rail__name">{businessName}</strong>
          <span className="ws-rail__tagline">{partnerPortalLabel}</span>
          <span className="ws-rail__plan">{planLabel}</span>
        </div>

        <nav className="ws-rail__nav">{items.map(renderLink)}</nav>

        {/* Pinned bottom block — a <div>, never a <footer>. */}
        <div className="ws-rail__foot">
          <a className="btn btn-primary ws-upgrade" href={upgradeHref}>
            {upgradeLabel}
          </a>
          {bottomItems.map(renderLink)}
          {publicLink}
        </div>
      </aside>

      {/* The drawer: always in the DOM, shown/hidden by Bootstrap. */}
      <BootstrapOffcanvas id={DRAWER_ID} onClose={onClose} open={false} title={businessName}>
        <nav className="ws-drawer__nav">
          {items.map(renderLink)}
          {bottomItems.map(renderLink)}
          {publicLink}
        </nav>
        <a className="btn btn-primary ws-upgrade ws-drawer__upgrade" href={upgradeHref}>
          {upgradeLabel}
        </a>
      </BootstrapOffcanvas>
    </>
  );
}
