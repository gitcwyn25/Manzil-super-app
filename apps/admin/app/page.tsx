import Link from "next/link";
import {
  Activity,
  ArrowUpRight,
  Building2,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  CreditCard,
  Inbox,
  ShieldCheck,
  Star,
  UsersRound
} from "lucide-react";
import { AccessDenied } from "@/components/access-denied";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { consoleGet, getMe } from "@/lib/console";
import { timeAgo } from "@/lib/ui";

export const dynamic = "force-dynamic";

type Overview = { pendingBusinesses: number; pendingApplications: number; flaggedReviews: number; bannedUsers: number; admins: number };
type AuditEntry = {
  id: string;
  action: string;
  targetType: string;
  targetId: string | null;
  reason: string | null;
  actor: { email: string; name: string };
  createdAt: string;
};

type StatCardProps = { label: string; value: number | null; hint: string; href?: string; icon: React.ElementType; tone?: "ceramic" | "brass" | "danger" | "good" };

function StatCard({ label, value, hint, href, icon: Icon, tone = "ceramic" }: StatCardProps) {
  const content = (
    <Card className="group h-full overflow-hidden transition-[border-color,transform,box-shadow] duration-150 hover:-translate-y-0.5 hover:border-ceramic/35 hover:shadow-float">
      <CardContent className="relative p-5">
        <div className="absolute right-5 top-5 flex size-9 items-center justify-center rounded-[8px] bg-panel-3 text-muted-foreground transition-colors group-hover:bg-signal-soft group-hover:text-ceramic">
          <Icon className="size-[17px]" strokeWidth={1.7} />
        </div>
        <p className="pr-12 text-xs font-medium text-muted-foreground">{label}</p>
        <p className="mt-4 font-display text-3xl font-semibold tracking-[-0.04em] text-foreground">{value === null ? "—" : value}</p>
        <div className="mt-3 flex items-center gap-2 text-[11px] text-muted-foreground">
          <span className={`size-1.5 rounded-full ${tone === "danger" ? "bg-danger" : tone === "brass" ? "bg-brass" : tone === "good" ? "bg-good" : "bg-ceramic"}`} />
          <span>{hint}</span>
        </div>
      </CardContent>
    </Card>
  );
  return href ? <Link href={href} className="block h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ceramic focus-visible:ring-offset-2">{content}</Link> : content;
}

function actionTone(action: string): "success" | "warning" | "destructive" | "secondary" {
  if (action.includes("approve") || action.includes("unban")) return "success";
  if (action.includes("reject") || action.includes("delete") || action.includes("ban")) return "destructive";
  if (action.includes("login")) return "warning";
  return "secondary";
}

