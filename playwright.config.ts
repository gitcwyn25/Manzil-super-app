import { defineConfig, devices } from "@playwright/test";

/**
 * End-to-end suite.
 *
 * Runs against a real Next.js server. `BASE_URL` lets the same specs run
 * against a deployed environment; by default Playwright starts the local dev
 * server itself.
 *
 * These specs are written to pass against a **near-empty** database as well as
 * a populated one — Manzil is pre-launch, and a suite that only passes with
 * seeded data would fail on a fresh environment and get disabled.
 */
const baseURL = process.env.BASE_URL ?? "http://localhost:3000";

export default defineConfig({
  testDir: "./tests/e2e",
  // Fail the run if a `.only` was committed — otherwise CI silently tests one spec.
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : [["list"]],

  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    // Generous but bounded: the first hit on a cold route still pays for
    // server-side data fetching against a remote database.
    navigationTimeout: 45_000,
    actionTimeout: 15_000
  },

  timeout: 60_000,

  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],

  // Skipped when BASE_URL points elsewhere, so the same specs can be aimed at
  // a deployed environment without trying to boot a local server too.
  //
  // Runs a **production** build rather than `next dev`: the dev server compiles
  // each route on first request (15-20s here), which blows navigation timeouts
  // and makes the suite flaky for reasons that have nothing to do with the code
  // under test.
  webServer: process.env.BASE_URL
    ? undefined
    : {
        command: "npm run build --workspace @manzil/web && npm run start --workspace @manzil/web",
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 300_000
      }
});
