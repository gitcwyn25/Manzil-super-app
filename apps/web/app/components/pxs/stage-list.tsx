import type { Locale } from "@manzil/shared";
import { getPxsCopy } from "../../lib/pxs/copy";
import type { PxsStage, PxsStageStatus } from "../../lib/pxs/types";
import { Icon, type IconName } from "../vm/icons";
import { Spinner } from "./progress";

/**
 * ⛔ THE BINDING RULE, IN CODE.
 *
 * Every message this component renders corresponds to a real stage of a real
 * process, because **this component cannot produce a message on its own.**
 * There is no default stage list in this file, no example array, no
 * `PLACEHOLDER_STAGES` export to copy. `stages` is a required prop, and the
 * only text the component owns is `copy.stages.waiting` — which describes the
 * *request* ("waiting for a reply"), a fact this component can verify, rather
 * than any step inside it.
 *
 * The failure this prevents:
 *
 * ```
 * Thinking… → Reading your preferences… → Comparing 24 restaurants…
 *   → Removing closed places… → Ranking by your budget… → Done ✓
 * ```
 *
 * That sequence is only allowed on screen if the engine emitted it. If Gurman
 * did not compare 24 restaurants, nothing may say it did. Progress theatre —
 * invented stages, invented counts, spinners for work that is not happening —
 * is the same category of failure as a fabricated metric and is forbidden by
 * the same principle (docs/evidence/TRUST-AUDIT.md).
 *
 * Today no Manzil backend emits stages: `POST /gurman/ask` returns text and
 * grounded businesses, nothing more. So every current caller passes `[]` and
 * gets the honest indeterminate state. When Epic 03's `RecommendationTrace` and
 * Epic 09's conversational layer start emitting `PxsStageEvent[]`, the same
 * callers start rendering real stages with no UI change — see `parseStages()`
 * in `app/lib/pxs/types.ts`, which returns `[]` rather than a placeholder for
 * any payload it cannot verify.
 *
 * Server-safe: no "use client", no hooks.
 */

const STATUS_ICON: Record<Exclude<PxsStageStatus, "active">, IconName> = {
  pending: "schedule",
  done: "check_circle",
  failed: "alert_circle",
  skipped: "chevron_right"
};

export type StageListProps = {
  /**
   * Stages **as reported by the process**, in the order the process reported
   * them. Required, and never defaulted — see the note above.
   */
  stages: PxsStage[];
  locale: Locale;
  /**
   * Whether the process is still running. Controls the indeterminate fallback
   * shown when `stages` is empty.
   */
  busy?: boolean;
  /**
   * Overrides the "waiting for a reply" line. Must still describe only the
   * request, never a step inside it — `copy.concierge.thinking` is fine,
   * "Comparing restaurants" is not.
   */
  waitingLabel?: string;
  className?: string;
};

export function StageList({
  stages,
  locale,
  busy = false,
  waitingLabel,
  className
}: StageListProps) {
  const copy = getPxsCopy(locale);

  // Nothing reported and nothing running: render nothing. An empty stage list
  // is a complete, honest answer, and inventing filler to occupy the space is
  // precisely what this component exists to prevent.
  if (stages.length === 0 && !busy) {
    return null;
  }

  // Running, but the process reported no stages. This is the honest rendering:
  // one indeterminate indicator and a line about the *request*. It is what
  // every current caller gets, because no Manzil backend emits stages yet.
  if (stages.length === 0) {
    return (
      <p className={`pxs-stages__waiting${className ? ` ${className}` : ""}`}>
        {/* Decorative: the text beside it says the same thing, and two live
            regions would announce the phrase twice. */}
        <Spinner decorative label={waitingLabel ?? copy.stages.waiting} size={16} />
        <span>{waitingLabel ?? copy.stages.waiting}</span>
      </p>
    );
  }

  const statusText: Record<PxsStageStatus, string> = {
    pending: copy.stages.statusPending,
    active: copy.stages.statusActive,
    done: copy.stages.statusDone,
    failed: copy.stages.statusFailed,
    skipped: copy.stages.statusSkipped
  };

  return (
    <ol
      // `aria-live="polite"` rather than a separate announcement: the list is
      // the source of truth, and appending a stage is exactly the mutation a
      // live region is designed to report. `aria-relevant="additions"` keeps a
      // status flipping pending → done from re-reading the whole list.
      aria-label={copy.stages.listLabel}
      aria-live={busy ? "polite" : "off"}
      aria-relevant="additions"
      className={`pxs-stages${className ? ` ${className}` : ""}`}
    >
      {stages.map((stage) => (
        <li className={`pxs-stage pxs-stage--${stage.status}`} key={stage.id}>
          <span aria-hidden="true" className="pxs-stage__marker">
            {stage.status === "active" ? (
              <span className="pxs-stage__pulse" />
            ) : (
              <Icon name={STATUS_ICON[stage.status]} size={16} />
            )}
          </span>
          <span className="pxs-stage__label">
            {stage.label}
            {/* Rendered only when the process reported one. The UI never
                computes a detail to fill the gap. */}
            {stage.detail ? <span className="pxs-stage__detail">{stage.detail}</span> : null}
          </span>
          <span className="pxs-sr-only">{statusText[stage.status]}</span>
        </li>
      ))}
    </ol>
  );
}
