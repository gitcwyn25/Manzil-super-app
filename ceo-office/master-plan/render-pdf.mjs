// Renders master-plan.html → Manzil-Master-Plan.pdf (A4, print backgrounds).
// Run from the repo root: node ceo-office/master-plan/render-pdf.mjs
import { chromium } from "@playwright/test";
import { resolve, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const htmlPath = resolve(here, "master-plan.html");
const pdfPath = resolve(here, "Manzil-Master-Plan.pdf");

const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto(pathToFileURL(htmlPath).href, { waitUntil: "networkidle", timeout: 60000 });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(400);
await page.pdf({
  path: pdfPath,
  format: "A4",
  printBackground: true,
  margin: { top: 0, right: 0, bottom: 0, left: 0 },
  preferCSSPageSize: true
});
await browser.close();
console.log("wrote", pdfPath);
