import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";
import path from "node:path";

/**
 * Clerk credentials and DATABASE_URL live in the repo's env files, but
 * `globalSetup` runs outside Next.js and the Nest bootstrap, so nothing has
 * loaded them yet. Later files do not override earlier ones, so the more
 * specific app-level file wins.
 */
for (const file of ["apps/web/.env.local", ".env.local", ".env"]) {
  dotenv.config({ path: path.join(__dirname, file) });
}

// @clerk/testing reads the unprefixed name; the app uses the NEXT_PUBLIC_ one.
if (!process.env.CLERK_PUBLISHABLE_KEY && process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
  process.env.CLERK_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
}

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
  // Always one worker. These specs share a single seeded business and a single
  // signed-in user, so parallel workers race on the same rows — one spec's
  // review submission landing after another spec has already read the page.
  // Parallelism against shared database state buys speed and costs determinism.
  workers: 1,
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

  // Provisions a real Clerk session and seeds the fixtures the authenticated
  // specs assert against. Skipped when SKIP_AUTH_SETUP is set, so the
  // unauthenticated specs can still be run without Clerk credentials.
  globalSetup: process.env.SKIP_AUTH_SETUP ? undefined : require.resolve("./tests/e2e/global-setup"),

  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        // Reuses the signed-in session captured in global setup. Without it
        // every spec would have to sign in again, which is slow and makes each
        // spec depend on the sign-in UI rather than on what it is testing.
        ...(process.env.SKIP_AUTH_SETUP
          ? {}
          : { storageState: "tests/e2e/.auth/user.json" })
      }
    }
  ],

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
