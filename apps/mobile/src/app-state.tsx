import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getUserProfile } from '@manzil/shared';
import type { Review } from '@manzil/shared';

type DraftReview = {
  businessSlug: string;
  rating: number;
  text: string;
  tags: string[];
};

type AppState = {
  savedSlugs: string[];
  isSaved: (slug: string) => boolean;
  toggleSaved: (slug: string) => void;
  submittedReviews: Review[];
  submitReview: (review: DraftReview) => void;
  hasCompletedOnboarding: boolean;
  completeOnboarding: () => void;
};

const SAVED_STORAGE_KEY = 'manzil.saved.v1';
const ONBOARDING_STORAGE_KEY = 'manzil.onboarding.v1';
const StateContext = createContext<AppState | null>(null);

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const profile = getUserProfile();
  const [savedSlugs, setSavedSlugs] = useState<string[]>(profile.defaultSavedSlugs);
  const [submittedReviews, setSubmittedReviews] = useState<Review[]>([]);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.all([
      AsyncStorage.getItem(SAVED_STORAGE_KEY),
      AsyncStorage.getItem(ONBOARDING_STORAGE_KEY)
    ])
      .then(([savedRaw, onboardingRaw]) => {
        if (!active) return;
        if (savedRaw) {
          const parsed = JSON.parse(savedRaw);
          if (Array.isArray(parsed) && parsed.every((item) => typeof item === 'string')) {
            setSavedSlugs(parsed);
          }
        }
        if (onboardingRaw === 'complete') setHasCompletedOnboarding(true);
      })
      .catch(() => undefined)
      .finally(() => {
        if (active) setHydrated(true);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    AsyncStorage.setItem(SAVED_STORAGE_KEY, JSON.stringify(savedSlugs)).catch(() => undefined);
  }, [hydrated, savedSlugs]);

  const value = useMemo<AppState>(
    () => ({
      savedSlugs,
      isSaved: (slug) => savedSlugs.includes(slug),
      toggleSaved: (slug) => {
        setSavedSlugs((current) =>
          current.includes(slug) ? current.filter((item) => item !== slug) : [slug, ...current]
        );
      },
      submittedReviews,
      submitReview: (review) => {
        setSubmittedReviews((current) => [
          {
            id: `local-${Date.now()}`,
            businessSlug: review.businessSlug,
            authorName: profile.displayName,
            authorBadge: 'Yangi sharh',
            rating: review.rating,
            text: `${review.text}${review.tags.length ? `\n\n${review.tags.join(' · ')}` : ''}`,
            locale: profile.locale,
            createdAt: new Date().toISOString(),
            helpfulCount: 0
          },
          ...current
        ]);
      },
      hasCompletedOnboarding,
      completeOnboarding: () => {
        setHasCompletedOnboarding(true);
        AsyncStorage.setItem(ONBOARDING_STORAGE_KEY, 'complete').catch(() => undefined);
      }
    }),
    [hasCompletedOnboarding, profile.displayName, profile.locale, savedSlugs, submittedReviews]
  );

  return <StateContext.Provider value={value}>{children}</StateContext.Provider>;
}

export function useAppState() {
  const state = useContext(StateContext);
  if (!state) {
    throw new Error('useAppState must be used inside AppStateProvider');
  }
  return state;
}
