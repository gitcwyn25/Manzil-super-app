import Link from "next/link";
import { ArrowUpRight, ClipboardCheck, Search } from "lucide-react";
import { AccessDenied } from "@/components/access-denied";
import { ActionButton } from "@/components/action-button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  approveBusinessApplication,
  rejectBusinessApplication,
  requestBusinessApplicationChanges,
  reviewBusinessApplication
} from "@/lib/actions";
import { can, consoleGet, getMe, type AdminMe } from "@/lib/console";
import { EmptyRow, PageHeader, StatusBadge, timeAgo } from "@/lib/ui";

export const dynamic = "force-dynamic";

type Application = {
  id: string;
  status: string;
  name: string;
  categorySlug: string;
  address: string;
  district: string;
  submittedAt: string | null;
  updatedAt: string;
  reviewNote: string | null;
  applicant: { id: string; email: string | null; displayName: string; phone: string | null };
  business: { id: string; slug: string; name: string; status: string } | null;
};

type ApplicationResponse = {
  total: number;
  counts: Record<string, number>;
  applications: Application[];
};

type SearchParams = { status?: string; q?: string };

const STATUSES = ["", "submitted", "under_review", "changes_requested", "approved", "rejected"];

function label(value: string) {
  return value ? value.replace(/_/g, " ").replace(/^./, (char) => char.toUpperCase()) : "All";
}

function filterHref(status: string, q: string, nextStatus: string) {
  const query = new URLSearchParams();
  if (nextStatus) query.set("status", nextStatus);
  if (q) query.set("q", q);
  const encoded = query.toString();
  return `/applications${encoded ? `?${encoded}` : ""}`;
}

function ApplicationActions({ application, me }: { application: Application; me: AdminMe }) {
  const canApprove = can(me, "business.approve");
  const canReject = can(me, "business.reject");
  const status = application.status;

  if (status === "approved") {
    return application.business ? <Button asChild size="sm" variant="ghost"><Link href={`/businesses/${application.business.id}`}>Open company <ArrowUpRight className="size-3.5" /></Link></Button> : <span className="text-xs text-muted-foreground">Approved; company pending sync</span>;
  }

  return <div className="flex flex-wrap justify-end gap-2">
    {canApprove && ["submitted", "changes_requested", "rejected"].includes(status) ? <ActionButton action={reviewBusinessApplication} id={application.id} label={status === "rejected" ? "Reopen" : "Review"} variant="ghost" /> : null}
    {canApprove && ["submitted", "under_review", "changes_requested"].includes(status) ? <ActionButton action={approveBusinessApplication} id={application.id} label="Approve" variant="primary" /> : null}
    {canApprove && ["submitted", "under_review", "changes_requested"].includes(status) ? <ActionButton action={requestBusinessApplicationChanges} id={application.id} label="Request changes" variant="ghost" reason /> : null}
    {canReject && ["submitted", "under_review", "changes_requested"].includes(status) ? <ActionButton action={rejectBusinessApplication} id={application.id} label="Reject" variant="danger" reason /> : null}
    <Button asChild size="sm" variant="ghost"><Link href={`/applications/${application.id}`}>Open <ArrowUpRight className="size-3.5" /></Link></Button>
  </div>;
}

function ApplicationRow({ application, me }: { application: Application; me: AdminMe }) {
  return <TableRow>
    <TableCell><div className="min-w-[240px]"><Link href={`/applications/${application.id}`} className="font-medium text-foreground underline-offset-4 hover:text-ceramic hover:underline">{application.name}</Link><p className="mt-1 text-xs text-muted-foreground">{application.categorySlug} · {application.district}</p><p className="mt-1 truncate text-[11px] text-muted-foreground">{application.address}</p></div></TableCell>
    <TableCell><p className="text-sm">{application.applicant.displayName}</p><p className="mt-1 text-xs text-muted-foreground">{application.applicant.email ?? application.applicant.phone ?? "No contact"}</p></TableCell>
    <TableCell><StatusBadge kind="application" value={application.status} />{application.reviewNote ? <p className="mt-1 max-w-48 truncate text-[11px] text-muted-foreground" title={application.reviewNote}>{application.reviewNote}</p> : null}</TableCell>
    <TableCell className="whitespace-nowrap font-data text-[11px] text-muted-foreground">{timeAgo(application.updatedAt)}</TableCell>
    <TableCell><ApplicationActions application={application} me={me} /></TableCell>
  </TableRow>;
}

export default async function ApplicationsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const me = await getMe();
  if (!me) return <AccessDenied />;
  if (!can(me, "business.view")) return <AccessDenied missing="business.view" />;

  const params = await searchParams;
  const status = params.status ?? "submitted";
  const q = params.q ?? "";
  const query = new URLSearchParams();
  if (status) query.set("status", status);
  if (q) query.set("q", q);
  const response = await consoleGet<ApplicationResponse>(`/business-applications?${query.toString()}`);
  const applications = response.ok ? response.data.applications : [];
  const counts = response.ok ? response.data.counts : {};

  return <div className="mx-auto max-w-[1480px]">
    <PageHeader title="Business applications" subtitle="Review the applicant's snapshot before creating the public company record and owner workspace." actions={<Button asChild variant="secondary"><Link href="/businesses">Open companies</Link></Button>} />
    {!response.ok ? <Alert variant="danger" className="mb-5"><AlertTitle>Application queue unavailable</AlertTitle><AlertDescription>{response.error}. No fallback records are shown.</AlertDescription></Alert> : null}
    <Card className="overflow-hidden">
      <CardHeader className="gap-4 border-b border-border pb-4 lg:flex-row lg:items-center lg:justify-between">
        <div><CardTitle className="flex items-center gap-2 text-base"><ClipboardCheck className="size-4 text-ceramic" />Review queue</CardTitle><p className="mt-1 text-xs text-muted-foreground">{response.ok ? `${response.data.total} records in this view` : "No records loaded"} · every decision is written to signed activity</p></div>
        <form action="/applications" method="get" className="relative w-full sm:w-80"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />{status ? <input type="hidden" name="status" value={status} /> : null}<Input name="q" placeholder="Search business, applicant, district…" defaultValue={q} className="pl-9" /></form>
      </CardHeader>
      <CardContent className="space-y-4 p-4 sm:p-5">
        <div className="flex flex-wrap gap-1 rounded-[8px] bg-panel-3 p-1">{STATUSES.map((value) => <Button key={value || "all"} asChild variant={status === value ? "primary" : "ghost"} size="sm"><Link href={filterHref(status, q, value)}>{label(value)}{value && response.ok && counts[value] !== undefined ? <span className="ml-1 font-data text-[10px] opacity-70">{counts[value]}</span> : null}</Link></Button>)}</div>
        {applications.length === 0 ? <div className="rounded-[8px] border border-dashed border-border px-5 py-14 text-center"><ClipboardCheck className="mx-auto size-7 text-muted-foreground" /><p className="mt-3 text-sm font-medium">No applications match this view.</p><p className="mt-1 text-xs text-muted-foreground">Try another lifecycle state or clear the search.</p></div> : <div className="overflow-x-auto rounded-[8px] border border-border"><Table><TableHeader><TableRow><TableHead>Business</TableHead><TableHead>Applicant</TableHead><TableHead>Review state</TableHead><TableHead>Updated</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader><TableBody>{applications.map((application) => <ApplicationRow key={application.id} application={application} me={me} />)}<EmptyRow colSpan={5} label="" /></TableBody></Table></div>}
      </CardContent>
    </Card>
  </div>;
}
