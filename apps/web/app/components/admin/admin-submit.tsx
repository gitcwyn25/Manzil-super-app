"use client";

import { useFormStatus } from "react-dom";

/**
 * Pending-state submit button for admin console mutations (approve, reject,
 * moderate, publish, mark-read, ...).
 *
 * Mirrors `components/crm/register-submit.tsx`'s `useFormStatus` pattern —
 * a mutating button with no pending indicator is exactly the double-submit
 * failure mode that component was built to fix. "row" tone reuses the same
 * `.crm-row-submit`/`.crm-row-submit__spinner` classes
 * `components/crm/booking-submit.tsx` established for compact in-table
 * actions, rather than inventing a third button style for the same purpose.
 *
 * Must live inside the <form> element — useFormStatus reports the status of
 * the nearest ancestor form, and returns pending:false anywhere else.
 */
export function AdminSubmit({
  label,
  pendingLabel,
  tone = "primary",
  danger = false
}: {
  label: string;
  pendingLabel: string;
  tone?: "primary" | "row";
  danger?: boolean;
}) {
  const { pending } = useFormStatus();

  if (tone === "row") {
    return (
      <button
        aria-busy={pending}
        className={danger ? "danger crm-row-submit" : "crm-row-submit"}
        disabled={pending}
        type="submit"
      >
        {pending ? (
          <>
            <span aria-hidden="true" className="crm-row-submit__spinner" />
            {pendingLabel}
          </>
        ) : (
          label
        )}
      </button>
    );
  }

  return (
    <button aria-busy={pending} className="bz-btn-primary crm-submit" disabled={pending} type="submit">
      {pending ? (
        <>
          <span aria-hidden="true" className="crm-submit__spinner" />
          {pendingLabel}
        </>
      ) : (
        label
      )}
    </button>
  );
}
