import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { resolve, sep, extname } from "node:path";
import { brotliCompress, gzip, constants } from "node:zlib";
import { promisify } from "node:util";
const compressBrotli = promisify(brotliCompress);
const compressGzip = promisify(gzip);
const routing = JSON.parse(await readFile(new URL("../vercel.json", import.meta.url), "utf8"));

const root = fileURLToPath(new URL("../dist/client/", import.meta.url));
const portIndex = process.argv.indexOf("--port");
const port = Number(portIndex >= 0 ? process.argv[portIndex + 1] : 4173);
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".avif": "image/avif",
  ".webp": "image/webp",
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".woff2": "font/woff2",
  ".xml": "application/xml",
  ".txt": "text/plain; charset=utf-8",
};
createServer(async (request, response) => {
  const requestPath = new URL(request.url ?? "/", "http://localhost").pathname;
  const exactRedirect = routing.routes.find((item) => new RegExp(item.src).test(requestPath));
  if (exactRedirect) {
    response.writeHead(exactRedirect.status, exactRedirect.headers);
    response.end();
    return;
  }
  // Mirror the subset of Vercel's path patterns used by this static package.
  // All rules are trusted, checked-in configuration; URL input is never a regex.
  let destination;
  const redirect = routing.redirects.find((item) => {
    const pattern = item.source
      .replace(":locale(en|uz|ru)", "(?<locale>en|uz|ru)")
      .replace("/:path*", "(?:/(?<path>.*))?");
    const match = new RegExp(`^${pattern}/?$`).exec(requestPath);
    if (!match) return false;
    destination = item.destination
      .replace(":locale", match.groups?.locale ?? "")
      .replace(":path*", match.groups?.path ?? "");
    // Vercel's high-level redirects preserve query strings. The waitlist uses
    // the literal Location rule above specifically to discard them.
    const query = new URL(request.url ?? "/", "http://localhost").search;
    destination += query;
    return true;
  });
  if (redirect) {
    response.writeHead(redirect.permanent ? 308 : 307, {
      Location: destination,
      "X-Robots-Tag": "noindex, nofollow",
    });
    response.end();
    return;
  }
  let file;
  let status = 200;
  try {
    const path = decodeURIComponent(new URL(request.url ?? "/", "http://localhost").pathname);
    file = resolve(root, `.${path}`);
    if (file !== resolve(root) && !file.startsWith(resolve(root) + sep))
      throw new Error("Invalid path");
    const info = await stat(file);
    if (info.isDirectory()) file = resolve(file, "index.html");
    await stat(file);
  } catch {
    file = resolve(root, "404.html");
    status = 404;
  }
  try {
    let body = await readFile(file);
    const compressible = /\.(html|js|css|json|svg|xml|txt)$/.test(file) && body.length > 1024;
    const accepted = request.headers["accept-encoding"] ?? "";
    let encoding;
    if (compressible && /\bbr\b/.test(accepted)) {
      body = await compressBrotli(body, { params: { [constants.BROTLI_PARAM_QUALITY]: 4 } });
      encoding = "br";
    } else if (compressible && /\bgzip\b/.test(accepted)) {
      body = await compressGzip(body);
      encoding = "gzip";
    }
    response.writeHead(status, {
      "Content-Type": types[extname(file)] ?? "application/octet-stream",
      "X-Robots-Tag": "noindex, nofollow",
      "Cache-Control": "no-cache",
      "X-Content-Type-Options": "nosniff",
      Vary: "Accept-Encoding",
      "Content-Length": body.length,
      ...(encoding ? { "Content-Encoding": encoding } : {}),
    });
    response.end(request.method === "HEAD" ? undefined : body);
  } catch {
    response.writeHead(500);
    response.end("Run npm run build before preview.");
  }
}).listen(port, "127.0.0.1", () => console.log(`Manzil V3 preview: http://127.0.0.1:${port}`));
