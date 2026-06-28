import type { BusinessInsight, Locale } from "@manzil/shared";
import { getUiCopy } from "@manzil/shared";
import { formatCount, pickLocalized } from "../lib/locale-text";

export function AiSummaryBlock({
  insight,
  locale
}: {
  insight: BusinessInsight;
  locale: Locale;
}) {
  const copy = getUiCopy(locale);

  return (
    <article className="ai-summary-block glass-panel">
      <p className="section-kicker">{copy.business.aiSummaryKicker}</p>
      <p className="ai-summary-text">{pickLocalized(insight.aiSummary, locale)}</p>
      <div className="social-proof-row">
        <span>{formatCount(insight.monthlyViews)} {copy.business.viewsPerMonth}</span>
        <span>{formatCount(insight.bookmarksToday)} {copy.business.bookmarksToday}</span>
        {insight.trendingRank ? (
          <span>#{insight.trendingRank} {copy.business.trending}</span>
        ) : null}
      </div>
    </article>
  );
}
