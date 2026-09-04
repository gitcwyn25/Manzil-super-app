import Link from "next/link";
import { ArrowUpRight, Building2, Inbox, Search, UserRound } from "lucide-react";
import { AccessDenied, ConsoleUnavailable } from "@/components/access-denied";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AssignWaitlistButton, ConnectCompanyButton, QueueDraftButton, WaitlistTransitionButton } from "@/components/activation-controls";
import { can, consoleGet, getMeResult, type AdminMe } from "@/lib/console";
import { Badge, EmptyRow, PageHeader, timeAgo } from "@/lib/ui";

export const dynamic = "force-dynamic";

type Operator = { id: string; name: string; email: string };
type ConnectedBusiness = { id: string; slug: string; name: string; status: string };
type OutboxSummary = { id: string; kind: string; status: string; attempts: number; lastError: string | null; createdAt: string; sentAt: string | null };
type WaitlistSignup = {
  id: string;
  topic: "city" | "gurman" | "pro";
  email: string;
  locale: string;
  city: string | null;
  businessName: string | null;
  source: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  contactedAt: string | null;
  reviewedAt: string | null;
  decisionReason: string | null;
  assignedAdmin: Operator | null;
  reviewedByAdmin: Operator | null;
  connectedAt: string | null;
  connectedBusiness: ConnectedBusiness | null;
  outboxMessages: OutboxSummary[];
};
type WaitlistResponse = { total: number; counts: Record<string, number>; signups: WaitlistSignup[] };

type SearchParams = { status?: string; topic?: string; q?: string };

const STATUSES = ["", "new", "contacted", "qualified", "accepted", "connected", "rejected", "duplicate"];
const TOPICS = ["", "gurman", "city", "pro"];
const STATUS_TONE: Record<string, "good" | "warn" | "bad" | "muted" | "brand"> = {
  new: "muted",
  contacted: "warn",
  qualified: "brand",
  accepted: "good",
  connected: "good",
  rejected: "bad",
  duplicate: "bad"
};
const TOPIC_LABEL: Record<string, string> = { gurman: "Gurman", city: "City", pro: "Pro" };

function label(value: string) {
  return value ? value.replace(/_/g, " ").replace(/^./, (char) => char.toUpperCase()) : "All";
}

function filterHref(current: SearchParams, key: "status" | "topic", value: string) {
  const query = new URLSearchParams();
  if (key === "status" ? value : current.status) query.set("status", key === "status" ? value : current.status!);
  if (key === "topic" ? value : current.topic) query.set("topic", key === "topic" ? value : current.topic!);
  if (current.q) query.set("q", current.q);
  const encoded = query.toString();
  return `/waitlist${encoded ? `?${encoded}` : ""}`;
}

function QueueState({ response }: { response: { ok: false; error: string } }) {
  return <Alert variant="warning" className="mb-5"><AlertTitle>Waitlist contract is gated or unavailable</AlertTitle><AlertDescription>{response.error}. No fallback records are shown. Apply the reviewed M1 migration before enabling the contract. Queue-only staging may remain delivery-disabled; no provider worker is implied.</AlertDescription></Alert>;
}

function OutboxStatus({ message }: { message: OutboxSummary }) {
  const tone = message.status === "sent" ? "good" : message.status === "failed" ? "bad" : message.status === "pending" ? "warn" : "muted";
  return <span className="inline-flex items-center gap-1.5 text-xs"><Badge tone={tone}>{message.status}</Badge>{message.status === "failed" && message.lastError ? <span className="max-w-40 truncate text-danger" title={message.lastError}>{message.lastError}</span> : null}</span>;
}

