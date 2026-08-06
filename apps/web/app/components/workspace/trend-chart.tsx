type TrendPoint = {
  date: string;
  value: number;
};

/**
 * Server-rendered SVG line/area chart for the workspace "Business Health"
 * card (upgrade of the .crm-chart CSS bar chart). Pure and honest: it draws
 * exactly the {date,value}[] series it is given — one series, no invented
 * comparison line (the mock's revenue-vs-costs framing has no costs data).
 *
 * The SVG stretches with preserveAspectRatio="none"; strokes keep their
 * width via vector-effect. Dot markers from the mock are dropped — circles
 * distort under non-uniform scaling. No JS, no animation: the chart is a
 * static picture, fully visible without hydration.
 */
export function TrendChart({
  points,
  ariaLabel,
  emptyLabel,
  axisStart,
  axisEnd
}: {
  points: TrendPoint[];
  ariaLabel: string;
  emptyLabel: string;
  /** Left / right x-axis captions (localized range boundary dates). */
  axisStart?: string;
  axisEnd?: string;
}) {
  const hasData = points.length > 0 && points.some((point) => point.value > 0);

  if (!hasData) {
    return <div className="ws-chart-empty">{emptyLabel}</div>;
  }

  // y: value 0 rests at 38, the peak at 4 (viewBox is 100x40).
  const max = Math.max(...points.map((point) => point.value), 1);
  const plotted = points.length === 1 ? [points[0], points[0]] : points;
  const coords = plotted.map((point, index) => ({
    x: (index / (plotted.length - 1)) * 100,
    y: 38 - (point.value / max) * 34
  }));

  const line = coords
    .map((c, index) => `${index === 0 ? "M" : "L"}${c.x.toFixed(2)},${c.y.toFixed(2)}`)
    .join(" ");
  const area = `${line} L100,40 L0,40 Z`;

  return (
    <>
      <div aria-label={ariaLabel} className="ws-chart" role="img">
        <svg
          aria-hidden="true"
          className="ws-chart__svg"
          focusable="false"
          preserveAspectRatio="none"
          viewBox="0 0 100 40"
        >
          <defs>
            <linearGradient id="ws-chart-fill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopOpacity=".22" style={{ stopColor: "var(--bs-primary)" }} />
              <stop offset="1" stopOpacity="0" style={{ stopColor: "var(--bs-primary)" }} />
            </linearGradient>
          </defs>
          {[13, 22, 31].map((y) => (
            <line
              key={y}
              strokeOpacity=".35"
              strokeWidth="1"
              style={{ stroke: "var(--vm-outline-variant)" }}
              vectorEffect="non-scaling-stroke"
              x1="0"
              x2="100"
              y1={y}
              y2={y}
            />
          ))}
          <path d={area} fill="url(#ws-chart-fill)" />
          <path
            d={line}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            style={{ stroke: "var(--bs-primary)" }}
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      </div>
      {axisStart || axisEnd ? (
        <div aria-hidden="true" className="ws-chart__axis">
          <span>{axisStart}</span>
          <span>{axisEnd}</span>
        </div>
      ) : null}
    </>
  );
}
