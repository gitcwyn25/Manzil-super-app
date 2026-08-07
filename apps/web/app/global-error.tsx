"use client";

import * as Sentry from "@sentry/nextjs";
import { defaultLocale, isLocale } from "@manzil/shared";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { ERROR_COPY, StatusPage } from "./components/status-page";

/**
 * Last-resort 500.
 *
 * The audit found no custom error page at all, so any uncaught server error
 * rendered Next's built-in stack-trace-shaped fallback. `global-error` is the
 * only boundary that catches a failure in the root layout itself, and by
 * contract it must render its own `<html>`/`<body>` — it replaces the whole
 * document, so it cannot reuse `DocumentShell` (that component is a server
 * component and this file must be a Client Component).
 *
 * The error is reported to Sentry explicitly: React swallows the exception once
 * a boundary handles it, so without this call a rendered 500 would be invisible
 * in monitoring.
 */
export default function GlobalError({
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
    <html lang={locale}>
      <body>
        <StatusPage
          copy={copy}
          locale={locale}
          action={
            <button className="btn btn-primary vm-cta" onClick={reset} type="button">
              {copy.action}
            </button>
          }
        />
      </body>
    </html>
  );
}
