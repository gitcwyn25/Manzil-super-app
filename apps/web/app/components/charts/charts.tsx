import type { ReactNode } from "react";

/**
 * Dependency-free SVG chart primitives for the analytics dashboards.
 *
 * No charting library: these render on the server with zero client JS, which
 * keeps them fast on the mobile connections most Manzil merchants use and keeps
 * them inside the app's strict CSP (no inline script, no CDN).
 *
 * Hover tooltips use native SVG `<title>` rather than a JS overlay — it works
 * without hydration, is exposed to screen readers, and cannot break the page.
 * Every chart is paired with a `<details>` table so no value is available only
 * through color or hover.
 *
 * Colors come from CSS custom properties defined in `charts.css`, validated
 * against the light and dark surfaces (see the ordinal blue ramp there).
 */

export type Point = { date: string; value: number | null };

const PAD = { top: 12, right: 12, bottom: 22, left: 34 };

function niceCeiling(max: number): number {
  if (max <= 0) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(max));
  const normalized = max / magnitude;
  const step = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  return step * magnitude;
}

function formatCompact(value: number): string {
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return String(value);
}

function formatDay(iso: string): string {
  const date = new Date(`${iso}T00:00:00Z`);
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", timeZone: "UTC" });
}

/* ------------------------------------------------------------------ */
/* Stat tile                                                           */
/* ------------------------------------------------------------------ */

export function StatTile({
  label,
  value,
  hint,
  valueClassName
}: {
  label: string;
  value: string;
  hint?: string;
  valueClassName?: string;
}) {
  return (
    <div className="mz-stat">
      <span className="mz-stat__label">{label}</span>
      {/* Proportional figures: tabular-nums makes a large standalone number
          look loose, and is reserved for aligned columns. `valueClassName`
          is opt-in so callers outside the workspace density layer are
          unaffected — the tile itself stays proportional by default. */}
      <strong className={valueClassName ? `mz-stat__value ${valueClassName}` : "mz-stat__value"}>
        {value}
      </strong>
      {hint ? <span className="mz-stat__hint">{hint}</span> : null}
    </div>
  );
}

export function StatRow({ children }: { children: ReactNode }) {
  return <div className="mz-statrow">{children}</div>;
}

/* ------------------------------------------------------------------ */
/* Line / area trend — single series                                   */
/* ------------------------------------------------------------------ */

/**
 * Single-series trend. No legend box: with one series the title already names
 * what is plotted, and a one-swatch legend just restates it.
 *
 * Only the final point is labelled — a value on every point is unreadable and
 * goes unread; the axis, tooltips, and table carry the rest.
 */
export function TrendChart({
  points,
  title,
  emptyLabel,
  valueSuffix = "",
  height = 180
}: {
  points: Point[];
  title: string;
  emptyLabel: string;
  valueSuffix?: string;
  height?: number;
}) {
  const width = 640;
  const plotWidth = width - PAD.left - PAD.right;
  const plotHeight = height - PAD.top - PAD.bottom;

  const values = points.map((p) => p.value).filter((v): v is number => v !== null);
  const hasData = values.length > 0 && values.some((v) => v > 0);

  if (points.length === 0 || !hasData) {
    return (
      <figure className="mz-chart">
        <figcaption className="mz-chart__title">{title}</figcaption>
        <p className="mz-chart__empty">{emptyLabel}</p>
      </figure>
    );
  }

  const maxValue = niceCeiling(Math.max(...values));
  const stepX = points.length > 1 ? plotWidth / (points.length - 1) : 0;

  const x = (index: number) => PAD.left + index * stepX;
  const y = (value: number) => PAD.top + plotHeight - (value / maxValue) * plotHeight;

  // Gaps (null values) break the line rather than being drawn as zero, which
  // would invent data that was never recorded.
  const segments: string[] = [];
  let current: string[] = [];

  points.forEach((point, index) => {
    if (point.value === null) {
      if (current.length > 0) segments.push(current.join(" "));
      current = [];
      return;
    }
    current.push(`${current.length === 0 ? "M" : "L"}${x(index)},${y(point.value)}`);
  });
  if (current.length > 0) segments.push(current.join(" "));

  const lastIndex = points.reduce((acc, p, i) => (p.value !== null ? i : acc), -1);
  const lastPoint = lastIndex >= 0 ? points[lastIndex] : null;

  // Area wash only when the series is contiguous — a fill under a broken line
  // implies continuity that the data does not have.
  const contiguous = segments.length === 1 && points.every((p) => p.value !== null);
  const areaPath = contiguous
    ? `${segments[0]} L${x(points.length - 1)},${PAD.top + plotHeight} L${x(0)},${PAD.top + plotHeight} Z`
    : null;

  const ticks = [0, 0.5, 1].map((fraction) => ({
    value: maxValue * fraction,
    y: PAD.top + plotHeight - fraction * plotHeight
  }));

  return (
    <figure className="mz-chart">
      <figcaption className="mz-chart__title">{title}</figcaption>

      <svg
        className="mz-chart__svg"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={title}
        preserveAspectRatio="none"
      >
        {ticks.map((tick) => (
          <g key={tick.value}>
            {/* Hairline, solid, recessive — never dashed. */}
            <line
              x1={PAD.left}
              x2={width - PAD.right}
              y1={tick.y}
              y2={tick.y}
              className="mz-grid"
            />
            <text x={PAD.left - 6} y={tick.y + 3} className="mz-axis mz-axis--y">
              {formatCompact(Math.round(tick.value))}
            </text>
          </g>
        ))}

        {areaPath ? <path d={areaPath} className="mz-area" /> : null}

        {segments.map((segment, index) => (
          <path key={index} d={segment} className="mz-line" />
        ))}

        {/* Invisible per-point hover bands: a bigger hit target than the 2px
            line, carrying a native tooltip with no client JS. */}
        {points.map((point, index) => (
          <rect
            key={point.date}
            x={x(index) - stepX / 2}
            y={PAD.top}
            width={Math.max(stepX, 6)}
            height={plotHeight}
            fill="transparent"
          >
            <title>{`${formatDay(point.date)}: ${point.value ?? "—"}${valueSuffix}`}</title>
          </rect>
        ))}

        {lastPoint && lastPoint.value !== null ? (
          <circle
            cx={x(lastIndex)}
            cy={y(lastPoint.value)}
            r={4}
            className="mz-dot"
          />
        ) : null}

        <text x={PAD.left} y={height - 6} className="mz-axis">
          {formatDay(points[0].date)}
        </text>
        <text x={width - PAD.right} y={height - 6} className="mz-axis mz-axis--end">
          {formatDay(points[points.length - 1].date)}
        </text>
      </svg>

      {/* Endpoint value as a direct label, outside the plot so it cannot clip. */}
      {lastPoint && lastPoint.value !== null ? (
        <p className="mz-chart__endlabel">
          {formatDay(lastPoint.date)}: <strong>{lastPoint.value}{valueSuffix}</strong>
        </p>
      ) : null}

      <ChartTable
        head={["Date", "Value"]}
        rows={points.map((p) => [formatDay(p.date), p.value === null ? "—" : `${p.value}${valueSuffix}`])}
      />
    </figure>
  );
}

