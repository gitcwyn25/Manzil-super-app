import type { ReactNode } from "react";
import { Badge as UiBadge, type BadgeProps as UiBadgeProps } from "@/components/ui/badge";
export { cn } from "@/lib/utils";

const TONES: Record<string, UiBadgeProps["variant"]> = {
  good: "success",
  warn: "warning",
  bad: "destructive",
  muted: "secondary",
  brand: "default"
};

export function Badge({ tone = "muted", children }: { tone?: keyof typeof TONES | string; children: ReactNode }) {
  return <UiBadge variant={TONES[tone] ?? "secondary"}>{children}</UiBadge>;
}

const BUSINESS_TONE: Record<string, keyof typeof TONES> = { claimed: "good", pending_claim: "warn", unclaimed: "muted", suspended: "bad" };
const USER_TONE: Record<string, keyof typeof TONES> = { active: "good", suspended: "warn", banned: "bad" };
const REVIEW_TONE: Record<string, keyof typeof TONES> = { approved: "good", pending: "warn", rejected: "bad" };
const APPLICATION_TONE: Record<string, keyof typeof TONES> = {
  submitted: "warn",
  under_review: "brand",
  changes_requested: "warn",
  approved: "good",
  rejected: "bad",
  withdrawn: "muted",
  draft: "muted"
};

export function StatusBadge({ kind, value }: { kind: "business" | "user" | "review" | "application"; value: string }) {
  const map = kind === "business" ? BUSINESS_TONE : kind === "user" ? USER_TONE : kind === "review" ? REVIEW_TONE : APPLICATION_TONE;
  return <Badge tone={map[value] ?? "muted"}>{value.replace(/_/g, " ")}</Badge>;
}

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0"><p className="mb-2 font-data text-[10px] font-semibold uppercase tracking-[0.16em] text-ceramic">Manzil operations</p><h1 className="font-display text-2xl font-semibold tracking-[-0.03em] text-foreground sm:text-3xl">{title}</h1>{subtitle ? <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">{subtitle}</p> : null}</div>
      {actions}
    </div>
  );
}

export function EmptyRow({ colSpan, label }: { colSpan: number; label: string }) {
  return <tr><td colSpan={colSpan} className="px-4 py-12 text-center text-muted-foreground">{label}</td></tr>;
}
