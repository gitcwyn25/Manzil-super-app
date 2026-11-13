import { readdir, readFile, writeFile, access } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const directory = new URL("../dist/client/", import.meta.url);
await access(new URL("index.html", directory));
const production = process.env.MANZIL_INDEXING === "production";
const routes = [
  "/",
  "/en/about",
  "/en/contact",
  "/en/legal/privacy",
  "/en/legal/terms",
  "/en/legal/reviews",
  "/en/legal/cookies",
  "/en/legal/ai-transparency",
];

async function visit(path) {
  for (const entry of await readdir(path, { withFileTypes: true })) {
    const file = join(path, entry.name);
    if (entry.isDirectory()) await visit(file);
    else if (entry.name.endsWith(".html") && !production) {
      const html = await readFile(file, "utf8");
      await writeFile(
        file,
        html.replace("</head>", '<meta name="robots" content="noindex, nofollow" /></head>'),
      );
    }
  }
}
await visit(fileURLToPath(directory));
await writeFile(
  new URL("robots.txt", directory),
  production
    ? "User-agent: *\nAllow: /\nSitemap: https://manzilgroup.uz/sitemap.xml\n"
    : "User-agent: *\nDisallow: /\n",
);
await writeFile(
  new URL("sitemap.xml", directory),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${routes.map((path) => `<url><loc>https://manzilgroup.uz${path}</loc></url>`).join("")}</urlset>\n`,
);
await writeFile(
  new URL("404.html", directory),
  `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Page not found | Manzil</title><link rel="icon" href="/favicon.svg"><style>body{margin:0;background:#080a09;color:#f7f6ed;font:18px/1.6 system-ui;display:grid;place-items:center;min-height:100svh}main{max-width:32rem;padding:2rem}img{width:3rem}h1{font-size:clamp(2rem,7vw,4rem);line-height:1.1}a{color:#c9f64a}a:focus-visible{outline:2px solid currentColor;outline-offset:6px}</style></head><body><main><img src="/favicon.svg" alt="Manzil"><p>404 / Manzil</p><h1>This place isn’t on the map.</h1><p>The page could not be found.</p><a href="/">Back to Manzil →</a></main></body></html>`,
);
console.log(
  `Static frontend finalized; indexing=${production ? "production" : "preview (noindex)"}. No server or app API is deployed.`,
);
