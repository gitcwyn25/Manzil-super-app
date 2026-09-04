import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    container: {
      center: true,
      padding: "1.25rem",
      screens: { "2xl": "1440px" }
    },
    extend: {
      colors: {
        border: "hsl(var(--border) / <alpha-value>)",
        input: "hsl(var(--input) / <alpha-value>)",
        ring: "hsl(var(--ring) / <alpha-value>)",
        background: "hsl(var(--background) / <alpha-value>)",
        foreground: "hsl(var(--foreground) / <alpha-value>)",
        primary: { DEFAULT: "hsl(var(--primary) / <alpha-value>)", foreground: "hsl(var(--primary-foreground) / <alpha-value>)" },
        secondary: { DEFAULT: "hsl(var(--secondary) / <alpha-value>)", foreground: "hsl(var(--secondary-foreground) / <alpha-value>)" },
        destructive: { DEFAULT: "hsl(var(--destructive) / <alpha-value>)", foreground: "hsl(var(--destructive-foreground) / <alpha-value>)" },
        muted: { DEFAULT: "hsl(var(--muted) / <alpha-value>)", foreground: "hsl(var(--muted-foreground) / <alpha-value>)" },
        accent: { DEFAULT: "hsl(var(--accent) / <alpha-value>)", foreground: "hsl(var(--accent-foreground) / <alpha-value>)" },
        popover: { DEFAULT: "hsl(var(--popover) / <alpha-value>)", foreground: "hsl(var(--popover-foreground) / <alpha-value>)" },
        card: { DEFAULT: "hsl(var(--card) / <alpha-value>)", foreground: "hsl(var(--card-foreground) / <alpha-value>)" },
        void: "hsl(var(--void) / <alpha-value>)",
        "void-2": "hsl(var(--void-2) / <alpha-value>)",
        "line-dark": "hsl(var(--line-dark) / <alpha-value>)",
        panel: "hsl(var(--panel) / <alpha-value>)",
        "panel-2": "hsl(var(--panel-2) / <alpha-value>)",
        "panel-3": "hsl(var(--panel-3) / <alpha-value>)",
        ink: "hsl(var(--ink) / <alpha-value>)",
        "ink-soft": "hsl(var(--ink-soft) / <alpha-value>)",
        ceramic: "hsl(var(--ceramic) / <alpha-value>)",
        "ceramic-dark": "hsl(var(--ceramic-dark) / <alpha-value>)",
        signal: "hsl(var(--signal) / <alpha-value>)",
        "signal-soft": "hsl(var(--signal-soft) / <alpha-value>)",
        brass: "hsl(var(--brass) / <alpha-value>)",
        "brass-soft": "hsl(var(--brass-soft) / <alpha-value>)",
        warn: "hsl(var(--warn) / <alpha-value>)",
        "warn-soft": "hsl(var(--warn-soft) / <alpha-value>)",
        danger: "hsl(var(--danger) / <alpha-value>)",
        "danger-soft": "hsl(var(--danger-soft) / <alpha-value>)",
        good: "hsl(var(--good) / <alpha-value>)",
        "good-soft": "hsl(var(--good-soft) / <alpha-value>)",
        // Compatibility aliases used by the existing admin routes.
        bg: "hsl(var(--void) / <alpha-value>)",
        fg: "hsl(var(--foreground) / <alpha-value>)",
        brand: "hsl(var(--ceramic) / <alpha-value>)",
        "brand-dim": "hsl(var(--ceramic-dark) / <alpha-value>)",
        bad: "hsl(var(--danger) / <alpha-value>)"
      },
      borderRadius: {
        sm: "6px",
        md: "8px",
        lg: "10px",
        xl: "16px"
      },
      fontFamily: {
        sans: ["var(--font-ibm)", "IBM Plex Sans", "system-ui", "sans-serif"],
        display: ["var(--font-archivo)", "Archivo", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "IBM Plex Mono", "ui-monospace", "monospace"]
      },
      boxShadow: {
        surface: "0 1px 2px rgba(18,36,40,0.03)",
        float: "0 18px 50px rgba(10,26,30,0.18)"
      }
    }
  },
  plugins: []
};

export default config;
