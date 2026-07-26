import { approveBusiness, rejectBusiness } from "@/lib/actions";
import { ActionButton } from "@/components/action-button";
import { AccessDenied } from "@/components/access-denied";
import { consoleGet, getMe } from "@/lib/console";
import { EmptyRow, PageHeader, StatusBadge, timeAgo } from "@/lib/ui";

export const dynamic = "force-dynamic";

type Business = {
  id: string;
  slug: string;
  name: string;
  status: string;
  category: string;
  district: string;
  address: string;
  phone: string | null;
  avgRating: number;
  reviewCount: number;
  owner: { email: string | null; displayName: string } | null;
  createdAt: string;
};

const FILTERS = [
  { label: "Pending", value: "pending_claim" },
  { label: "Claimed", value: "claimed" },
  { label: "Unclaimed", value: "unclaimed" },
  { label: "Suspended", value: "suspended" },
  { label: "All", value: "" }
];

export default async function BusinessesPage({
  searchParams
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const me = await getMe();
  if (!me) return <AccessDenied />;
  if (!me.permissions.includes("business.view")) return <AccessDenied missing="business.view" />;

  const { status = "pending_claim", q = "" } = await searchParams;
  const query = new URLSearchParams();
  if (status) query.set("status", status);
  if (q) query.set("q", q);
  const res = await consoleGet<{ businesses: Business[] }>(`/businesses?${query.toString()}`);
  const businesses = res.ok ? res.data.businesses : [];

  const canApprove = me.permissions.includes("business.approve");
  const canReject = me.permissions.includes("business.reject");

  return (
    <>
      <PageHeader title="Business moderation" subtitle="Approve, reject, and manage listing submissions" />

      <div className="mb-4 flex items-center gap-3">
        <div className="flex gap-1">
          {FILTERS.map((f) => (
            <a
              key={f.value || "all"}
              href={`/businesses${f.value ? `?status=${f.value}` : ""}`}
              className={`rounded-md px-3 py-1.5 text-sm ${status === f.value ? "bg-panel-2 text-fg" : "text-muted hover:text-fg"}`}
            >
              {f.label}
            </a>
          ))}
        </div>
        <form className="ml-auto" action="/businesses">
          {status ? <input type="hidden" name="status" value={status} /> : null}
          <input className="input w-64" name="q" placeholder="Search name / address / district…" defaultValue={q} />
        </form>
      </div>

      <div className="card overflow-x-auto">
        <table className="grid-table">
          <thead>
            <tr>
              <th>Business</th>
              <th>Category</th>
              <th>District</th>
              <th>Status</th>
              <th>Rating</th>
              <th>Submitted</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {businesses.map((b) => (
              <tr key={b.id}>
                <td>
                  {/* The name is the affordance into the detail page, addressed
                      by id — the previous "View" link passed a slug to an
                      id-based route, which could never resolve. */}
                  <a className="font-medium hover:underline" href={`/businesses/${b.id}`}>
                    {b.name}
                  </a>
                  <div className="text-xs text-muted">{b.address}</div>
                  {b.owner ? <div className="text-xs text-muted">owner: {b.owner.email ?? b.owner.displayName}</div> : null}
                </td>
                <td className="text-muted">{b.category}</td>
                <td className="text-muted">{b.district}</td>
                <td><StatusBadge kind="business" value={b.status} /></td>
                <td className="tabular-nums">{b.avgRating.toFixed(1)} · {b.reviewCount}</td>
                <td className="text-muted">{timeAgo(b.createdAt)}</td>
                <td>
                  <div className="flex justify-end gap-1.5">
                    {canApprove && b.status !== "claimed" ? (
                      <ActionButton action={approveBusiness} id={b.id} label="Approve" variant="primary" />
                    ) : null}
                    {canReject && b.status !== "suspended" ? (
                      <ActionButton action={rejectBusiness} id={b.id} label="Reject" variant="danger" reason />
                    ) : null}
                    <a className="btn-ghost btn-xs" href={`/businesses/${b.id}`}>
                      Manage
                    </a>
                  </div>
                </td>
              </tr>
            ))}
            {businesses.length === 0 ? <EmptyRow colSpan={7} label="No businesses match this filter." /> : null}
          </tbody>
        </table>
      </div>
    </>
  );
}
