import Link from "next/link";
import { ArrowLeft, ArrowUpRight, Building2, ClipboardCheck, MapPin, UserRound } from "lucide-react";
import { AccessDenied } from "@/components/access-denied";
import { ActionButton } from "@/components/action-button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  approveBusinessApplication,
  rejectBusinessApplication,
  requestBusinessApplicationChanges,
  reviewBusinessApplication
} from "@/lib/actions";
import { can, consoleGet, getMe, type AdminMe } from "@/lib/console";
import { PageHeader, StatusBadge, timeAgo } from "@/lib/ui";

export const dynamic = "force-dynamic";

type Application = {
  id: string;
  status: string;
  name: string;
  categorySlug: string;
  descriptionUz: string;
  address: string;
  district: string;
  city: string;
  phone: string | null;
  email: string | null;
  website: string | null;
  telegram: string | null;
  workingHours: unknown;
  acceptedTermsVersion: string | null;
  acceptedTermsAt: string | null;
  submittedAt: string | null;
  reviewNote: string | null;
  createdAt: string;
  updatedAt: string;
  applicant: { id: string; email: string | null; displayName: string; phone: string | null };
  business: { id: string; slug: string; name: string; status: string } | null;
  reviewer: { id: string; email: string | null; displayName: string } | null;
};

function DecisionActions({ application, me }: { application: Application; me: AdminMe }) {
  const canApprove = can(me, "business.approve");
  const canReject = can(me, "business.reject");
  const status = application.status;
  if (status === "approved") return application.business ? <Button asChild variant="primary"><Link href={`/businesses/${application.business.id}`}>Open connected company <ArrowUpRight className="size-4" /></Link></Button> : null;

  return <div className="flex flex-wrap gap-2">
    {canApprove && ["submitted", "changes_requested", "rejected"].includes(status) ? <ActionButton action={reviewBusinessApplication} id={application.id} label={status === "rejected" ? "Reopen for review" : "Move to review"} variant="ghost" /> : null}
    {canApprove && ["submitted", "under_review", "changes_requested"].includes(status) ? <ActionButton action={approveBusinessApplication} id={application.id} label="Approve and connect" variant="primary" /> : null}
    {canApprove && ["submitted", "under_review", "changes_requested"].includes(status) ? <ActionButton action={requestBusinessApplicationChanges} id={application.id} label="Request changes" variant="ghost" reason /> : null}
    {canReject && ["submitted", "under_review", "changes_requested"].includes(status) ? <ActionButton action={rejectBusinessApplication} id={application.id} label="Reject" variant="danger" reason /> : null}
  </div>;
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return <div><dt className="font-data text-[10px] uppercase tracking-[0.12em] text-muted-foreground">{label}</dt><dd className="mt-1 whitespace-pre-wrap text-sm text-foreground">{value || "—"}</dd></div>;
}

export default async function ApplicationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const me = await getMe();
  if (!me) return <AccessDenied />;
  if (!can(me, "business.view")) return <AccessDenied missing="business.view" />;

  const { id } = await params;
  const response = await consoleGet<Application>(`/business-applications/${id}`);
  if (!response.ok) return <div className="mx-auto max-w-[1100px]"><PageHeader title="Application unavailable" actions={<Button asChild variant="secondary"><Link href="/applications"><ArrowLeft className="size-4" />Back to applications</Link></Button>} /><Alert variant="danger"><AlertTitle>Could not load this application</AlertTitle><AlertDescription>{response.error}. No fallback record is shown.</AlertDescription></Alert></div>;

  const application = response.data;
  return <div className="mx-auto max-w-[1100px]">
    <PageHeader title={application.name} subtitle={`${application.categorySlug} · submitted ${application.submittedAt ? timeAgo(application.submittedAt) : "not submitted"}`} actions={<Button asChild variant="secondary"><Link href="/applications"><ArrowLeft className="size-4" />Back to applications</Link></Button>} />
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="space-y-5">
        <Card><CardHeader className="flex-row items-start justify-between gap-4 border-b border-border pb-4"><div><CardTitle className="flex items-center gap-2 text-base"><ClipboardCheck className="size-4 text-ceramic" />Review snapshot</CardTitle><p className="mt-1 text-xs text-muted-foreground">The submitted values are preserved here before activation.</p></div><StatusBadge kind="application" value={application.status} /></CardHeader><CardContent className="space-y-5 p-5"><div className="grid gap-5 sm:grid-cols-2"><Field label="Business name" value={application.name} /><Field label="Category" value={application.categorySlug} /><Field label="Address" value={`${application.address}, ${application.district}, ${application.city}`} /><Field label="Phone" value={application.phone} /><Field label="Email" value={application.email} /><Field label="Website" value={application.website} /><Field label="Telegram" value={application.telegram} /><Field label="Working hours" value={typeof application.workingHours === "string" ? application.workingHours : application.workingHours ? JSON.stringify(application.workingHours) : null} /></div><div className="border-t border-border pt-5"><Field label="Description" value={application.descriptionUz} /></div></CardContent></Card>
        {application.reviewNote ? <Card><CardHeader><CardTitle className="text-base">Latest review note</CardTitle></CardHeader><CardContent><p className="whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{application.reviewNote}</p></CardContent></Card> : null}
      </div>
      <div className="space-y-5">
        <Card><CardHeader><CardTitle className="text-base">Decision</CardTitle></CardHeader><CardContent className="space-y-4"><DecisionActions application={application} me={me} /><p className="text-xs leading-5 text-muted-foreground">Approval creates the public company row, approved ownership claim, legal acceptance records, and owner workspace link in one transaction.</p></CardContent></Card>
        <Card><CardHeader><CardTitle className="flex items-center gap-2 text-base"><UserRound className="size-4 text-ceramic" />Applicant</CardTitle></CardHeader><CardContent className="space-y-3 text-sm"><p className="font-medium">{application.applicant.displayName}</p><p className="text-muted-foreground">{application.applicant.email ?? "No email"}</p><p className="text-muted-foreground">{application.applicant.phone ?? "No phone"}</p></CardContent></Card>
        <Card><CardHeader><CardTitle className="flex items-center gap-2 text-base"><MapPin className="size-4 text-ceramic" />Record state</CardTitle></CardHeader><CardContent className="space-y-3 text-xs text-muted-foreground"><p>Created {timeAgo(application.createdAt)}</p><p>Updated {timeAgo(application.updatedAt)}</p><p>Terms version {application.acceptedTermsVersion ?? "not recorded"}</p>{application.business ? <Link className="inline-flex items-center gap-1 text-ceramic hover:underline" href={`/businesses/${application.business.id}`}><Building2 className="size-3.5" />Connected · {application.business.name}<ArrowUpRight className="size-3.5" /></Link> : null}</CardContent></Card>
      </div>
    </div>
  </div>;
}
