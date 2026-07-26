import React from "react";
import { AbsoluteFill, Sequence, useCurrentFrame } from "remotion";
import { color, font, SAFE } from "../theme";
import { BrandBase, Grain } from "../components/Overlays";
import { BrowserFrame } from "../components/BrowserFrame";
import { Dashboard } from "../components/Dashboard";
import { Caption, Hi } from "../components/Caption";
import { ramp, countUp, fadeRise } from "../anim";

const WIN_W = 1004;
const DASH_SCALE = WIN_W / 1360; // fit dashboard width
const CONTENT_H = Math.round(900 * DASH_SCALE);
const WIN_H = CONTENT_H + 56;

const REPLY = "Rahmat, Azizbek! Sizni yana kutamiz.";

export const Product: React.FC<{ dur: number }> = ({ dur }) => {
  const frame = useCurrentFrame();

  // window enter + gentle push-in
  const enter = fadeRise(frame, 0, 20, 120);
  const push = ramp(frame, 12, dur, 1.02, 1.12);

  // KPI count-ups
  const views = countUp(frame, 26, 66, 1240);
  const delta = countUp(frame, 26, 66, 12);
  const rating = countUp(frame, 26, 70, 4.8);
  const searches = countUp(frame, 30, 72, 3500);

  // typed reply
  const chars = Math.round(ramp(frame, 118, 178, 0, REPLY.length));
  const typing = frame >= 118 && frame <= 182;
  const verified = ramp(frame, 150, 176, 0, 1);

  return (
    <BrandBase>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <div
          style={{
            opacity: enter.opacity,
            translate: `0px ${enter.y - 30}px`,
            scale: String(push),
          }}
        >
          <BrowserFrame width={WIN_W} height={WIN_H}>
            <div style={{ width: 1360, height: 900, transform: `scale(${DASH_SCALE})`, transformOrigin: "top left" }}>
              <Dashboard
                views={views}
                viewsDelta={delta}
                rating={rating}
                ratingCount={240}
                searches={searches}
                newReviews={8}
                replyText={REPLY.slice(0, chars)}
                showCursor={typing && Math.floor(frame / 8) % 2 === 0}
                verified={verified}
              />
            </div>
          </BrowserFrame>
        </div>
      </AbsoluteFill>

      {/* late caption */}
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "flex-end", padding: `0 ${SAFE.x}px ${SAFE.bottom - 30}px` }}>
        <Sequence from={150} layout="none">
          <Caption size={58} family={font.ui} colorText={color.ink}>
            Real reviews. <Hi c={color.teal}>Real control.</Hi>
          </Caption>
        </Sequence>
      </AbsoluteFill>
      <Grain opacity={0.035} />
    </BrandBase>
  );
};
