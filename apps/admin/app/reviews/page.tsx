import { approveReview, deleteReview, rejectReview } from "@/lib/actions";
import { ActionButton } from "@/components/action-button";
import { AccessDenied } from "@/components/access-denied";
import { consoleGet, getMe } from "@/lib/console";
import { Badge, EmptyRow, PageHeader, StatusBadge, timeAgo } from "@/lib/ui";

export const dynamic = "force-dynamic";

type Review = {
  id: string;
  rating: number;
  text: string;
  moderationStatus: string;
  createdAt: string;
  business: { slug: string; name: string };
  author: { id: string; email: string | null; displayName: string; status: string };
  openReports: Array<{ id: string; reason: string }>;
  spam: { last24hReviews: number };
};

export default async function ReviewsPage({
  searchParams
}: {
  searchParams: Promise<{ status?: string; flagged?: string }>;
}) {
  const me = await getMe();
  if (!me) return <AccessDenied />;
  if (!me.permissions.includes("review.view")) return <AccessDenied missing="review.view" />;

  const { status = "", flagged = "" } = await searchParams;
  const query = new URLSearchParams();
  if (status) query.set("status", status);
  if (flagged) query.set("flagged", flagged);
  const res = await consoleGet<{ reviews: Review[] }>(`/reviews?${query.toString()}`);
  const reviews = res.ok ? res.data.reviews : [];

  const tabs = [
    { label: "Flagged", q: "?flagged=true", active: flagged === "true" },
    { label: "Pending", q: "?status=pending", active: status === "pending" },
    { label: "All", q: "", active: !flagged && !status }
  ];

  const canApprove = me.permissions.includes("review.approve");
  const canReject = me.permissions.includes("review.reject");
  const canDelete = me.permissions.includes("review.delete");

  return (
    <>
      <PageHeader title="Review moderation" subtitle="Flagged & pending reviews with spam signals" />

      <div className="mb-4 flex gap-1">
        {tabs.map((t) => (
          <a key={t.label} href={`/reviews${t.q}`} className={`rounded-md px-3 py-1.5 text-sm ${t.active ? "bg-panel-2 text-fg" : "text-muted hover:text-fg"}`}>
            {t.label}
          </a>
        ))}
      </div>

      <div className="space-y-3">
        {reviews.map((r) => (
          <div key={r.id} className="card p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-warn">{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</span>
                  <StatusBadge kind="review" value={r.moderationStatus} />
                  {r.spam.last24hReviews >= 5 ? <Badge tone="bad">spam risk: {r.spam.last24hReviews}/24h</Badge> : null}
                  {r.openReports.length ? <Badge tone="warn">{r.openReports.length} report(s)</Badge> : null}
                </div>
                <p className="mt-2 text-sm">{r.text}</p>
                <div className="mt-2 text-xs text-muted">
                  on <span className="text-fg">{r.business.name}</span> · by{" "}
                  <a className="text-brand hover:underline" href={`/users/${r.author.id}`}>
                    {r.author.email ?? r.author.displayName}
                  </a>{" "}
                  · {timeAgo(r.createdAt)}
                </div>
                {r.openReports.length ? (
                  <div className="mt-2 text-xs text-muted">Reasons: {r.openReports.map((o) => o.reason).join("; ")}</div>
                ) : null}
              </div>
              <div className="flex shrink-0 gap-1.5">
                {canApprove && r.moderationStatus !== "approved" ? (
                  <ActionButton action={approveReview} id={r.id} label="Approve" variant="primary" />
                ) : null}
                {canReject && r.moderationStatus !== "rejected" ? (
                  <ActionButton action={rejectReview} id={r.id} label="Reject" variant="ghost" reason />
                ) : null}
                {canDelete ? <ActionButton action={deleteReview} id={r.id} label="Delete" variant="danger" reason /> : null}
              </div>
            </div>
          </div>
        ))}
        {reviews.length === 0 ? (
          <div className="card p-10 text-center text-muted">No reviews in this queue.</div>
        ) : null}
      </div>
    </>
  );
}
