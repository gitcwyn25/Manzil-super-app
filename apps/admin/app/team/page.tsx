import Link from "next/link";
import { ArrowUpRight, KeyRound, UsersRound } from "lucide-react";
import { AccessDenied } from "@/components/access-denied";
import { SystemState } from "@/components/data-display/system-state";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/lib/ui";
import { getMe } from "@/lib/console";

export const dynamic = "force-dynamic";

export default async function TeamPage() {
  const me = await getMe();
  if (!me) return <AccessDenied />;
  if (!me.permissions.includes("admin.manage") && !me.permissions.includes("*")) return <AccessDenied missing="admin.manage" />;

  return (
    <div className="mx-auto max-w-[1180px]">
      <PageHeader title="Team & access" subtitle="One identity, one role boundary, one accountable operator signature." actions={<Button asChild variant="secondary"><Link href="/signature">Signature profile <ArrowUpRight className="size-3.5" /></Link></Button>} />
      <div className="mb-5 grid gap-4 md:grid-cols-3">
        <Card><CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Current actor</CardTitle></CardHeader><CardContent><p className="font-display text-xl font-semibold">{me.name}</p><p className="mt-1 text-xs text-muted-foreground">{me.email}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Effective roles</CardTitle></CardHeader><CardContent><div className="flex flex-wrap gap-2">{me.roles.map((role) => <Badge key={role} variant="success">{role}</Badge>)}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Permission surface</CardTitle></CardHeader><CardContent><p className="font-display text-xl font-semibold">{me.permissions.length}</p><p className="mt-1 text-xs text-muted-foreground">server-checked capabilities</p></CardContent></Card>
      </div>
      <SystemState
        icon={UsersRound}
        title="Employee onboarding and signatures"
        description="A new employee should receive a role-aware welcome pack only after identity and access are confirmed. Their first session should guide them through 2FA, operating policy, signature setup, and the first assigned queue."
        detail="Employee management, first-login state, 2FA readiness, and an idempotent onboarding email outbox remain gated. The operational signature profile is now available separately and is not a legal e-signature."
        contract="GET /console/admins\nPOST /console/admins/:id/onboarding\nGET /console/signature\nPOST /console/signature"
        backHref="/"
        backLabel="Return to Today"
      />
      <Card className="mt-5"><CardHeader><CardTitle className="flex items-center gap-2 text-base"><KeyRound className="size-4 text-ceramic" />First-login standard</CardTitle></CardHeader><CardContent className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-5">{["Confirm role", "Set up 2FA", "Configure signature", "Read policy", "Open first queue"].map((step, index) => <div key={step} className="flex gap-2"><span className="font-data text-[10px] text-ceramic">0{index + 1}</span><span>{step}</span></div>)}</CardContent></Card>
    </div>
  );
}
