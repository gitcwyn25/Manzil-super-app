"use client";

import * as Sentry from "@sentry/nextjs";
import { defaultLocale, isLocale } from "@manzil/shared";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { ERROR_COPY, StatusPage } from "../../components/status-page";

/**
 * Error boundary for the consumer shell.
 *
 * Preferred over `global-error.tsx` for anything that fails below the layout,
 * because it keeps the header, nav and footer: a visitor whose occasion page
 * failed can still search, switch locale, or go home instead of staring at a
 * bare document. `global-error` remains the fallback for failures in the
 * layout tree itself.
 *
 * `/business/register` and `/business/plans` keep their own, more specific
 * boundaries — this one does not replace them.
 */
export default function SiteError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const pathname = usePathname() ?? "";
  const [, first] = pathname.split("/");
  const locale = isLocale(first) ? first : defaultLocale;
  const copy = ERROR_COPY[locale];

  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <StatusPage
      copy={copy}
      locale={locale}
      action={
        <button className="btn btn-primary vm-cta" onClick={reset} type="button">
          {copy.action}
        </button>
      }
    />
  );
}
