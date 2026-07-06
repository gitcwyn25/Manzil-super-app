import { readFileSync } from "node:fs";

const filePath = process.argv[2];

if (!filePath) {
  throw new Error("Usage: tsx tools/validate-seed.ts <csv-path>");
}

const csv = readFileSync(filePath, "utf8").trim();
const [headerLine, ...rows] = csv.split(/\r?\n/);
const requiredHeaders = [
  "name",
  "category_slug",
  "district",
  "address",
  "phone",
  "lat",
  "lng",
  "price_tier",
  "description_uz",
  "description_ru",
  "description_en",
  "status"
];

const headers = headerLine.split(",");
const missing = requiredHeaders.filter((header) => !headers.includes(header));

if (missing.length > 0) {
  throw new Error(`Missing seed headers: ${missing.join(", ")}`);
}

if (rows.length === 0) {
  throw new Error("Seed file must include at least one listing row.");
}

console.log(`Seed template OK: ${rows.length} listings`);
