"use client";

import { useActionState, useEffect, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

type ActionState = { ok: boolean; error?: string };
type ActionFn = (prev: ActionState, form: FormData) => Promise<ActionState>;

export function ActionButton({ action, id, label, variant = "ghost", reason = false, extraFields }: { action: ActionFn; id: string; label: string; variant?: "primary" | "ghost" | "danger"; reason?: boolean; extraFields?: Record<string, string> }) {
  const [state, formAction, pending] = useActionState(action, { ok: false });
  const [open, setOpen] = useState(false);
  const mappedVariant = variant === "primary" ? "primary" : variant === "danger" ? "danger" : "secondary";

  useEffect(() => {
    if (state.ok) setOpen(false);
  }, [state.ok]);

  const fields = <>{<input type="hidden" name="id" value={id} />}{Object.entries(extraFields ?? {}).map(([key, value]) => <input key={key} type="hidden" name={key} value={value} />)}</>;

  if (!reason) {
    return <form action={formAction} className="inline"><>{fields}</><Button variant={mappedVariant} size="sm" disabled={pending} type="submit" aria-busy={pending}>{pending ? "Working…" : label}</Button></form>;
  }

  return (
    <>
      <Button variant={mappedVariant} size="sm" onClick={() => setOpen(true)} type="button">{label}</Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Confirm {label.toLowerCase()}</DialogTitle><DialogDescription>This action changes a production record and is written to the signed activity log. A reason of at least 10 characters is required.</DialogDescription></DialogHeader>
          <form action={formAction} className="space-y-4">{fields}<Textarea name="reason" minLength={10} placeholder="Explain the decision for the next operator…" required aria-label="Reason" />{state.error ? <Alert variant="danger"><AlertDescription>{state.error}</AlertDescription></Alert> : null}<DialogFooter><Button variant="ghost" type="button" onClick={() => setOpen(false)}>Cancel</Button><Button variant={variant === "danger" ? "danger" : "primary"} disabled={pending} type="submit" aria-busy={pending}>{pending ? "Working…" : `Confirm ${label}`}</Button></DialogFooter></form>
        </DialogContent>
      </Dialog>
    </>
  );
}
