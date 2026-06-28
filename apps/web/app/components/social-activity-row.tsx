import type { Locale, SocialActivity } from "@manzil/shared";
import { pickLocalized } from "../lib/locale-text";

export function SocialActivityRow({
  activity,
  locale,
  businessName
}: {
  activity: SocialActivity;
  locale: Locale;
  businessName: string;
}) {
  return (
    <article className="social-activity-row">
      <div className="social-avatar" aria-hidden="true">
        {activity.actorName.charAt(0)}
      </div>
      <div>
        <p>
          <strong>{activity.actorName}</strong> {pickLocalized(activity.action, locale)}
        </p>
        <a href={`/${locale}/businesses/${activity.businessSlug}`}>{businessName}</a>
        {activity.rating ? <span className="social-rating">{activity.rating}★</span> : null}
      </div>
    </article>
  );
}
