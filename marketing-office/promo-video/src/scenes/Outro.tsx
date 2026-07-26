import React from "react";
import { AbsoluteFill, Sequence, useCurrentFrame } from "remotion";
import { color, font } from "../theme";
import { BrandBase, Grain } from "../components/Overlays";
import { Arch } from "../components/Arch";
import { Caption } from "../components/Caption";
import { fadeRise, ramp } from "../anim";

export const Outro: React.FC<{ dur: number }> = ({ dur }) => {
  const frame = useCurrentFrame();
  const archIn = fadeRise(frame, 0, 16, 40);
  const archScale = ramp(frame, 0, 18, 0.86, 1);
  const glow = ramp(frame, 6, 26, 0, 0.5);

  return (
    <BrandBase>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          {/* Arch mark */}
          <div
            style={{
              position: "relative",
              opacity: archIn.opacity,
              translate: `0px ${archIn.y}px`,
              scale: String(archScale),
              marginBottom: 34,
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: -130,
                background: `radial-gradient(circle, rgba(254,179,0,${glow}) 0%, transparent 68%)`,
                filter: "blur(6px)",
              }}
            />
            <Arch size={300} />
          </div>

          {/* Wordmark */}
          <Sequence from={12} layout="none">
            <div style={{ fontFamily: font.display, fontSize: 92, fontWeight: 700, color: color.teal, lineHeight: 1 }}>
              Manzil <span style={{ color: color.ink }}>Business</span>
            </div>
          </Sequence>

          {/* Tagline */}
          <Sequence from={24} layout="none">
            <div style={{ marginTop: 18 }}>
              <Caption size={62} family={font.display} weight={400} colorText={color.inkVariant}>
                Become the destination.
              </Caption>
            </div>
          </Sequence>

          {/* CTA + url */}
          <Sequence from={40} layout="none">
            <div style={{ marginTop: 54, display: "flex", flexDirection: "column", alignItems: "center", gap: 22 }}>
              <div
                style={{
                  background: color.gold,
                  color: color.goldInk,
                  fontFamily: font.ui,
                  fontWeight: 700,
                  fontSize: 40,
                  padding: "22px 48px",
                  borderRadius: 999,
                  boxShadow: "0px 16px 44px rgba(254,179,0,0.4)",
                }}
              >
                Claim your business — free
              </div>
              <div style={{ fontFamily: font.ui, fontSize: 34, fontWeight: 600, color: color.teal }}>
                manzil-business.vercel.app
              </div>
            </div>
          </Sequence>
        </div>
      </AbsoluteFill>
      <Grain opacity={0.04} />
    </BrandBase>
  );
};
