"use client";

import { isLocale } from "@manzil/shared";
import { useParams } from "next/navigation";
import { useEffect } from "react";
import { getCrmCopy } from "../../../../lib/crm-copy";

/**
 * Failure state for business registration.
 *
 * Without this, a failed registration hit the root error boundary and showed a
 * generic crash page, which reads as "something is broken, don't try again" —
 * the opposite of what we want at the top of the acquisition funnel.
 *
 * The reassurance about duplicates is load-bearing: the API returns the
 * existing business when the same owner submits the same name twice, so
 * retrying is genuinely safe and people need to be told that before they will
 * do it.
 */
export default function RegisterError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // Error boundaries render outside the page's own params, so the locale is
  // read from the route rather than passed in.
  const params = useParams();
  const raw = typeof params?.locale === "string" ? params.locale : "uz";
  const copy = getCrmCopy(isLocale(raw) ? raw : "uz");

  useEffect(() => {
    // Surfaces in Sentry, which is already wired for this app.
    console.error("Business registration failed", error);
  }, [error]);

  return (
    <section className="crm-auth-panel">
      <h1>{copy.register.failedTitle}</h1>
      <p>{copy.register.failedBody}</p>
      <button className="bz-btn-primary" onClick={reset} type="button">
        {copy.register.retry}
      </button>
    </section>
  );
}
