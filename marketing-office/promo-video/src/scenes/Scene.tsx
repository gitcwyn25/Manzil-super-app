import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";

// Wraps a scene with a short cross-dissolve in/out so hard cuts feel intentional.
// Frame is relative to the scene's own Sequence.
export const Scene: React.FC<{
  dur: number;
  fadeIn?: number;
  fadeOut?: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ dur, fadeIn = 7, fadeOut = 7, children, style }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(
    frame,
    [0, fadeIn, dur - fadeOut, dur],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  return <AbsoluteFill style={{ opacity, ...style }}>{children}</AbsoluteFill>;
};