export default async function DashboardPage() {
  const me = await getMe();
  if (!me) return <AccessDenied />;

  const [overviewResult, auditResult] = await Promise.all([
    me.permissions.includes("analytics.view") ? consoleGet<Overview>("/overview") : Promise.resolve(null),
    me.permissions.includes("audit.view") ? consoleGet<{ entries: AuditEntry[] }>("/audit?take=5") : Promise.resolve(null)
  ]);

  const overview = overviewResult?.ok ? overviewResult.data : null;
  const audit = auditResult?.ok ? auditResult.data.entries : [];
  const apiIssue = overviewResult && !overviewResult.ok ? overviewResult.error : null;
  const firstName = me.name.split(" ")[0];
  const day = new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "2-digit", month: "short", year: "numeric" }).format(new Date());

  const decisions = [
    { label: "Business applications", description: "Review before creating a public company", count: overview?.pendingApplications ?? null, href: "/applications", icon: ClipboardCheck, tone: "warning" as const },
    { label: "Business claims", description: "Owner connection and listing visibility", count: overview?.pendingBusinesses ?? null, href: "/businesses?status=pending_claim", icon: Building2, tone: "warning" as const },
    { label: "Flagged reviews", description: "Evidence requiring a moderation decision", count: overview?.flaggedReviews ?? null, href: "/reviews?flagged=true", icon: Star, tone: "destructive" as const },
    { label: "Payment exceptions", description: "Provider state that needs reconciliation", count: null, href: "/payments", icon: CreditCard, tone: "warning" as const }
  ];

  return (
    <div className="mx-auto max-w-[1480px]">
      <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-3 flex items-center gap-2 font-data text-[10px] font-semibold uppercase tracking-[0.18em] text-ceramic"><span className="size-1.5 rounded-full bg-signal shadow-[0_0_12px_rgba(77,225,193,0.85)]" />Control room · {day}</div>
          <h1 className="font-display text-3xl font-semibold tracking-[-0.045em] text-foreground sm:text-4xl">Good afternoon, {firstName}.</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Make the next trustworthy decision. Start with the oldest unresolved item, then leave a clear next action for the team.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="secondary"><Link href="/businesses"><Building2 className="size-4" />Review companies</Link></Button>
          <Button asChild variant="primary"><Link href="/audit"><ShieldCheck className="size-4" />Open signed activity</Link></Button>
        </div>
      </div>

      {apiIssue ? (
        <Alert variant="warning" className="mb-6">
          <Clock3 className="absolute left-4 top-4 size-4 text-warn" />
          <AlertTitle className="pl-7">Console data is unavailable</AlertTitle>
          <AlertDescription className="pl-7">{apiIssue}. The dashboard is showing no fallback metrics; retry the source instead of acting on stale numbers.</AlertDescription>
        </Alert>
      ) : null}

      <section aria-labelledby="signal-title" className="mb-8">
        <div className="mb-3 flex items-center justify-between gap-4"><div><h2 id="signal-title" className="font-display text-lg font-semibold tracking-[-0.02em]">System pulse</h2><p className="text-xs text-muted-foreground">Live counts from the permissioned console API.</p></div><Badge variant={overview ? "success" : "secondary"}><span className="size-1.5 rounded-full bg-current" />{overview ? "synced" : "not connected"}</Badge></div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <StatCard label="Business applications" value={overview?.pendingApplications ?? null} hint={overview ? "needs review" : "source unavailable"} href={me.permissions.includes("business.view") ? "/applications" : undefined} icon={ClipboardCheck} tone="brass" />
          <StatCard label="Pending businesses" value={overview?.pendingBusinesses ?? null} hint={overview ? "needs claim review" : "source unavailable"} href={me.permissions.includes("business.view") ? "/businesses?status=pending_claim" : undefined} icon={Building2} tone="brass" />
          <StatCard label="Flagged reviews" value={overview?.flaggedReviews ?? null} hint={overview ? "open reports" : "source unavailable"} href={me.permissions.includes("review.view") ? "/reviews?flagged=true" : undefined} icon={Star} tone="danger" />
          <StatCard label="Active admins" value={overview?.admins ?? null} hint={overview ? "identity and access" : "source unavailable"} href={me.permissions.includes("admin.manage") ? "/team" : undefined} icon={UsersRound} tone="good" />
          <StatCard label="Banned users" value={overview?.bannedUsers ?? null} hint={overview ? "enforced account state" : "source unavailable"} href={me.permissions.includes("user.view") ? "/users?status=banned" : undefined} icon={ShieldCheck} tone="ceramic" />
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(330px,0.75fr)]">
        <Card className="overflow-hidden">
          <CardHeader className="flex-row items-start justify-between border-b border-border pb-4">
            <div><CardTitle className="flex items-center gap-2 text-base"><Inbox className="size-4 text-ceramic" />Needs a decision</CardTitle><p className="mt-1 text-xs leading-5 text-muted-foreground">Ordered by risk and age, not by volume.</p></div>
            <Button asChild variant="ghost" size="sm"><Link href="/businesses">View queues <ArrowUpRight className="size-3.5" /></Link></Button>
          </CardHeader>
          <CardContent className="p-0">
            {decisions.map((item, index) => {
              const Icon = item.icon;
              return (
                <Link key={item.label} href={item.href} className="group flex min-h-[78px] items-center gap-4 border-b border-border px-5 py-4 transition-colors last:border-0 hover:bg-panel-3 focus-visible:bg-panel-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-[8px] bg-panel-3 text-muted-foreground group-hover:bg-signal-soft group-hover:text-ceramic"><Icon className="size-[17px]" strokeWidth={1.7} /></span>
                  <span className="min-w-0 flex-1"><span className="block text-sm font-medium text-foreground">{item.label}</span><span className="mt-1 block text-xs text-muted-foreground">{item.description}</span></span>
                  <span className="flex shrink-0 items-center gap-3"><span className={`font-data text-lg font-medium ${item.tone === "destructive" ? "text-danger" : item.tone === "warning" ? "text-warn" : "text-foreground"}`}>{item.count === null ? "—" : item.count}</span><ArrowUpRight className="size-4 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" /></span>
                </Link>
              );
            })}
            <div className="flex items-center gap-2 bg-panel-3/60 px-5 py-3 text-[11px] text-muted-foreground"><CheckCircle2 className="size-4 text-good" />Every consequential action should expose its evidence before the decision.</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-base"><ShieldCheck className="size-4 text-ceramic" />Operator standard</CardTitle><p className="text-xs leading-5 text-muted-foreground">The control room is a trust system, not a pile of admin screens.</p></CardHeader>
          <CardContent className="space-y-4 pt-0">
            {["Evidence before action", "One accountable actor", "Provider truth over manual override", "Failure states stay visible"].map((rule, index) => <div key={rule} className="flex gap-3"><span className="font-data text-[10px] text-ceramic">0{index + 1}</span><p className="text-sm leading-5 text-foreground">{rule}</p></div>)}
            <Separator />
            <div className="rounded-[8px] border border-signal/25 bg-signal-soft p-3.5"><p className="font-data text-[9px] font-semibold uppercase tracking-[0.14em] text-ceramic-dark">Current operator</p><p className="mt-1 text-sm font-medium text-foreground">{me.name}</p><p className="mt-1 text-xs text-muted-foreground">{me.roles.join(" · ") || "No role label"} · {me.permissions.length} permissions</p></div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(330px,0.75fr)]">
        <Card>
          <CardHeader className="flex-row items-start justify-between border-b border-border pb-4"><div><CardTitle className="flex items-center gap-2 text-base"><Activity className="size-4 text-ceramic" />Signed activity</CardTitle><p className="mt-1 text-xs leading-5 text-muted-foreground">Recent actions with accountable identity and reason.</p></div><Button asChild variant="ghost" size="sm"><Link href="/audit">Open log <ArrowUpRight className="size-3.5" /></Link></Button></CardHeader>
          <CardContent className="p-0">
            {audit.length ? audit.map((entry) => <div key={entry.id} className="flex items-start gap-3 border-b border-border px-5 py-4 last:border-0"><span className="mt-1 flex size-6 shrink-0 items-center justify-center rounded-full bg-panel-3"><Activity className="size-3.5 text-ceramic" /></span><div className="min-w-0 flex-1"><p className="text-sm font-medium text-foreground">{entry.action}</p><p className="mt-1 text-xs text-muted-foreground"><span className="font-medium text-foreground">{entry.actor.name}</span> · {entry.targetType}{entry.targetId ? ` · ${entry.targetId}` : ""}{entry.reason ? ` · ${entry.reason}` : ""}</p></div><time className="shrink-0 font-data text-[10px] text-muted-foreground" dateTime={entry.createdAt}>{timeAgo(entry.createdAt)}</time></div>) : <div className="px-5 py-12 text-center text-sm text-muted-foreground">{auditResult && !auditResult.ok ? auditResult.error : "No signed activity available for this operator."}</div>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-base"><CreditCard className="size-4 text-brass" />What deserves care</CardTitle><p className="text-xs leading-5 text-muted-foreground">Exceptions are more valuable than decorative charts.</p></CardHeader>
          <CardContent className="space-y-3 pt-0">
            <Link href="/payments" className="flex items-center gap-3 rounded-[8px] border border-border p-3 transition-colors hover:border-brass/40 hover:bg-brass-soft"><CreditCard className="size-4 text-brass" /><span className="min-w-0 flex-1"><span className="block text-sm font-medium">Payment state mismatch</span><span className="mt-0.5 block text-xs text-muted-foreground">Provider events · read-only lane</span></span><ArrowUpRight className="size-4 text-muted-foreground" /></Link>
            <Link href="/campaigns" className="flex items-center gap-3 rounded-[8px] border border-border p-3 transition-colors hover:border-ceramic/40 hover:bg-signal-soft"><ShieldCheck className="size-4 text-ceramic" /><span className="min-w-0 flex-1"><span className="block text-sm font-medium">Consent evidence missing</span><span className="mt-0.5 block text-xs text-muted-foreground">Campaigns fail closed until verified</span></span><ArrowUpRight className="size-4 text-muted-foreground" /></Link>
            <Link href="/team" className="flex items-center gap-3 rounded-[8px] border border-border p-3 transition-colors hover:border-danger/40 hover:bg-danger-soft"><UsersRound className="size-4 text-danger" /><span className="min-w-0 flex-1"><span className="block text-sm font-medium">New teammate setup</span><span className="mt-0.5 block text-xs text-muted-foreground">Identity, 2FA, signature, first queue</span></span><ArrowUpRight className="size-4 text-muted-foreground" /></Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
