"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from "react";

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
  defaults
}: {
  children: ReactNode;
  defaults?: Partial<StoredPreferences>;
}) {
  const [ready, setReady] = useState(false);
  const [savedBusinessSlugs, setSavedBusinessSlugs] = useState<string[]>(defaults?.savedBusinessSlugs ?? []);
  const [followedUserIds, setFollowedUserIds] = useState<string[]>(defaults?.followedUserIds ?? []);
  const [followedListSlugs, setFollowedListSlugs] = useState<string[]>(defaults?.followedListSlugs ?? []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const stored = readStorage();
      setSavedBusinessSlugs(stored.savedBusinessSlugs.length ? stored.savedBusinessSlugs : defaults?.savedBusinessSlugs ?? []);
      setFollowedUserIds(stored.followedUserIds.length ? stored.followedUserIds : defaults?.followedUserIds ?? []);
      setFollowedListSlugs(stored.followedListSlugs.length ? stored.followedListSlugs : defaults?.followedListSlugs ?? []);
      setReady(true);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [defaults?.followedListSlugs, defaults?.followedUserIds, defaults?.savedBusinessSlugs]);

  useEffect(() => {
    if (!ready) {
      return;
    }

    const payload: StoredPreferences = {
      savedBusinessSlugs,
      followedUserIds,
      followedListSlugs
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [ready, savedBusinessSlugs, followedUserIds, followedListSlugs]);

  const toggleItem = useCallback((value: string, setter: (next: string[]) => void, current: string[]) => {
    setter(current.includes(value) ? current.filter((item) => item !== value) : [...current, value]);
  }, []);

  const value = useMemo<UserPreferencesContextValue>(
    () => ({
      ready,
      savedBusinessSlugs,
      followedUserIds,
      followedListSlugs,
      isSaved: (businessSlug) => savedBusinessSlugs.includes(businessSlug),
      isFollowingUser: (userId) => followedUserIds.includes(userId),
      isFollowingList: (listSlug) => followedListSlugs.includes(listSlug),
      toggleSave: (businessSlug) => toggleItem(businessSlug, setSavedBusinessSlugs, savedBusinessSlugs),
      toggleFollowUser: (userId) => toggleItem(userId, setFollowedUserIds, followedUserIds),
      toggleFollowList: (listSlug) => toggleItem(listSlug, setFollowedListSlugs, followedListSlugs)
    }),
    [ready, savedBusinessSlugs, followedUserIds, followedListSlugs, toggleItem]
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
