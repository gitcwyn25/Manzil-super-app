import type { Locale, QualityScore } from "@manzil/shared";
import { getUiCopy } from "@manzil/shared";

const metricKeys: Array<keyof Omit<QualityScore, "overall">> = [
  "reviewQuality",
  "freshness",
  "popularity",
  "returnVisitors",
  "responseSpeed",
  "photoQuality"
];

export function QualityScoreCard({ score, locale }: { score: QualityScore; locale: Locale }) {
  const copy = getUiCopy(locale);

  return (
    <div className="quality-score-card glass-panel">
      <div className="quality-score-head">
        <div>
          <p className="section-kicker">{copy.business.qualityKicker}</p>
          <strong className="quality-overall">{score.overall}</strong>
        </div>
        <p className="quality-note">{copy.business.qualityNote}</p>
      </div>
      <div className="quality-bars">
        {metricKeys.map((key) => (
          <div className="quality-bar-row" key={key}>
            <span>{copy.business.qualityMetrics[key]}</span>
            <div className="quality-bar-track">
              <div className="quality-bar-fill" style={{ width: `${score[key]}%` }} />
            </div>
            <strong>{score[key]}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

export function QualityScoreCompact({ score, locale }: { score: QualityScore; locale: Locale }) {
  const copy = getUiCopy(locale);

  return (
    <span className="quality-compact">
      {copy.business.qualityKicker} <strong>{score.overall}</strong>
    </span>
  );
}
