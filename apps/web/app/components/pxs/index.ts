/**
 * Product Experience System — public surface.
 *
 * Governance (docs/design/PRODUCT-EXPERIENCE-SYSTEM.md): a new feature that
 * needs a toast, a dialog, a loading state, a progress bar, an empty state or
 * an optimistic update **imports it from here**. Hand-rolling a spinner or a
 * toast is a review rejection — that is what makes the platform feel like one
 * product rather than twenty pages.
 *
 * Server-safe exports (usable directly in an RSC): `Skeleton*`, `Progress*`,
 * `Spinner`, `UploadProgress`, `StageList`, `StatePanel` and its four presets.
 * Everything else is a client component or hook; importing one from an RSC
 * creates a client boundary, which is fine but should be deliberate.
 *
 * Hooks live under `app/lib/pxs/` and are imported from there directly rather
 * than re-exported here, so a server component pulling in `StatePanel` does not
 * drag the client hooks into its module graph.
 */

// Runtime
export { PxsProvider } from "./pxs-provider";
export { AnnouncerProvider, useAnnounce } from "./announcer";
export { ToastProvider, useToast } from "./toast";
export { ConnectionBanner } from "./connection-status";

// Overlays
export { Dialog, ConfirmDialog, type DialogProps, type ConfirmDialogProps } from "./dialog";

// Loading & progress
export { Skeleton, SkeletonText, SkeletonCard, SkeletonGrid, SkeletonRegion } from "./skeleton";
export { ProgressBar, Spinner, UploadProgress } from "./progress";

// Process reporting — see the binding rule in ./stage-list
export { StageList, type StageListProps } from "./stage-list";

// States
export {
  StatePanel,
  EmptyState,
  NoResultsState,
  ErrorState,
  SuccessState,
  type StatePanelProps
} from "./state-panel";
export { PxsErrorBoundary } from "./error-boundary";

// Actions & forms
export { AsyncButton, FormSubmitButton } from "./async-button";
export { SaveIndicator } from "./save-indicator";
export { UnsavedChangesGuard, useFormDirty } from "./unsaved-changes";

/**
 * Mutation system — every create/update/delete goes through one of these two.
 *
 * `useMutation` for client-side writes (fetch/XHR); `MutationForm` +
 * `MutationSubmit` for Server Action forms. Both carry the single-flight
 * guard, the `Idempotency-Key`, the failure toast and — on forms — the
 * preservation of what the user typed. Hand-rolling a submit handler is a
 * review rejection: the guard belongs inside the primitive, because a guard
 * that each form has to remember is a guard some form will forget.
 */
export { useMutation, type Mutation, type MutationOptions } from "./use-mutation";
export { MutationForm, MutationSubmit, type MutationFormProps } from "./mutation-form";
