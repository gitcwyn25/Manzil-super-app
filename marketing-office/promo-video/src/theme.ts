// Manzil brand tokens — mirrored from marketing-office/brand-identity/manzil_design_system
// and the live dashboard mockup (biznes_dashboard_dashboard/code.html).
// Single source of truth for the promo. Do not hardcode hex elsewhere.

export const color = {
  // Core brand
  teal: "#005454", // primary — trust, Samarkand tilework
  tealContainer: "#0f6e6e",
  tealDim: "#03696a",
  tealSoft: "#9eedec", // on-primary-container
  tealFixed: "#a1f0ef",
  tealInverse: "#85d4d3",

  gold: "#feb300", // secondary-container — ratings, CTAs
  goldWarm: "#ffba38",
  goldSoft: "#ffdeac",
  goldInk: "#6a4800", // on-secondary-container
  archGold: "#c9a24a", // the logo mark's antique gold (from fav-icon)

  // Surfaces (off-white, paper-like — never pure white bg)
  surface: "#f9f9f7",
  surfaceLowest: "#ffffff", // cards
  surfaceLow: "#f4f4f2",
  surfaceContainer: "#eeeeec",
  surfaceHigh: "#e8e8e6",
  surfaceDim: "#dadad8",

  // Ink
  ink: "#1a1c1b", // on-surface — logo outer, headings
  inkVariant: "#3e4948", // on-surface-variant — secondary text
  outline: "#6e7979",
  outlineVariant: "#bec9c8",
  inverseSurface: "#2f3130",
  inverseOnSurface: "#f1f1ef",

  // Semantic
  error: "#ba1a1a",
  errorContainer: "#ffdad6",
  onErrorContainer: "#93000a",
  success: "#0f7a3d",

  // "Competitor" cold-gray directory palette (implied rivals — utilitarian, lifeless)
  grayBg: "#eceef0",
  grayCard: "#f4f5f6",
  grayLine: "#dcdfe3",
  grayInk: "#8b9299",
  grayInkDim: "#aeb4ba",
} as const;

export const font = {
  // Heritage display serif — wordmark + brand statement lines
  display: "'Libre Caslon Display', 'Georgia', serif",
  // Engineered sans — product UI, numerals, labels (matches dashboard)
  ui: "'Geist', 'Inter', system-ui, sans-serif",
  // Body / captions
  body: "'Inter', system-ui, sans-serif",
  icon: "'Material Symbols Outlined'",
} as const;

// Video-first type scale (composition is 1080px wide → generous sizes)
export const type = {
  hero: 118, // brand statement
  headline: 84,
  title: 60,
  body: 46,
  label: 34,
  caption: 30,
} as const;

export const radius = { sm: 8, md: 12, lg: 16, xl: 24, pill: 9999 } as const;

// Ambient shadow language (soft, diffused — from design system)
export const shadow = {
  card: "0px 4px 20px rgba(0,0,0,0.06)",
  cardStrong: "0px 12px 40px rgba(0,0,0,0.12)",
  lift: "0px 24px 70px rgba(0,0,0,0.18)",
  gold: "0px 10px 40px rgba(201,162,74,0.35)",
} as const;

export const VIDEO = { width: 1080, height: 1920, fps: 30 } as const;

// Safe area (video-layout rule: keep key content off the edges)
export const SAFE = { x: 88, top: 150, bottom: 190 } as const;
