import type { ReactNode } from "react";

/**
 * SVG chart primitives for the admin console.
 *
 * Same method as the merchant dashboard (no charting library, server-rendered,
 * native `<title>` tooltips, a table view behind every chart), styled with the
 * console's Tailwind tokens instead of its own CSS file.
 *
 * The blue ordinal ramp is the validated one — monotone lightness, single hue,
 * light end clearing 2:1 on both surfaces. Do not re-step it by eye.
 */

/** Ordinal ramp, light: blue 250→650. */
const RAMP = ["#86b6ef", "#5598e7", "#2a78d6", "#1c5cab", "#104281"];
const SERIES = "#2a78d6";

function formatDay(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    timeZone: "UTC"
  });
}

function niceCeiling(max: number): number {
  if (max <= 0) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(max));
  const normalized = max / magnitude;
  const step = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  return step * magnitude;
}

export function Card({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <section className="card p-5">
      <h2 className="text-sm font-semibold">{title}</h2>
      {subtitle ? <p className="mt-0.5 text-xs text-muted">{subtitle}</p> : null}
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function Empty({ label }: { label: string }) {
  return <p className="py-8 text-center text-sm text-muted">{label}</p>;
}

/** Single series: no legend box — the card title already names what is plotted. */
export function Trend({ points, emptyLabel }: { points: Array<{ date: string; value: number }>; emptyLabel: string }) {
  const width = 640;
  const height = 160;
  const pad = { top: 10, right: 10, bottom: 20, left: 32 };
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;

  if (points.length === 0 || points.every((p) => p.value === 0)) {
    return <Empty label={emptyLabel} />;
  }

  const max = niceCeiling(Math.max(...points.map((p) => p.value)));
  const stepX = points.length > 1 ? plotW / (points.length - 1) : 0;
  const x = (i: number) => pad.left + i * stepX;
  const y = (v: number) => pad.top + plotH - (v / max) * plotH;

  const line = points.map((p, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(p.value)}`).join(" ");
  const area = `${line} L${x(points.length - 1)},${pad.top + plotH} L${x(0)},${pad.top + plotH} Z`;
  const last = points[points.length - 1];

  return (
    <>
      <svg viewBox={`0 0 ${width} ${height}`} className="block h-auto w-full" role="img" aria-label="Trend">
        {[0, 0.5, 1].map((f) => (
          <g key={f}>
            <line
              x1={pad.left}
              x2={width - pad.right}
              y1={pad.top + plotH - f * plotH}
              y2={pad.top + plotH - f * plotH}
              stroke="currentColor"
              strokeWidth={1}
              className="text-border"
            />
            <text
              x={pad.left - 6}
              y={pad.top + plotH - f * plotH + 3}
              textAnchor="end"
              className="fill-muted text-[10px] tabular-nums"
            >
              {Math.round(max * f)}
            </text>
          </g>
        ))}

        <path d={area} fill={SERIES} opacity={0.1} />
        <path d={line} fill="none" stroke={SERIES} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />

        {points.map((p, i) => (
          <rect
            key={p.date}
            x={x(i) - stepX / 2}
            y={pad.top}
            width={Math.max(stepX, 6)}
            height={plotH}
            fill="transparent"
          >
            <title>{`${formatDay(p.date)}: ${p.value}`}</title>
          </rect>
        ))}

        {/* End marker with a 2px surface ring so it reads over the line. */}
        <circle cx={x(points.length - 1)} cy={y(last.value)} r={4} fill={SERIES} stroke="var(--panel, #fff)" strokeWidth={2} />

        <text x={pad.left} y={height - 4} className="fill-muted text-[10px]">
          {formatDay(points[0].date)}
        </text>
        <text x={width - pad.right} y={height - 4} textAnchor="end" className="fill-muted text-[10px]">
          {formatDay(last.date)}
        </text>
      </svg>
      <p className="mt-1 text-xs text-muted">
        {formatDay(last.date)}: <span className="font-semibold text-fg tabular-nums">{last.value}</span>
      </p>
    </>
  );
}

/**
 * Horizontal ranked/ordered bars.
 *
 * Horizontal because the labels are words — search queries in Uzbek and
 * Russian, status names — and rotated column labels are unreadable.
 */
export function Bars({
  data,
  emptyLabel,
  ramp = false
}: {
  data: Array<{ label: string; value: number }>;
  emptyLabel: string;
  ramp?: boolean;
}) {
  if (data.length === 0 || data.every((d) => d.value === 0)) {
    return <Empty label={emptyLabel} />;
  }

  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <>
      <ul className="flex flex-col gap-2">
        {data.map((d, i) => (
          <li key={d.label} className="grid grid-cols-[minmax(90px,30%)_1fr_auto] items-center gap-3">
            <span className="truncate text-xs text-muted" title={d.label}>
              {d.label}
            </span>
            {/* 20px track: under the 24px cap, leftover row space stays as air. */}
            <span className="block h-5 rounded-sm bg-panel-2">
              <span
                className="block h-full rounded-r"
                style={{
                  width: `${Math.max((d.value / max) * 100, 1.5)}%`,
                  background: ramp ? RAMP[Math.min(i, RAMP.length - 1)] : SERIES
                }}
              />
            </span>
            <span className="text-xs font-semibold tabular-nums">{d.value}</span>
          </li>
        ))}
      </ul>

      <details className="mt-3 text-xs">
        <summary className="cursor-pointer text-muted">View as table</summary>
        <table className="mt-2 w-full">
          <thead>
            <tr>
              <th scope="col" className="border-b border-border py-1 text-left font-medium text-muted">
                Item
              </th>
              <th scope="col" className="border-b border-border py-1 text-right font-medium text-muted">
                Count
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map((d) => (
              <tr key={d.label}>
                <td className="border-b border-border py-1">{d.label}</td>
                <td className="border-b border-border py-1 text-right tabular-nums">{d.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </>
  );
}
