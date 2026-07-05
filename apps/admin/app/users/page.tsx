import Link from "next/link";
import { banUser, suspendUser, unbanUser } from "@/lib/actions";
import { ActionButton } from "@/components/action-button";
import { AccessDenied } from "@/components/access-denied";
import { consoleGet, getMe } from "@/lib/console";
import { EmptyRow, PageHeader, StatusBadge, timeAgo } from "@/lib/ui";

export const dynamic = "force-dynamic";

type UserRow = {
  id: string;
  email: string | null;
  displayName: string;
  phone: string | null;
  role: string;
  status: string;
  reviewCount: number;
  businessCount: number;
  createdAt: string;
};

export default async function UsersPage({
  searchParams
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const me = await getMe();
  if (!me) return <AccessDenied />;
  if (!me.permissions.includes("user.view")) return <AccessDenied missing="user.view" />;

  const { q = "", status = "" } = await searchParams;
  const query = new URLSearchParams();
  if (q) query.set("q", q);
  if (status) query.set("status", status);
  const res = await consoleGet<{ users: UserRow[] }>(`/users?${query.toString()}`);
  const users = res.ok ? res.data.users : [];

  const canBan = me.permissions.includes("user.ban");
  const canSuspend = me.permissions.includes("user.suspend");
  const canUnban = me.permissions.includes("user.unban");

  return (
    <>
      <PageHeader title="User management" subtitle="Search, review activity, and enforce account status" />

      <div className="mb-4 flex items-center gap-3">
        <div className="flex gap-1">
          {[{ l: "All", v: "" }, { l: "Active", v: "active" }, { l: "Suspended", v: "suspended" }, { l: "Banned", v: "banned" }].map((f) => (
            <a key={f.v || "all"} href={`/users${f.v ? `?status=${f.v}` : ""}`} className={`rounded-md px-3 py-1.5 text-sm ${status === f.v ? "bg-panel-2 text-fg" : "text-muted hover:text-fg"}`}>
              {f.l}
            </a>
          ))}
        </div>
        <form className="ml-auto" action="/users">
          {status ? <input type="hidden" name="status" value={status} /> : null}
          <input className="input w-64" name="q" placeholder="Search email / name / phone…" defaultValue={q} />
        </form>
      </div>

      <div className="card overflow-x-auto">
        <table className="grid-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Role</th>
              <th>Status</th>
              <th>Reviews</th>
              <th>Businesses</th>
              <th>Joined</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>
                  <Link href={`/users/${u.id}`} className="font-medium hover:text-brand">
                    {u.displayName}
                  </Link>
                  <div className="text-xs text-muted">{u.email ?? u.phone ?? "—"}</div>
                </td>
                <td className="text-muted">{u.role}</td>
                <td><StatusBadge kind="user" value={u.status} /></td>
                <td className="tabular-nums">{u.reviewCount}</td>
                <td className="tabular-nums">{u.businessCount}</td>
                <td className="text-muted">{timeAgo(u.createdAt)}</td>
                <td>
                  <div className="flex justify-end gap-1.5">
                    {u.role !== "admin" && u.status === "active" && canSuspend ? (
                      <ActionButton action={suspendUser} id={u.id} label="Suspend" variant="ghost" reason />
                    ) : null}
                    {u.role !== "admin" && u.status !== "banned" && canBan ? (
                      <ActionButton action={banUser} id={u.id} label="Ban" variant="danger" reason />
                    ) : null}
                    {u.status !== "active" && canUnban ? (
                      <ActionButton action={unbanUser} id={u.id} label="Unban" variant="primary" />
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
            {users.length === 0 ? <EmptyRow colSpan={7} label="No users match this search." /> : null}
          </tbody>
        </table>
      </div>
    </>
  );
}
