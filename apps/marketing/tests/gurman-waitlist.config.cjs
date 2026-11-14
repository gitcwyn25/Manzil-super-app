const path = require("node:path");
const { defineConfig } = require(process.env.MANZIL_PLAYWRIGHT_TEST || "@playwright/test");

const baseURL = process.env.MANZIL_PREVIEW_URL || "http://127.0.0.1:4173";
if (!["127.0.0.1", "localhost", "[::1]"].includes(new URL(baseURL).hostname)) {
  throw new Error("Docs/Gurman verification may target a local preview only.");
}

const evidenceDirectory = path.resolve(__dirname, "../../../docs/gurman-waitlist/evidence");

module.exports = defineConfig({
  testDir: __dirname,
  testMatch: "gurman-waitlist.spec.cjs",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 45000,
  expect: { timeout: 8000 },
  forbidOnly: Boolean(process.env.CI),
  outputDir: path.join(evidenceDirectory, "browser-artifacts"),
  reporter: [
    ["list"],
    ["json", { outputFile: path.join(evidenceDirectory, "playwright-report.json") }],
  ],
  use: {
    baseURL,
    browserName: "chromium",
    headless: true,
    colorScheme: "light",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    launchOptions: process.env.MANZIL_CHROMIUM_EXECUTABLE
      ? { executablePath: process.env.MANZIL_CHROMIUM_EXECUTABLE }
      : {},
  },
  projects: [
    { name: "375x812", use: { viewport: { width: 375, height: 812 } } },
    { name: "768x1024", use: { viewport: { width: 768, height: 1024 } } },
    { name: "1440x900", use: { viewport: { width: 1440, height: 900 } } },
  ],
});
