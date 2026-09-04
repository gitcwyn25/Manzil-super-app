import { ImageResponse } from "next/og";

/**
 * Site-wide Open Graph / Twitter card image.
 *
 * The audit found zero Open Graph tags in production, and there was no shareable
 * image asset in the repo at all — only square PWA icons, which social cards
 * crop badly. This generates the 1200×630 card Next then attaches to every
 * route that does not override it.
 *
 * Latin-only wordmark by design: `ImageResponse` renders with its bundled
 * default font, which has no Cyrillic coverage, so Russian copy here would
 * render as tofu boxes. The card carries the brand and the promise; the
 * localized title and description ride in the `og:title` / `og:description`
 * tags next to it.
 */

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Manzil — Tashkent business directory with real local reviews";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "84px 92px",
          // Brand primary (#0058bc, the manifest theme colour) into deep ink.
          background: "linear-gradient(135deg, #0058bc 0%, #062a63 62%, #04122c 100%)",
          color: "#ffffff",
          fontFamily: "sans-serif"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 20,
              background: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#0058bc",
              fontSize: 42,
              fontWeight: 800
            }}
          >
            M
          </div>
          <div style={{ fontSize: 46, fontWeight: 700, letterSpacing: -1 }}>Manzil</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ fontSize: 82, fontWeight: 800, lineHeight: 1.04, letterSpacing: -2.5 }}>
            Discover · Plan · Experience
          </div>
          <div style={{ fontSize: 34, lineHeight: 1.35, color: "rgba(255,255,255,0.82)" }}>
            Tashkent places and real local reviews.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: 26,
            color: "rgba(255,255,255,0.7)"
          }}
        >
          <div style={{ display: "flex" }}>manzilgroup.uz</div>
          <div style={{ display: "flex" }}>UZ · RU · EN</div>
        </div>
      </div>
    ),
    size
  );
}
