import type { LucideIcon } from "lucide-react";
import { ArrowRight, LockKeyhole } from "lucide-react";
import Link from "next/link";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type SystemStateProps = {
  icon?: LucideIcon;
  title: string;
  description: string;
  detail: string;
  contract: string;
  backHref?: string;
  backLabel?: string;
};

export function SystemState({ icon: Icon = LockKeyhole, title, description, detail, contract, backHref, backLabel }: SystemStateProps) {
  return (
    <div className="space-y-5">
      <Alert variant="warning">
        <Icon className="absolute left-4 top-4 size-4 text-warn" />
        <AlertTitle className="pl-7">This lane is shaped, not connected</AlertTitle>
        <AlertDescription className="pl-7">No mutation, email, payment, or external state change can happen from this screen yet.</AlertDescription>
      </Alert>
      <Card className="overflow-hidden">
        <CardHeader className="border-b border-border pb-4"><div className="flex items-start justify-between gap-4"><div><CardTitle className="flex items-center gap-2 text-lg"><Icon className="size-5 text-ceramic" />{title}</CardTitle><p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p></div><Badge variant="outline">Backend contract</Badge></div></CardHeader>
        <CardContent className="grid gap-6 p-5 md:grid-cols-[minmax(0,1fr)_minmax(250px,0.65fr)]">
          <div><p className="mb-2 font-data text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Why this is gated</p><p className="text-sm leading-6 text-foreground">{detail}</p></div>
          <div className="rounded-[8px] border border-border bg-panel-3 p-4"><p className="font-data text-[10px] font-semibold uppercase tracking-[0.14em] text-ceramic">Next contract</p><p className="mt-2 font-data text-xs leading-6 text-foreground">{contract}</p><div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground"><LockKeyhole className="size-3.5" />Permission, audit, and retry required</div></div>
        </CardContent>
      </Card>
      {backHref && backLabel ? <Button asChild variant="secondary"><Link href={backHref}>{backLabel}<ArrowRight className="size-4" /></Link></Button> : null}
    </div>
  );
}
