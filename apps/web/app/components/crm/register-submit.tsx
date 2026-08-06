"use client";

import { useFormStatus } from "react-dom";
import { Icon } from "../vm/icons";

/**
 * Submit button for the business registration form.
 *
 * Registration is genuinely slow — it geocodes the address over the network and
 * then runs a multi-statement transaction — and the form previously gave no
 * sign it was working. People concluded the click had missed and clicked again,
 * which used to register the business twice.
 *
 * Must live inside the <form> element: useFormStatus reports the status of the
 * nearest ancestor form, and returns pending:false anywhere else.
 *
 * Styled as the Vibrant Marketplace PrimaryCta recipe (btn-primary gradient +
 * .vm-cta tactility, full-width via .vm-auth-submit) while keeping the
 * .crm-submit pending-state classes that globals.css styles.
 */
export function RegisterSubmit({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      aria-busy={pending}
      className="btn btn-primary vm-cta vm-auth-submit crm-submit"
      disabled={pending}
      type="submit"
    >
      {pending ? (
        <>
          <span aria-hidden="true" className="crm-submit__spinner" />
          {pendingLabel}
        </>
      ) : (
        <>
          {label}
          <Icon name="arrow_forward" size={18} />
        </>
      )}
    </button>
  );
}