function WaitlistActions({ signup, me }: { signup: WaitlistSignup; me: AdminMe }) {
  const canManage = can(me, "waitlist.manage");
  const canConnect = can(me, "business.connect");
  const canDraft = can(me, "outbox.create");
  if (!canManage && !canConnect && !canDraft) return <span className="text-xs text-muted-foreground">Read only</span>;

  return <div className="flex flex-wrap items-center justify-end gap-2">
    {canManage ? <AssignWaitlistButton id={signup.id} adminId={me.id} assigned={signup.assignedAdmin?.id === me.id} expectedUpdatedAt={signup.updatedAt} /> : null}
    {canManage && signup.status === "new" ? <><WaitlistTransitionButton expectedUpdatedAt={signup.updatedAt} id={signup.id} status="contacted" /><WaitlistTransitionButton expectedUpdatedAt={signup.updatedAt} id={signup.id} status="qualified" /></> : null}
    {canManage && signup.status === "contacted" ? <><WaitlistTransitionButton expectedUpdatedAt={signup.updatedAt} id={signup.id} status="qualified" /><WaitlistTransitionButton expectedUpdatedAt={signup.updatedAt} id={signup.id} status="rejected" variant="danger" requiresReason /><WaitlistTransitionButton expectedUpdatedAt={signup.updatedAt} id={signup.id} status="duplicate" variant="ghost" requiresReason /></> : null}
    {canManage && signup.status === "qualified" ? <><WaitlistTransitionButton expectedUpdatedAt={signup.updatedAt} id={signup.id} status="accepted" variant="primary" requiresReason /><WaitlistTransitionButton expectedUpdatedAt={signup.updatedAt} id={signup.id} status="rejected" variant="danger" requiresReason /><WaitlistTransitionButton expectedUpdatedAt={signup.updatedAt} id={signup.id} status="duplicate" variant="ghost" requiresReason /></> : null}
    {canConnect && signup.topic !== "city" && (signup.status === "qualified" || signup.status === "accepted") ? <ConnectCompanyButton id={signup.id} expectedUpdatedAt={signup.updatedAt} /> : null}
    {canDraft && ["contacted", "qualified", "accepted", "connected"].includes(signup.status) ? <QueueDraftButton id={signup.id} /> : null}
    {canManage && ["rejected", "duplicate"].includes(signup.status) ? <WaitlistTransitionButton expectedUpdatedAt={signup.updatedAt} id={signup.id} status="contacted" variant="ghost" requiresReason label="Reopen" /> : null}
  </div>;
}

function WaitlistRow({ signup, me }: { signup: WaitlistSignup; me: AdminMe }) {
  const latestMessage = signup.outboxMessages[0];
  return <TableRow>
    <TableCell><div className="min-w-[230px]"><div className="flex items-center gap-2"><Badge tone={signup.topic === "pro" ? "brand" : "muted"}>{TOPIC_LABEL[signup.topic]}</Badge><Badge tone={STATUS_TONE[signup.status] ?? "muted"}>{label(signup.status)}</Badge></div><p className="mt-2 font-medium text-foreground">{signup.email}</p><p className="mt-1 text-xs text-muted-foreground">{signup.city ?? signup.businessName ?? "No place context"} · {signup.locale.toUpperCase()}</p></div></TableCell>
    <TableCell><p className="max-w-52 truncate text-sm">{signup.businessName ?? "—"}</p><p className="mt-1 text-xs text-muted-foreground">{signup.source ?? "public waitlist"}</p></TableCell>
    <TableCell>{signup.assignedAdmin ? <span className="inline-flex items-center gap-1.5 text-xs"><UserRound className="size-3.5 text-ceramic" />{signup.assignedAdmin.name}</span> : <span className="text-xs text-muted-foreground">Unassigned</span>}</TableCell>
    <TableCell>{signup.connectedBusiness ? <Link href={`/businesses/${signup.connectedBusiness.id}`} className="inline-flex max-w-44 items-center gap-1 text-xs text-ceramic hover:underline"><Building2 className="size-3.5 shrink-0" /><span className="truncate">Internal link · {signup.connectedBusiness.name}</span><ArrowUpRight className="size-3 shrink-0" /></Link> : <span className="text-xs text-muted-foreground">Not connected</span>}{latestMessage ? <div className="mt-2"><OutboxStatus message={latestMessage} /></div> : null}</TableCell>
    <TableCell className="whitespace-nowrap font-data text-[11px] text-muted-foreground">{timeAgo(signup.updatedAt)}</TableCell>
    <TableCell><WaitlistActions signup={signup} me={me} /></TableCell>
  </TableRow>;
}

function WaitlistCard({ signup, me }: { signup: WaitlistSignup; me: AdminMe }) {
  const latestMessage = signup.outboxMessages[0];
  return <Card className="overflow-hidden"><CardContent className="p-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><div className="flex flex-wrap items-center gap-1.5"><Badge tone={signup.topic === "pro" ? "brand" : "muted"}>{TOPIC_LABEL[signup.topic]}</Badge><Badge tone={STATUS_TONE[signup.status] ?? "muted"}>{label(signup.status)}</Badge></div><p className="mt-2 truncate font-medium">{signup.email}</p></div><span className="shrink-0 font-data text-[10px] text-muted-foreground">{timeAgo(signup.updatedAt)}</span></div><div className="mt-3 grid gap-2 text-xs text-muted-foreground"><span>{signup.city ?? signup.businessName ?? "No place context"} · {signup.locale.toUpperCase()}</span><span>{signup.assignedAdmin ? `Assigned to ${signup.assignedAdmin.name}` : "Unassigned"}</span>{signup.connectedBusiness ? <Link href={`/businesses/${signup.connectedBusiness.id}`} className="text-ceramic hover:underline">Internal link · {signup.connectedBusiness.name} · ownership unchanged</Link> : null}{latestMessage ? <OutboxStatus message={latestMessage} /> : null}</div><div className="mt-4 border-t border-border pt-3"><WaitlistActions signup={signup} me={me} /></div></CardContent></Card>;
}

