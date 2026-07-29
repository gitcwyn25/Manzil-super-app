"use client";

import { useFormStatus } from "react-dom";

/**
 * Pending-state submit button for the bookings surface.
 *
 * Two tones, both mirroring an existing pattern rather than inventing a third:
 * "primary" is RegisterSubmit's button (filled `.bz-btn-primary`, white
 * spinner) for the manual-booking form; "row" is PlanSubmit's `currentColor`
 * spinner adapted for the small, unfilled `.crm-row-actions` buttons — a
 * white spinner would be invisible on their white background.
 *
 * Must live inside the <form> element: useFormStatus reports the status of
 * the nearest ancestor form, and returns pending:false anywhere else. Status
 * actions matter here as much as the create form does — confirm/complete/
 * cancel/no-show all round-trip to the API, and a click with no feedback is
 * exactly the double-submit failure mode this codebase has already hit once.
 */
export function BookingSubmit({
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
