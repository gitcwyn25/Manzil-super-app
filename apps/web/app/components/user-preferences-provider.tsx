"use client";

import type { Locale } from "@manzil/shared";
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
import { getPxsCopy } from "../lib/pxs/copy";
import { useToast } from "./pxs/toast";

const STORAGE_KEY = "manzil-preferences-v1";

type StoredPreferences = {
  savedBusinessSlugs: string[];
  followedUserIds: string[];
  followedListSlugs: string[];
};

type UserPreferencesContextValue = {
  ready: boolean;
  savedBusinessSlugs: string[];
  followedUserIds: string[];
  followedListSlugs: string[];
  isSaved: (businessSlug: string) => boolean;
  isFollowingUser: (userId: string) => boolean;
  isFollowingList: (listSlug: string) => boolean;
  toggleSave: (businessSlug: string) => void;
  toggleFollowUser: (userId: string) => void;
  toggleFollowList: (listSlug: string) => void;
  /**
   * True while a toggle's write to `localStorage` has not been confirmed.
   *
   * Storage is fast enough that this is normally a single frame, but it is not
   * guaranteed to succeed — see `persist()` — so the state exists and the Save
   * control renders it rather than assuming.
   */
  persisting: boolean;
};

const UserPreferencesContext = createContext<UserPreferencesContextValue | null>(null);

function readStorage(): StoredPreferences {
  if (typeof window === "undefined") {
    return { savedBusinessSlugs: [], followedUserIds: [], followedListSlugs: [] };
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { savedBusinessSlugs: [], followedUserIds: [], followedListSlugs: [] };
    }

    return JSON.parse(raw) as StoredPreferences;
  } catch {
    return { savedBusinessSlugs: [], followedUserIds: [], followedListSlugs: [] };
  }
}

export function UserPreferencesProvider({
  children,
  locale,
  defaults
}: {
  children: ReactNode;
  locale: Locale;
  defaults?: Partial<StoredPreferences>;
}) {
  const copy = getPxsCopy(locale);
  const { toast } = useToast();
  const [ready, setReady] = useState(false);
  const [persisting, setPersisting] = useState(false);
  const [savedBusinessSlugs, setSavedBusinessSlugs] = useState<string[]>(defaults?.savedBusinessSlugs ?? []);
  const [followedUserIds, setFollowedUserIds] = useState<string[]>(defaults?.followedUserIds ?? []);
  const [followedListSlugs, setFollowedListSlugs] = useState<string[]>(defaults?.followedListSlugs ?? []);

  // Stored state wins unconditionally, including when it is empty.
  //
  // The previous version fell back to `defaults` whenever a stored list was
  // empty (`stored.x.length ? stored.x : defaults.x`), which meant a visitor
  // who un-saved everything got the seed data back on the next render — the
  // store could be added to but never cleared. `defaults` survives only as the
  // pre-hydration value; nothing passes it today (see locale-providers.tsx).
  useEffect(() => {
    const timer = window.setTimeout(() => {
      const stored = readStorage();
      setSavedBusinessSlugs(stored.savedBusinessSlugs ?? []);
      setFollowedUserIds(stored.followedUserIds ?? []);
      setFollowedListSlugs(stored.followedListSlugs ?? []);
      setReady(true);
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  // The last state known to be on disk. This is what an optimistic change
  // reverts *to*, so it is only advanced after a write actually succeeds.
  const committed = useRef<StoredPreferences>({
    savedBusinessSlugs: [],
    followedUserIds: [],
    followedListSlugs: []
  });

  useEffect(() => {
    if (ready) {
      committed.current = { savedBusinessSlugs, followedUserIds, followedListSlugs };
    }
    // Intentionally only on `ready`: this seeds the baseline from hydration.
    // Afterwards `persist()` owns it, advancing it only on a confirmed write.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  /**
   * Writes the store and reports whether it landed.
   *
   * `localStorage.setItem` is not the guaranteed operation it looks like. It
   * throws `QuotaExceededError` when the origin's quota is full, and Safari
   * throws for any write in Private Browsing. Both are ordinary user
   * conditions, not exotic failures.
   *
   * The previous version wrote inside a `useEffect` with no error handling, so
   * a throw was swallowed by React and the button kept its "Saved" label for a
   * change that reached no storage at all — the interface asserting an outcome
   * it had not observed, which is the same failure the trust audit removed from
   * the site's copy.
   */
  const persist = useCallback((next: StoredPreferences) => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    committed.current = next;
  }, []);

  /**
   * Optimistic toggle: apply instantly, revert on failure, surface the failure.
   *
   * This is the concrete case `useOptimisticValue` in `app/lib/pxs/` was
   * generalised from. It is inlined here rather than calling that hook because
   * three independent lists share one storage payload, so the commit is over
   * the whole object rather than over a single value.
   *
   * On failure the state goes back to the last confirmed-persisted snapshot —
   * not to "whatever it was a moment ago" — and the user is told, with a
   * specific reason. A silent revert would be worse than no optimism at all:
   * the user watches their change happen and then quietly un-happen.
   */
  const toggleItem = useCallback(
    (
      value: string,
      key: keyof StoredPreferences,
      setter: (next: string[]) => void,
      current: string[]
    ) => {
      const nextList = current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value];

      setter(nextList);
      setPersisting(true);

      try {
        persist({ ...committed.current, [key]: nextList });
      } catch {
        // Revert every list, since they share one payload and none of it landed.
        const rollback = committed.current;
        setSavedBusinessSlugs(rollback.savedBusinessSlugs);
        setFollowedUserIds(rollback.followedUserIds);
        setFollowedListSlugs(rollback.followedListSlugs);

        toast({
          intent: "danger",
          title: copy.optimistic.storageBlockedTitle,
          body: copy.optimistic.storageBlockedBody,
          // One card however many times the user retries — the cause does not
          // change between attempts.
          key: "preferences-storage-blocked"
        });
      } finally {
        setPersisting(false);
      }
    },
    [persist, toast, copy.optimistic.storageBlockedTitle, copy.optimistic.storageBlockedBody]
  );

  const value = useMemo<UserPreferencesContextValue>(
    () => ({
      ready,
      savedBusinessSlugs,
      followedUserIds,
      followedListSlugs,
      persisting,
      isSaved: (businessSlug) => savedBusinessSlugs.includes(businessSlug),
      isFollowingUser: (userId) => followedUserIds.includes(userId),
      isFollowingList: (listSlug) => followedListSlugs.includes(listSlug),
      toggleSave: (businessSlug) =>
        toggleItem(businessSlug, "savedBusinessSlugs", setSavedBusinessSlugs, savedBusinessSlugs),
      toggleFollowUser: (userId) =>
        toggleItem(userId, "followedUserIds", setFollowedUserIds, followedUserIds),
      toggleFollowList: (listSlug) =>
        toggleItem(listSlug, "followedListSlugs", setFollowedListSlugs, followedListSlugs)
    }),
    [ready, persisting, savedBusinessSlugs, followedUserIds, followedListSlugs, toggleItem]
  );

  return <UserPreferencesContext.Provider value={value}>{children}</UserPreferencesContext.Provider>;
}

export function useUserPreferences() {
  const context = useContext(UserPreferencesContext);
  if (!context) {
    throw new Error("useUserPreferences must be used within UserPreferencesProvider");
  }
  return context;
}
