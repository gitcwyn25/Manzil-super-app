"use client";

import type { Locale } from "@manzil/shared";
import { MutationSubmit } from "../pxs/mutation-form";

/**
 * Submit button for the business registration form.
 *
 * Registration is genuinely slow — it geocodes the address over the network and
 * then runs a multi-statement transaction — and the form originally gave no
 * sign it was working. People concluded the click had missed and clicked again,
 * which registered the business twice. A duplicate listing produced that way is
 * still in the live catalogue.
 *
 * This is now a thin adapter over the PXS mutation system (Epic 17) rather than
 * its own implementation. Everything it used to do by hand — disable on click,
 * swap to a spinner and "Saving…", set `aria-busy` — is inherited from
 * `MutationSubmit`, along with the things it did *not* do: announcing the
 * pending state to assistive technology, and rendering the confirmed-success
 * state. The behaviour is now identical to every other form in the product,
 * which is the entire point of the system.
 *
 * Must live inside the form element: `useFormStatus` reports the status of the
 * nearest ancestor form and returns `pending: false` anywhere else.
 *
 * Styling is unchanged — the Vibrant Marketplace `PrimaryCta` recipe
 * (`btn-primary` gradient + `.vm-cta` tactility, full width via
 * `.vm-auth-submit`) plus the `.crm-submit` pending-state classes that
 * globals.css already styles. `registration.spec.ts` asserts on a single
 * `button[type='submit']`, which this still is.
 */
export function RegisterSubmit({
  label,
  pendingLabel,
  locale
}: {
  label: string;
  pendingLabel: string;
  locale: Locale;
}) {
  return (
    <MutationSubmit
      className="btn btn-primary vm-cta vm-auth-submit crm-submit"
      label={label}
      locale={locale}
      pendingLabel={pendingLabel}
    />
  );
}
