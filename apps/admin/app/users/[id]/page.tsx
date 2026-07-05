import { banUser, suspendUser, unbanUser } from "@/lib/actions";
import { ActionButton } from "@/components/action-button";
import { AccessDenied } from "@/components/access-denied";
import { consoleGet, getMe } from "@/lib/console";
import { Badge, PageHeader, StatusBadge, timeAgo } from "@/lib/ui";

export const dynamic = "force-dynamic";

type UserDetail = {
  id: string;
  email: string | null;
  displayName: string;
  phone: string | null;
  role: string;
  status: string;
  bannedAt: string | null;
  bannedReason: string | null;
  clerkId: string | null;
  createdAt: string;
  businesses: Array<{ id: string; slug: string; name: string; status: string }>;
  timeline: Array<{ type: string; id: string; rating: number; text: string; business: { slug: string; name: string }; at: string }>;
};

export default async function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const me = await getMe();
  if (!me) return <AccessDenied />;
  if (!me.permissions.includes("user.view")) return <AccessDenied missing="user.view" />;

  const { id } = await params;
  const res = await consoleGet<UserDetail>(`/users/${id}`);
  if (!res.ok) return <div className="card p-8 text-muted">User not found or unavailable.</div>;
  const u = res.data;

  return (
    <>
      <PageHeader
        title={u.displayName}
        subtitle={u.email ?? u.phone ?? "—"}
        actions={
          u.role !== "admin" ? (
            <div className="flex gap-1.5">
              {u.status === "active" && me.permissions.includes("user.suspend") ? (
                <ActionButton action={suspendUser} id={u.id} label="Suspend" variant="ghost" reason />
              ) : null}
              {u.status !== "banned" && me.permissions.includes("user.ban") ? (
                <ActionButton action={banUser} id={u.id} label="Ban" variant="danger" reason />
              ) : null}
              {u.status !== "active" && me.permissions.includes("user.unban") ? (
                <ActionButton action={unbanUser} id={u.id} label="Unban" variant="primary" />
              ) : null}
            </div>
          ) : null
        }
      />

      <div className="grid grid-cols-3 gap-4">
        <div className="card space-y-2 p-4 text-sm">
          <Row label="Status"><StatusBadge kind="user" value={u.status} /></Row>
          <Row label="Role"><Badge>{u.role}</Badge></Row>
          <Row label="Joined"><span className="text-muted">{new Date(u.createdAt).toLocaleDateString()}</span></Row>
          <Row label="Clerk ID"><span className="font-mono text-xs text-muted">{u.clerkId ?? "—"}</span></Row>
          {u.bannedReason ? <Row label="Ban reason"><span className="text-bad">{u.bannedReason}</span></Row> : null}
        </div>

        <div className="card col-span-2 p-4">
          <h2 className="mb-2 text-sm font-semibold">Owned businesses ({u.businesses.length})</h2>
          {u.businesses.length ? (
            <ul className="space-y-1 text-sm">
              {u.businesses.map((b) => (
                <li key={b.id} className="flex items-center justify-between">
                  <span>{b.name}</span>
                  <StatusBadge kind="business" value={b.status} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">None</p>
          )}
        </div>
      </div>

      <div className="mt-4 card p-4">
        <h2 className="mb-3 text-sm font-semibold">Activity timeline ({u.timeline.length})</h2>
        <div className="space-y-3">
          {u.timeline.map((t) => (
            <div key={t.id} className="border-l-2 border-border pl-3">
              <div className="flex items-center gap-2 text-xs text-muted">
                <span className="text-warn">{"★".repeat(t.rating)}</span>
                <span>reviewed {t.business.name}</span>
                <span>· {timeAgo(t.at)}</span>
              </div>
              <p className="mt-0.5 text-sm">{t.text}</p>
            </div>
          ))}
          {u.timeline.length === 0 ? <p className="text-sm text-muted">No recent activity.</p> : null}
        </div>
      </div>
    </>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted">{label}</span>
      {children}
    </div>
  );
}
