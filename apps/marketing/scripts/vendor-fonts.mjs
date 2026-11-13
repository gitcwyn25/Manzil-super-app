import { mkdir, writeFile, readdir, unlink } from "node:fs/promises";
import { createHash } from "node:crypto";
const root = new URL("../", import.meta.url);
const directory = new URL("public/fonts/", root);
await mkdir(directory, { recursive: true });
for (const file of await readdir(directory)) {
  if (/^[a-f0-9]{16}\.(woff2|ttf)$/.test(file)) await unlink(new URL(file, directory));
}
const cssUrl =
  "https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400..600&family=Manrope:wght@400..800&display=swap";
const response = await fetch(cssUrl, {
  headers: {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
  },
  signal: AbortSignal.timeout(20000),
});
if (!response.ok) throw new Error(`Font CSS: ${response.status}`);
let css = await response.text();
const fonts = [];
for (const source of new Set(
  [...css.matchAll(/url\((https:\/\/[^)]+)\)/g)].map((match) => match[1]),
)) {
  const font = await fetch(source, { signal: AbortSignal.timeout(20000) });
  if (!font.ok) throw new Error(`Font download: ${font.status}`);
  const data = Buffer.from(await font.arrayBuffer());
  const hash = createHash("sha256").update(data).digest("hex");
  const extension = data.subarray(0, 4).toString() === "wOF2" ? "woff2" : "ttf";
  const file = `${hash.slice(0, 16)}.${extension}`;
  await writeFile(new URL(file, directory), data);
  css = css.replaceAll(source, `/fonts/${file}`);
  fonts.push({ source, file, bytes: data.length, sha256: hash });
}
for (const family of ["manrope", "jetbrainsmono"]) {
  const license = await fetch(
    `https://raw.githubusercontent.com/google/fonts/main/ofl/${family}/OFL.txt`,
  );
  if (!license.ok) throw new Error(`License: ${family}: ${license.status}`);
  await writeFile(new URL(`${family}-OFL.txt`, directory), await license.text());
}
await writeFile(
  new URL("src/assets/fonts.css", root),
  `/* Manrope and JetBrains Mono, SIL Open Font License; see public/fonts/*-OFL.txt. */\n${css}`,
);
const latinManrope = css.match(
  /\/\* latin \*\/\s*@font-face\s*\{(?=[^}]*font-family:\s*['"]Manrope['"])[^}]*src:\s*url\(([^)]+)\)/,
)?.[1];
if (!latinManrope) throw new Error("Manrope Latin font was not found");
await writeFile(
  new URL("src/assets/font-preloads.json", root),
  JSON.stringify([latinManrope], null, 2) + "\n",
);
await writeFile(
  new URL("../../docs/v3/evidence/font-provenance.json", root),
  JSON.stringify(
    { cssUrl, fonts, license: "SIL Open Font License 1.1; unchanged font files, served locally" },
    null,
    2,
  ) + "\n",
);
console.log(
  JSON.stringify({
    fontFiles: fonts.length,
    totalBytes: fonts.reduce((sum, font) => sum + font.bytes, 0),
  }),
);
