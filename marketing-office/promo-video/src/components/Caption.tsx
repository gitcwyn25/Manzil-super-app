import React from "react";
import { useCurrentFrame } from "remotion";
import { fadeRise } from "../anim";
import { font, color } from "../theme";

// Kinetic caption (sound-off social). Reveals with fade + rise + subtle blur clear,
// relative to its own Sequence start. Supports a highlighted keyword span.
export const Caption: React.FC<{
  children: React.ReactNode;
  size?: number;
  weight?: number;
  family?: string;
  colorText?: string;
  align?: "center" | "left";
  delay?: number;
  maxWidth?: number;
  style?: React.CSSProperties;
}> = ({
  children,
  size = 60,
  weight = 700,
  family = font.ui,
  colorText = color.ink,
  align = "center",
  delay = 0,
  maxWidth = 900,
  style,
}) => {
  const frame = useCurrentFrame();
  const { opacity, y } = fadeRise(frame, delay, 13, 40);
  const blur = (1 - opacity) * 8;
  return (
    <div
      style={{
        fontFamily: family,
        fontSize: size,
        fontWeight: weight,
        color: colorText,
        textAlign: align,
        lineHeight: 1.08,
        letterSpacing: "-0.02em",
        maxWidth,
        opacity,
        translate: `0px ${y}px`,
        filter: `blur(${blur}px)`,
        textWrap: "balance",
        ...style,
      }}
    >
      {children}
    </div>
  );
};

// Inline highlight (gold) for a keyword inside a caption.
export const Hi: React.FC<{ children: React.ReactNode; c?: string }> = ({
  children,
  c = color.gold,
}) => <span style={{ color: c }}>{children}</span>;
