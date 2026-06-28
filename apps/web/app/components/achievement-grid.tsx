"use client";

import type { Achievement, Locale } from "@manzil/shared";
import { getUiCopy } from "@manzil/shared";
import { pickLocalized } from "../lib/locale-text";

export function AchievementGrid({
  achievements,
  earnedSlugs,
  locale
}: {
  achievements: Achievement[];
  earnedSlugs: string[];
  locale: Locale;
}) {
  const copy = getUiCopy(locale);

  return (
    <div className="achievement-grid">
      {achievements.map((achievement) => {
        const earned = earnedSlugs.includes(achievement.slug);
        return (
          <article className={earned ? "achievement-card earned" : "achievement-card"} key={achievement.slug}>
            <span className="achievement-emoji" aria-hidden="true">{achievement.emoji}</span>
            <h3>{pickLocalized(achievement.name, locale)}</h3>
            <p>{pickLocalized(achievement.description, locale)}</p>
            <span className="achievement-status">{earned ? copy.profile.earned : copy.profile.locked}</span>
          </article>
        );
      })}
    </div>
  );
}
