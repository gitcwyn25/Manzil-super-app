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
  companies: (
    <svg fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" viewBox="0 0 24 24">
      <path d="M4 20V6.5A1.5 1.5 0 0 1 5.5 5H12v15M12 20V9h6.5A1.5 1.5 0 0 1 20 10.5V20" />
      <path d="M7.5 8.5h1M7.5 11.5h1M7.5 14.5h1M15 12.5h1M15 15.5h1" />
    </svg>
  ),
  notifications: (
    <svg fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" viewBox="0 0 24 24">
      <path d="M6 9a6 6 0 0 1 12 0c0 4 1.5 5.5 2 6H4c.5-.5 2-2 2-6Z" />
      <path d="M10 19a2 2 0 0 0 4 0" />
    </svg>
  ),
  data: (
    <svg fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" viewBox="0 0 24 24">
      <ellipse cx="12" cy="6" rx="7.5" ry="3" />
      <path d="M4.5 6v6c0 1.66 3.36 3 7.5 3s7.5-1.34 7.5-3V6" />
      <path d="M4.5 12v6c0 1.66 3.36 3 7.5 3s7.5-1.34 7.5-3v-6" />
    </svg>
  )
};

export function AdminSidebar({
  locale,
  operatorName,
  roleLabel,
  sectionLabel,
  items,
  logoutLabel,
  logoutAction
}: {
  locale: Locale;
  operatorName: string;
  roleLabel: string;
  sectionLabel: string;
  items: MenuItem[];
  logoutLabel: string;
  logoutAction: (formData: FormData) => void;
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
        <span aria-hidden="true" className="crm-sidebar__ring" />
        <span className="crm-sidebar-avatar">{operatorName.slice(0, 1).toUpperCase()}</span>
        <div>
          <strong>{operatorName}</strong>
          <em>{roleLabel}</em>
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
        <form action={logoutAction}>
          <input name="locale" type="hidden" value={locale} />
          <button className="crm-sidebar-public" type="submit">
            {logoutLabel}
          </button>
        </form>
      </div>
    </aside>
  );
}
