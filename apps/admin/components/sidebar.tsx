"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  BarChart3,
  Building2,
  ClipboardCheck,
  CreditCard,
  FileCheck2,
  Inbox,
  KeyRound,
  LayoutDashboard,
  Megaphone,
  Send,
  PackageSearch,
  Settings2,
  ShieldCheck,
  Star,
  Tags,
  UsersRound
} from "lucide-react";
import { cn } from "@/lib/utils";

export type AdminIdentity = {
  id: string;
  email: string;
  name: string;
  roles: string[];
  permissions: string[];
};

type NavItem = {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
  permission?: string;
};

type NavGroup = { label: string; items: NavItem[] };

const GROUPS: NavGroup[] = [
  {
    label: "Work",
    items: [
      { href: "/", label: "Today", description: "Your decision queue", icon: LayoutDashboard },
      { href: "/waitlist", label: "Waitlist", description: "Demand and first touch", icon: Inbox, permission: "waitlist.view" },
      { href: "/outbox", label: "Outbox", description: "Attributable first touch", icon: Send, permission: "outbox.view" },
      { href: "/applications", label: "Applications", description: "Review before activation", icon: ClipboardCheck, permission: "business.view" },
      { href: "/businesses", label: "Companies", description: "Trust and activation", icon: Building2, permission: "business.view" }
    ]
  },
  {
    label: "Trust & money",
    items: [
      { href: "/reviews", label: "Reviews", description: "Moderation and evidence", icon: Star, permission: "review.view" },
      { href: "/payments", label: "Payment exceptions", description: "Reconcile provider truth", icon: CreditCard, permission: "payout.approve" },
      { href: "/campaigns", label: "Campaigns", description: "Consent before growth", icon: Megaphone, permission: "business.edit" }
    ]
  },
  {
    label: "Governance",
    items: [
      { href: "/signature", label: "Signature profile", description: "Operator attribution", icon: KeyRound, permission: "signature.view" },
      { href: "/audit", label: "Signed activity", description: "Accountable operations", icon: Activity, permission: "audit.view" },
      { href: "/team", label: "Team & access", description: "Least privilege", icon: UsersRound, permission: "admin.manage" }
    ]
  },
  {
    label: "System",
    items: [
      { href: "/analytics", label: "Analytics", description: "Platform signals", icon: BarChart3, permission: "analytics.view" },
      { href: "/categories", label: "Categories", description: "Catalog structure", icon: Tags, permission: "business.view" },
      { href: "/plans", label: "Plans & pricing", description: "Entitlements", icon: PackageSearch, permission: "plan.manage" },
      { href: "/legal", label: "Legal & contracts", description: "Versioned documents", icon: FileCheck2, permission: "legal.view" }
    ]
  }
];

function isCurrent(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

export function Sidebar({ identity, onNavigate, className }: { identity: AdminIdentity; onNavigate?: () => void; className?: string }) {
  const pathname = usePathname();
  const initials = identity.name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className={cn("flex min-h-full flex-col", className)}>
      <div className="flex h-[76px] items-center gap-3 border-b border-line-dark px-5">
        <div className="flex size-9 items-center justify-center rounded-[9px] border border-signal/30 bg-signal/10 text-signal">
          <ShieldCheck className="size-[18px]" strokeWidth={1.8} />
        </div>
        <div className="min-w-0">
          <div className="font-display text-[15px] font-semibold tracking-[-0.02em] text-white">Manzil</div>
          <div className="font-data text-[9px] uppercase tracking-[0.16em] text-white/45">Operations</div>
        </div>
      </div>

      <nav aria-label="Primary navigation" className="flex-1 space-y-6 overflow-y-auto px-3 py-6">
        {GROUPS.map((group) => {
          const items = group.items.filter((item) => !item.permission || identity.permissions.includes(item.permission) || identity.permissions.includes("*"));
          if (items.length === 0) return null;
          return (
            <div key={group.label}>
              <p className="mb-2 px-3 font-data text-[9px] font-semibold uppercase tracking-[0.18em] text-white/35">{group.label}</p>
              <div className="space-y-1">
                {items.map((item) => {
                  const active = isCurrent(pathname, item.href);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      onClick={onNavigate}
                      className={cn(
                        "group flex min-h-11 items-center gap-3 rounded-[7px] px-3 text-sm transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal",
                        active ? "bg-white/[0.1] text-white" : "text-white/58 hover:bg-white/[0.06] hover:text-white"
                      )}
                    >
                      <Icon className={cn("size-[17px] shrink-0", active ? "text-signal" : "text-white/42 group-hover:text-white/75")} strokeWidth={active ? 2 : 1.7} />
                      <span className="min-w-0 flex-1 truncate">{item.label}</span>
                      {active ? <span className="size-1.5 rounded-full bg-signal shadow-[0_0_14px_rgba(77,225,193,0.9)]" aria-hidden="true" /> : null}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      <div className="border-t border-line-dark p-4">
        <div className="flex items-center gap-3 rounded-[8px] bg-white/[0.06] p-3">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-signal/15 font-data text-[10px] font-semibold text-signal">{initials}</div>
          <div className="min-w-0">
            <p className="truncate text-xs font-medium text-white">{identity.name}</p>
            <p className="truncate text-[11px] text-white/45">{identity.roles[0] ?? "operator"}</p>
          </div>
          <Settings2 className="ml-auto size-4 shrink-0 text-white/35" aria-hidden="true" />
        </div>
        <p className="mt-3 px-1 font-data text-[9px] uppercase tracking-[0.13em] text-white/30">Signature channel · v1</p>
      </div>
    </div>
  );
}
