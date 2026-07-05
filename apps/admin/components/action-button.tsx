"use client";

import { useActionState, useEffect, useRef, useState } from "react";

type ActionState = { ok: boolean; error?: string };
type ActionFn = (prev: ActionState, form: FormData) => Promise<ActionState>;

/**
 * Action button with optional reason gate. Destructive actions (`reason`)
 * open a confirm dialog requiring a >=10 char reason — this is the step-up /
 * re-confirmation layer; the server action re-checks permission and the API
 * re-validates the reason independently.
 */
export function ActionButton({
  action,
  id,
  label,
  variant = "ghost",
  reason = false,
  extraFields
}: {
  action: ActionFn;
  id: string;
  label: string;
  variant?: "primary" | "ghost" | "danger";
  reason?: boolean;
  extraFields?: Record<string, string>;
}) {
  const [state, formAction, pending] = useActionState(action, { ok: false });
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const cls = variant === "primary" ? "btn-primary btn-xs" : variant === "danger" ? "btn-danger btn-xs" : "btn-ghost btn-xs";

  useEffect(() => {
    if (state.ok) setOpen(false);
  }, [state.ok]);

  if (!reason) {
    return (
      <form action={formAction} className="inline">
        <input type="hidden" name="id" value={id} />
        {Object.entries(extraFields ?? {}).map(([k, v]) => (
          <input key={k} type="hidden" name={k} value={v} />
        ))}
        <button className={cls} disabled={pending} type="submit">
          {pending ? "…" : label}
        </button>
      </form>
    );
  }

  return (
    <>
      <button className={cls} onClick={() => setOpen(true)} type="button">
        {label}
      </button>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setOpen(false)}>
          <div className="card w-full max-w-md p-5" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-semibold">Confirm: {label}</h3>
            <p className="mt-1 text-sm text-muted">
              This action is logged to the audit trail. A reason of at least 10 characters is required.
            </p>
            <form action={formAction} ref={formRef} className="mt-3 space-y-3">
              <input type="hidden" name="id" value={id} />
              {Object.entries(extraFields ?? {}).map(([k, v]) => (
                <input key={k} type="hidden" name={k} value={v} />
              ))}
              <textarea
                className="input min-h-[80px]"
                name="reason"
                minLength={10}
                placeholder="Reason (min 10 characters)…"
                required
              />
              {state.error ? <p className="text-sm text-bad">{state.error}</p> : null}
              <div className="flex justify-end gap-2">
                <button className="btn-ghost btn-xs" onClick={() => setOpen(false)} type="button">
                  Cancel
                </button>
                <button className={variant === "danger" ? "btn-danger btn-xs" : "btn-primary btn-xs"} disabled={pending} type="submit">
                  {pending ? "Working…" : `Confirm ${label}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
