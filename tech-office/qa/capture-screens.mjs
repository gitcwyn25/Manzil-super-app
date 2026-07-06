// Capture production screenshots for the Manzil master-plan PDF.
import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";

const OUT = "d:/Desktop/Manzil/ceo-office/master-plan/assets";
mkdirSync(OUT, { recursive: true });
const BASE = "https://manzil-business.vercel.app";

const browser = await chromium.launch();

async function shot(name, path, { width = 1440, height = 900, scrollY = 0, settle = 1200 } = {}) {
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 2 });
  await page.goto(`${BASE}${path}`, { waitUntil: "networkidle", timeout: 45000 });
  if (scrollY > 0) {
    await page.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), scrollY);
  }
  await page.waitForTimeout(settle);
  await page.screenshot({ path: `${OUT}/${name}.png` });
  console.log(`ok ${name}`);
  await page.close();
}

await shot("web-landing-hero", "/uz");
await shot("web-business-hero", "/uz/business");
await shot("web-business-reviews", "/uz/business", { scrollY: 1050 });
await shot("web-business-pricing", "/uz/business", { scrollY: 3050 });
await shot("web-discover", "/uz/discover");
await shot("mobile-home", "/uz", { width: 390, height: 844 });
await shot("mobile-business", "/uz/business", { width: 390, height: 844 });

await browser.close();
console.log("done");
