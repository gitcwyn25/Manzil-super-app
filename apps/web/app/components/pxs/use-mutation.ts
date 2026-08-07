"use client";

import type { Locale } from "@manzil/shared";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { getPxsCopy } from "../../lib/pxs/copy";
import { newIdempotencyKey } from "../../lib/pxs/idempotency";
import type { PxsPhase } from "../../lib/pxs/types";
import { useAnnounce } from "./announcer";
import { useToast } from "./toast";

export type MutationContext = {
  /**
   * Stable across retries of the same intent; rotated after a confirmed
   * success. Send it as the `Idempotency-Key` header — see
   * `app/lib/pxs/idempotency.ts`.
   */
  idempotencyKey: string;
  /** Aborted if the component unmounts mid-flight. */
  signal: AbortSignal;
};

export type MutationOptions<TInput, TResult> = {
  /**
   * The write. Must **throw or reject on failure** — that is the only signal
   * this hook has, and a `run` that swallows its own errors turns every failed
   * save into a green toast.
   */
  run: (input: TInput, context: MutationContext) => Promise<TResult>;
  locale: Locale;
  /** Toast title on success. Omit for a mutation that should stay silent. */
  successTitle?: string;
  successBody?: string;
  /**
   * Announced on success when no toast is shown. Defaults to the localized
   * "Saved".
   *
   * Pass `null` when the result *is* its own confirmation and already lives in
   * a live region — a chat reply appearing in the transcript, for instance.
   * Announcing "Saved" there would be both redundant and wrong.
   */
  successAnnouncement?: string | null;
  /** Toast title on failure. Defaults to `copy.async.saveFailed`. */
  errorTitle?: string;
  /**
   * Turns a thrown error into a sentence for the user. Defaults to the error's
   * own `message`, which is what `crmSend` already surfaces from the API's
   * validation output. Return `undefined` to show the title alone.
   */
  errorBody?: (error: unknown) => string | undefined;
  /**
   * Revalidates server-rendered data after a success, so the list the user is
   * looking at reflects the write. Default `true`. Set `false` only when the
   * mutation navigates away, which revalidates on arrival anyway.
   */
  refresh?: boolean;
  /**
   * How long the button holds its "Saved ✓" state before returning to idle.
   * Long enough to be read, short enough not to block a second edit.
   */
  successHoldMs?: number;
  onSuccess?: (result: TResult, input: TInput) => void;
  onError?: (error: unknown, input: TInput) => void;
};

export type Mutation<TInput, TResult> = {
  phase: PxsPhase;
  pending: boolean;
  /** True while the button should read "Saved ✓". */
  succeeded: boolean;
  error: unknown;
  data: TResult | null;
  idempotencyKey: string;
  /** Fires the mutation. Calls made while one is in flight are ignored. */
  mutate: (input: TInput) => void;
  /** Same, but awaitable — resolves `null` if a call was in flight. */
  mutateAsync: (input: TInput) => Promise<TResult | null>;
  /** Clears state and rotates the idempotency key: a new intent starts here. */
  reset: () => void;
};

/**
 * The mutation primitive. **Every create / update / delete in this app goes
 * through it.**
 *
 * The behaviour the epic requires is implemented once, here, so that no form
 * can forget a piece of it:
 *
 *   1. **One request per intent.** `inFlight` is checked and set inside this
 *      hook, before `run` is called. A form cannot opt out by forgetting a
 *      guard in its own handler, because the guard is not in the handler.
 *   2. **Immediate acknowledgement.** `pending` flips synchronously, which is
 *      what drives the disabled state and the "Saving…" label.
 *   3. **Success is confirmed, not assumed.** The success toast, the `Saved ✓`
 *      hold and the refresh all hang off the resolution of `run` — never off
 *      the moment the request was sent. An interface that says "Saved" because
 *      a request left the browser is asserting an outcome it has not observed.
 *   4. **Failure is loud and lossless.** The error toast carries the API's own
 *      message, `pending` clears so the button is usable again, and nothing in
 *      this hook touches the form — the user's typing is still on screen,
 *      ready to resubmit. Losing a filled form on a failed save is its own
 *      trust failure.
 *   5. **The retry is identified.** The idempotency key is *not* rotated on
 *      failure, so a retry after an ambiguous outcome is recognisable to the
 *      API as the same operation rather than a second one.
 *   6. **The data catches up.** `router.refresh()` re-renders the server
 *      components on the current route, so the list reflects the write without
 *      a full reload.
 *
 * ⛔ No progress theatre: `pending` is true exactly while a real request is in
 * flight, and the only message shown is "Saving…", which is a fact about the
 * request rather than a claim about a step inside it.
 */
