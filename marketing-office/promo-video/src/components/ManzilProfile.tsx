import React from "react";
import { Img } from "remotion";
import { color, font, radius, shadow } from "../theme";
import { IconStar, IconVerified, IconPin } from "../icons";
import { Arch } from "./Arch";

// The warm counter to the gray directory: the same business, alive on Manzil.
// heroSrc optional (real/AI photo dropped in later); falls back to a composed
// brand cover so it never reads as a lazy colored block.

export const ManzilProfile: React.FC<{
  width: number;
  heroSrc?: string;
  reveal?: number; // 0..1 content stagger
}> = ({ width, heroSrc, reveal = 1 }) => {
  const heroH = Math.round(width * 0.62);
  return (
    <div
      style={{
        width,
        background: color.surfaceLowest,
        borderRadius: radius.xl,
        overflow: "hidden",
        boxShadow: shadow.cardStrong,
        fontFamily: font.body,
      }}
    >
      {/* Hero */}
      <div style={{ position: "relative", width, height: heroH, overflow: "hidden" }}>
        {heroSrc ? (
          <Img src={heroSrc} style={{ width, height: heroH, objectFit: "cover" }} />
        ) : (
          <div
            style={{
              width,
              height: heroH,
              background: `radial-gradient(120% 100% at 20% 10%, ${color.tealContainer} 0%, ${color.teal} 45%, #003b3b 100%)`,
              position: "relative",
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "radial-gradient(60% 50% at 80% 90%, rgba(254,179,0,0.28), transparent 70%)",
              }}
            />
            <div style={{ position: "absolute", right: 26, top: 22, opacity: 0.9 }}>
              <Arch size={128} outerColor="rgba(255,255,255,0.16)" innerColor={color.gold} />
            </div>
          </div>
        )}
        {/* open-now chip */}
        <div
          style={{
            position: "absolute",
            left: 22,
            top: 22,
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: "rgba(255,255,255,0.92)",
            borderRadius: radius.pill,
            padding: "8px 16px",
            fontFamily: font.ui,
            fontWeight: 600,
            fontSize: 20,
            color: color.success,
          }}
        >
          <span style={{ width: 11, height: 11, borderRadius: 999, background: color.success }} />
          Ochiq
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: 30, opacity: reveal }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ fontFamily: font.display, fontSize: 46, fontWeight: 700, color: color.ink }}>
            Osh Markazi
          </div>
          <IconVerified size={34} fill={color.teal} />
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginTop: 10,
            fontFamily: font.body,
            fontSize: 24,
            color: color.inkVariant,
          }}
        >
          <span style={{ display: "flex", gap: 3 }}>
            {[0, 1, 2, 3, 4].map((i) => (
              <IconStar key={i} size={26} fill={color.gold} />
            ))}
          </span>
          <span style={{ fontFamily: font.ui, fontWeight: 700, color: color.ink }}>4.9</span>
          <span>(1.2k fikrlar)</span>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginTop: 12,
            fontFamily: font.body,
            fontSize: 22,
            color: color.inkVariant,
          }}
        >
          <IconPin size={22} color={color.teal} /> Milliy taomlar · Chilonzor, Toshkent
        </div>
      </div>
    </div>
  );
};
