import React, { createContext, useContext, useMemo, useState } from 'react';
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
};

const StateContext = createContext<AppState | null>(null);

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const profile = getUserProfile();
  const [savedSlugs, setSavedSlugs] = useState<string[]>(profile.defaultSavedSlugs);
  const [submittedReviews, setSubmittedReviews] = useState<Review[]>([]);

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
      }
    }),
    [profile.displayName, profile.locale, savedSlugs, submittedReviews]
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
