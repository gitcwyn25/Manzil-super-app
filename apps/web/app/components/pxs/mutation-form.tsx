"use client";

import type { Locale } from "@manzil/shared";
import {
  createContext,
  useActionState,
  useContext,
  useEffect,
  useRef,
  type ReactNode
} from "react";
import { useFormStatus } from "react-dom";
import { getPxsCopy } from "../../lib/pxs/copy";
import { IDEMPOTENCY_FIELD, newIdempotencyKey } from "../../lib/pxs/idempotency";
import { IDLE_FORM_STATE, type FormActionState } from "../../lib/pxs/form-state";
import { Icon } from "../vm/icons";
import { useAnnounce } from "./announcer";
import { Spinner } from "./progress";
import { useToast } from "./toast";
import { UnsavedChangesGuard, useFormDirty } from "./unsaved-changes";

type MutationFormContextValue = { state: FormActionState };

const MutationFormContext = createContext<MutationFormContextValue>({ state: IDLE_FORM_STATE });

export type MutationFormProps = {
  /**
   * A Server Action with the `useActionState` signature. It must **return** a
   * `FormActionState` on failure rather than throwing — see
   * `app/lib/pxs/form-state.ts` for why that difference decides whether the
   * user keeps what they typed.
   */
  action: (state: FormActionState, formData: FormData) => Promise<FormActionState>;
  locale: Locale;
  children: ReactNode;
  className?: string;
  /** Toast title on failure. Defaults to `copy.async.saveFailed`. */
  errorTitle?: string;
  /** Toast title on a success that does not navigate away. */
  successTitle?: string;
  /**
   * Warns before the user abandons a form they have started filling in.
   * Driven by real `input`/`change` events on this form, never hardcoded — a
   * guard that is always armed is a guard everyone learns to click through.
   */
  guardUnsavedChanges?: boolean;
  id?: string;
};

/**
 * A `<form>` that cannot submit twice and cannot lose the user's work.
 *
 * This is the Server Action half of the mutation system (`useMutation` is the
 * client-fetch half). Every create form should use it, and the reason is a
 * live production defect rather than polish:
 *
 * > Click Save → nothing visible happens → the user clicks again → two
 * > requests → **two rows in the catalogue** for one business, which then
 * > accumulate separate reviews and separate ratings.
 *
 * Four mechanisms, all inherited rather than reimplemented per form:
 *
 *   1. **The button disables itself on the first click** (`MutationSubmit`,
 *      via `useFormStatus`) and shows "Saving…" with a spinner. There is
 *      nothing left to click.
 *   2. **A second submit is refused at the form level.** Even if a form ships
 *      its own button, `onSubmit` blocks re-entry while `pending` is true —
 *      including Enter-in-a-text-field, which never touches the button.
 *   3. **Every submission carries an `Idempotency-Key`.** Minted once per
 *      mounted form and *kept across retries*, so if a request lands but its
 *      response is lost, the retry is recognisable to the API as the same
 *      intent. This is the half that still works when the UI guard cannot —
 *      a dropped response is genuinely ambiguous to the browser.
 *   4. **A failure keeps the form.** The action returns state instead of
 *      throwing, so the fields are still filled in; the user gets a pinned red
 *      toast carrying the API's own message and can resubmit.
 *
 * ⛔ No progress theatre. "Saving…" is shown exactly while a request is in
 * flight — a fact about the request, not an invented step inside it. No stage
 * list is rendered here, because the registration endpoint emits no stages.
 */
