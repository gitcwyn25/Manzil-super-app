import React from "react";
import { color } from "../theme";

// The Manzil mark: two nested Samarkand portal arches (ink outer, gold inner),
// each a single open-bottom stroke path so it can "draw" as one sweep.
// Recreated from marketing-office/brand-identity/fav-icon.jpg.

// viewBox 240 x 320.
const OUTER =
  "M44 292 L44 134 A76 76 0 0 1 196 134 L196 292";
const INNER =
  "M95 292 L95 176 A25.5 25.5 0 0 1 146 176 L146 292";

type Props = {
  size?: number;
  outerProgress?: number; // 0..1 draw
  innerProgress?: number; // 0..1 draw
  outerColor?: string;
  innerColor?: string;
  style?: React.CSSProperties;
};

export const Arch: React.FC<Props> = ({
  size = 240,
  outerProgress = 1,
  innerProgress = 1,
  outerColor = color.ink,
  innerColor = color.archGold,
  style,
}) => {
  const w = size * (240 / 320);
  const clamp = (v: number) => Math.max(0, Math.min(1, v));
  return (
    <svg
      width={w}
      height={size}
      viewBox="0 0 240 320"
      fill="none"
      style={{ display: "block", overflow: "visible", ...style }}
    >
      <path
        d={OUTER}
        stroke={outerColor}
        strokeWidth={34}
        strokeLinecap="round"
        pathLength={1}
        strokeDasharray={1}
        strokeDashoffset={1 - clamp(outerProgress)}
      />
      <path
        d={INNER}
        stroke={innerColor}
        strokeWidth={28}
        strokeLinecap="round"
        pathLength={1}
        strokeDasharray={1}
        strokeDashoffset={1 - clamp(innerProgress)}
      />
    </svg>
  );
};
