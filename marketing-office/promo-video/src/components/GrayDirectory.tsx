import React from "react";
import { color, font, radius } from "../theme";
import { IconSearch, IconStar, IconPin } from "../icons";

// The implied competitor: a cold, utilitarian directory. Faceless gray rows,
// unclaimed listings, no photos. One row is "you" — lost in the sameness.
// Never named; the visual language (generic pins, gray sameness) does the work.

const GRAY_ROWS = [
  { name: "Kafe #114", tag: "Unclaimed" },
  { name: "Restoran", tag: "Hours unknown" },
  { name: "YOUR BUSINESS", tag: "Unclaimed · no photos", you: true },
  { name: "Osh xonasi", tag: "Unclaimed" },
  { name: "Choyxona", tag: "Hours unknown" },
  { name: "Kafeteriya", tag: "Unclaimed" },
];

const Row: React.FC<{
  name: string;
  tag: string;
  you?: boolean;
  highlight?: number; // 0..1 emphasis on the "you" row
}> = ({ name, tag, you, highlight = 0 }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: 20,
      padding: "22px 24px",
      background: color.grayCard,
      border: `1px solid ${color.grayLine}`,
      borderRadius: radius.md,
      opacity: you ? 1 : 0.62,
      outline: you ? `3px solid rgba(186,26,26,${0.15 + 0.55 * highlight})` : "none",
    }}
  >
    {/* no-photo placeholder */}
    <div
      style={{
        width: 74,
        height: 74,
        borderRadius: radius.sm,
        background: color.grayLine,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <IconPin size={30} color={color.grayInkDim} />
    </div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div
        style={{
          height: 20,
          width: you ? 260 : 180,
          background: you ? "transparent" : color.grayLine,
          borderRadius: 5,
          color: color.grayInk,
          fontFamily: font.ui,
          fontWeight: 700,
          fontSize: you ? 26 : 0,
          display: "flex",
          alignItems: "center",
        }}
      >
        {you ? name : ""}
      </div>
      <div
        style={{
          marginTop: 12,
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          color: color.grayInk,
          fontFamily: font.body,
          fontSize: 19,
        }}
      >
        <span
          style={{
            padding: "3px 10px",
            borderRadius: radius.sm,
            background: color.grayBg,
            border: `1px solid ${color.grayLine}`,
            fontSize: 16,
          }}
        >
          {tag}
        </span>
        <span style={{ display: "flex", gap: 2, opacity: 0.5 }}>
          {[0, 1, 2].map((i) => (
            <IconStar key={i} size={16} fill={color.grayInkDim} />
          ))}
        </span>
      </div>
    </div>
  </div>
);

export const GrayDirectory: React.FC<{
  width: number;
  scroll?: number; // px offset
  highlight?: number;
}> = ({ width, scroll = 0, highlight = 0 }) => (
  <div
    style={{
      width,
      background: color.grayBg,
      borderRadius: radius.lg,
      padding: 24,
      fontFamily: font.body,
    }}
  >
    {/* generic search header */}
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        background: color.grayCard,
        border: `1px solid ${color.grayLine}`,
        borderRadius: radius.pill,
        padding: "16px 22px",
        color: color.grayInk,
        marginBottom: 22,
      }}
    >
      <IconSearch size={24} color={color.grayInk} />
      <span style={{ fontSize: 22, fontFamily: font.body }}>cafe near me</span>
    </div>
    <div style={{ display: "flex", flexDirection: "column", gap: 14, transform: `translateY(${-scroll}px)` }}>
      {GRAY_ROWS.map((r, i) => (
        <Row key={i} {...r} highlight={r.you ? highlight : 0} />
      ))}
    </div>
  </div>
);
