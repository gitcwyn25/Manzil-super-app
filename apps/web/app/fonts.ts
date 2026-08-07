import { Golos_Text, Hanken_Grotesk } from "next/font/google";

/**
 * Font definitions live in their own module because the element that carries
 * their CSS variables (`<html>`) moved from the root layout down into
 * `app/[locale]/layout.tsx`, and the offline and 404 documents outside that
 * segment need the same variables. `next/font` must be called at module scope,
 * so a shared module is the only way to apply one loader to several documents.
 */

// One grotesque across all levels (DESIGN.md). Weights map to the type ramp:
// 400 body, 500 label-sm, 600 headline-md/labels/buttons, 700 headline-lg,
// 800 display-lg. latin-ext covers Uzbek-Latin's okina and diacritics.
const sans = Hanken_Grotesk({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-sans",
  display: "swap",
  fallback: ["system-ui", "Segoe UI", "Roboto", "sans-serif"]
});

// Hanken Grotesk ships no Cyrillic cut, and Manzil is trilingual (uz/ru/en):
// Golos Text rides second in the stack as the designed Cyrillic companion so
// Russian never falls back to system-ui (decision D4).
const golos = Golos_Text({
  subsets: ["cyrillic", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
  display: "swap"
});

export const fontVariables = `${sans.variable} ${golos.variable}`;
