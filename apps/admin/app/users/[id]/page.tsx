import Link from "next/link";
import { banUser, suspendUser, unbanUser } from "@/lib/actions";
import { ActionButton } from "@/components/action-button";
import { AccessDenied } from "@/components/access-denied";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { consoleGet, getMe } from "@/lib/console";
import { PageHeader, StatusBadge, timeAgo } from "@/lib/ui";

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
  if (!res.ok) {
    return (
      <>
        <PageHeader title="User unavailable" subtitle="The requested account could not be loaded" />
        <Alert variant="destructive"><AlertTitle>Could not load user</AlertTitle><AlertDescription>{res.error}</AlertDescription></Alert>
      </>
    );
  }
  const user = res.data;

  return (
    <>
      <PageHeader
        title={user.displayName}
        subtitle={user.email ?? user.phone ?? "No contact channel"}
        actions={
          user.role !== "admin" ? (
            <div className="flex flex-wrap gap-2">
              {user.status === "active" && me.permissions.includes("user.suspend") ? <ActionButton action={suspendUser} id={user.id} label="Suspend" variant="ghost" reason /> : null}
              {user.status !== "banned" && me.permissions.includes("user.ban") ? <ActionButton action={banUser} id={user.id} label="Ban" variant="danger" reason /> : null}
              {user.status !== "active" && me.permissions.includes("user.unban") ? <ActionButton action={unbanUser} id={user.id} label="Unban" variant="primary" /> : null}
            </div>
          ) : null
        }
      />

      <div className="mb-5 flex flex-wrap items-center gap-2">
        <StatusBadge kind="user" value={user.status} />
        <Badge variant="outline">{user.role}</Badge>
        <span className="text-xs text-muted">Joined {new Date(user.createdAt).toLocaleDateString()}</span>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader><CardTitle className="text-sm">Account record</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Row label="Email">{user.email ?? "—"}</Row>
            <Row label="Phone">{user.phone ?? "—"}</Row>
            <Row label="Clerk ID"><span className="font-data text-xs text-muted">{user.clerkId ?? "—"}</span></Row>
            {user.bannedReason ? <Row label="Ban reason"><span className="text-danger">{user.bannedReason}</span></Row> : null}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-sm">Owned businesses ({user.businesses.length})</CardTitle></CardHeader>
          <CardContent>
            {user.businesses.length ? (
              <ul className="divide-y divide-border text-sm">
                {user.businesses.map((business) => (
                  <li key={business.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                    <Link href={`/businesses/${business.id}`} className="font-medium text-fg hover:text-ceramic">{business.name}</Link>
                    <StatusBadge kind="business" value={business.status} />
                  </li>
                ))}
              </ul>
            ) : <p className="text-sm text-muted">No owned businesses.</p>}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader><CardTitle className="text-sm">Activity timeline ({user.timeline.length})</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-4">
            {user.timeline.map((entry) => (
              <div key={entry.id} className="border-l-2 border-ceramic/40 pl-4">
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
                  <span className="font-data tracking-[0.08em] text-brass" aria-label={`${entry.rating} out of 5 stars`}>{"★".repeat(entry.rating)}</span>
                  <span>reviewed {entry.business.name}</span>
                  <span>· {timeAgo(entry.at)}</span>
                </div>
                <p className="mt-1 text-sm leading-6 text-fg">{entry.text}</p>
              </div>
            ))}
            {user.timeline.length === 0 ? <p className="text-sm text-muted">No recent activity.</p> : null}
          </div>
        </CardContent>
      </Card>
    </>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="flex items-start justify-between gap-4"><span className="text-muted">{label}</span><span className="text-right text-fg">{children}</span></div>;
}
