import React from "react";
import { AbsoluteFill, Sequence, staticFile, useCurrentFrame } from "remotion";
import { Video } from "@remotion/media";
import { color, font, SAFE } from "../theme";
import { Scrim, Grain, useKenBurns } from "../components/Overlays";
import { Caption } from "../components/Caption";
import { ramp } from "../anim";
import { IconSearch } from "../icons";

const QUERY = "best osh in Tashkent";

export const Hook: React.FC<{ dur: number }> = ({ dur }) => {
  const frame = useCurrentFrame();
  const scale = useKenBurns(0, dur, 1.05, 1.14);
  // type the query f26..f96
  const chars = Math.round(ramp(frame, 26, 96, 0, QUERY.length));
  const typed = QUERY.slice(0, chars);
  const caretOn = Math.floor(frame / 8) % 2 === 0;

  return (
    <AbsoluteFill style={{ background: "#0c0d0d" }}>
      <AbsoluteFill style={{ scale: String(scale) }}>
        <Video
          src={staticFile("broll/shotA-empty-cafe.mp4")}
          playbackRate={0.75}
          volume={0}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </AbsoluteFill>
      {/* brand grade */}
      <AbsoluteFill style={{ background: color.teal, opacity: 0.14, mixBlendMode: "soft-light" }} />
      <Scrim from="both" strength={0.66} />
      <Grain opacity={0.045} />

      {/* search pill (upper) */}
      <Sequence from={14} layout="none">
        <div
          style={{
            position: "absolute",
            top: 250,
            left: SAFE.x,
            right: SAFE.x,
            display: "flex",
            alignItems: "center",
            gap: 16,
            background: "rgba(255,255,255,0.95)",
            borderRadius: 999,
            padding: "22px 30px",
            boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
          }}
        >
          <IconSearch size={38} color={color.outline} />
          <span style={{ fontFamily: font.body, fontSize: 40, color: color.ink }}>
            {typed}
            <span style={{ opacity: caretOn ? 1 : 0, color: color.teal }}>|</span>
          </span>
        </div>
      </Sequence>

      {/* caption (lower third) */}
      <AbsoluteFill
        style={{
          justifyContent: "flex-end",
          alignItems: "center",
          padding: `0 ${SAFE.x}px ${SAFE.bottom + 20}px`,
        }}
      >
        <Sequence from={40} layout="none">
          <Caption size={92} colorText="#ffffff" family={font.ui} align="center" maxWidth={900}>
            Your customers are searching.
          </Caption>
        </Sequence>
        <Sequence from={132} layout="none">
          <Caption
            size={46}
            weight={500}
            colorText="rgba(255,255,255,0.9)"
            family={font.ui}
            style={{ marginTop: 22, letterSpacing: "0.01em" }}
          >
            to eat · to shop · to trust
          </Caption>
        </Sequence>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
