import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0b0e14",
        panel: "#111621",
        "panel-2": "#161c28",
        border: "#222b3a",
        muted: "#8a93a6",
        fg: "#e6e9ef",
        brand: "#3ba3a1",
        "brand-dim": "#2b7a78",
        good: "#2fbf71",
        warn: "#e0a83b",
        bad: "#e5484d"
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"]
      }
    }
  },
  plugins: []
};

export default config;
