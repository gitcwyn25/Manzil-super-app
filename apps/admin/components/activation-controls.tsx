"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  activateSignature,
  assignWaitlist,
  connectWaitlistCompany,
  queueWaitlistEmailDraft,
  retryOutboxMessage,
  transitionWaitlist
} from "@/lib/actions";

type ActionState = { ok: boolean; error?: string };
type ActionFn = (prev: ActionState, form: FormData) => Promise<ActionState>;
type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "brass";

function ActionError({ message }: { message?: string }) {
  return message ? <Alert variant="danger" className="py-2"><AlertDescription>{message}</AlertDescription></Alert> : null;
}

function useRefreshOnSuccess(state: ActionState, setOpen?: (open: boolean) => void) {
  const router = useRouter();
  useEffect(() => {
    if (!state.ok) return;
    setOpen?.(false);
    router.refresh();
  }, [router, setOpen, state.ok]);
}

const STATUS_LABELS: Record<string, string> = {
  contacted: "Mark contacted",
  qualified: "Qualify",
  accepted: "Approve internal follow-up",
  rejected: "Reject",
  duplicate: "Mark duplicate"
};

export function WaitlistTransitionButton({
  id,
  status,
  expectedUpdatedAt,
  variant = "secondary",
  requiresReason = false,
  label: customLabel
}: {
  id: string;
  status: "contacted" | "qualified" | "accepted" | "rejected" | "duplicate";
  expectedUpdatedAt?: string;
  variant?: ButtonVariant;
  requiresReason?: boolean;
  label?: string;
}) {
  const [state, formAction, pending] = useActionState(transitionWaitlist, { ok: false });
  const [open, setOpen] = useState(false);
  useRefreshOnSuccess(state, setOpen);
  const label = customLabel ?? STATUS_LABELS[status];

  if (!requiresReason) {
    return <form action={formAction} className="inline"><input type="hidden" name="id" value={id} /><input type="hidden" name="status" value={status} />{expectedUpdatedAt ? <input type="hidden" name="expectedUpdatedAt" value={expectedUpdatedAt} /> : null}<Button type="submit" size="sm" variant={variant} disabled={pending} aria-busy={pending}>{pending ? "Working…" : label}</Button>{state.error ? <span className="ml-2 text-xs text-danger" role="alert">{state.error}</span> : null}</form>;
  }

  return <>
    <Button type="button" size="sm" variant={variant} onClick={() => setOpen(true)}>{label}</Button>
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader><DialogTitle>{label}</DialogTitle><DialogDescription>This changes the waitlist lifecycle and creates a signed operational audit event. Explain the decision for the next operator.</DialogDescription></DialogHeader>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="id" value={id} /><input type="hidden" name="status" value={status} />{expectedUpdatedAt ? <input type="hidden" name="expectedUpdatedAt" value={expectedUpdatedAt} /> : null}
          <Textarea name="reason" minLength={10} maxLength={2000} required placeholder="At least 10 characters…" aria-label="Decision reason" />
          <ActionError message={state.error} />
          <DialogFooter><Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit" variant={variant === "danger" ? "danger" : "primary"} disabled={pending} aria-busy={pending}>{pending ? "Working…" : `Confirm ${label.toLowerCase()}`}</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  </>;
}

export function AssignWaitlistButton({ id, adminId, assigned, expectedUpdatedAt }: { id: string; adminId: string; assigned: boolean; expectedUpdatedAt?: string }) {
  const [state, formAction, pending] = useActionState(assignWaitlist, { ok: false });
  useRefreshOnSuccess(state);
  return <form action={formAction} className="inline"><input type="hidden" name="id" value={id} /><input type="hidden" name="adminId" value={assigned ? "" : adminId} />{expectedUpdatedAt ? <input type="hidden" name="expectedUpdatedAt" value={expectedUpdatedAt} /> : null}<Button type="submit" size="sm" variant="ghost" disabled={pending} aria-busy={pending}>{pending ? "Working…" : assigned ? "Unassign" : "Assign to me"}</Button>{state.error ? <span className="ml-2 text-xs text-danger" role="alert">{state.error}</span> : null}</form>;
}

