"use client";

import type { Locale } from "@manzil/shared";
import { useEffect, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { getPxsCopy } from "../../lib/pxs/copy";
import { useOptimisticAction } from "../../lib/pxs/use-optimistic-action";
import { Icon } from "../vm/icons";
import { useAnnounce } from "./announcer";
import { Spinner } from "./progress";

export type AsyncButtonProps = {
  /** The work. Throwing or rejecting puts the button into its error state. */
  action: () => void | Promise<void>;
  children: ReactNode;
  locale: Locale;
  /** Replaces the label while running. Defaults to `copy.async.pending`. */
  pendingLabel?: string;
  /** Announced on success. Nothing is announced if omitted. */
  successLabel?: string;
  /** Announced (assertively) on failure. Defaults to `copy.async.failed`. */
  errorLabel?: string;
  className?: string;
  disabled?: boolean;
  type?: "button" | "submit";
};

/**
 * A button that owns the full lifecycle of the action it triggers: idle →
 * pending → success or error, with the result announced.
 *
 * The gap this closes, in the epic's words: *click Save → nothing → page
 * refreshes*. The three things that were missing are all here and all
 * mandatory —
 *
 *   - `aria-busy` and a visible pending label, so the click is acknowledged;
 *   - re-entry blocked while pending (`useOptimisticAction`), so an impatient
 *     second click cannot fire the action twice;
 *   - the outcome announced through the live region, so it is not conveyed by
 *     colour alone.
 *
 * The button stays disabled only while pending. Locking it after success would
 * make a legitimate second action (save again after another edit) impossible.
 */
export function AsyncButton({
  action,
  children,
  locale,
  pendingLabel,
  successLabel,
  errorLabel,
  className,
  disabled,
  type = "button"
}: AsyncButtonProps) {
  const copy = getPxsCopy(locale);
  const announce = useAnnounce();

  const { phase, pending, invoke } = useOptimisticAction({
    run: action,
    onSuccess: () => {
      if (successLabel) {
        announce(successLabel, "polite");
      }
    },
    onError: () => announce(errorLabel ?? copy.async.failed, "assertive")
  });

  return (
    <button
      aria-busy={pending}
      className={`${className ?? "pxs-btn pxs-btn--solid"}${
        phase === "error" ? " is-error" : ""
      }${phase === "success" ? " is-success" : ""}`}
      disabled={disabled || pending}
      onClick={invoke}
      type={type}
    >
      {pending ? (
        <>
          <Spinner label={pendingLabel ?? copy.async.pending} size={16} />
          {pendingLabel ?? copy.async.pending}
        </>
      ) : (
        children
      )}
    </button>
  );
}

export type FormSubmitButtonProps = {
  label: string;
  pendingLabel: string;
  locale: Locale;
  className?: string;
  /** Trailing icon, shown in the idle state only. */
  icon?: "arrow_forward" | "check" | "send" | "plus";
  children?: ReactNode;
};

/**
 * Submit button for a React Server Action form.
 *
 * Must be rendered **inside** the `<form>`: `useFormStatus` reports on the
 * nearest ancestor form and returns `pending: false` anywhere else — a silent
 * failure that looks exactly like a working button.
 *
 * Beyond the visual pending state it announces "submitting" once, on the
 * transition into pending. Server Actions navigate on success, so the success
 * message is the destination page; there is no post-success state to announce
 * here and inventing one would describe a transition the component cannot
 * observe.
 */
export function FormSubmitButton({
  label,
  pendingLabel,
  locale,
  className,
  icon = "arrow_forward",
  children
}: FormSubmitButtonProps) {
  const { pending } = useFormStatus();
  const announce = useAnnounce();
  const copy = getPxsCopy(locale);

  useEffect(() => {
    if (pending) {
      announce(pendingLabel || copy.async.pending, "polite");
    }
  }, [pending, pendingLabel, announce, copy.async.pending]);

  return (
    <button
      aria-busy={pending}
      className={className ?? "pxs-btn pxs-btn--solid"}
      disabled={pending}
      type="submit"
    >
      {pending ? (
        <>
          <Spinner label={pendingLabel} size={16} />
          {pendingLabel}
        </>
      ) : (
        <>
          {children ?? label}
          <Icon name={icon} size={18} />
        </>
      )}
    </button>
  );
}
