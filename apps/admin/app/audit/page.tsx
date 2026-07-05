import { AccessDenied } from "@/components/access-denied";
import { consoleGet, getMe } from "@/lib/console";
import { Badge, EmptyRow, PageHeader, timeAgo } from "@/lib/ui";

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
  createdAt: string;
};

function toneFor(action: string): string {
  if (action.includes("delete") || action.includes("ban") || action.includes("reject")) return "bad";
  if (action.includes("approve") || action.includes("unban")) return "good";
  return "muted";
}

export default async function AuditPage({
  searchParams
}: {
  searchParams: Promise<{ action?: string; targetType?: string }>;
}) {
  const me = await getMe();
  if (!me) return <AccessDenied />;
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

      <div className="mb-4 flex flex-wrap gap-1">
        {["", "business", "review", "user"].map((t) => (
          <a key={t || "all"} href={`/audit${t ? `?targetType=${t}` : ""}`} className={`rounded-md px-3 py-1.5 text-sm ${targetType === t ? "bg-panel-2 text-fg" : "text-muted hover:text-fg"}`}>
            {t || "All"}
          </a>
        ))}
      </div>

      <div className="card overflow-x-auto">
        <table className="grid-table">
          <thead>
            <tr>
              <th>When</th>
              <th>Actor</th>
              <th>Action</th>
              <th>Target</th>
              <th>Reason</th>
              <th>IP</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e) => (
              <tr key={e.id}>
                <td className="whitespace-nowrap text-muted" title={new Date(e.createdAt).toISOString()}>
                  {timeAgo(e.createdAt)}
                </td>
                <td>
                  <div className="font-medium">{e.actor.name}</div>
                  <div className="text-xs text-muted">{e.actor.email}</div>
                </td>
                <td><Badge tone={toneFor(e.action)}>{e.action}</Badge></td>
                <td>
                  <span className="text-muted">{e.targetType}</span>
                  {e.targetId ? <div className="font-mono text-[11px] text-muted">{e.targetId}</div> : null}
                </td>
                <td className="max-w-xs text-muted">{e.reason ?? "—"}</td>
                <td className="font-mono text-[11px] text-muted">{e.ipAddress ?? "—"}</td>
              </tr>
            ))}
            {entries.length === 0 ? <EmptyRow colSpan={6} label="No audit entries yet." /> : null}
          </tbody>
        </table>
      </div>
    </>
  );
}
