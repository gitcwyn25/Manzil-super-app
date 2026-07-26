"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/", label: "Dashboard", perm: null },
  { href: "/analytics", label: "Analytics", perm: "analytics.view" },
  { href: "/businesses", label: "Business queue", perm: "business.view" },
  { href: "/reviews", label: "Review queue", perm: "review.view" },
  { href: "/users", label: "Users", perm: "user.view" },
  { href: "/categories", label: "Categories", perm: "business.view" },
  { href: "/plans", label: "Plans & pricing", perm: "plan.manage" },
  { href: "/legal", label: "Legal & contracts", perm: "legal.view" },
  { href: "/audit", label: "Audit log", perm: "audit.view" }
];

export function Sidebar({ permissions }: { permissions: string[] }) {
  const pathname = usePathname();
  const has = (p: string | null) => p === null || permissions.includes(p);

  return (
    <nav className="flex flex-col gap-0.5 p-2">
      {ITEMS.filter((i) => has(i.perm)).map((item) => {
        const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              active ? "bg-panel-2 text-fg" : "text-muted hover:bg-panel-2/60 hover:text-fg"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
