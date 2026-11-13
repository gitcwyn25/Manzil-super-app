/**
 * Decorative "living intelligence layer": thin signal lines connecting context nodes over the city.
 * Purely illustrative (aria-hidden). Labels describe kinds of knowledge, never data or metrics.
 */
const PATHS = [
  { d: "M120 640 C 380 560, 520 700, 760 560 S 1120 420, 1480 470", len: 1500, delay: 400 },
  { d: "M260 300 C 480 360, 600 260, 820 330 S 1100 520, 1360 300", len: 1300, delay: 700 },
  { d: "M760 560 C 800 470, 790 400, 820 330", len: 260, delay: 1500 },
  { d: "M1120 470 C 1180 400, 1260 360, 1360 300", len: 300, delay: 1800 },
];

const NODES = [
  { x: 120, y: 640, label: "EXPERIENCE" },
  { x: 760, y: 560, label: "PLACE" },
  { x: 820, y: 330, label: "QUESTION" },
  { x: 1360, y: 300, label: "CONTEXT" },
  { x: 1480, y: 470, label: "DECISION" },
  { x: 260, y: 300, label: "" },
];

export function SignalField() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 1600 900"
      preserveAspectRatio="xMidYMid slice"
      className="pointer-events-none absolute inset-0 h-full w-full"
    >
      <defs>
        <linearGradient id="sig" x1="0" x2="1">
          <stop offset="0" stopColor="var(--lime)" stopOpacity="0" />
          <stop offset="0.25" stopColor="var(--lime)" stopOpacity="0.9" />
          <stop offset="1" stopColor="var(--lime)" stopOpacity="0.5" />
        </linearGradient>
      </defs>
      {PATHS.map((p, i) => (
        <path
          key={i}
          d={p.d}
          fill="none"
          stroke="url(#sig)"
          strokeWidth={1.25}
          strokeDasharray={p.len}
          strokeDashoffset={p.len}
          className="animate-signal-draw"
          style={{ ["--len" as string]: p.len, animationDelay: `${p.delay}ms` }}
        />
      ))}
      {NODES.map((n, i) => (
        <g key={i} className="animate-fade-up" style={{ animationDelay: `${900 + i * 220}ms` }}>
          <circle cx={n.x} cy={n.y} r={14} fill="var(--lime)" opacity={0.12} />
          <circle
            cx={n.x}
            cy={n.y}
            r={4}
            fill="var(--lime)"
            className="animate-signal-pulse"
            style={{ transformOrigin: `${n.x}px ${n.y}px`, animationDelay: `${i * 400}ms` }}
          />
          {n.label && (
            <text
              x={n.x + 16}
              y={n.y - 14}
              fill="var(--paper)"
              opacity={0.75}
              fontFamily="var(--font-mono)"
              fontSize={13}
              letterSpacing="0.16em"
              className="hidden md:block"
            >
              {n.label}
            </text>
          )}
        </g>
      ))}
    </svg>
  );
}
