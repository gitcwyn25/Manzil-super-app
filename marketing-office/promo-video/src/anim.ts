import { Easing, interpolate } from "remotion";

// Exponential ease-outs only (impeccable motion rule: no bounce/elastic).
export const EASE_OUT = Easing.bezier(0.16, 1, 0.3, 1); // expo-ish
export const EASE_OUT_QUINT = Easing.bezier(0.22, 1, 0.36, 1);
export const EASE_IN_OUT = Easing.bezier(0.65, 0, 0.35, 1);

const clampOpts = (easing: (n: number) => number) => ({
  easing,
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
});

// Reveal helper: returns opacity + Y offset for a fade-rise-in.
export const fadeRise = (
  frame: number,
  start: number,
  dur = 14,
  distance = 46,
) => {
  const p = interpolate(frame, [start, start + dur], [0, 1], clampOpts(EASE_OUT));
  return { opacity: p, y: (1 - p) * distance };
};

// Ease a value between two numbers over a frame window.
export const ramp = (
  frame: number,
  start: number,
  end: number,
  from = 0,
  to = 1,
  easing = EASE_OUT,
) => interpolate(frame, [start, end], [from, to], clampOpts(easing));

// Count-up: eased numeric interpolation for KPI odometers.
export const countUp = (
  frame: number,
  start: number,
  dur: number,
  target: number,
) => interpolate(frame, [start, start + dur], [0, target], clampOpts(EASE_OUT_QUINT));
