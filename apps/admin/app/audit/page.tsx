import Link from "next/link";
import { AccessDenied, ConsoleUnavailable } from "@/components/access-denied";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { consoleGet, getMeResult } from "@/lib/console";
import { Badge, PageHeader, timeAgo } from "@/lib/ui";

export const dynamic = "force-dynamic";

type AuditEntry = {
  id: string;
  action: string;
  targetType: string;
  targetId: string | null;
  reason: string | null;
  beforeState: unknown;
  afterState: unknown;
  ipAddress: string | null;
  actor: { email: string; name: string };
  operationalSignature: {
    id: string;
    adminSignatureId: string;
    signatureVersion: number;
    displayName: string;
    title: string | null;
    payloadHash: string;
    algorithm: string;
    createdAt: string;
  } | null;
  createdAt: string;
};

function toneFor(action: string): "bad" | "good" | "muted" {
  if (action.includes("delete") || action.includes("ban") || action.includes("reject")) return "bad";
  if (action.includes("approve") || action.includes("unban")) return "good";
  return "muted";
}

export default async function AuditPage({
  searchParams
}: {
  searchParams: Promise<{ action?: string; targetType?: string }>;
}) {
  const meResult = await getMeResult();
  if (!meResult.ok) return meResult.status === 401 || meResult.status === 403 ? <AccessDenied /> : <ConsoleUnavailable status={meResult.status} error={meResult.error} />;
  const me = meResult.data;
  if (!me.permissions.includes("audit.view")) return <AccessDenied missing="audit.view" />;

  const { action = "", targetType = "" } = await searchParams;
  const query = new URLSearchParams();
  if (action) query.set("action", action);
  if (targetType) query.set("targetType", targetType);
  const res = await consoleGet<{ entries: AuditEntry[] }>(`/audit?${query.toString()}`);
  const entries = res.ok ? res.data.entries : [];

  return (
    <>
      <PageHeader title="Audit log" subtitle="Immutable record of every admin action" />

      <div className="mb-5 flex flex-wrap gap-2" aria-label="Audit filters">
        {["", "business", "review", "user", "waitlist_signup", "outbox_message", "admin_signature"].map((type) => {
          const active = targetType === type;
          return (
            <Button key={type || "all"} asChild size="sm" variant={active ? "default" : "outline"}>
              <Link href={`/audit${type ? `?targetType=${type}` : ""}`} aria-current={active ? "page" : undefined}>
                {type || "All"}
              </Link>
            </Button>
          );
        })}
      </div>

      {!res.ok ? (
        <Alert variant="destructive" className="mb-5">
          <AlertTitle>Audit stream unavailable</AlertTitle>
          <AlertDescription>{res.error}</AlertDescription>
        </Alert>
      ) : null}

      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>When</TableHead>
                  <TableHead>Actor</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Evidence</TableHead>
                  <TableHead>IP</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="whitespace-nowrap text-muted" title={new Date(entry.createdAt).toISOString()}>
                      {timeAgo(entry.createdAt)}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-fg">{entry.actor.name}</div>
                      <div className="text-xs text-muted">{entry.actor.email}</div>
                    </TableCell>
                    <TableCell><Badge tone={toneFor(entry.action)}>{entry.action}</Badge></TableCell>
                    <TableCell>
                      <span className="text-muted">{entry.targetType}</span>
                      {entry.targetId ? <div className="font-data text-[11px] text-muted">{entry.targetId}</div> : null}
                    </TableCell>
                    <TableCell className="max-w-xs text-muted">{entry.reason ?? "—"}</TableCell>
                    <TableCell className="min-w-56 text-xs text-muted">
                      {entry.operationalSignature ? (
                        <>
                          <div className="font-medium text-fg">Signed · v{entry.operationalSignature.signatureVersion} · {entry.operationalSignature.algorithm}</div>
                          <div className="font-data text-[10px]" title={entry.operationalSignature.payloadHash}>hash {entry.operationalSignature.payloadHash.slice(0, 12)}…</div>
                        </>
                      ) : <div>Unsigned bootstrap / legacy event</div>}
                      <details className="mt-1">
                        <summary className="cursor-pointer text-[11px] text-ceramic">View state</summary>
                        <pre className="mt-1 max-w-xs overflow-auto whitespace-pre-wrap text-[10px]">{JSON.stringify({ before: entry.beforeState, after: entry.afterState }, null, 2)}</pre>
                      </details>
                    </TableCell>
                    <TableCell className="font-data text-[11px] text-muted">{entry.ipAddress ?? "—"}</TableCell>
                  </TableRow>
                ))}
                {entries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-28 text-center text-sm text-muted">
                      {res.ok ? "No audit entries yet." : "No audit data was returned."}
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
