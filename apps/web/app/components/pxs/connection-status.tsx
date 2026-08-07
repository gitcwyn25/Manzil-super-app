"use client";

import type { Locale } from "@manzil/shared";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { getPxsCopy } from "../../lib/pxs/copy";
import { useOnlineStatus } from "../../lib/pxs/use-online-status";
import { DUR, EASE_OUT } from "../motion/presets";
import { Icon } from "../vm/icons";
import { useAnnounce } from "./announcer";

/**
 * Offline / reconnect banner.
 *
 * Two states, both true when shown:
 *
 *   - **Offline** — the device reports no network. Pinned until connectivity
 *     returns, because the condition persists and a banner that self-dismisses
 *     would leave the user wondering why nothing loads.
 *   - **Back online** — shown briefly *only after* a real offline period, and
 *     it does not silently refetch anything. Server-rendered pages fetched
 *     their data before the drop, so the honest offer is "reload to get the
 *     latest", not a claim that the page has updated itself.
 *
 * On first paint nothing renders: `useOnlineStatus` reports online during SSR
 * (a page that was just delivered is evidence of a working connection), so
 * there is no offline banner flashing in the HTML of a successfully served
 * page.
 *
 * Both transitions are announced. Losing connectivity is announced
 * assertively — it changes what every control on the page will do.
 */
export function ConnectionBanner({ locale }: { locale: Locale }) {
  const copy = getPxsCopy(locale);
  const online = useOnlineStatus();
  const announce = useAnnounce();

  const [showRestored, setShowRestored] = useState(false);
  const wasOffline = useRef(false);

  /**
   * State is set from the browser's own `online`/`offline` events rather than
   * from an effect body reacting to `online`.
   *
   * Two reasons. It is where the transition genuinely happens — the event *is*
   * the connectivity change, whereas an effect only observes that a render
   * happened to have a different value. And setting state synchronously inside
   * an effect forces an extra render pass on every connectivity change, which
   * `react-hooks/set-state-in-effect` flags for exactly that reason.
   */
  useEffect(() => {
    const onOffline = () => {
      wasOffline.current = true;
      setShowRestored(false);
      announce(`${copy.connection.offlineTitle}. ${copy.connection.offlineBody}`, "assertive");
    };

    const onOnline = () => {
      // Only report a reconnection that actually followed a disconnection.
      if (!wasOffline.current) {
        return;
      }
      wasOffline.current = false;
      setShowRestored(true);
      announce(`${copy.connection.onlineTitle}. ${copy.connection.onlineBody}`, "polite");
    };

    window.addEventListener("offline", onOffline);
    window.addEventListener("online", onOnline);
    return () => {
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("online", onOnline);
    };
  }, [announce, copy.connection]);

  // Arriving on the page already offline fires no `offline` event, so the
  // transition handler above never runs. The banner still renders (the state
  // comes from `navigator.onLine`), but without this the fact would never be
  // announced. Runs once; `announce` is a call, not local state.
  useEffect(() => {
    if (!online) {
      wasOffline.current = true;
      announce(`${copy.connection.offlineTitle}. ${copy.connection.offlineBody}`, "assertive");
    }
    // Mount only — subsequent changes are the events' job.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-hides the "back online" note. The state change happens in the timeout
  // callback, not synchronously in the effect body.
  useEffect(() => {
    if (!showRestored) {
      return;
    }
    const id = window.setTimeout(() => setShowRestored(false), 8_000);
    return () => window.clearTimeout(id);
  }, [showRestored]);

  const visible = !online || showRestored;

  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          animate={{ y: 0, opacity: 1 }}
          className={`pxs-connection pxs-connection--${online ? "online" : "offline"}`}
          exit={{ y: -12, opacity: 0 }}
          initial={{ y: -12, opacity: 0 }}
          transition={{ duration: DUR.med, ease: EASE_OUT }}
        >
          <span aria-hidden="true" className="pxs-connection__icon">
            <Icon name={online ? "check_circle" : "alert_circle"} size={18} />
          </span>
          <span className="pxs-connection__text">
            <strong>{online ? copy.connection.onlineTitle : copy.connection.offlineTitle}</strong>
            <span>{online ? copy.connection.onlineBody : copy.connection.offlineBody}</span>
          </span>
          {online ? (
            <button
              className="pxs-connection__action"
              onClick={() => window.location.reload()}
              type="button"
            >
              {copy.connection.reload}
            </button>
          ) : null}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
