"use client";

import type { Locale } from "@manzil/shared";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useId, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { getPxsCopy } from "../../lib/pxs/copy";
import { useFocusTrap, useScrollLock } from "../../lib/pxs/use-focus-trap";
import { useIsMounted } from "../../lib/pxs/use-is-mounted";
import type { PxsIntent } from "../../lib/pxs/types";
import { DUR, EASE_OUT } from "../motion/presets";
import { Icon } from "../vm/icons";

export type DialogProps = {
  open: boolean;
  onClose: () => void;
  locale: Locale;
  title: string;
  /** Optional supporting sentence, associated via `aria-describedby`. */
  description?: string;
  children?: ReactNode;
  /** Rendered in the footer. Put the primary action last (LTR reading order). */
  footer?: ReactNode;
  /**
   * Blocks Escape and backdrop-click. Use only where dismissing would lose
   * work; a dialog the user cannot close is otherwise a trap.
   */
  dismissible?: boolean;
  /** Widens the panel for content-heavy dialogs. */
  size?: "sm" | "md" | "lg";
  intent?: PxsIntent;
};

/**
 * Modal dialog.
 *
 * The four obligations of a modal, all handled here so no call site has to
 * remember them:
 *
 *   1. **Focus moves in** on open and is **restored to the trigger** on close
 *      (`useFocusTrap`).
 *   2. **Focus cannot leave** while it is open — Tab and Shift+Tab wrap.
 *   3. **Escape closes it**, and so does a backdrop click, unless
 *      `dismissible={false}`.
 *   4. **The page behind cannot scroll** (`useScrollLock`), with the scrollbar
 *      width compensated so opening a dialog does not shift the layout.
 *
 * Rendered through a portal to `document.body` so no ancestor's `overflow`,
 * `transform` or stacking context can clip it — a class of bug that is
 * invisible in development and appears the moment a dialog is opened from
 * inside a card.
 *
 * `aria-modal="true"` plus `role="dialog"` is what tells a screen reader the
 * rest of the page is inert; the visual backdrop alone communicates nothing.
 */
export function Dialog({
  open,
  onClose,
  locale,
  title,
  description,
  children,
  footer,
  dismissible = true,
  size = "md",
  intent
}: DialogProps) {
  const copy = getPxsCopy(locale);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const mounted = useIsMounted();
  const titleId = useId();
  const descriptionId = useId();

  useFocusTrap(open, panelRef);
  useScrollLock(open);

  useEffect(() => {
    if (!open || !dismissible) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onClose();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, dismissible, onClose]);

  if (!mounted) {
    return null;
  }

  return createPortal(
    <AnimatePresence>
      {open ? (
        <div className="pxs-dialog-layer">
          <motion.div
            animate={{ opacity: 1 }}
            className="pxs-dialog__backdrop"
            exit={{ opacity: 0 }}
            initial={{ opacity: 0 }}
            onClick={dismissible ? onClose : undefined}
            transition={{ duration: DUR.fast, ease: EASE_OUT }}
          />
          <motion.div
            animate={{ opacity: 1, y: 0, scale: 1 }}
            aria-describedby={description ? descriptionId : undefined}
            aria-labelledby={titleId}
            aria-modal="true"
            className={`pxs-dialog pxs-dialog--${size}${intent ? ` pxs-dialog--${intent}` : ""}`}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            ref={panelRef}
            role="dialog"
            tabIndex={-1}
            transition={{ duration: DUR.med, ease: EASE_OUT }}
          >
            <header className="pxs-dialog__head">
              <h2 className="pxs-dialog__title" id={titleId}>
                {title}
              </h2>
              {dismissible ? (
                <button
                  aria-label={copy.dialog.close}
                  className="pxs-dialog__close"
                  onClick={onClose}
                  type="button"
                >
                  <Icon name="close" size={18} />
                </button>
              ) : null}
            </header>

            {description ? (
              <p className="pxs-dialog__description" id={descriptionId}>
                {description}
              </p>
            ) : null}

            {children ? <div className="pxs-dialog__body">{children}</div> : null}
            {footer ? <div className="pxs-dialog__footer">{footer}</div> : null}
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>,
    document.body
  );
}

export type ConfirmDialogProps = {
  open: boolean;
  locale: Locale;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** `danger` styles the confirm button as destructive. */
  intent?: PxsIntent;
  onConfirm: () => void;
  onCancel: () => void;
};

/**
 * Confirmation dialog for an action that cannot be undone.
 *
 * Nothing destructive is ever the default target: initial focus lands on the
 * header's Close button, and Cancel precedes Confirm in the footer. A
 * reflexive Enter or Space on a dialog the user has not read yet therefore
 * dismisses rather than confirms. The cost of an accidental cancel is one more
 * click; the cost of an accidental confirm is the thing itself.
 *
 * If the action *can* be undone, prefer doing it immediately and offering Undo
 * in a toast — a confirmation the user always clicks through is a tax, not a
 * safeguard.
 */
export function ConfirmDialog({
  open,
  locale,
  title,
  description,
  confirmLabel,
  cancelLabel,
  intent = "info",
  onConfirm,
  onCancel
}: ConfirmDialogProps) {
  const copy = getPxsCopy(locale);

  return (
    <Dialog
      intent={intent}
      locale={locale}
      onClose={onCancel}
      size="sm"
      title={title}
      {...(description ? { description } : {})}
      footer={
        <>
          <button className="pxs-btn pxs-btn--ghost" onClick={onCancel} type="button">
            {cancelLabel ?? copy.dialog.cancel}
          </button>
          <button
            className={`pxs-btn pxs-btn--solid${intent === "danger" ? " pxs-btn--danger" : ""}`}
            onClick={onConfirm}
            type="button"
          >
            {confirmLabel ??
              (intent === "danger" ? copy.dialog.confirmDestructive : copy.dialog.confirm)}
          </button>
        </>
      }
      open={open}
    />
  );
}
