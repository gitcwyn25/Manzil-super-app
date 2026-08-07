/**
 * Return type for a Server Action driven by `MutationForm`.
 *
 * ## Why an action returns a state instead of throwing
 *
 * A Server Action that throws is handled by the nearest `error.tsx` boundary:
 * the route is replaced by an error page and **every value the user typed is
 * destroyed**. For a thirteen-field business registration that is a worse
 * outcome than the failure itself — the user has to retype everything, and
 * most will not.
 *
 * Returning an error state instead keeps the form mounted with its DOM values
 * intact. The user sees a red toast explaining what went wrong, with their
 * work still on screen, and can fix one field and resubmit.
 *
 * `token` exists so two identical consecutive failures are distinguishable.
 * Without it the second failure would produce a structurally equal object,
 * React would not re-run the effect that raises the toast, and the second
 * click would once again appear to do nothing — the exact symptom this whole
 * system exists to remove.
 */
export type FormActionState =
  | { status: "idle" }
  | { status: "error"; message: string; token: number }
  | { status: "success"; message?: string; token: number };

export const IDLE_FORM_STATE: FormActionState = { status: "idle" };

/**
 * Wraps a thrown value as an error state.
 *
 * The message is the API's own — `crmSend` already lifts NestJS validation
 * output into `Error.message`, so the user is told which field is wrong rather
 * than "something went wrong". `fallback` covers a non-`Error` throw and must
 * be localized by the caller.
 */
export function formError(error: unknown, fallback: string): FormActionState {
  const message = error instanceof Error && error.message ? error.message : fallback;
  return { status: "error", message, token: Date.now() };
}

export function formSuccess(message?: string): FormActionState {
  return { status: "success", message, token: Date.now() };
}
