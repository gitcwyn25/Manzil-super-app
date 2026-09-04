import Link from "next/link";
import { ArrowUpRight, Building2, Search, SlidersHorizontal, Star } from "lucide-react";
import { ActionButton } from "@/components/action-button";
import { AccessDenied } from "@/components/access-denied";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { consoleGet, getMe } from "@/lib/console";
import { EmptyRow, PageHeader, StatusBadge, timeAgo } from "@/lib/ui";
import { cn } from "@/lib/utils";
import { approveBusiness, rejectBusiness } from "@/lib/actions";

export const dynamic = "force-dynamic";

type Business = { id: string; slug: string; name: string; status: string; category: string; district: string; address: string; phone: string | null; avgRating: number; reviewCount: number; owner: { email: string | null; displayName: string } | null; createdAt: string };
const FILTERS = [{ label: "Pending", value: "pending_claim" }, { label: "Claimed", value: "claimed" }, { label: "Unclaimed", value: "unclaimed" }, { label: "Suspended", value: "suspended" }, { label: "All", value: "" }];

function FilterLink({ label, value, current, q }: { label: string; value: string; current: string; q: string }) {
  const query = new URLSearchParams(); if (value) query.set("status", value); if (q) query.set("q", q);
  return <Button asChild variant={current === value ? "primary" : "ghost"} size="sm"><Link href={`/businesses${query.toString() ? `?${query.toString()}` : ""}`}>{label}</Link></Button>;
}

function BusinessRow({ business, me }: { business: Business; me: NonNullable<Awaited<ReturnType<typeof getMe>>> }) {
  return <TableRow><TableCell><div className="flex min-w-[240px] items-start gap-3"><span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-[7px] bg-panel-3 text-ceramic"><Building2 className="size-4" /></span><div className="min-w-0"><Link href={`/businesses/${business.id}`} className="font-medium text-foreground underline-offset-4 hover:text-ceramic hover:underline">{business.name}</Link><p className="mt-1 truncate text-xs text-muted-foreground">{business.address}</p>{business.owner ? <p className="mt-1 truncate text-[11px] text-muted-foreground">owner · {business.owner.email ?? business.owner.displayName}</p> : null}</div></div></TableCell><TableCell><p className="text-sm">{business.category}</p><p className="mt-1 text-xs text-muted-foreground">{business.district}</p></TableCell><TableCell><StatusBadge kind="business" value={business.status} /></TableCell><TableCell><span className="inline-flex items-center gap-1 font-data text-xs"><Star className="size-3.5 fill-brass text-brass" />{business.avgRating.toFixed(1)}</span><span className="ml-1 text-xs text-muted-foreground">({business.reviewCount})</span></TableCell><TableCell className="whitespace-nowrap font-data text-[11px] text-muted-foreground">{timeAgo(business.createdAt)}</TableCell><TableCell><div className="flex justify-end gap-2">{me.permissions.includes("business.approve") && business.status !== "claimed" ? <ActionButton action={approveBusiness} id={business.id} label="Approve" variant="primary" /> : null}{me.permissions.includes("business.reject") && business.status !== "suspended" ? <ActionButton action={rejectBusiness} id={business.id} label="Reject" variant="danger" reason /> : null}<Button asChild variant="ghost" size="sm"><Link href={`/businesses/${business.id}`}>Open <ArrowUpRight className="size-3.5" /></Link></Button></div></TableCell></TableRow>;
}

export default async function BusinessesPage({ searchParams }: { searchParams: Promise<{ status?: string; q?: string }> }) {
  const me = await getMe(); if (!me) return <AccessDenied />; if (!me.permissions.includes("business.view")) return <AccessDenied missing="business.view" />;
  const { status = "pending_claim", q = "" } = await searchParams;
  const query = new URLSearchParams(); if (status) query.set("status", status); if (q) query.set("q", q);
  const res = await consoleGet<{ businesses: Business[] }>(`/businesses?${query.toString()}`);
  const businesses = res.ok ? res.data.businesses : [];

  return <div className="mx-auto max-w-[1480px]"><PageHeader title="Companies" subtitle="One operational record per business: ownership, verification, public visibility, relationship, and next action." actions={<Button asChild variant="secondary"><Link href="/audit"><SlidersHorizontal className="size-4" />Signed activity</Link></Button>} />
    {res.ok ? null : <Alert variant="danger" className="mb-5"><AlertTitle>Company queue unavailable</AlertTitle><AlertDescription>{res.error}. No fallback records are shown.</AlertDescription></Alert>}
    <Card className="overflow-hidden"><CardHeader className="gap-4 border-b border-border pb-4 lg:flex-row lg:items-center lg:justify-between"><div><CardTitle className="flex items-center gap-2 text-base"><Building2 className="size-4 text-ceramic" />Activation queue</CardTitle><p className="mt-1 text-xs text-muted-foreground">{businesses.length} records in this view · server-filtered in production</p></div><form action="/businesses" className="relative w-full sm:w-80">{status ? <input type="hidden" name="status" value={status} /> : null}<Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input name="q" placeholder="Search company, district, owner…" defaultValue={q} className="pl-9" /></form></CardHeader><CardContent className="space-y-4 p-4 sm:p-5"><div className="flex flex-wrap gap-1 rounded-[8px] bg-panel-3 p-1">{FILTERS.map((filter) => <FilterLink key={filter.value || "all"} {...filter} current={status} q={q} />)}</div>
      {businesses.length === 0 ? <div className="rounded-[8px] border border-dashed border-border px-5 py-14 text-center"><Building2 className="mx-auto size-7 text-muted-foreground" /><p className="mt-3 text-sm font-medium">No companies match this view.</p><p className="mt-1 text-xs text-muted-foreground">Try another lifecycle state or clear the search.</p></div> : <><div className="hidden overflow-hidden rounded-[8px] border border-border md:block"><Table><TableHeader><TableRow><TableHead>Company</TableHead><TableHead>Operation</TableHead><TableHead>Lifecycle</TableHead><TableHead>Signal</TableHead><TableHead>Updated</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader><TableBody>{businesses.map((business) => <BusinessRow key={business.id} business={business} me={me} />)}<EmptyRow colSpan={6} label="" /></TableBody></Table></div><div className="grid gap-3 md:hidden">{businesses.map((business) => <Card key={business.id} className="overflow-hidden"><CardContent className="p-4"><div className="flex items-start gap-3"><span className="flex size-9 shrink-0 items-center justify-center rounded-[7px] bg-panel-3 text-ceramic"><Building2 className="size-4" /></span><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-3"><Link href={`/businesses/${business.id}`} className="font-medium hover:text-ceramic">{business.name}</Link><StatusBadge kind="business" value={business.status} /></div><p className="mt-1 text-xs text-muted-foreground">{business.category} · {business.district}</p><p className="mt-1 text-xs text-muted-foreground">{business.owner?.email ?? "Unclaimed"}</p></div></div><div className="mt-4 flex items-center justify-between border-t border-border pt-3"><span className="font-data text-[11px] text-muted-foreground"><Star className="mr-1 inline size-3.5 fill-brass text-brass" />{business.avgRating.toFixed(1)} · {timeAgo(business.createdAt)}</span><Button asChild variant="ghost" size="sm"><Link href={`/businesses/${business.id}`}>Open <ArrowUpRight className="size-3.5" /></Link></Button></div></CardContent></Card>)}</div></>}
    </CardContent></Card></div>;
}
