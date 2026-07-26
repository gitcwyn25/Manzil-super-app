import React from "react";

// Crisp line-icon set (Lucide-flavored) for the product recreation.
// Stroke inherits `color`; sized via `size`. Star/badge are filled.

type P = { size?: number; color?: string; strokeWidth?: number; fill?: string };

const Svg: React.FC<P & { children: React.ReactNode }> = ({
  size = 24,
  color = "currentColor",
  strokeWidth = 2,
  children,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ display: "block", flexShrink: 0 }}
  >
    {children}
  </svg>
);

export const IconDashboard: React.FC<P> = (p) => (
  <Svg {...p}>
    <rect x="3" y="3" width="7" height="9" rx="1.5" />
    <rect x="14" y="3" width="7" height="5" rx="1.5" />
    <rect x="14" y="12" width="7" height="9" rx="1.5" />
    <rect x="3" y="16" width="7" height="5" rx="1.5" />
  </Svg>
);

export const IconStore: React.FC<P> = (p) => (
  <Svg {...p}>
    <path d="M3 9l1.5-5h15L21 9" />
    <path d="M4 9v10a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V9" />
    <path d="M3 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0" />
    <path d="M9 20v-5h6v5" />
  </Svg>
);

export const IconReviews: React.FC<P> = (p) => (
  <Svg {...p}>
    <path d="M21 15a2 2 0 0 1-2 2H8l-4 4V5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2z" />
  </Svg>
);

export const IconPhotos: React.FC<P> = (p) => (
  <Svg {...p}>
    <rect x="3" y="4" width="18" height="14" rx="2" />
    <circle cx="8.5" cy="9" r="1.6" />
    <path d="M21 15l-5-5L5 18" />
  </Svg>
);

export const IconAnalytics: React.FC<P> = (p) => (
  <Svg {...p}>
    <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
  </Svg>
);

export const IconSettings: React.FC<P> = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7.7 1.6 1.6 0 0 1-3.2 0 1.6 1.6 0 0 0-2.7-.7l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H4a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H12a1.6 1.6 0 0 0 1-1.5V4a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V12a1.6 1.6 0 0 0 1.5 1H20a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z" />
  </Svg>
);

export const IconLogout: React.FC<P> = (p) => (
  <Svg {...p}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <path d="M16 17l5-5-5-5M21 12H9" />
  </Svg>
);

export const IconSearch: React.FC<P> = (p) => (
  <Svg {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="M21 21l-4.3-4.3" />
  </Svg>
);

export const IconBell: React.FC<P> = (p) => (
  <Svg {...p}>
    <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.7 21a2 2 0 0 1-3.4 0" />
  </Svg>
);

export const IconHelp: React.FC<P> = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 2.5-3 4" />
    <path d="M12 17h.01" />
  </Svg>
);

export const IconGlobe: React.FC<P> = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18M12 3a15 15 0 0 1 0 18 15 15 0 0 1 0-18" />
  </Svg>
);

export const IconEye: React.FC<P> = (p) => (
  <Svg {...p}>
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
    <circle cx="12" cy="12" r="3" />
  </Svg>
);

export const IconTrendUp: React.FC<P> = (p) => (
  <Svg {...p}>
    <path d="M3 17l6-6 4 4 8-8" />
    <path d="M14 7h7v7" />
  </Svg>
);

export const IconCalendarEdit: React.FC<P> = (p) => (
  <Svg {...p}>
    <path d="M8 2v4M16 2v4M3 9h13" />
    <path d="M11 21H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6" />
    <path d="M18.4 15.6a1.5 1.5 0 0 1 2 2L16 22l-3 .7.7-3z" />
  </Svg>
);

// Filled star (rating)
export const IconStar: React.FC<P> = ({
  size = 24,
  fill = "currentColor",
  color,
}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: "block", flexShrink: 0 }}>
    <path
      d="M12 2.6l2.75 5.57 6.15.9-4.45 4.34 1.05 6.12L12 20.65 6.5 19.53l1.05-6.12L3.1 9.07l6.15-.9z"
      fill={fill}
      stroke={color ?? "none"}
    />
  </svg>
);

export const IconStarHalf: React.FC<P> = ({ size = 24, fill = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: "block", flexShrink: 0 }}>
    <defs>
      <linearGradient id="halfStar">
        <stop offset="50%" stopColor={fill} />
        <stop offset="50%" stopColor={fill} stopOpacity="0.25" />
      </linearGradient>
    </defs>
    <path
      d="M12 2.6l2.75 5.57 6.15.9-4.45 4.34 1.05 6.12L12 20.65 6.5 19.53l1.05-6.12L3.1 9.07l6.15-.9z"
      fill="url(#halfStar)"
    />
  </svg>
);

// Verified merchant seal (scalloped badge + check)
export const IconVerified: React.FC<P> = ({ size = 24, fill = "#005454" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: "block", flexShrink: 0 }}>
    <path
      d="M12 1.6l2.3 1.7 2.85-.2 1 2.7 2.35 1.6-.85 2.75.85 2.75-2.35 1.6-1 2.7-2.85-.2L12 22.4l-2.3-1.7-2.85.2-1-2.7-2.35-1.6.85-2.75L3.5 11.1l2.35-1.6 1-2.7 2.85.2z"
      fill={fill}
    />
    <path d="M8.5 12.2l2.3 2.3 4.5-4.6" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </svg>
);

export const IconPin: React.FC<P> = (p) => (
  <Svg {...p}>
    <path d="M12 21s-7-6.3-7-11a7 7 0 0 1 14 0c0 4.7-7 11-7 11z" />
    <circle cx="12" cy="10" r="2.5" />
  </Svg>
);
