"use client";

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

type Politeness = "polite" | "assertive";

type AnnouncerContextValue = {
  /**
   * Speaks `message` through the shared live region.
   *
   * `assertive` interrupts whatever the screen reader is saying — reserve it
   * for failures and for state the user must act on. Confirmations, counts and
   * status changes are `polite`.
   */
  announce: (message: string, politeness?: Politeness) => void;
};

const AnnouncerContext = createContext<AnnouncerContextValue | null>(null);

/**
 * The application's single pair of ARIA live regions.
 *
 * One pair, mounted once, is the design. Live regions must exist in the DOM
 * *before* their content changes for assistive technology to notice the
 * mutation, so components that mount a live region at the same moment they
 * fill it announce nothing at all. Routing every announcement through a region
 * that has been present since the app booted removes that whole class of bug.
 *
 * Two implementation details that look odd and are both load-bearing:
 *
 *   1. **The message is cleared and re-set.** Setting a live region to the
 *      string it already contains is not a mutation, so an identical repeat
 *      announcement ("Saved", "Saved") would be silent. A microtask-separated
 *      clear guarantees the second one is heard.
 *   2. **The regions are visually hidden, not `display: none`.** A region that
 *      is not rendered is not announced. `.pxs-sr-only` clips it instead.
 */
export function AnnouncerProvider({ children }: { children: ReactNode }) {
  const [polite, setPolite] = useState("");
  const [assertive, setAssertive] = useState("");
  const timers = useRef<number[]>([]);

  useEffect(() => {
    const pending = timers.current;
    return () => {
      for (const id of pending) {
        window.clearTimeout(id);
      }
    };
  }, []);

  const announce = useCallback((message: string, politeness: Politeness = "polite") => {
    const text = message.trim();
    if (!text) {
      return;
    }

    const setter = politeness === "assertive" ? setAssertive : setPolite;
    setter("");

    const id = window.setTimeout(() => {
      setter(text);
      timers.current = timers.current.filter((entry) => entry !== id);
    }, 60);

    timers.current.push(id);
  }, []);

  const value = useMemo<AnnouncerContextValue>(() => ({ announce }), [announce]);

  return (
    <AnnouncerContext.Provider value={value}>
      {children}
      <div aria-atomic="true" aria-live="polite" className="pxs-sr-only" role="status">
        {polite}
      </div>
      <div aria-atomic="true" aria-live="assertive" className="pxs-sr-only" role="alert">
        {assertive}
      </div>
    </AnnouncerContext.Provider>
  );
}

/**
 * Announcement channel for assistive technology.
 *
 * Returns a no-op outside the provider rather than throwing. A missing
 * announcement degrades the experience for some users; a thrown error removes
 * the feature for all of them, and this hook is called from leaf components
 * that may legitimately render in isolation (an error boundary's fallback, for
 * instance, whose whole job is to survive a broken tree).
 */
export function useAnnounce(): (message: string, politeness?: Politeness) => void {
  const context = useContext(AnnouncerContext);
  const fallback = useCallback(() => {}, []);
  return context?.announce ?? fallback;
}
