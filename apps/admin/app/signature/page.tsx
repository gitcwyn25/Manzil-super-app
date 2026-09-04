import Link from "next/link";
import { ArrowUpRight, Fingerprint, ShieldCheck } from "lucide-react";
import { AccessDenied, ConsoleUnavailable } from "@/components/access-denied";
import { SignatureActivationForm } from "@/components/activation-controls";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge as UiBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { can, consoleGet, getMeResult, type AdminMe } from "@/lib/console";
import { Badge, PageHeader, timeAgo } from "@/lib/ui";

export const dynamic = "force-dynamic";

type Signature = { id: string; adminUserId: string; version: number; displayName: string; title: string | null; status: "active" | "revoked"; createdAt: string; revokedAt: string | null };
type SignatureResponse = { configured: boolean; active: Signature | null; history: Signature[] };

function GateState({ error }: { error: string }) {
  return <Alert variant="warning" className="mb-5"><AlertTitle>Signature contract is gated</AlertTitle><AlertDescription>{error}. No signature profile is created until the M1 migration and activation key are ready.</AlertDescription></Alert>;
}

function SignatureHistory({ history }: { history: Signature[] }) {
  return <Card className="overflow-hidden"><CardHeader className="border-b border-border pb-4"><CardTitle className="flex items-center gap-2 text-base"><Fingerprint className="size-4 text-ceramic" />Version history</CardTitle><p className="text-xs text-muted-foreground">Historical audit events retain the signature version that was active at the time.</p></CardHeader><CardContent className="p-0"><div className="divide-y divide-border">{history.map((signature) => <div key={signature.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"><div className="flex min-w-0 items-center gap-3"><span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-panel-3 font-data text-[10px] font-semibold text-ceramic">v{signature.version}</span><div className="min-w-0"><p className="truncate text-sm font-medium">{signature.displayName}{signature.title ? <span className="font-normal text-muted-foreground"> · {signature.title}</span> : null}</p><p className="mt-1 text-xs text-muted-foreground">Created {timeAgo(signature.createdAt)}{signature.revokedAt ? ` · revoked ${timeAgo(signature.revokedAt)}` : ""}</p></div></div><Badge tone={signature.status === "active" ? "good" : "muted"}>{signature.status}</Badge></div>)}</div></CardContent></Card>;
}

function ProfileCard({ active, me }: { active: Signature | null; me: AdminMe }) {
  const canCreate = can(me, "signature.create");
  return <Card className="overflow-hidden"><CardHeader className="border-b border-border pb-4"><div className="flex items-start justify-between gap-4"><div><CardTitle className="flex items-center gap-2 text-base"><ShieldCheck className="size-4 text-ceramic" />Current operator profile</CardTitle><p className="mt-1 text-xs text-muted-foreground">Used to attribute consequential activation actions.</p></div>{active ? <UiBadge variant="success">Active · v{active.version}</UiBadge> : <UiBadge variant="warning">Not configured</UiBadge>}</div></CardHeader><CardContent className="space-y-5 p-5">{active ? <div className="grid gap-4 sm:grid-cols-3"><div><p className="font-data text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Display name</p><p className="mt-1 text-sm font-medium">{active.displayName}</p></div><div><p className="font-data text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Operational title</p><p className="mt-1 text-sm">{active.title ?? "Not set"}</p></div><div><p className="font-data text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Created</p><p className="mt-1 text-sm">{timeAgo(active.createdAt)}</p></div></div> : <div className="rounded-[8px] border border-dashed border-warn/40 bg-warn-soft/40 p-4 text-sm leading-6 text-foreground">No active profile exists for {me.name}. Consequential waitlist, company-link, outbox, and retry mutations will fail closed until one is configured.</div>}{canCreate ? <div className="border-t border-border pt-5"><SignatureActivationForm hasActive={Boolean(active)} /></div> : <p className="text-xs text-muted-foreground">You have read access only. A user with <code className="font-data text-[11px]">signature.create</code> can configure or rotate this profile.</p>}</CardContent></Card>;
}

export default async function SignaturePage() {
  const meResult = await getMeResult();
  if (!meResult.ok) return meResult.status === 401 || meResult.status === 403 ? <AccessDenied /> : <ConsoleUnavailable status={meResult.status} error={meResult.error} />;
  const me = meResult.data;
  if (!can(me, "signature.view")) return <AccessDenied missing="signature.view" />;
  const response = await consoleGet<SignatureResponse>("/signature");

  return <div className="mx-auto max-w-[1180px]"><PageHeader title="Signature profile" subtitle="Operational attribution for consequential work—versioned, reviewable, and explicitly not a legal e-signature." actions={<div className="flex flex-wrap gap-2"><Button asChild variant="secondary"><Link href="/audit">Signed activity <ArrowUpRight className="size-3.5" /></Link></Button><Button asChild variant="secondary"><Link href="/team">Team & access</Link></Button></div>} />
    {!response.ok ? <GateState error={response.error} /> : <><ProfileCard active={response.data.active} me={me} />{response.data.history.length > 0 ? <div className="mt-5"><SignatureHistory history={response.data.history} /></div> : <Card className="mt-5"><CardContent className="p-5 text-sm text-muted-foreground">No signature history yet. Configure the profile above before operating on activation records.</CardContent></Card>}</>}
    <Alert className="mt-5"><ShieldCheck className="absolute left-4 top-4 size-4 text-ceramic" /><AlertTitle className="pl-7">What this proves</AlertTitle><AlertDescription className="pl-7">The profile identifies the operator, role context, version, timestamp, reason, and before/after state in the audit trail. It does not prove legal consent, ownership, or a customer’s identity.</AlertDescription></Alert>
  </div>;
}