export default async function WaitlistPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const meResult = await getMeResult();
  if (!meResult.ok) return meResult.status === 401 || meResult.status === 403 ? <AccessDenied /> : <ConsoleUnavailable status={meResult.status} error={meResult.error} />;
  const me = meResult.data;
  if (!can(me, "waitlist.view")) return <AccessDenied missing="waitlist.view" />;
  const params = await searchParams;
  const status = params.status ?? "";
  const topic = params.topic ?? "";
  const q = params.q ?? "";
  const query = new URLSearchParams();
  if (status) query.set("status", status);
  if (topic) query.set("topic", topic);
  if (q) query.set("q", q);
  const response = await consoleGet<WaitlistResponse>(`/waitlist${query.toString() ? `?${query.toString()}` : ""}`);
  const signups = response.ok ? response.data.signups : [];
  const counts = response.ok ? response.data.counts : {};

  return <div className="mx-auto max-w-[1480px]"><PageHeader title="Waitlist" subtitle="Qualify demand, make the next honest promise, and keep first touch attributable." actions={<div className="flex flex-wrap gap-2"><Button asChild variant="secondary"><Link href="/outbox">Open outbox</Link></Button><Button asChild variant="secondary"><Link href="/signature">Signature profile</Link></Button></div>} />
    {!response.ok ? <QueueState response={response} /> : null}
    <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">{[["Visible", response.ok ? response.data.total : "—"], ["New", counts.new ?? "—"], ["Qualified", counts.qualified ?? "—"], ["Accepted", counts.accepted ?? "—"], ["Connected", counts.connected ?? "—"]].map(([title, value]) => <Card key={String(title)}><CardContent className="p-4"><p className="font-data text-[10px] uppercase tracking-[0.14em] text-muted-foreground">{title}</p><p className="mt-2 font-display text-2xl font-semibold">{value}</p></CardContent></Card>)}</div>
    <Card className="overflow-hidden"><CardHeader className="gap-4 border-b border-border pb-4 lg:flex-row lg:items-center lg:justify-between"><div><CardTitle className="flex items-center gap-2 text-base"><Inbox className="size-4 text-ceramic" />Demand review queue</CardTitle><p className="mt-1 text-xs text-muted-foreground">Server-filtered records · intake context is frozen after review · operator changes are signed</p></div><form action="/waitlist" method="get" className="relative w-full sm:w-80"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />{status ? <input type="hidden" name="status" value={status} /> : null}{topic ? <input type="hidden" name="topic" value={topic} /> : null}<Input name="q" placeholder="Search email, city, business…" defaultValue={q} className="pl-9" /></form></CardHeader><CardContent className="space-y-4 p-4 sm:p-5"><div className="space-y-2"><p className="font-data text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Lifecycle</p><div className="flex flex-wrap gap-1 rounded-[8px] bg-panel-3 p-1">{STATUSES.map((value) => <Button key={value || "all-statuses"} asChild variant={status === value ? "primary" : "ghost"} size="sm"><Link href={filterHref({ status, topic, q }, "status", value)}>{label(value)}{value && response.ok && counts[value] !== undefined ? <span className="ml-1 font-data text-[10px] opacity-70">{counts[value]}</span> : null}</Link></Button>)}</div></div><div className="space-y-2"><p className="font-data text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Topic</p><div className="flex flex-wrap gap-1 rounded-[8px] bg-panel-3 p-1">{TOPICS.map((value) => <Button key={value || "all-topics"} asChild variant={topic === value ? "primary" : "ghost"} size="sm"><Link href={filterHref({ status, topic, q }, "topic", value)}>{value ? TOPIC_LABEL[value] : "All topics"}</Link></Button>)}</div></div>
      {response.ok && signups.length > 0 ? <><div className="hidden overflow-x-auto rounded-[8px] border border-border md:block"><Table><TableHeader><TableRow><TableHead>Demand</TableHead><TableHead>Context</TableHead><TableHead>Owner</TableHead><TableHead>Connection / first touch</TableHead><TableHead>Updated</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader><TableBody>{signups.map((signup) => <WaitlistRow key={signup.id} signup={signup} me={me} />)}<EmptyRow colSpan={6} label="" /></TableBody></Table></div><div className="grid gap-3 md:hidden">{signups.map((signup) => <WaitlistCard key={signup.id} signup={signup} me={me} />)}</div></> : <div className="rounded-[8px] border border-dashed border-border px-5 py-14 text-center"><Inbox className="mx-auto size-7 text-muted-foreground" /><p className="mt-3 text-sm font-medium">{response.ok ? "No waitlist records match this view." : "No records loaded."}</p><p className="mt-1 text-xs text-muted-foreground">{response.ok ? "Try another lifecycle state, topic, or search term." : "The screen is wired, but the activation contract is not active."}</p></div>}
    </CardContent></Card>
  </div>;
}
