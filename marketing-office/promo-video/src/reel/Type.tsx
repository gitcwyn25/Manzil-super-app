import { interpolate, useCurrentFrame, Easing } from "remotion";
import { c, t, EASE } from "./reel-theme";
import { geist, inter } from "../fonts";

/**
 * A headline that rises into its slot.
 *
 * Each line animates on its own short offset rather than the whole block
 * fading as one — a staggered rise reads as deliberate, a uniform fade reads as
 * a default. Lines are laid out in a flex column so they can never land on top
 * of each other regardless of length.
 */
export const Headline: React.FC<{
  lines: string[];
  size?: number;
  color?: string;
  align?: "left" | "center";
  delay?: number;
}> = ({ lines, size = t.headline, color = c.panel, align = "center", delay = 0 }) => {
  const frame = useCurrentFrame();

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: size * 0.06,
        alignItems: align === "center" ? "center" : "flex-start",
        textAlign: align,
      }}
    >
      {lines.map((line, i) => {
        const start = delay + i * 5;
        const p = interpolate(frame, [start, start + 22], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.bezier(...EASE),
        });

        return (
          <div
            key={line}
            style={{
              fontFamily: geist,
              fontWeight: 700,
              fontSize: size,
              lineHeight: 1.02,
              letterSpacing: "-0.035em",
              color,
              opacity: p,
              translate: `0px ${interpolate(p, [0, 1], [38, 0])}px`,
            }}
          >
            {line}
          </div>
        );
      })}
    </div>
  );
};

/** Supporting line. Deliberately one size down and dust-coloured, never competing. */
export const Sub: React.FC<{ children: React.ReactNode; delay?: number; color?: string }> = ({
  children,
  delay = 12,
  color = "rgba(241,243,242,0.72)",
}) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [delay, delay + 22], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(...EASE),
  });

  return (
    <div
      style={{
        fontFamily: inter,
        fontWeight: 500,
        fontSize: t.body,
        lineHeight: 1.32,
        color,
        opacity: p,
        translate: `0px ${interpolate(p, [0, 1], [22, 0])}px`,
        maxWidth: 820,
      }}
    >
      {children}
    </div>
  );
};

/**
 * The live pill.
 *
 * Carries --signal, and only ever labels something that is genuinely live —
 * the same rule the product follows. Used once, on the scene showing real
 * businesses on the real site.
 */
export const LivePill: React.FC<{ label: string; delay?: number }> = ({ label, delay = 0 }) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [delay, delay + 18], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(...EASE),
  });
  const pulse = 0.55 + 0.45 * Math.sin(frame / 7);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "14px 26px",
        borderRadius: 999,
        background: "rgba(77,225,193,0.10)",
        border: `1px solid rgba(77,225,193,0.35)`,
        opacity: p,
        translate: `0px ${interpolate(p, [0, 1], [16, 0])}px`,
      }}
    >
      <div
        style={{
          width: 12,
          height: 12,
          borderRadius: 999,
          background: c.signal,
          opacity: pulse,
        }}
      />
      <span
        style={{
          fontFamily: geist,
          fontWeight: 600,
          fontSize: t.label,
          letterSpacing: "0.04em",
          color: c.signal,
        }}
      >
        {label}
      </span>
    </div>
  );
};
