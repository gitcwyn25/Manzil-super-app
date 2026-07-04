"use client";

import type { Locale } from "@manzil/shared";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

type MenuItem = {
  key: string;
  label: string;
  href: string;
  exact?: boolean;
};

const icons: Record<string, ReactNode> = {
  overview: (
    <svg fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" viewBox="0 0 24 24">
      <rect height="7" rx="1.5" width="7" x="3.5" y="3.5" />
      <rect height="7" rx="1.5" width="7" x="13.5" y="3.5" />
      <rect height="7" rx="1.5" width="7" x="3.5" y="13.5" />
      <rect height="7" rx="1.5" width="7" x="13.5" y="13.5" />
    </svg>
  ),
  announcements: (
    <svg fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" viewBox="0 0 24 24">
      <path d="M3 11v2a1 1 0 0 0 1 1h2l5 4V6L6 10H4a1 1 0 0 0-1 1Z" />
      <path d="M15 9.5a4 4 0 0 1 0 5M18 7a8 8 0 0 1 0 10" />
    </svg>
  ),
  packages: (
    <svg fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" viewBox="0 0 24 24">
      <path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" />
      <path d="M4 7.5 12 12l8-4.5M12 12v9" />
    </svg>
  ),
  reviews: (
    <svg fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" viewBox="0 0 24 24">
      <path d="m12 3.5 2.5 5.2 5.7.7-4.2 4 1.1 5.6-5.1-2.8-5.1 2.8 1.1-5.6-4.2-4 5.7-.7L12 3.5Z" />
    </svg>
  ),
  settings: (
    <svg fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="3.2" />
      <path d="M19 12a7 7 0 0 0-.1-1.2l2-1.5-2-3.5-2.3 1a7 7 0 0 0-2-1.2L14.2 3h-4l-.4 2.6a7 7 0 0 0-2 1.2l-2.3-1-2 3.5 2 1.5a7 7 0 0 0 0 2.4l-2 1.5 2 3.5 2.3-1a7 7 0 0 0 2 1.2l.4 2.6h4l.4-2.6a7 7 0 0 0 2-1.2l2.3 1 2-3.5-2-1.5c.06-.4.1-.8.1-1.2Z" />
    </svg>
  )
};

export function CrmSidebar({
  locale,
  businessName,
  businessSlug,
  planLabel,
  sectionLabel,
  items,
  viewPublicLabel,
  upgradeLabel
}: {
  locale: Locale;
  businessName: string;
  businessSlug: string;
  planLabel: string;
  sectionLabel: string;
  items: MenuItem[];
  viewPublicLabel: string;
  upgradeLabel: string;
}) {
  const pathname = usePathname();

  return (
    <aside className="crm-sidebar">
      <div className="crm-sidebar-brand">
        <a className="brand" href={`/${locale}`}>
          Manzil<span aria-hidden="true" className="brand-dot" />
        </a>
      </div>

      <div className="crm-sidebar-business">
        <span className="crm-sidebar-avatar">{businessName.slice(0, 1).toUpperCase()}</span>
        <div>
          <strong>{businessName}</strong>
          <em>{planLabel}</em>
        </div>
      </div>

      <p className="crm-sidebar-section">{sectionLabel}</p>
      <nav className="crm-sidebar-nav">
        {items.map((item) => {
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <a className={active ? "active" : undefined} href={item.href} key={item.key}>
              {icons[item.key]}
              {item.label}
            </a>
          );
        })}
      </nav>

      <div className="crm-sidebar-foot">
        <a className="crm-sidebar-public" href={`/${locale}/businesses/${businessSlug}`}>
          {viewPublicLabel}
        </a>
        <a className="crm-sidebar-upgrade" href={`/${locale}/business/plans?business=${businessSlug}`}>
          {upgradeLabel}
        </a>
      </div>
    </aside>
  );
}