export function useMutation<TInput = void, TResult = unknown>({
  run,
  locale,
  successTitle,
  successBody,
  successAnnouncement,
  errorTitle,
  errorBody,
  refresh = true,
  successHoldMs = 2_500,
  onSuccess,
  onError
}: MutationOptions<TInput, TResult>): Mutation<TInput, TResult> {
  const copy = getPxsCopy(locale);
  const router = useRouter();
  const { toast } = useToast();
  const announce = useAnnounce();

  const [phase, setPhase] = useState<PxsPhase>("idle");
  const [error, setError] = useState<unknown>(null);
  const [data, setData] = useState<TResult | null>(null);
  const [idempotencyKey, setIdempotencyKey] = useState(newIdempotencyKey);

  // The guard. A ref, not state: it must be readable and writable
  // synchronously within one click handler, before React has re-rendered.
  // A `pending` state check would still be `false` on the second click of a
  // double-click, which is exactly the bug this exists to prevent.
  const inFlight = useRef(false);
  const mounted = useRef(true);
  const abort = useRef<AbortController | null>(null);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      abort.current?.abort();
    };
  }, []);

  // Refreshed in an effect, not during render: writing a ref while rendering is
  // unsafe under concurrent rendering. `mutateAsync` reads these from an event
  // handler, which always runs after the commit phase.
  const optionsRef = useRef({ run, onSuccess, onError, errorBody });

  useEffect(() => {
    optionsRef.current = { run, onSuccess, onError, errorBody };
  });

  const mutateAsync = useCallback(
    async (input: TInput): Promise<TResult | null> => {
      if (inFlight.current) {
        return null;
      }

      inFlight.current = true;
      abort.current = new AbortController();
      setPhase("pending");
      setError(null);

      try {
        const result = await optionsRef.current.run(input, {
          idempotencyKey,
          signal: abort.current.signal
        });

        inFlight.current = false;

        if (!mounted.current) {
          return result;
        }

        setData(result);
        setPhase("success");

        if (successTitle) {
          toast({ intent: "success", title: successTitle, body: successBody });
        } else if (successAnnouncement !== null) {
          // Still announced even without a toast: a save that produced no
          // visible confirmation is a save a screen-reader user cannot verify.
          announce(successAnnouncement ?? copy.async.saved, "polite");
        }

        optionsRef.current.onSuccess?.(result, input);

        // The intent is complete, so the next submission is a new one.
        setIdempotencyKey(newIdempotencyKey());

        if (refresh) {
          router.refresh();
        }

        return result;
      } catch (thrown) {
        inFlight.current = false;

        if (!mounted.current) {
          return null;
        }

        setError(thrown);
        setPhase("error");

        const body =
          optionsRef.current.errorBody?.(thrown) ??
          (thrown instanceof Error && thrown.message ? thrown.message : undefined);

        // Pinned (danger toasts do not auto-dismiss) and announced
        // assertively: this is the state the user has to act on. The key is
        // deliberately NOT rotated — the retry is the same intent.
        toast({
          intent: "danger",
          title: errorTitle ?? copy.async.saveFailed,
          body,
          action: undefined
        });

        optionsRef.current.onError?.(thrown, input);
        return null;
      }
    },
    [
      idempotencyKey,
      successTitle,
      successBody,
      successAnnouncement,
      errorTitle,
      refresh,
      router,
      toast,
      announce,
      copy.async.saved,
      copy.async.saveFailed
    ]
  );

  const mutate = useCallback(
    (input: TInput) => {
      void mutateAsync(input);
    },
    [mutateAsync]
  );

  // Release the "Saved ✓" state after the hold. Not a timer that *creates* the
  // success state — one that ends a state a real resolution already produced.
  useEffect(() => {
    if (phase !== "success" || successHoldMs <= 0) {
      return;
    }
    const id = window.setTimeout(() => {
      if (mounted.current) {
        setPhase("idle");
      }
    }, successHoldMs);
    return () => window.clearTimeout(id);
  }, [phase, successHoldMs]);

  const reset = useCallback(() => {
    setPhase("idle");
    setError(null);
    setData(null);
    setIdempotencyKey(newIdempotencyKey());
  }, []);

  return {
    phase,
    pending: phase === "pending",
    succeeded: phase === "success",
    error,
    data,
    idempotencyKey,
    mutate,
    mutateAsync,
    reset
  };
}
