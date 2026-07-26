import React from "react";
import { AbsoluteFill, Sequence, useCurrentFrame } from "remotion";
import { color, font, SAFE, type as T } from "../theme";
import { GrayDirectory } from "../components/GrayDirectory";
import { Caption, Hi } from "../components/Caption";
import { Grain } from "../components/Overlays";
import { ramp, fadeRise } from "../anim";

export const Problem: React.FC<{ dur: number }> = ({ dur }) => {
  const frame = useCurrentFrame();
  const scroll = ramp(frame, 0, dur, 0, 46);
  const highlight = ramp(frame, 18, 70, 0, 1);
  const dirIn = fadeRise(frame, 4, 16, 60);

  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(180deg, #e9ecee 0%, #d6dade 100%)",
      }}
    >
      {/* cold vignette */}
      <AbsoluteFill
        style={{
          background: "radial-gradient(120% 80% at 50% 40%, transparent 50%, rgba(40,55,60,0.28) 100%)",
        }}
      />

      {/* directory */}
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "flex-start", paddingTop: 420 }}>
        <div
          style={{
            width: 904,
            opacity: dirIn.opacity,
            translate: `0px ${dirIn.y}px`,
            transform: "perspective(1600px) rotateX(4deg)",
          }}
        >
          <GrayDirectory width={904} scroll={scroll} highlight={highlight} />
        </div>
      </AbsoluteFill>

      {/* top caption */}
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "flex-start", paddingTop: SAFE.top }}>
        <Sequence from={6} layout="none">
          <Caption size={T.headline} colorText={color.ink} family={font.ui} maxWidth={860}>
            But they can't <Hi c={color.error}>find you.</Hi>
          </Caption>
        </Sequence>
      </AbsoluteFill>
      <Grain opacity={0.04} />
    </AbsoluteFill>
  );
};
