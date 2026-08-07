import { formatBytes } from "../../lib/pxs/copy";
import type { PxsIntent } from "../../lib/pxs/types";

/**
 * Progress indicators.
 *
 * Server-safe (no "use client"): these are pure renderers of numbers someone
 * else measured.
 *
 * ⛔ **The binding rule applies to progress bars.** A determinate bar is a
 * claim about how much of a real job is finished, so `value` must come from
 * the thing doing the work — a transfer's `loaded / total`, a queue's real
 * completed count. Bars that animate to 90% on a timer and wait there are
 * fabricated measurements; they are forbidden for the same reason a fabricated
 * metric is. When nothing can measure the work, use `<Spinner>` or an
 * indeterminate `<ProgressBar>`, both of which claim only "this is running".
 */

export type ProgressBarProps = {
  /**
   * 0–100, measured by the process. Omit for an indeterminate bar — the honest
   * rendering when the real fraction is unknown.
   */
  value?: number;
  /** Localized accessible name, e.g. `getPxsCopy(locale).progress.label`. */
  label: string;
  /** Renders the percentage next to the bar. Determinate bars only. */
  showValue?: boolean;
  intent?: PxsIntent;
  className?: string;
};

export function ProgressBar({
  value,
  label,
  showValue = false,
  intent = "info",
  className
}: ProgressBarProps) {
  const determinate = typeof value === "number" && Number.isFinite(value);
  const clamped = determinate ? Math.min(100, Math.max(0, Math.round(value))) : undefined;

  return (
    <div className={`pxs-progress${className ? ` ${className}` : ""}`}>
      <div
        aria-label={label}
        aria-valuemax={determinate ? 100 : undefined}
        aria-valuemin={determinate ? 0 : undefined}
        // Omitted entirely when indeterminate: a progressbar with no
        // aria-valuenow is exactly how ARIA expresses "running, amount
        // unknown". Supplying 0 would claim no progress has been made.
        aria-valuenow={clamped}
        className={`pxs-progress__track pxs-progress__track--${intent}${
          determinate ? "" : " is-indeterminate"
        }`}
        role="progressbar"
      >
        <span
          className="pxs-progress__fill"
          style={determinate ? { width: `${clamped}%` } : undefined}
        />
      </div>
      {showValue && determinate ? <span className="pxs-progress__value">{clamped}%</span> : null}
    </div>
  );
}

/**
 * Indeterminate activity indicator.
 *
 * Claims one thing only: work is in flight. It carries no measurement, so it
 * is always honest — which is why it is the correct fallback whenever a real
 * fraction is unavailable.
 *
 * `label` is required. A bare spinner tells a screen-reader user nothing.
 *
 * Pass `decorative` when visible text beside the spinner already says the same
 * thing. Without it the spinner is its own live region and the phrase gets
 * announced twice — once from `role="status"` here and once from the text.
 */
export function Spinner({
  label,
  size = 18,
  className,
  decorative = false
}: {
  label: string;
  size?: number;
  className?: string;
  decorative?: boolean;
}) {
  return (
    <span
      aria-hidden={decorative ? true : undefined}
      aria-label={decorative ? undefined : label}
      className={`pxs-spinner${className ? ` ${className}` : ""}`}
      role={decorative ? undefined : "status"}
      style={{ width: size, height: size }}
    />
  );
}

export type UploadProgressProps = {
  /** File name as chosen by the user. */
  name: string;
  /** Bytes transferred so far — from a real `ProgressEvent.loaded`. */
  loaded: number;
  /**
   * Total bytes — from `ProgressEvent.total`, and only when
   * `lengthComputable` was true. Leave undefined otherwise, which renders an
   * indeterminate bar rather than a made-up percentage.
   */
  total?: number;
  label: string;
  status?: "uploading" | "done" | "error";
  /** Localized status line, e.g. `copy.progress.uploading`. */
  statusLabel?: string;
};

/**
 * Per-file upload progress.
 *
 * Every number shown here originates in an `XMLHttpRequest` upload
 * `ProgressEvent`. `fetch()` cannot report upload progress at all, which is
 * exactly why a surface that wants a real bar must use XHR — see
 * `components/photo-upload.tsx`. Faking the bar because the transport does not
 * expose one is the failure this component exists to prevent.
 */
export function UploadProgress({
  name,
  loaded,
  total,
  label,
  status = "uploading",
  statusLabel
}: UploadProgressProps) {
  const measurable = typeof total === "number" && total > 0;
  const percent = measurable ? (loaded / (total as number)) * 100 : undefined;

  return (
    <div className={`pxs-upload pxs-upload--${status}`}>
      <div className="pxs-upload__head">
        <span className="pxs-upload__name">{name}</span>
        {measurable ? (
          <span className="pxs-upload__bytes">
            {formatBytes(loaded)} / {formatBytes(total as number)}
          </span>
        ) : null}
      </div>
      <ProgressBar
        intent={status === "error" ? "danger" : status === "done" ? "success" : "info"}
        label={label}
        showValue={measurable}
        value={percent}
      />
      {statusLabel ? <p className="pxs-upload__status">{statusLabel}</p> : null}
    </div>
  );
}
