import React from "react";
import { AbsoluteFill, Sequence, staticFile, useCurrentFrame } from "remotion";
import { Video } from "@remotion/media";
import { color, font, radius, SAFE, type as T } from "../theme";
import { Scrim, Grain, useKenBurns } from "../components/Overlays";
import { ManzilProfile } from "../components/ManzilProfile";
import { Caption, Hi } from "../components/Caption";
import { fadeRise, ramp } from "../anim";

export const WhyUs: React.FC<{ dur: number }> = ({ dur }) => {
  const frame = useCurrentFrame();
  const scale = useKenBurns(0, dur, 1.05, 1.12);
  const profile = fadeRise(frame, 14, 20, 90);
  const ghostFade = ramp(frame, 18, 54, 0.5, 0);
  const glow = ramp(frame, 20, 50, 0, 0.5);

  return (
    <AbsoluteFill style={{ background: "#0c0d0d" }}>
      <AbsoluteFill style={{ scale: String(scale) }}>
        <Video
          src={staticFile("broll/shotB-cafe-alive.mp4")}
          playbackRate={0.95}
          volume={0}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </AbsoluteFill>
      <AbsoluteFill style={{ background: color.teal, opacity: 0.16, mixBlendMode: "soft-light" }} />
      <Scrim from="both" strength={0.72} />

      {/* profile card (with fading gray ghost behind → implies the competitor) */}
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "flex-start", paddingTop: 300 }}>
        <div style={{ position: "relative", width: 720 }}>
          <div
            style={{
              position: "absolute",
              inset: -70,
              background: `radial-gradient(circle, rgba(254,179,0,${glow}) 0%, transparent 70%)`,
              filter: "blur(8px)",
            }}
          />
          {/* gray ghost */}
          <div
            style={{
              position: "absolute",
              top: -46,
              left: 40,
              right: 40,
              height: 150,
              background: color.grayCard,
              border: `1px solid ${color.grayLine}`,
              borderRadius: radius.lg,
              opacity: ghostFade,
              transform: "rotate(-3deg)",
              display: "flex",
              alignItems: "center",
              paddingLeft: 28,
              color: color.grayInk,
              fontFamily: font.ui,
              fontSize: 26,
              fontWeight: 600,
            }}
          >
            Unclaimed listing
          </div>
          <div style={{ opacity: profile.opacity, translate: `0px ${profile.y}px` }}>
            <ManzilProfile width={720} />
          </div>
        </div>
      </AbsoluteFill>

      {/* captions (lower third, swapping) */}
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "flex-end", padding: `0 ${SAFE.x}px ${SAFE.bottom - 10}px` }}>
        <Sequence from={6} durationInFrames={70} layout="none">
          <Caption size={T.title} family={font.ui} colorText="#ffffff">
            Not another <Hi>gray directory.</Hi>
          </Caption>
        </Sequence>
        <Sequence from={80} layout="none">
          <Caption size={T.title} family={font.ui} colorText="#ffffff" maxWidth={860}>
            A home for your business — <Hi>built in Tashkent.</Hi>
          </Caption>
        </Sequence>
      </AbsoluteFill>
      <Grain opacity={0.045} />
    </AbsoluteFill>
  );
};