/* ------------------------------------------------------------------ */
/* Horizontal ordinal bars                                             */
/* ------------------------------------------------------------------ */

export type BarDatum = { label: string; value: number; note?: string };

/**
 * Horizontal bars for ranked magnitude and ordered stages (the funnel).
 *
 * Horizontal because the labels are words ("photo_view", search queries in
 * Uzbek/Russian) — rotated column labels are unreadable.
 *
 * `ramp` walks the validated ordinal blue ramp so an ordered sequence reads as
 * ordered; ranked lists use a single step instead, because rank is not magnitude
 * and shading by position would imply a scale that isn't there.
 */
export function BarList({
  data,
  title,
  emptyLabel,
  ramp = false,
  valueSuffix = ""
}: {
  data: BarDatum[];
  title: string;
  emptyLabel: string;
  ramp?: boolean;
  valueSuffix?: string;
}) {
  if (data.length === 0 || data.every((d) => d.value === 0)) {
    return (
      <figure className="mz-chart">
        <figcaption className="mz-chart__title">{title}</figcaption>
        <p className="mz-chart__empty">{emptyLabel}</p>
      </figure>
    );
  }

  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <figure className="mz-chart">
      <figcaption className="mz-chart__title">{title}</figcaption>

      <ul className="mz-bars">
        {data.map((datum, index) => {
          const percent = (datum.value / max) * 100;
          // Ramp index is clamped to the 5 validated steps.
          const step = ramp ? Math.min(index, 4) : null;

          return (
            <li key={datum.label} className="mz-bars__row">
              <span className="mz-bars__label" title={datum.label}>
                {datum.label}
              </span>
              <span className="mz-bars__track">
                <span
                  className="mz-bars__fill"
                  data-step={step ?? undefined}
                  style={{ width: `${Math.max(percent, 1.5)}%` }}
                />
              </span>
              <span className="mz-bars__value">
                {datum.value}
                {valueSuffix}
                {datum.note ? <em className="mz-bars__note"> {datum.note}</em> : null}
              </span>
            </li>
          );
        })}
      </ul>

      <ChartTable
        head={["Item", "Value"]}
        rows={data.map((d) => [d.label, `${d.value}${valueSuffix}${d.note ? ` (${d.note})` : ""}`])}
      />
    </figure>
  );
}

/* ------------------------------------------------------------------ */
/* Table view — the non-visual channel                                 */
/* ------------------------------------------------------------------ */

/** Collapsed table behind every chart, so no value is locked behind color or hover. */
function ChartTable({ head, rows }: { head: string[]; rows: string[][] }) {
  return (
    <details className="mz-chart__table">
      <summary>View as table</summary>
      <table>
        <thead>
          <tr>
            {head.map((cell) => (
              <th key={cell} scope="col">
                {cell}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index}>
              {row.map((cell, cellIndex) => (
                <td key={cellIndex}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </details>
  );
}
