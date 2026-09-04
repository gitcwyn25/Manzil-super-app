import Link from "next/link";
import { banUser, suspendUser, unbanUser } from "@/lib/actions";
import { ActionButton } from "@/components/action-button";
import { AccessDenied } from "@/components/access-denied";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { consoleGet, getMe } from "@/lib/console";
import { PageHeader, StatusBadge, timeAgo } from "@/lib/ui";

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
  const filters = [
    { label: "All", value: "" },
    { label: "Active", value: "active" },
    { label: "Suspended", value: "suspended" },
    { label: "Banned", value: "banned" }
  ];

  return (
    <>
      <PageHeader title="User management" subtitle="Search, review activity, and enforce account status" />

      <div className="mb-5 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-wrap gap-2" aria-label="User status filters">
          {filters.map((filter) => {
            const active = status === filter.value;
            const href = new URLSearchParams({ ...(filter.value ? { status: filter.value } : {}), ...(q ? { q } : {}) }).toString();
            return (
              <Button key={filter.value || "all"} asChild size="sm" variant={active ? "default" : "outline"}>
                <Link href={`/users${href ? `?${href}` : ""}`} aria-current={active ? "page" : undefined}>
                  {filter.label}
                </Link>
              </Button>
            );
          })}
        </div>
        <form className="flex w-full gap-2 xl:w-auto" action="/users">
          {status ? <input type="hidden" name="status" value={status} /> : null}
          <Input className="w-full xl:w-72" name="q" placeholder="Search email, name, or phone" defaultValue={q} />
          <Button type="submit" variant="outline">Search</Button>
        </form>
      </div>

      {!res.ok ? (
        <Alert variant="destructive" className="mb-5">
          <AlertTitle>User directory unavailable</AlertTitle>
          <AlertDescription>{res.error}</AlertDescription>
        </Alert>
      ) : null}

      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="hidden overflow-x-auto md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Reviews</TableHead>
                  <TableHead>Businesses</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <Link href={`/users/${user.id}`} className="font-medium text-fg hover:text-ceramic">
                        {user.displayName}
                      </Link>
                      <div className="text-xs text-muted">{user.email ?? user.phone ?? "—"}</div>
                    </TableCell>
                    <TableCell className="text-muted">{user.role}</TableCell>
                    <TableCell><StatusBadge kind="user" value={user.status} /></TableCell>
                    <TableCell className="tabular-nums">{user.reviewCount}</TableCell>
                    <TableCell className="tabular-nums">{user.businessCount}</TableCell>
                    <TableCell className="text-muted">{timeAgo(user.createdAt)}</TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        {user.role !== "admin" && user.status === "active" && canSuspend ? (
                          <ActionButton action={suspendUser} id={user.id} label="Suspend" variant="ghost" reason />
                        ) : null}
                        {user.role !== "admin" && user.status !== "banned" && canBan ? (
                          <ActionButton action={banUser} id={user.id} label="Ban" variant="danger" reason />
                        ) : null}
                        {user.status !== "active" && canUnban ? (
                          <ActionButton action={unbanUser} id={user.id} label="Unban" variant="primary" />
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {users.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="h-28 text-center text-sm text-muted">{res.ok ? "No users match this search." : "No user data was returned."}</TableCell></TableRow>
                ) : null}
              </TableBody>
            </Table>
          </div>
          <div className="divide-y divide-border md:hidden">
            {users.map((user) => (
              <div key={user.id} className="space-y-4 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <Link href={`/users/${user.id}`} className="font-medium text-fg hover:text-ceramic">{user.displayName}</Link>
                    <p className="mt-1 text-xs text-muted">{user.email ?? user.phone ?? "—"}</p>
                  </div>
                  <StatusBadge kind="user" value={user.status} />
                </div>
                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div><div className="font-data text-base text-fg">{user.reviewCount}</div><div className="text-muted">Reviews</div></div>
                  <div><div className="font-data text-base text-fg">{user.businessCount}</div><div className="text-muted">Businesses</div></div>
                  <div><div className="font-data text-base text-fg">{user.role}</div><div className="text-muted">Role</div></div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {user.role !== "admin" && user.status === "active" && canSuspend ? <ActionButton action={suspendUser} id={user.id} label="Suspend" variant="ghost" reason /> : null}
                  {user.role !== "admin" && user.status !== "banned" && canBan ? <ActionButton action={banUser} id={user.id} label="Ban" variant="danger" reason /> : null}
                  {user.status !== "active" && canUnban ? <ActionButton action={unbanUser} id={user.id} label="Unban" variant="primary" /> : null}
                </div>
              </div>
            ))}
            {users.length === 0 ? <div className="p-10 text-center text-sm text-muted">{res.ok ? "No users match this search." : "No user data was returned."}</div> : null}
          </div>
        </CardContent>
      </Card>
    </>
  );
}
