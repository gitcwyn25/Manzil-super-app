import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// Preserve the downloaded TanStack pages/components; replace only the editor's
// build wrapper with TanStack's portable static prerender build.
export default defineConfig({
  css: { postcss: { plugins: [] } },
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  plugins: [
    tanstackStart({
      server: { entry: "server" },
      prerender: {
        enabled: true,
        crawlLinks: false,
        autoStaticPathsDiscovery: true,
        failOnError: true,
      },
      pages: [
        { path: "/" },
        { path: "/docs" },
        { path: "/gurman" },
        ...[
          "about",
          "contact",
          "legal/privacy",
          "legal/terms",
          "legal/reviews",
          "legal/cookies",
          "legal/ai-transparency",
        ].map((path) => ({ path: `/en/${path}` })),
      ],
    }),
    react(),
    tailwindcss(),
  ],
});
