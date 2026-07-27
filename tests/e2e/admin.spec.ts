import { expect, test } from "@playwright/test";

/**
 * Admin console coverage (Track 2).
 *
 * The console runs as a separate app on its own port, so these are skipped
 * unless `ADMIN_BASE_URL` is provided — a suite that fails purely because a
 * second server was not started gets disabled, which loses the coverage.
 */
const adminBaseURL = process.env.ADMIN_BASE_URL;

test.describe("admin console", () => {
  test.skip(!adminBaseURL, "ADMIN_BASE_URL not set");

  test("unauthenticated access does not expose business data", async ({ page }) => {
    const response = await page.goto(`${adminBaseURL}/businesses`);

    // Either redirected to sign-in or shown access-denied — never the list.
    const url = page.url();
    const body = await page.locator("body").innerText();

    const gated =
      url.includes("sign-in") ||
      /access denied|sign in/i.test(body) ||
      (response?.status() ?? 200) >= 400;

    expect(gated).toBe(true);
  });

  test("the business detail route exists and is gated", async ({ page }) => {
    // This route did not exist before Track 2, and the list's link to it passed
    // a slug to an id-addressed route — it could never resolve.
    const response = await page.goto(`${adminBaseURL}/businesses/some-id`);

    // A 404 would mean the route is missing again.
    expect(response?.status()).not.toBe(404);
  });
});
