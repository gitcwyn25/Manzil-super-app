import type { LiveStatus, Locale } from "@manzil/shared";
import { pickLocalized } from "../lib/locale-text";

const levelClass: Record<LiveStatus["level"], string> = {
  quiet: "live-quiet",
  moderate: "live-moderate",
  busy: "live-busy",
  unknown: "live-unknown"
};

export function LiveStatusPill({
  status,
  locale,
  compact = false
}: {
  status: LiveStatus;
  locale: Locale;
  compact?: boolean;
}) {
  return (
    <div className={`live-status-pill ${levelClass[status.level]}${compact ? " compact" : ""}`}>
      <span className="live-dot" aria-hidden="true" />
      <span>{pickLocalized(status.label, locale)}</span>
      {status.waitMinutes !== undefined && status.waitMinutes > 0 ? (
        <span className="live-meta">~{status.waitMinutes} min</span>
      ) : null}
    </div>
  );
}

export function LiveStatusDetails({ status, locale }: { status: LiveStatus; locale: Locale }) {
  const noise =
    status.noiseLevel === "low"
      ? { uz: "Past shovqin", ru: "Тихо", en: "Low noise" }
      : status.noiseLevel === "medium"
        ? { uz: "O'rtacha shovqin", ru: "Умеренно", en: "Medium noise" }
        : status.noiseLevel === "high"
          ? { uz: "Baland shovqin", ru: "Шумно", en: "High noise" }
          : undefined;

  const parking =
    status.parking === "available"
      ? { uz: "Avtoturargoh bor", ru: "Есть парковка", en: "Parking available" }
      : status.parking === "limited"
        ? { uz: "Cheklangan joy", ru: "Мало мест", en: "Limited parking" }
        : status.parking === "none"
          ? { uz: "Avtoturargoh yo'q", ru: "Нет парковки", en: "No parking" }
          : undefined;

  return (
    <div className="live-status-grid">
      <LiveStatusPill locale={locale} status={status} />
      {noise ? <span className="live-detail">{pickLocalized(noise, locale)}</span> : null}
      {parking ? <span className="live-detail">{pickLocalized(parking, locale)}</span> : null}
    </div>
  );
}
