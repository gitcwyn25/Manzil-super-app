"use client";

import { isLocale } from "@manzil/shared";
import { useParams } from "next/navigation";
import { useEffect } from "react";
import { getCrmCopy } from "../../../../lib/crm-copy";

/**
 * Failure state for plan selection / Stripe Checkout creation.
 *
 * `choosePlanAction` throws when `/billing/checkout` rejects (e.g. Stripe is
 * briefly unavailable, or the tier turns out not to be purchasable) — without
 * this boundary that surfaces as the generic root crash page, which reads as
 * "something is broken" rather than "nothing was charged, try again".
 */
export default function PlansError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  // Error boundaries render outside the page's own params, so the locale is
  // read from the route rather than passed in.
  const params = useParams();
  const raw = typeof params?.locale === "string" ? params.locale : "uz";
  const copy = getCrmCopy(isLocale(raw) ? raw : "uz");

  useEffect(() => {
    // Surfaces in Sentry, which is already wired for this app.
    console.error("Plan checkout failed", error);
  }, [error]);

  return (
    <section className="crm-auth-panel">
      <h1>{copy.plans.checkoutFailedTitle}</h1>
      <p>{copy.plans.checkoutFailedBody}</p>
      <button className="bz-btn-primary" onClick={reset} type="button">
        {copy.plans.retry}
      </button>
    </section>
  );
}
