import type { MetadataRoute } from "next";

/**
 * Web app manifest.
 *
 * Served by Next at /manifest.webmanifest, which the app's CSP already permits
 * (`manifest-src 'self'`).
 *
 * `start_url` is "/uz" rather than "/": every route is locale-prefixed, and a
 * bare "/" only redirects — an installed app that opens on a redirect flashes
 * a blank frame on launch and breaks the offline start-URL cache.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Manzil — Toshkent biznes katalogi",
    short_name: "Manzil",
    description:
      "Toshkentdagi bizneslarni toping, sharhlarni o'qing va o'z biznesingizni boshqaring.",
    start_url: "/uz",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#ffffff",
    theme_color: "#0f5b3d",
    // The app is Uzbek-first; ru/en are available via the locale switcher.
    lang: "uz",
    dir: "ltr",
    categories: ["business", "travel", "food"],
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any"
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any"
      },
      {
        // Separate maskable asset: Android crops "any" icons to its mask shape,
        // clipping a mark that was drawn edge-to-edge.
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable"
      }
    ]
  };
}
