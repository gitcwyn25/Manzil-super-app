"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PxsPhase } from "./types";

export type OptimisticValueOptions<T> = {
  /**
   * The committed value — whatever the store, server or `localStorage`
   * currently holds. The hook overlays a pending value on top of it and drops
   * the overlay as soon as the commit resolves, so the committed value is
   * always the single source of truth.
   */
  value: T;
  /**
   * Persists `next`. **Throwing or rejecting is how failure is reported**, and
   * is what triggers the revert. A commit that swallows its own errors makes
   * the whole primitive useless, so never wrap this body in a bare try/catch.
   */
  commit: (next: T) => void | Promise<void>;
  /** Ran after a successful commit, with the value that stuck. */
  onSuccess?: (committed: T) => void;
  /**
   * Ran after a failed commit, with the error and the value the UI reverted
   * to. This is where the failure must be *surfaced* — a toast, an inline
   * message, an announcement. A silent revert is worse than no optimism: the
   * user watched their change happen and then quietly un-happen.
   */
  onError?: (error: unknown, revertedTo: T) => void;
};

export type OptimisticValue<T> = {
  /** What to render: the optimistic overlay if one is in flight, else `value`. */
  value: T;
  phase: PxsPhase;
  pending: boolean;
  error: unknown;
  /** Applies `next` instantly and commits it in the background. */
  set: (next: T) => void;
  /** Clears a lingering error/success phase back to idle. */
  reset: () => void;
};

/**
 * Optimistic update primitive: **apply instantly, revert on failure, surface
 * the failure.**
 *
 * This generalises the pattern the Save control needs. Before PXS, the
 * preferences store applied a change to React state and wrote to
 * `localStorage` in a `useEffect` — so a write that threw (Safari private
 * mode, a full quota) left the screen showing "Saved" for a change that was
 * never persisted. The trust audit's rule applies to state as much as to copy:
 * the interface must not claim something that did not happen.
 *
 * Ordering is guarded by a monotonically increasing token, so a slow first
 * commit resolving after a fast second one cannot resurrect a stale value.
 *
 * ```tsx
 * const saved = useOptimisticValue({
 *   value: isSaved(slug),
 *   commit: (next) => persist(next),        // throws on failure
 *   onError: () => toast({ intent: "danger", title: copy.optimistic.revertedTitle })
 * });
 * <button aria-pressed={saved.value} onClick={() => saved.set(!saved.value)} />
 * ```
 */
export function useOptimisticValue<T>({
  value,
  commit,
  onSuccess,
  onError
}: OptimisticValueOptions<T>): OptimisticValue<T> {
  // `null` (not `undefined`) means "no overlay", so `T` may legitimately be
  // undefined without the hook mistaking it for an absent overlay.
  const [overlay, setOverlay] = useState<{ value: T } | null>(null);
  const [phase, setPhase] = useState<PxsPhase>("idle");
  const [error, setError] = useState<unknown>(null);

  const token = useRef(0);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  // Callbacks are read through refs so a caller passing inline closures (the
  // common case) does not re-create `set` on every render.
  //
  // Assigned in an effect rather than during render: writing to a ref while
  // rendering is unsafe under concurrent rendering, where a render can be
  // discarded or replayed. Everything below reads these refs from an event
  // handler or a promise callback, both of which run after the commit phase,
  // so they always see the latest value.
  const commitRef = useRef(commit);
  const successRef = useRef(onSuccess);
  const errorRef = useRef(onError);
  const valueRef = useRef(value);

  useEffect(() => {
    commitRef.current = commit;
    successRef.current = onSuccess;
    errorRef.current = onError;
    valueRef.current = value;
  });

  const set = useCallback((next: T) => {
    const current = ++token.current;
    const previous = valueRef.current;

    setOverlay({ value: next });
    setPhase("pending");
    setError(null);

    const settle = (failure: unknown) => {
      // A newer call has taken over; its overlay and phase win.
      if (!mounted.current || current !== token.current) {
        return;
      }

      // Drop the overlay either way. On success the committed value has caught
      // up; on failure dropping it *is* the revert.
      setOverlay(null);

      if (failure === null) {
        setPhase("success");
        successRef.current?.(next);
        return;
      }

      setPhase("error");
      setError(failure);
      errorRef.current?.(failure, previous);
    };

    try {
      const result = commitRef.current(next);
      if (result instanceof Promise) {
        result.then(
          () => settle(null),
          (reason: unknown) => settle(reason ?? new Error("Commit rejected"))
        );
        return;
      }
      settle(null);
    } catch (thrown) {
      settle(thrown ?? new Error("Commit threw"));
    }
  }, []);

  const reset = useCallback(() => {
    setPhase("idle");
    setError(null);
  }, []);

  return {
    value: overlay ? overlay.value : value,
    phase,
    pending: phase === "pending",
    error,
    set,
    reset
  };
}

export type OptimisticActionOptions = {
  /** The work. Throwing or rejecting marks the action failed. */
  run: () => void | Promise<void>;
  onSuccess?: () => void;
  onError?: (error: unknown) => void;
};

export type OptimisticAction = {
  phase: PxsPhase;
  pending: boolean;
  error: unknown;
  /** Invokes the action. A second call while pending is ignored. */
  invoke: () => void;
  reset: () => void;
};

/**
 * The valueless sibling of `useOptimisticValue`, for actions with no toggle
 * state — submit, delete, resend.
 *
 * Re-entry is blocked while pending. That is not cosmetic: the concierge
 * endpoint is rate-limited to 10 requests per 15 minutes, and registration
 * used to create duplicate businesses when an impatient user double-clicked.
 */
export function useOptimisticAction({
  run,
  onSuccess,
  onError
}: OptimisticActionOptions): OptimisticAction {
  const [phase, setPhase] = useState<PxsPhase>("idle");
  const [error, setError] = useState<unknown>(null);
  const inFlight = useRef(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  // See the note in `useOptimisticValue`: refs are refreshed in an effect, not
  // during render, and are only ever read after the commit phase.
  const runRef = useRef(run);
  const successRef = useRef(onSuccess);
  const errorRef = useRef(onError);

  useEffect(() => {
    runRef.current = run;
    successRef.current = onSuccess;
    errorRef.current = onError;
  });

  const invoke = useCallback(() => {
    if (inFlight.current) {
      return;
    }

    inFlight.current = true;
    setPhase("pending");
    setError(null);

    const settle = (failure: unknown) => {
      inFlight.current = false;
      if (!mounted.current) {
        return;
      }
      if (failure === null) {
        setPhase("success");
        successRef.current?.();
        return;
      }
      setPhase("error");
      setError(failure);
      errorRef.current?.(failure);
    };

    try {
      const result = runRef.current();
      if (result instanceof Promise) {
        result.then(
          () => settle(null),
          (reason: unknown) => settle(reason ?? new Error("Action rejected"))
        );
        return;
      }
      settle(null);
    } catch (thrown) {
      settle(thrown ?? new Error("Action threw"));
    }
  }, []);

  const reset = useCallback(() => {
    setPhase("idle");
    setError(null);
  }, []);

  return { phase, pending: phase === "pending", error, invoke, reset };
}
