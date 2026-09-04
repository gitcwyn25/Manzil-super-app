import Link from "next/link";
import { ArrowUpRight, Mail, RotateCcw } from "lucide-react";
import { AccessDenied, ConsoleUnavailable } from "@/components/access-denied";
import { RetryOutboxButton } from "@/components/activation-controls";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { can, consoleGet, getMeResult, type AdminMe } from "@/lib/console";
import { Badge, EmptyRow, PageHeader, timeAgo } from "@/lib/ui";

export const dynamic = "force-dynamic";

type WaitlistReference = { id: string; topic: string; email: string; city: string | null; businessName: string | null };
type AdminReference = { id: string; name: string; email: string };
type OutboxMessage = {
  id: string;
  channel: string;
  status: string;
  kind: string;
  recipient: string;
  subject: string;
  body: string;
  idempotencyKey: string;
  attempts: number;
  availableAt: string;
  lockedAt: string | null;
  sentAt: string | null;
  lastError: string | null;
  waitlistSignup: WaitlistReference | null;
  createdByAdmin: AdminReference | null;
  createdAt: string;
  updatedAt: string;
};
type OutboxResponse = { counts: Record<string, number>; messages: OutboxMessage[] };

type SearchParams = { status?: string };
const STATUSES = ["", "pending", "processing", "failed", "sent", "canceled"];
const STATUS_TONE: Record<string, "good" | "warn" | "bad" | "muted" | "brand"> = { pending: "warn", processing: "brand", failed: "bad", sent: "good", canceled: "muted" };

function statusLabel(value: string) {
  return value ? value.replace(/_/g, " ").replace(/^./, (char) => char.toUpperCase()) : "All";
}

function filterHref(status: string, value: string) {
  return value ? `/outbox?status=${encodeURIComponent(value)}` : "/outbox";
}

function QueueState({ error }: { error: string }) {
  return <Alert variant="warning" className="mb-5"><AlertTitle>Outbox contract is gated or unavailable</AlertTitle><AlertDescription>{error}. No fallback messages are shown. Apply the reviewed activation migration before enabling the contract. Queue-only staging remains delivery-disabled until a provider worker is separately approved.</AlertDescription></Alert>;
}

function MessageStatus({ message }: { message: OutboxMessage }) {
  return <div className="flex flex-wrap items-center gap-2"><Badge tone={STATUS_TONE[message.status] ?? "muted"}>{statusLabel(message.status)}</Badge><span className="font-data text-[10px] text-muted-foreground">attempts {message.attempts}</span>{message.status === "failed" && message.lastError ? <span className="max-w-56 truncate text-xs text-danger" title={message.lastError}>{message.lastError}</span> : null}</div>;
}

function SourceLabel({ message }: { message: OutboxMessage }) {
  const source = message.waitlistSignup;
  if (!source) return <span className="text-xs text-muted-foreground">No linked waitlist record</span>;
  return <Link href="/waitlist" className="inline-flex max-w-56 items-center gap-1 text-xs text-ceramic hover:underline"><span className="truncate">{source.topic} · {source.city ?? source.businessName ?? source.email}</span><ArrowUpRight className="size-3 shrink-0" /></Link>;
}

function OutboxActions({ message, me }: { message: OutboxMessage; me: AdminMe }) {
  if (message.status !== "failed" || !can(me, "outbox.retry")) return <span className="text-xs text-muted-foreground">{message.status === "sent" ? "Provider sent" : "No action"}</span>;
  return <RetryOutboxButton id={message.id} />;
}

function OutboxRow({ message, me }: { message: OutboxMessage; me: AdminMe }) {
  return <TableRow><TableCell><div className="min-w-[250px]"><p className="font-medium text-foreground">{message.recipient}</p><p className="mt-1 max-w-[280px] truncate text-xs text-muted-foreground">{message.subject}</p><p className="mt-1 font-data text-[10px] text-muted-foreground">{message.channel} · {message.kind}</p></div></TableCell><TableCell><MessageStatus message={message} /><p className="mt-2 max-w-[320px] truncate text-xs text-muted-foreground">{message.body}</p></TableCell><TableCell><SourceLabel message={message} /></TableCell><TableCell><span className="text-xs">{message.createdByAdmin?.name ?? "System"}</span><p className="mt-1 text-[11px] text-muted-foreground">{timeAgo(message.createdAt)}</p></TableCell><TableCell><OutboxActions message={message} me={me} /></TableCell></TableRow>;
}

