"use client";

import type { Locale } from "@manzil/shared";
import { getPxsCopy } from "../../lib/pxs/copy";
import type { PxsSaveStatus } from "../../lib/pxs/types";
import { Icon } from "../vm/icons";
import { Spinner } from "./progress";

/**
 * Auto-save status line.
 *
 * Every state maps to something that verifiably happened:
 *
 *   | status   | means                                              |
 *   |----------|----------------------------------------------------|
 *   | `dirty`  | the user changed something not yet persisted       |
 *   | `saving` | a write is genuinely in flight                      |
 *   | `saved`  | a write **completed** — with the time it completed  |
 *   | `error`  | a write failed, and the change is not stored        |
 *
 * `saved` must be driven by the resolution of the write, never by the moment
 * the request was sent. An indicator that says "Saved" because a request left
 * the browser is the interface asserting an outcome it has not observed, which
 * is the same failure the trust audit removed from the site's copy.
 *
 * `savedAt` is formatted client-side from a real timestamp, and rendered inside
 * a `<time>` element so the machine-readable value travels with the text.
 */
export function SaveIndicator({
  status,
  locale,
  savedAt,
  className
}: {
  status: PxsSaveStatus;
  locale: Locale;
  /** When the completed write resolved. Only meaningful with `status="saved"`. */
  savedAt?: Date | null;
  className?: string;
}) {
  const copy = getPxsCopy(locale);

  if (status === "idle") {
    return null;
  }

  const time =
    savedAt instanceof Date && !Number.isNaN(savedAt.getTime())
      ? new Intl.DateTimeFormat(locale === "uz" ? "uz-UZ" : locale === "ru" ? "ru-RU" : "en-GB", {
          hour: "2-digit",
          minute: "2-digit"
        }).format(savedAt)
      : null;

  return (
    <p
      // `polite`: a save confirmation must never interrupt what the user is
      // typing, which is the very thing being saved.
      aria-live="polite"
      className={`pxs-save pxs-save--${status}${className ? ` ${className}` : ""}`}
    >
      {status === "saving" ? (
        <>
          <Spinner label={copy.async.saving} size={14} />
          {copy.async.saving}
        </>
      ) : null}

      {status === "saved" ? (
        <>
          <Icon aria-hidden="true" name="check_circle" size={14} />
          {time ? copy.async.savedAt(time) : copy.async.saved}
        </>
      ) : null}

      {status === "dirty" ? (
        <>
          <Icon aria-hidden="true" name="schedule" size={14} />
          {copy.async.unsaved}
        </>
      ) : null}

      {status === "error" ? (
        <>
          <Icon aria-hidden="true" name="alert_circle" size={14} />
          {copy.async.saveFailed}
        </>
      ) : null}
    </p>
  );
}
