"use client";

import type { Locale } from "@manzil/shared";
import { AnimatePresence, motion } from "framer-motion";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode
} from "react";
import { createPortal } from "react-dom";
import { getPxsCopy } from "../../lib/pxs/copy";
import { useIsMounted } from "../../lib/pxs/use-is-mounted";
import {
  TOAST_DURATION,
  TOAST_VISIBLE_LIMIT,
  type PxsIntent,
  type PxsToast,
  type PxsToastInput
} from "../../lib/pxs/types";
import { DUR, EASE_OUT } from "../motion/presets";
import { Icon, type IconName } from "../vm/icons";
import { useAnnounce } from "./announcer";

type ToastContextValue = {
  /** Raises a toast and returns its id, so the caller can dismiss it early. */
  toast: (input: PxsToastInput) => string;
  dismiss: (id: string) => void;
  dismissAll: () => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const INTENT_ICON: Record<PxsIntent, IconName> = {
  info: "help_circle",
  success: "check_circle",
  warning: "alert_circle",
  danger: "alert_circle"
};

let sequence = 0;
function nextId(): string {
  sequence += 1;
  return `pxs-toast-${sequence}`;
}

function dedupeKey(input: PxsToastInput): string {
  return input.key ?? `${input.intent ?? "info"}::${input.title}::${input.body ?? ""}`;
}

/**
 * The notification system.
 *
 * Behaviour that is deliberate rather than incidental:
 *
 * **Dedupe.** Two toasts with the same key never stack — the second refreshes
 * the first and bumps a repeat counter. Without this, a failing request behind
 * a retry loop produces a column of identical red cards that buries everything
 * else on screen, and the user learns to ignore toasts entirely.
 *
 * **Queue.** At most `TOAST_VISIBLE_LIMIT` are shown; the rest wait in order
 * and promote as slots free. A toast the user cannot read is not a
 * notification.
 *
 * **`danger` does not auto-dismiss.** A failure that vanishes after four
 * seconds is a failure the user will meet again later with less context.
 * Everything else clears itself.
 *
 * **Timers pause on hover and on focus.** A toast carrying an Undo button must
 * not expire while the user is reaching for it, and a keyboard user tabbing
 * into it must not have it disappear mid-tab.
 *
 * **Announcement is separate from rendering.** The viewport is *not* a live
 * region; announcements go through `AnnouncerProvider` instead. Doing both
 * would make every toast speak twice, which is the most common defect in
 * hand-rolled toast systems.
 */
export function ToastProvider({ children, locale }: { children: ReactNode; locale: Locale }) {
  const copy = getPxsCopy(locale);
  const announce = useAnnounce();

  const [toasts, setToasts] = useState<PxsToast[]>([]);
  const [paused, setPaused] = useState(false);
  const mounted = useIsMounted();

  const dismiss = useCallback((id: string) => {
    setToasts((current) => current.filter((entry) => entry.id !== id));
  }, []);

  const dismissAll = useCallback(() => setToasts([]), []);

  const toast = useCallback(
    (input: PxsToastInput) => {
      const intent = input.intent ?? "info";
      const key = dedupeKey(input);
      const duration = input.duration ?? TOAST_DURATION[intent];
      const politeness = input.politeness ?? (intent === "danger" ? "assertive" : "polite");

      let id = "";

      setToasts((current) => {
        const existing = current.find((entry) => entry.key === key);

        if (existing) {
          id = existing.id;
          // Refresh in place: new content, repeat count up, timer restarted by
          // the changed `repeats` value flowing into the item's effect.
          return current.map((entry) =>
            entry.id === existing.id
              ? { ...entry, ...input, intent, duration, key, repeats: entry.repeats + 1 }
              : entry
          );
        }

        id = nextId();
        return [...current, { ...input, id, key, intent, duration, repeats: 1 }];
      });

      // Announced regardless of queue position: a queued toast the user cannot
      // see yet is exactly the one a screen-reader user most needs told about.
      announce(input.body ? `${input.title}. ${input.body}` : input.title, politeness);

      return id;
    },
    [announce]
  );

  const value = useMemo<ToastContextValue>(
    () => ({ toast, dismiss, dismissAll }),
    [toast, dismiss, dismissAll]
  );

  const visible = toasts.slice(0, TOAST_VISIBLE_LIMIT);

  const viewport = (
    <section
      aria-label={copy.toast.regionLabel}
      className="pxs-toast-viewport"
      onBlur={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      role="region"
    >
      <AnimatePresence initial={false}>
        {visible.map((entry) => (
          <ToastCard
            copy={copy}
            key={entry.id}
            onDismiss={() => dismiss(entry.id)}
            paused={paused}
            toast={entry}
          />
        ))}
      </AnimatePresence>
    </section>
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      {mounted ? createPortal(viewport, document.body) : null}
    </ToastContext.Provider>
  );
}

function ToastCard({
  copy,
  onDismiss,
  paused,
  toast
}: {
  copy: ReturnType<typeof getPxsCopy>;
  onDismiss: () => void;
  paused: boolean;
  toast: PxsToast;
}) {
  // Refreshed in an effect, not during render. The only reader is the
  // auto-dismiss timeout, which fires long after the commit phase.
  const dismissRef = useRef(onDismiss);

  useEffect(() => {
    dismissRef.current = onDismiss;
  });

  // `repeats` is in the dependency list on purpose: a re-raised duplicate must
  // restart its own countdown rather than expire on the original schedule.
  useEffect(() => {
    if (toast.duration <= 0 || paused) {
      return;
    }
    const id = window.setTimeout(() => dismissRef.current(), toast.duration);
    return () => window.clearTimeout(id);
  }, [toast.duration, toast.repeats, paused]);

  return (
    // A plain <div>, deliberately: <output> and role="status" both create an
    // implicit live region, which would announce every toast a second time on
    // top of the AnnouncerProvider announcement.
    <motion.div
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={`pxs-toast pxs-toast--${toast.intent}`}
      data-intent={toast.intent}
      exit={{ opacity: 0, y: -8, scale: 0.97 }}
      initial={{ opacity: 0, y: 16, scale: 0.97 }}
      transition={{ duration: DUR.med, ease: EASE_OUT }}
    >
      <span aria-hidden="true" className="pxs-toast__icon">
        <Icon name={INTENT_ICON[toast.intent]} size={18} />
      </span>

      <div className="pxs-toast__content">
        <p className="pxs-toast__title">
          {toast.title}
          {toast.repeats > 1 ? (
            <span className="pxs-toast__repeat">{copy.toast.repeat(toast.repeats)}</span>
          ) : null}
        </p>
        {toast.body ? <p className="pxs-toast__body">{toast.body}</p> : null}
        {toast.action ? (
          <button
            className="pxs-toast__action"
            onClick={() => {
              toast.action?.onClick();
              if (!toast.action?.keepOpen) {
                onDismiss();
              }
            }}
            type="button"
          >
            {toast.action.label}
          </button>
        ) : null}
      </div>

      <button
        aria-label={copy.toast.dismiss}
        className="pxs-toast__close"
        onClick={onDismiss}
        type="button"
      >
        <Icon name="close" size={16} />
      </button>
    </motion.div>
  );
}

/**
 * Raise notifications from any client component below `PxsProvider`.
 *
 * Falls back to no-ops outside the provider so a component rendered in
 * isolation degrades to silence rather than crashing the tree.
 */
export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  const noop = useMemo<ToastContextValue>(
    () => ({ toast: () => "", dismiss: () => {}, dismissAll: () => {} }),
    []
  );
  return context ?? noop;
}