export function MutationForm({
  action,
  locale,
  children,
  className,
  errorTitle,
  successTitle,
  guardUnsavedChanges = false,
  id
}: MutationFormProps) {
  const copy = getPxsCopy(locale);
  const { toast } = useToast();
  const announce = useAnnounce();

  const [state, formAction, pending] = useActionState(action, IDLE_FORM_STATE);

  const formRef = useRef<HTMLFormElement | null>(null);
  const keyInputRef = useRef<HTMLInputElement | null>(null);
  const { dirty } = useFormDirty(formRef);

  /**
   * The key is written imperatively after mount rather than rendered.
   *
   * A UUID generated during render would differ between the server pass and
   * the hydration pass — a guaranteed hydration mismatch. Writing it to an
   * uncontrolled input after mount sidesteps that: React rendered `value=""`
   * on both sides and never reconciles the field again.
   *
   * Crucially it is **not** regenerated on re-render, so a failed submit and
   * its retry carry the same key. Rotation happens only on success, where the
   * next submission is a genuinely new intent.
   */
  useEffect(() => {
    if (keyInputRef.current && !keyInputRef.current.value) {
      keyInputRef.current.value = newIdempotencyKey();
    }
  }, []);

  useEffect(() => {
    if (state.status === "error") {
      toast({
        intent: "danger",
        title: errorTitle ?? copy.async.saveFailed,
        body: state.message,
        // Deduped per message: a user retrying the same invalid field three
        // times gets one card with a repeat count, not three identical ones.
        key: `form-error:${state.message}`
      });
      return;
    }

    if (state.status === "success") {
      if (successTitle) {
        toast({ intent: "success", title: successTitle, body: state.message });
      } else {
        announce(copy.async.saved, "polite");
      }

      // The intent completed, so the next submission is a new one. (A success
      // that redirects unmounts this form before reaching here, which is also
      // correct — the fresh page mints a fresh key.)
      if (keyInputRef.current) {
        keyInputRef.current.value = newIdempotencyKey();
      }
    }
    // `state.token` is what makes a repeated identical outcome a new state.
  }, [state, toast, announce, errorTitle, successTitle, copy.async.saveFailed, copy.async.saved]);

  return (
    <MutationFormContext.Provider value={{ state }}>
      <form
        action={formAction}
        className={className}
        id={id}
        onSubmit={(event) => {
          // Belt to the button's braces. Covers Enter pressed inside a text
          // field and any bespoke submit control a form might add later.
          if (pending) {
            event.preventDefault();
          }
        }}
        ref={formRef}
      >
        <input defaultValue="" name={IDEMPOTENCY_FIELD} ref={keyInputRef} type="hidden" />
        {children}
      </form>

      {/* Suppressed while a submit is in flight: the navigation the submit
          itself causes is not an abandoned form. */}
      {guardUnsavedChanges ? (
        <UnsavedChangesGuard dirty={dirty && !pending} locale={locale} />
      ) : null}
    </MutationFormContext.Provider>
  );
}

/**
 * Submit button for a `MutationForm`.
 *
 * Three visible states, each corresponding to something real:
 *   - **idle** — the label, with a forward chevron;
 *   - **saving** — disabled, spinner, "Saving…", `aria-busy`, and the label
 *     change is announced politely so the click is acknowledged without a
 *     screen;
 *   - **saved** — a checkmark and "Saved", held briefly, and only ever shown
 *     after the action *returned* success. Forms that redirect on success skip
 *     this state entirely because the destination page is the confirmation.
 *
 * `useFormStatus` reports on the nearest ancestor `<form>`, so this must be
 * rendered inside one — outside, it silently reports `pending: false` forever,
 * which looks exactly like a working button that never acknowledges a click.
 */
export function MutationSubmit({
  label,
  pendingLabel,
  savedLabel,
  locale,
  className,
  icon = "arrow_forward"
}: {
  label: string;
  pendingLabel: string;
  /** Defaults to the localized "Saved". */
  savedLabel?: string;
  locale: Locale;
  className?: string;
  icon?: "arrow_forward" | "check" | "send" | "plus";
}) {
  const { pending } = useFormStatus();
  const { state } = useContext(MutationFormContext);
  const copy = getPxsCopy(locale);
  const announce = useAnnounce();

  const saved = state.status === "success";

  useEffect(() => {
    if (pending) {
      announce(pendingLabel, "polite");
    }
  }, [pending, pendingLabel, announce]);

  return (
    <button
      aria-busy={pending}
      className={`${className ?? "pxs-btn pxs-btn--solid"}${saved ? " is-success" : ""}`}
      disabled={pending}
      type="submit"
    >
      {pending ? (
        <>
          <Spinner label={pendingLabel} size={16} />
          {pendingLabel}
        </>
      ) : saved ? (
        <>
          {savedLabel ?? copy.async.saved}
          <Icon name="check" size={18} />
        </>
      ) : (
        <>
          {label}
          <Icon name={icon} size={18} />
        </>
      )}
    </button>
  );
}
