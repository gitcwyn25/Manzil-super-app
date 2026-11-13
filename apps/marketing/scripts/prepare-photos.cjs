const fs = require("node:fs/promises");
const path = require("node:path");
const { createHash } = require("node:crypto");
const root = path.resolve(__dirname, "..");
// Supply an installed Sharp package path when regenerating source photography.
const sharp = require(process.env.MANZIL_SHARP_PATH || "sharp");

async function main() {
  const directory = path.join(root, "public/images/photos");
  await fs.mkdir(directory, { recursive: true });
  const outputs = [];
  for (const width of [1280, 1920, 2400]) {
    for (const format of ["avif", "webp"]) {
      const output = path.join(directory, `chorsu-${width}.${format}`);
      await sharp(path.join(root, "source-assets/photos/Chorsu.png"))
        .resize({ width, withoutEnlargement: true })
        [format]({ quality: format === "avif" ? 65 : 85 })
        .toFile(output);
      const data = await fs.readFile(output);
      outputs.push({
        path: path.relative(root, output),
        bytes: data.length,
        sha256: createHash("sha256").update(data).digest("hex"),
      });
    }
  }
  await sharp(path.join(root, "source-assets/photos/Metro.png"))
    .resize({ width: 1920 })
    .webp({ quality: 85 })
    .toFile(path.join(root, "src/assets/metro.webp"));
  await sharp(path.join(root, "source-assets/photos/Chorsu.png"))
    .resize(1200, 630, { fit: "cover" })
    .jpeg({ quality: 88 })
    .toFile(path.join(root, "public/images/og-manzil.jpg"));
  const evidence = path.join(root, "../../docs/v3/evidence/optimized-photos.json");
  await fs.writeFile(
    evidence,
    JSON.stringify(
      {
        outputs,
        modifications:
          "Resized and compressed; OG version cropped. Attribution retained in the page and PHOTOGRAPHY.md.",
      },
      null,
      2,
    ) + "\n",
  );
  console.log(JSON.stringify(outputs));
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
