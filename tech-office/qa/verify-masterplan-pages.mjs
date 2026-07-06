import { chromium } from "@playwright/test";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { mkdirSync } from "node:fs";

const OUT = "C:/Users/nuobe/AppData/Local/Temp/claude/d--Desktop-Manzil/52e68b10-73aa-4670-9137-39181c403e1e/scratchpad/pages";
mkdirSync(OUT, { recursive: true });
const html = resolve("d:/Desktop/Manzil/ceo-office/master-plan/master-plan.html");
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 900, height: 1400 } });
await page.goto(pathToFileURL(html).href, { waitUntil: "networkidle" });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(400);
const pages = page.locator("section.page");
const n = await pages.count();
for (let i = 0; i < n; i++) {
  await pages.nth(i).screenshot({ path: `${OUT}/p${String(i + 1).padStart(2, "0")}.png` });
}
console.log("captured", n, "pages");
await browser.close();
