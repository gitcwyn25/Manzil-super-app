/**
 * Product Experience System — shared types.
 *
 * Server-safe: this module has no "use client" directive and no browser API,
 * so a React Server Component can import from it without pulling the client
 * runtime in.
 *
 * See docs/design/PRODUCT-EXPERIENCE-SYSTEM.md for the usage rules.
 */

/**
 * The four feedback intents. Every PXS surface that carries meaning — toast,
 * state panel, banner, progress bar — resolves its colour from one of these,
 * and only from these, via the `--fb-*` tokens in globals.css.
 *
 * `danger` is reserved for something that failed or is about to be destroyed.
 * A "heads up, this is unfinished" message is `warning`, not `danger`.
 */
export type PxsIntent = "info" | "success" | "warning" | "danger";

/** Lifecycle of anything the user triggered that takes measurable time. */
export type PxsPhase = "idle" | "pending" | "success" | "error";

// ---------------------------------------------------------------------------
// Stages — the binding rule lives here
// ---------------------------------------------------------------------------

/**
 * Status of one real stage of one real process.
 *
 * `skipped` exists because a process that genuinely did not run a step should
 * be able to say so. It is not a way to pad a list to look busier.
 */
export type PxsStageStatus = "pending" | "active" | "done" | "failed" | "skipped";

/**
 * ⛔ THE BINDING RULE.
 *
 * A stage describes something a process **actually did**. The label is emitted
 * by the engine doing the work — Epic 03's `RecommendationTrace`, Epic 08's
 * reason codes, an upload's transfer events — and is passed to the UI as data.
 *
 * The UI never authors stage text, never invents a count, and never shows a
 * step for work that is not happening. Progress theatre is the same class of
 * failure as a fabricated metric (see docs/evidence/TRUST-AUDIT.md): if Gurman
 * did not compare 24 restaurants, nothing in this codebase may say it did.
 *
 * This is enforced structurally rather than by convention: there is no default
 * stage list anywhere in `app/components/pxs/`, `StageList` requires `stages`
 * as a prop, and `parseStages()` returns `[]` — never a placeholder — when a
 * payload carries no stages.
 */
export type PxsStage = {
  /** Stable id from the emitting process; used as the React key. */
  id: string;
  /** Human-readable label **as reported by the process**. Never UI-authored. */
  label: string;
  status: PxsStageStatus;
  /**
   * Extra detail the process measured — a real count, a real duration, a real
   * reason code. If the process did not report one, leave it undefined; do not
   * compute a plausible-looking substitute in the UI.
   */
  detail?: string;
};

/**
 * Wire shape a backend must emit for `StageList` to render anything.
 *
 * Shipped now so the contract is fixed before Epic 09's conversational layer
 * lands. Until a backend emits it, every consumer passes `[]` and the UI shows
 * an honest indeterminate state instead of a fabricated sequence.
 *
 * ```jsonc
 * {
 *   "data": {
 *     "text": "…",
 *     "stages": [
 *       { "id": "retrieve", "label": "Read your saved places", "status": "done", "detail": "12 matched" }
 *     ]
 *   }
 * }
 * ```
 */
export type PxsStageEvent = {
  id: string;
  label: string;
  status: PxsStageStatus;
  detail?: string;
  /** ISO timestamp the stage reached this status, when the process records it. */
  at?: string;
};

const STAGE_STATUSES: readonly PxsStageStatus[] = [
  "pending",
  "active",
  "done",
  "failed",
  "skipped"
];

function isStageStatus(value: unknown): value is PxsStageStatus {
  return typeof value === "string" && (STAGE_STATUSES as readonly string[]).includes(value);
}

/**
 * Narrows an untrusted payload to `PxsStage[]`.
 *
 * Returns `[]` for anything it cannot verify — a missing field, a bad status,
 * a non-array. **It never substitutes a placeholder stage.** An empty list is
 * the honest answer to "what did the process report?" when the answer is
 * "nothing", and every PXS component is built to render that gracefully.
 */
export function parseStages(input: unknown): PxsStage[] {
  if (!Array.isArray(input)) {
    return [];
  }

  const stages: PxsStage[] = [];

  for (const entry of input) {
    if (!entry || typeof entry !== "object") {
      continue;
    }

    const candidate = entry as Partial<PxsStageEvent>;

    if (
      typeof candidate.id !== "string" ||
      typeof candidate.label !== "string" ||
      candidate.label.trim().length === 0 ||
      !isStageStatus(candidate.status)
    ) {
      continue;
    }

    stages.push({
      id: candidate.id,
      label: candidate.label,
      status: candidate.status,
      ...(typeof candidate.detail === "string" && candidate.detail.trim().length > 0
        ? { detail: candidate.detail }
        : {})
    });
  }

  return stages;
}

// ---------------------------------------------------------------------------
// Toasts
// ---------------------------------------------------------------------------

/** One optional action rendered inside a toast — undo, retry, "view it". */
export type PxsToastAction = {
  label: string;
  onClick: () => void;
  /** Keep the toast open after the action runs. Default: dismiss it. */
  keepOpen?: boolean;
};

/** What a caller passes to `toast()`. */
export type PxsToastInput = {
  title: string;
  body?: string;
  intent?: PxsIntent;
  action?: PxsToastAction;
  /**
   * Milliseconds before auto-dismiss. `0` pins the toast until dismissed.
   * Omit to take the per-intent default (see `TOAST_DURATION`).
   */
  duration?: number;
  /**
   * Dedupe key. Two toasts sharing a key never stack: the newer one refreshes
   * the existing entry and bumps its repeat count. Defaults to
   * `intent + title + body`, which is what stops a retry loop from producing
   * eight identical error toasts.
   */
  key?: string;
  /**
   * Live-region politeness. Defaults to `assertive` for `danger`, `polite`
   * otherwise — a failure interrupts, a confirmation waits its turn.
   */
  politeness?: "polite" | "assertive";
};

/** A toast as held by the store. */
export type PxsToast = PxsToastInput & {
  id: string;
  key: string;
  intent: PxsIntent;
  duration: number;
  /** How many times this toast has been raised since it appeared. */
  repeats: number;
};

/**
 * Per-intent auto-dismiss defaults, in milliseconds.
 *
 * `danger` is 0 — pinned. A failure the user did not read is a failure they
 * will meet again later with less context.
 */
export const TOAST_DURATION: Record<PxsIntent, number> = {
  info: 5_000,
  success: 4_000,
  warning: 7_000,
  danger: 0
};

/** Toasts on screen at once. The rest queue in order and promote on dismiss. */
export const TOAST_VISIBLE_LIMIT = 3;

// ---------------------------------------------------------------------------
// Save / auto-save
// ---------------------------------------------------------------------------

/** Status surfaced by `SaveIndicator`. Mirrors a real persistence attempt. */
export type PxsSaveStatus = "idle" | "dirty" | "saving" | "saved" | "error";
