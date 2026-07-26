import React from "react";
import { AbsoluteFill, Sequence, useCurrentFrame } from "remotion";
import { color, font } from "../theme";
import { BrandBase, Grain } from "../components/Overlays";
import { Arch } from "../components/Arch";
import { Caption } from "../components/Caption";
import { ramp } from "../anim";

export const Turn: React.FC<{ dur: number }> = ({ dur }) => {
  const frame = useCurrentFrame();
  const outer = ramp(frame, 3, 33, 0, 1);
  const inner = ramp(frame, 24, 52, 0, 1);
  const glow = ramp(frame, 30, 56, 0, 0.55);
  const settle = ramp(frame, 3, 40, 0.92, 1);

  return (
    <BrandBase>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 70 }}>
          <div style={{ position: "relative", scale: String(settle) }}>
            {/* gold bloom */}
            <div
              style={{
                position: "absolute",
                inset: -160,
                background: `radial-gradient(circle, rgba(254,179,0,${glow}) 0%, transparent 68%)`,
                filter: "blur(6px)",
              }}
            />
            <Arch size={380} outerProgress={outer} innerProgress={inner} />
          </div>
          <Sequence from={38} layout="none">
            <Caption size={100} family={font.display} weight={400} colorText={color.ink}>
              Manzil changes that.
            </Caption>
          </Sequence>
        </div>
      </AbsoluteFill>
      <Grain opacity={0.04} />
    </BrandBase>
  );
};
