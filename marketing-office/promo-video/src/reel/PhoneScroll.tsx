import { Img, interpolate, useCurrentFrame, Easing, staticFile } from "remotion";
import { c, EASE } from "./reel-theme";

/**
 * A real full-page capture, scrolling inside a phone.
 *
 * The captures are genuine Playwright renders of the live site — 1170px wide and
 * up to ~13,700px tall. Rather than crop them into stills, the frame scrolls
 * through one, which is both the honest way to show a website and a stronger
 * motion device than a static card: the viewer sees the actual page move the way
 * it moves for them.
 *
 * `from`/`to` are fractions of the image's own height, so a caller reasons in
 * "top quarter" rather than in pixels it cannot know.
 */
export const PhoneScroll: React.FC<{
  shot: string;
  /** Natural pixel height of the source image. */
  shotHeight: number;
  /** Scroll start/end as a fraction of total image height. */
  from: number;
  to: number;
  durationInFrames: number;
  /** Phone width in composition pixels. */
  width?: number;
  height?: number;
}> = ({ shot, shotHeight, from, to, durationInFrames, width = 620, height = 1180 }) => {
  const frame = useCurrentFrame();

  // The image is rendered at `width`, so its on-screen height scales with it.
  const SHOT_NATURAL_WIDTH = 1170;
  const scaledHeight = (shotHeight / SHOT_NATURAL_WIDTH) * width;
  const travel = scaledHeight - height;

  const progress = interpolate(frame, [0, durationInFrames], [from, to], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(...EASE),
  });

  // A short settle on entry so the phone arrives rather than cutting in.
  const enter = interpolate(frame, [0, 18], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(...EASE),
  });

  return (
    <div
      style={{
        width,
        height,
        borderRadius: 44,
        overflow: "hidden",
        position: "relative",
        background: c.panel,
        border: `3px solid rgba(255,255,255,0.14)`,
        boxShadow: "0 60px 140px -40px rgba(0,0,0,0.75)",
        opacity: enter,
        scale: interpolate(enter, [0, 1], [0.94, 1]),
      }}
    >
      <Img
        src={staticFile(shot)}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width,
          height: scaledHeight,
          translate: `0px ${-progress * travel}px`,
        }}
      />
      {/* Screen glass: a top sheen so the phone reads as a device, not a pasted rectangle. */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(160deg, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0) 34%)",
          pointerEvents: "none",
        }}
      />
    </div>
  );
};
