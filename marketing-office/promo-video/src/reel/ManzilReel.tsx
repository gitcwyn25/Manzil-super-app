import {
  AbsoluteFill,
  Sequence,
  interpolate,
  useCurrentFrame,
  Easing,
  useVideoConfig,
} from "remotion";
import { c, t, SAFE, EASE } from "./reel-theme";
import { geist, inter } from "../fonts";
import { PhoneScroll } from "./PhoneScroll";
import { Headline, Sub, LivePill } from "./Type";

export const FPS = 30;
const s = (sec: number) => Math.round(sec * FPS);

/** 45 seconds. */
export const REEL_TOTAL = s(45);

/** Natural heights of the real captures (Playwright, 1170px wide). */
const H = { home: 13713, business: 21162, pricing: 8643, discover: 12375 } as const;

/**
 * Ambient ground.
 *
 * A single slow teal bloom over --void. One background gesture for the whole
 * reel rather than a new treatment per scene: the video-layout rule is that
 * background supports the message, and a changing backdrop competes with it.
 */
const Ground: React.FC = () => {
  const frame = useCurrentFrame();
  const drift = interpolate(frame, [0, REEL_TOTAL], [0, 1]);

  return (
    <AbsoluteFill style={{ background: c.void }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(1100px 900px at ${28 + drift * 26}% ${18 + drift * 12}%, rgba(0,112,107,0.42), transparent 62%)`,
        }}
      />
      <AbsoluteFill
        style={{
          background: `radial-gradient(760px 640px at ${82 - drift * 20}% ${74 + drift * 8}%, rgba(200,162,76,0.16), transparent 64%)`,
        }}
      />
    </AbsoluteFill>
  );
};

/** Centred column: every scene reserves the same slots, so nothing can collide. */
const Stage: React.FC<{ children: React.ReactNode; gap?: number; justify?: string }> = ({
  children,
  gap = 46,
  justify = "center",
}) => (
  <AbsoluteFill
    style={{
      padding: `${SAFE.top}px ${SAFE.x}px ${SAFE.bottom}px`,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: justify,
      gap,
    }}
  >
    {children}
  </AbsoluteFill>
);

/** Scene 1 — the argument. Names the real competitor: an Instagram page. */
const Hook: React.FC = () => (
  <Stage gap={40}>
    <Headline lines={["Your business", "is on Instagram."]} size={t.hook} />
    <Sub delay={26} color="rgba(241,243,242,0.62)">
      That isn&apos;t a listing.
    </Sub>
  </Stage>
);

/** Scene 2 — what Manzil is, stated once, plainly. */
const Brand: React.FC = () => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [0, 22], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(...EASE),
  });

  return (
    <Stage gap={34}>
      <div
        style={{
          fontFamily: geist,
          fontWeight: 700,
          fontSize: 132,
          letterSpacing: "-0.04em",
          color: c.panel,
          opacity: p,
          translate: `0px ${interpolate(p, [0, 1], [30, 0])}px`,
          display: "flex",
          alignItems: "center",
          gap: 18,
        }}
      >
        Manzil
        <span
          style={{
            width: 20,
            height: 20,
            borderRadius: 999,
            background: c.brass,
            translate: "0px 34px",
          }}
        />
      </div>
      <Sub delay={16}>Uzbekistan&apos;s local business platform.</Sub>
    </Stage>
  );
};

/**
 * A scene that pairs one message with the real site scrolling beside it.
 * Caption sits above the phone in its own slot — never overlapping the device.
 */
const ShotScene: React.FC<{
  lines: string[];
  sub?: string;
  shot: string;
  shotHeight: number;
  from: number;
  to: number;
  durationInFrames: number;
  live?: string;
}> = ({ lines, sub, shot, shotHeight, from, to, durationInFrames, live }) => (
  // Centred rather than top-aligned: top-alignment left a band of dead space
  // under the phone, which reads as an unfinished frame on a full-bleed Reel.
  <Stage gap={34} justify="center">
    <Headline lines={lines} size={t.title} />
    {sub ? <Sub delay={14}>{sub}</Sub> : null}
    {live ? <LivePill label={live} delay={20} /> : null}
    <PhoneScroll
      shot={shot}
      shotHeight={shotHeight}
      from={from}
      to={to}
      durationInFrames={durationInFrames}
      width={600}
      height={1020}
    />
  </Stage>
);

/** Closer — one ask, plus the channel owners actually reply on. */
const Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [0, 24], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(...EASE),
  });

  return (
    <Stage gap={44}>
      <Headline lines={["Claim your", "business."]} size={t.hook} />
      <div
        style={{
          opacity: p,
          translate: `0px ${interpolate(p, [0, 1], [26, 0])}px`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 22,
        }}
      >
        <div
          style={{
            padding: "26px 58px",
            borderRadius: 999,
            background: c.ceramic,
            color: c.white,
            fontFamily: geist,
            fontWeight: 600,
            fontSize: t.body,
            letterSpacing: "-0.01em",
          }}
        >
          manzil-business.vercel.app
        </div>
        <div
          style={{
            fontFamily: inter,
            fontWeight: 500,
            fontSize: t.label,
            color: "rgba(241,243,242,0.66)",
          }}
        >
          Uzbek · Russian · English — @manzilbiz_bot
        </div>
      </div>
    </Stage>
  );
};

export const ManzilReel: React.FC = () => {
  const { durationInFrames } = useVideoConfig();

  return (
    <AbsoluteFill>
      <Ground />

      {/* 0:00–0:04 — the argument */}
      <Sequence durationInFrames={s(4)}>
        <Hook />
      </Sequence>

      {/* 0:04–0:07.5 — who we are */}
      <Sequence from={s(4)} durationInFrames={s(3.5)}>
        <Brand />
      </Sequence>

      {/* 0:07.5–0:16 — the consumer side, real homepage scrolling through
          the hero, the live business showcase and the Just Joined cards. */}
      <Sequence from={s(7.5)} durationInFrames={s(8.5)}>
        <ShotScene
          lines={["Real places.", "Real reviews."]}
          sub="Not a directory nobody updates."
          shot="shots/home.png"
          shotHeight={H.home}
          // Stops before the category grid: with five categories and two
          // businesses, most cells read "Be the first", which is honest on the
          // site but is the weakest thing to hold on screen in a promo.
          from={0}
          to={0.2}
          durationInFrames={s(8.5)}
          live="Live in Tashkent"
        />
      </Sequence>

      {/* 0:16–0:26 — the owner side. */}
      <Sequence from={s(16)} durationInFrames={s(10)}>
        <ShotScene
          lines={["Claim it and you", "get a dashboard."]}
          sub="Reviews, bookings, announcements, analytics."
          shot="shots/business.png"
          shotHeight={H.business}
          from={0.06}
          to={0.46}
          durationInFrames={s(10)}
        />
      </Sequence>

      {/* 0:26–0:33 — discovery, how customers actually find them. */}
      <Sequence from={s(26)} durationInFrames={s(7)}>
        <ShotScene
          lines={["Customers search.", "You show up."]}
          shot="shots/discover.png"
          shotHeight={H.discover}
          from={0}
          to={0.3}
          durationInFrames={s(7)}
        />
      </Sequence>

      {/* 0:33–0:39.5 — price, stated plainly. */}
      <Sequence from={s(33)} durationInFrames={s(6.5)}>
        <ShotScene
          lines={["Free to start."]}
          sub="Pro when you outgrow it."
          shot="shots/pricing.png"
          shotHeight={H.pricing}
          from={0.08}
          to={0.5}
          durationInFrames={s(6.5)}
        />
      </Sequence>

      {/* 0:39.5–0:45 — the ask */}
      <Sequence from={s(39.5)} durationInFrames={durationInFrames - s(39.5)}>
        <Outro />
      </Sequence>
    </AbsoluteFill>
  );
};
