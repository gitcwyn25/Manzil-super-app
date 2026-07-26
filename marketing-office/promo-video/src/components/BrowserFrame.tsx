import React from "react";
import { color, radius, shadow, font } from "../theme";

// Minimal, premium browser chrome to house the real dashboard —
// signals "this is the actual product" without kitsch.
export const BrowserFrame: React.FC<{
  url?: string;
  width: number;
  height: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ url = "manzil-business.vercel.app", width, height, children, style }) => {
  const bar = 56;
  return (
    <div
      style={{
        width,
        height,
        background: color.surfaceLowest,
        borderRadius: radius.xl,
        boxShadow: shadow.lift,
        overflow: "hidden",
        border: `1px solid ${color.outlineVariant}`,
        ...style,
      }}
    >
      <div
        style={{
          height: bar,
          display: "flex",
          alignItems: "center",
          gap: 16,
          padding: "0 22px",
          background: color.surfaceLow,
          borderBottom: `1px solid ${color.outlineVariant}`,
        }}
      >
        <div style={{ display: "flex", gap: 9 }}>
          {["#e6685f", "#f0bf4c", "#57b85f"].map((c) => (
            <div key={c} style={{ width: 14, height: 14, borderRadius: 999, background: c }} />
          ))}
        </div>
        <div
          style={{
            flex: 1,
            height: 34,
            background: color.surfaceLowest,
            border: `1px solid ${color.outlineVariant}`,
            borderRadius: radius.pill,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 9,
            color: color.inkVariant,
            fontFamily: font.ui,
            fontSize: 17,
          }}
        >
          <span style={{ fontSize: 13 }}>🔒</span>
          {url}
        </div>
        <div style={{ width: 60 }} />
      </div>
      <div style={{ width, height: height - bar, overflow: "hidden" }}>{children}</div>
    </div>
  );
};
