import Link from "next/link";
import { consoleGet, getMe } from "@/lib/console";
import { PageHeader } from "@/lib/ui";
import { AccessDenied } from "@/components/access-denied";

export const dynamic = "force-dynamic";

type Overview = {
  pendingBusinesses: number;
  flaggedReviews: number;
  bannedUsers: number;
  admins: number;
  gurmanWaitlist: number;
};

export default async function DashboardPage() {
  const me = await getMe();
  if (!me) return <AccessDenied />;

  const res = await consoleGet<Overview>("/overview");
  const stats = res.ok
    ? res.data
    : { pendingBusinesses: 0, flaggedReviews: 0, bannedUsers: 0, admins: 0, gurmanWaitlist: 0 };

  const cards = [
    { label: "Gurman waitlist", value: stats.gurmanWaitlist, href: "/waitlist", perm: "waitlist.view" },
    { label: "Pending businesses", value: stats.pendingBusinesses, href: "/businesses?status=pending_claim", perm: "business.view" },
    { label: "Flagged reviews", value: stats.flaggedReviews, href: "/reviews?flagged=true", perm: "review.view" },
    { label: "Banned users", value: stats.bannedUsers, href: "/users?status=banned", perm: "user.view" },
    { label: "Active admins", value: stats.admins, href: "/audit", perm: "audit.view" }
  ];

  return (
    <>
      <PageHeader title={`Welcome, ${me.name.split(" ")[0]}`} subtitle="Operations overview" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {cards.map((c) => {
          const allowed = me.permissions.includes(c.perm);
          const inner = (
            <div className="card p-5">
              <div className="text-3xl font-semibold tabular-nums">{c.value}</div>
              <div className="mt-1 text-sm text-muted">{c.label}</div>
            </div>
          );
          return allowed ? (
            <Link key={c.label} href={c.href} className="transition-transform hover:-translate-y-0.5">
              {inner}
            </Link>
          ) : (
            <div key={c.label} className="opacity-60">{inner}</div>
          );
        })}
      </div>

      <div className="mt-8 card p-5">
        <h2 className="text-sm font-semibold">Your access</h2>
        <p className="mt-1 text-sm text-muted">
          Roles: <span className="text-fg">{me.roles.join(", ")}</span> · {me.permissions.length} permissions granted.
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {me.permissions.map((p) => (
            <span key={p} className="rounded bg-panel-2 px-2 py-0.5 font-mono text-[11px] text-muted">{p}</span>
          ))}
        </div>
      </div>
    </>
  );
}
