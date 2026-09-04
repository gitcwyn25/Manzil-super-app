import Link from "next/link";
import { approveReview, deleteReview, rejectReview } from "@/lib/actions";
import { ActionButton } from "@/components/action-button";
import { AccessDenied } from "@/components/access-denied";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { consoleGet, getMe } from "@/lib/console";
import { Badge, PageHeader, StatusBadge, timeAgo } from "@/lib/ui";

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
      <PageHeader title="Review moderation" subtitle="Flagged and pending reviews with spam signals" />

      <div className="mb-5 flex flex-wrap gap-2" aria-label="Review filters">
        {tabs.map((tab) => (
          <Button key={tab.label} asChild size="sm" variant={tab.active ? "default" : "outline"}>
            <Link href={`/reviews${tab.q}`} aria-current={tab.active ? "page" : undefined}>
              {tab.label}
            </Link>
          </Button>
        ))}
      </div>

      {!res.ok ? (
        <Alert variant="destructive" className="mb-5">
          <AlertTitle>Moderation queue unavailable</AlertTitle>
          <AlertDescription>{res.error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="space-y-3">
        {reviews.map((review) => (
          <Card key={review.id} className="overflow-hidden">
            <CardContent className="p-5">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-data text-sm tracking-[0.12em] text-brass" aria-label={`${review.rating} out of 5 stars`}>
                      {"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}
                    </span>
                    <StatusBadge kind="review" value={review.moderationStatus} />
                    {review.spam.last24hReviews >= 5 ? (
                      <Badge tone="bad">spam risk: {review.spam.last24hReviews}/24h</Badge>
                    ) : null}
                    {review.openReports.length ? (
                      <Badge tone="warn">{review.openReports.length} report(s)</Badge>
                    ) : null}
                  </div>
                  <p className="mt-3 text-sm leading-6 text-fg">{review.text}</p>
                  <div className="mt-3 text-xs text-muted">
                    on <span className="text-fg">{review.business.name}</span> · by{" "}
                    <Link className="text-ceramic hover:underline" href={`/users/${review.author.id}`}>
                      {review.author.email ?? review.author.displayName}
                    </Link>{" "}
                    · {timeAgo(review.createdAt)}
                  </div>
                  {review.openReports.length ? (
                    <div className="mt-3 border-l-2 border-brass/50 pl-3 text-xs leading-5 text-muted">
                      <span className="font-medium text-fg">Report reasons:</span>{" "}
                      {review.openReports.map((report) => report.reason).join("; ")}
                    </div>
                  ) : null}
                </div>
                <div className="flex shrink-0 flex-wrap gap-2 lg:justify-end">
                  {canApprove && review.moderationStatus !== "approved" ? (
                    <ActionButton action={approveReview} id={review.id} label="Approve" variant="primary" />
                  ) : null}
                  {canReject && review.moderationStatus !== "rejected" ? (
                    <ActionButton action={rejectReview} id={review.id} label="Reject" variant="ghost" reason />
                  ) : null}
                  {canDelete ? (
                    <ActionButton action={deleteReview} id={review.id} label="Delete" variant="danger" reason />
                  ) : null}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {reviews.length === 0 ? (
          <Card>
            <CardContent className="p-10 text-center text-sm text-muted">
              {res.ok ? "No reviews in this queue." : "No queue data was returned."}
            </CardContent>
          </Card>
        ) : null}
      </div>
    </>
  );
}
