import type { ReactNode } from "react";

export function cn(...parts: Array<string | false | undefined | null>): string {
  return parts.filter(Boolean).join(" ");
}

const TONES: Record<string, string> = {
  good: "bg-good/15 text-good",
  warn: "bg-warn/15 text-warn",
  bad: "bg-bad/15 text-bad",
  muted: "bg-panel-2 text-muted",
  brand: "bg-brand/15 text-brand"
};

export function Badge({ tone = "muted", children }: { tone?: keyof typeof TONES | string; children: ReactNode }) {
  return (
    <span className={cn("inline-flex items-center rounded px-2 py-0.5 text-xs font-medium", TONES[tone] ?? TONES.muted)}>
      {children}
    </span>
  );
}

const BUSINESS_TONE: Record<string, string> = {
  claimed: "good",
  pending_claim: "warn",
  unclaimed: "muted",
  suspended: "bad"
};
const USER_TONE: Record<string, string> = { active: "good", suspended: "warn", banned: "bad" };
const REVIEW_TONE: Record<string, string> = { approved: "good", pending: "warn", rejected: "bad" };

export function StatusBadge({ kind, value }: { kind: "business" | "user" | "review"; value: string }) {
  const map = kind === "business" ? BUSINESS_TONE : kind === "user" ? USER_TONE : REVIEW_TONE;
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
    <div className="mb-5 flex items-end justify-between gap-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
        {subtitle ? <p className="mt-0.5 text-sm text-muted">{subtitle}</p> : null}
      </div>
      {actions}
    </div>
  );
}

export function EmptyRow({ colSpan, label }: { colSpan: number; label: string }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-3 py-10 text-center text-muted">
        {label}
      </td>
    </tr>
  );
}