export function ConnectCompanyButton({ id, expectedUpdatedAt }: { id: string; expectedUpdatedAt?: string }) {
  const [state, formAction, pending] = useActionState(connectWaitlistCompany, { ok: false });
  const [open, setOpen] = useState(false);
  useRefreshOnSuccess(state, setOpen);
  return <>
    <Button type="button" size="sm" variant="secondary" onClick={() => setOpen(true)}>Connect company</Button>
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader><DialogTitle>Connect existing company</DialogTitle><DialogDescription>Link this demand record to an existing business record. This does not grant ownership, change verification, or make the listing public.</DialogDescription></DialogHeader>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="id" value={id} />{expectedUpdatedAt ? <input type="hidden" name="expectedUpdatedAt" value={expectedUpdatedAt} /> : null}
          <label className="block space-y-2"><span className="text-xs font-medium text-muted-foreground">Business ID</span><Input name="businessId" required maxLength={100} placeholder="Paste the existing business ID" /></label>
          <label className="block space-y-2"><span className="text-xs font-medium text-muted-foreground">Connection reason</span><Textarea name="reason" minLength={10} maxLength={2000} required placeholder="Explain why this request matches the business record…" /></label>
          <ActionError message={state.error} />
          <DialogFooter><Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit" variant="primary" disabled={pending} aria-busy={pending}>{pending ? "Connecting…" : "Connect record"}</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  </>;
}

export function QueueDraftButton({ id }: { id: string }) {
  const [state, formAction, pending] = useActionState(queueWaitlistEmailDraft, { ok: false });
  const [open, setOpen] = useState(false);
  useRefreshOnSuccess(state, setOpen);
  return <>
    <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(true)}>Queue email draft</Button>
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader><DialogTitle>Queue an attributable email draft</DialogTitle><DialogDescription>Leave the fields blank to use the locale-aware truthful default. This queues a draft only; no email provider is called and nothing is sent from this screen.</DialogDescription></DialogHeader>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="id" value={id} />
          <label className="block space-y-2"><span className="text-xs font-medium text-muted-foreground">Subject <span className="font-normal">(optional)</span></span><Input name="subject" maxLength={200} placeholder="Use the locale-aware default" /></label>
          <label className="block space-y-2"><span className="text-xs font-medium text-muted-foreground">Body <span className="font-normal">(optional)</span></span><Textarea name="body" maxLength={12000} placeholder="Use the truthful default with the active operational signature" /></label>
          <ActionError message={state.error} />
          <DialogFooter><Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit" variant="primary" disabled={pending} aria-busy={pending}>{pending ? "Queueing…" : "Queue draft"}</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  </>;
}

export function RetryOutboxButton({ id }: { id: string }) {
  const [state, formAction, pending] = useActionState(retryOutboxMessage, { ok: false });
  const [open, setOpen] = useState(false);
  useRefreshOnSuccess(state, setOpen);
  return <>
    <Button type="button" size="sm" variant="secondary" onClick={() => setOpen(true)}>Retry</Button>
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader><DialogTitle>Retry queued message</DialogTitle><DialogDescription>The message will return to the pending queue. A reason is required and the provider worker remains responsible for actual delivery.</DialogDescription></DialogHeader>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="id" value={id} />
          <Textarea name="reason" minLength={10} maxLength={2000} required placeholder="Explain why this failed message should be retried…" aria-label="Retry reason" />
          <ActionError message={state.error} />
          <DialogFooter><Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit" variant="primary" disabled={pending} aria-busy={pending}>{pending ? "Retrying…" : "Confirm retry"}</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  </>;
}

export function SignatureActivationForm({ hasActive }: { hasActive: boolean }) {
  const [state, formAction, pending] = useActionState(activateSignature, { ok: false });
  useRefreshOnSuccess(state);
  return <form action={formAction} className="flex flex-col gap-3 sm:flex-row sm:items-end">
    <label className="block min-w-0 flex-1 space-y-2"><span className="text-xs font-medium text-muted-foreground">Operational title <span className="font-normal">(optional)</span></span><Input name="title" maxLength={160} placeholder="e.g. Merchant Success Lead" /></label>
    <Button type="submit" variant="primary" disabled={pending} aria-busy={pending}>{pending ? "Saving…" : hasActive ? "Rotate signature" : "Create signature"}</Button>
    {state.error ? <span className="text-xs text-danger" role="alert">{state.error}</span> : null}
  </form>;
}
