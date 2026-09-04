import type { ReactNode } from "react";
import { Card as UiCard, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * Small server-rendered chart primitives for the operations console.
 * Every visual has an accessible label and a table view behind it.
 */
const RAMP = ["#a7f3d0", "#6ee7c2", "#38c9a5", "#15977f", "#00665f"];
const SERIES = "#00706B";

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
    <UiCard>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {subtitle ? <p className="text-xs leading-5 text-muted">{subtitle}</p> : null}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </UiCard>
  );
}

export function Empty({ label }: { label: string }) {
  return <p className="py-8 text-center text-sm text-muted">{label}</p>;
}

export function Trend({ points, emptyLabel }: { points: Array<{ date: string; value: number }>; emptyLabel: string }) {
  const width = 640;
  const height = 160;
  const pad = { top: 10, right: 10, bottom: 20, left: 32 };
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;

  if (points.length === 0 || points.every((point) => point.value === 0)) return <Empty label={emptyLabel} />;

  const max = niceCeiling(Math.max(...points.map((point) => point.value)));
  const stepX = points.length > 1 ? plotW / (points.length - 1) : 0;
  const x = (index: number) => pad.left + index * stepX;
  const y = (value: number) => pad.top + plotH - (value / max) * plotH;
  const line = points.map((point, index) => `${index === 0 ? "M" : "L"}${x(index)},${y(point.value)}`).join(" ");
  const area = `${line} L${x(points.length - 1)},${pad.top + plotH} L${x(0)},${pad.top + plotH} Z`;
  const last = points[points.length - 1];

  return (
    <>
      <svg viewBox={`0 0 ${width} ${height}`} className="block h-auto w-full" role="img" aria-label="Trend">
        {[0, 0.5, 1].map((fraction) => (
          <g key={fraction}>
            <line x1={pad.left} x2={width - pad.right} y1={pad.top + plotH - fraction * plotH} y2={pad.top + plotH - fraction * plotH} stroke="currentColor" strokeWidth={1} className="text-border" />
            <text x={pad.left - 6} y={pad.top + plotH - fraction * plotH + 3} textAnchor="end" className="fill-muted text-[10px] tabular-nums">{Math.round(max * fraction)}</text>
          </g>
        ))}
        <path d={area} fill={SERIES} opacity={0.1} />
        <path d={line} fill="none" stroke={SERIES} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        {points.map((point, index) => (
          <rect key={point.date} x={x(index) - stepX / 2} y={pad.top} width={Math.max(stepX, 6)} height={plotH} fill="transparent">
            <title>{`${formatDay(point.date)}: ${point.value}`}</title>
          </rect>
        ))}
        <circle cx={x(points.length - 1)} cy={y(last.value)} r={4} fill={SERIES} stroke="var(--panel, #fff)" strokeWidth={2} />
        <text x={pad.left} y={height - 4} className="fill-muted text-[10px]">{formatDay(points[0].date)}</text>
        <text x={width - pad.right} y={height - 4} textAnchor="end" className="fill-muted text-[10px]">{formatDay(last.date)}</text>
      </svg>
      <p className="mt-1 text-xs text-muted">{formatDay(last.date)}: <span className="font-semibold text-fg tabular-nums">{last.value}</span></p>
    </>
  );
}

export function Bars({ data, emptyLabel, ramp = false }: { data: Array<{ label: string; value: number }>; emptyLabel: string; ramp?: boolean }) {
  if (data.length === 0 || data.every((item) => item.value === 0)) return <Empty label={emptyLabel} />;
  const max = Math.max(...data.map((item) => item.value), 1);

  return (
    <>
      <ul className="flex flex-col gap-2">
        {data.map((item, index) => (
          <li key={item.label} className="grid grid-cols-[minmax(90px,30%)_1fr_auto] items-center gap-3">
            <span className="truncate text-xs text-muted" title={item.label}>{item.label}</span>
            <span className="block h-5 rounded-sm bg-background"><span className="block h-full rounded-r" style={{ width: `${Math.max((item.value / max) * 100, 1.5)}%`, background: ramp ? RAMP[Math.min(index, RAMP.length - 1)] : SERIES }} /></span>
            <span className="text-xs font-semibold tabular-nums">{item.value}</span>
          </li>
        ))}
      </ul>
      <details className="mt-3 text-xs">
        <summary className="cursor-pointer text-muted">View as table</summary>
        <table className="mt-2 w-full">
          <thead><tr><th scope="col" className="border-b border-border py-1 text-left font-medium text-muted">Item</th><th scope="col" className="border-b border-border py-1 text-right font-medium text-muted">Count</th></tr></thead>
          <tbody>{data.map((item) => <tr key={item.label}><td className="border-b border-border py-1">{item.label}</td><td className="border-b border-border py-1 text-right tabular-nums">{item.value}</td></tr>)}</tbody>
        </table>
      </details>
    </>
  );
}
