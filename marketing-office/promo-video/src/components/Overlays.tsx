import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { color } from "../theme";
import { ramp } from "../anim";

// Persistent, subtle film grain + vignette that ties motion-graphics and
// B-roll scenes into one material. Kept very light (impeccable: premium, not noisy).
export const Grain: React.FC<{ opacity?: number }> = ({ opacity = 0.05 }) => (
  <AbsoluteFill
    style={{
      opacity,
      mixBlendMode: "overlay",
      pointerEvents: "none",
      backgroundImage:
        "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>\")",
      backgroundSize: "300px 300px",
    }}
  />
);

export const Vignette: React.FC<{ strength?: number }> = ({ strength = 0.4 }) => (
  <AbsoluteFill
    style={{
      pointerEvents: "none",
      background: `radial-gradient(120% 80% at 50% 45%, transparent 55%, rgba(6,20,20,${strength}) 100%)`,
    }}
  />
);

// Legibility scrim for captions over B-roll (top and/or bottom).
export const Scrim: React.FC<{ from?: "bottom" | "top" | "both"; strength?: number }> = ({
  from = "bottom",
  strength = 0.72,
}) => {
  const g = `rgba(10,18,18,${strength})`;
  const bg =
    from === "both"
      ? `linear-gradient(180deg, ${g} 0%, transparent 28%, transparent 66%, ${g} 100%)`
      : from === "top"
        ? `linear-gradient(180deg, ${g} 0%, transparent 42%)`
        : `linear-gradient(0deg, ${g} 0%, transparent 46%)`;
  return <AbsoluteFill style={{ background: bg, pointerEvents: "none" }} />;
};

// Ken Burns push-in for a full-bleed layer (video/image).
export const useKenBurns = (
  start: number,
  dur: number,
  fromScale = 1.0,
  toScale = 1.08,
) => {
  const frame = useCurrentFrame();
  return ramp(frame, start, start + dur, fromScale, toScale);
};

// Brand off-white base with a faint teal wash (never pure white).
export const BrandBase: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <AbsoluteFill style={{ background: color.surface }}>
    <AbsoluteFill
      style={{
        background:
          "radial-gradient(90% 60% at 50% 0%, rgba(0,84,84,0.05), transparent 60%)",
      }}
    />
    {children}
  </AbsoluteFill>
);
