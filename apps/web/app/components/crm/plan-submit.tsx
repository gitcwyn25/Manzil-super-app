"use client";

import { useFormStatus } from "react-dom";

/**
 * Submit button for a plan-selection form.
 *
 * Choosing pro/max calls the API to create a Stripe Checkout session and
 * waits for Stripe's URL before the browser redirects — a network round trip
 * with no visual feedback otherwise reads as a missed click, the same
 * problem RegisterSubmit solves for business registration.
 *
 * Must live inside the <form> element: useFormStatus reports the status of
 * the nearest ancestor form, and returns pending:false anywhere else.
 */
export function PlanSubmit({
  label,
  pendingLabel,
  highlight
}: {
  label: string;
  pendingLabel: string;
  highlight: boolean;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      aria-busy={pending}
      className={highlight ? "bz-btn-primary full crm-plan-submit" : "bz-btn-ghost full crm-plan-submit"}
      disabled={pending}
      type="submit"
    >
      {pending ? (
        <>
          <span aria-hidden="true" className="crm-plan-submit__spinner" />
          {pendingLabel}
        </>
      ) : (
        label
      )}
    </button>
  );
}