function OutboxCard({ message, me }: { message: OutboxMessage; me: AdminMe }) {
  return <Card><CardContent className="p-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate font-medium">{message.recipient}</p><p className="mt-1 truncate text-xs text-muted-foreground">{message.subject}</p></div><MessageStatus message={message} /></div><p className="mt-3 line-clamp-3 text-xs leading-5 text-muted-foreground">{message.body}</p><div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3"><SourceLabel message={message} /><OutboxActions message={message} me={me} /></div></CardContent></Card>;
}

export default async function OutboxPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const meResult = await getMeResult();
  if (!meResult.ok) return meResult.status === 401 || meResult.status === 403 ? <AccessDenied /> : <ConsoleUnavailable status={meResult.status} error={meResult.error} />;
  const me = meResult.data;
  if (!can(me, "outbox.view")) return <AccessDenied missing="outbox.view" />;
  const { status = "" } = await searchParams;
  const response = await consoleGet<OutboxResponse>(`/outbox${status ? `?status=${encodeURIComponent(status)}` : ""}`);
  const messages = response.ok ? response.data.messages : [];
  const counts = response.ok ? response.data.counts : {};

  return <div className="mx-auto max-w-[1480px]"><PageHeader title="Outbox" subtitle="Inspect attributable message drafts and delivery state without pretending queued work was sent." actions={<Button asChild variant="secondary"><Link href="/waitlist">Back to waitlist</Link></Button>} />
    {!response.ok ? <QueueState error={response.error} /> : null}
    <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">{[["Pending", counts.pending ?? "—"], ["Processing", counts.processing ?? "—"], ["Failed", counts.failed ?? "—"], ["Sent", counts.sent ?? "—"], ["Canceled", counts.canceled ?? "—"]].map(([title, value]) => <Card key={String(title)}><CardContent className="p-4"><p className="font-data text-[10px] uppercase tracking-[0.14em] text-muted-foreground">{title}</p><p className="mt-2 font-display text-2xl font-semibold">{value}</p></CardContent></Card>)}</div>
    <Card className="overflow-hidden"><CardHeader className="gap-4 border-b border-border pb-4 lg:flex-row lg:items-center lg:justify-between"><div><CardTitle className="flex items-center gap-2 text-base"><Mail className="size-4 text-ceramic" />Durable message queue</CardTitle><p className="mt-1 text-xs text-muted-foreground">A queued record is not a sent email · retries require a signed reason · provider delivery is a separate worker concern</p></div><div className="flex flex-wrap gap-1 rounded-[8px] bg-panel-3 p-1">{STATUSES.map((value) => <Button key={value || "all"} asChild variant={status === value ? "primary" : "ghost"} size="sm"><Link href={filterHref(status, value)}>{statusLabel(value)}{value && response.ok && counts[value] !== undefined ? <span className="ml-1 font-data text-[10px] opacity-70">{counts[value]}</span> : null}</Link></Button>)}</div></CardHeader><CardContent className="p-4 sm:p-5">{response.ok && messages.length > 0 ? <><div className="hidden overflow-x-auto rounded-[8px] border border-border md:block"><Table><TableHeader><TableRow><TableHead>Recipient</TableHead><TableHead>Delivery state</TableHead><TableHead>Source</TableHead><TableHead>Created by</TableHead><TableHead className="text-right">Action</TableHead></TableRow></TableHeader><TableBody>{messages.map((message) => <OutboxRow key={message.id} message={message} me={me} />)}<EmptyRow colSpan={5} label="" /></TableBody></Table></div><div className="grid gap-3 md:hidden">{messages.map((message) => <OutboxCard key={message.id} message={message} me={me} />)}</div></> : <div className="rounded-[8px] border border-dashed border-border px-5 py-14 text-center"><RotateCcw className="mx-auto size-7 text-muted-foreground" /><p className="mt-3 text-sm font-medium">{response.ok ? "No messages match this state." : "No messages loaded."}</p><p className="mt-1 text-xs text-muted-foreground">{response.ok ? "Try another delivery state." : "The screen is wired, but the activation contract is not active."}</p></div>}</CardContent></Card>
  </div>;
}
