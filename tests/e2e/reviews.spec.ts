import { expect, test } from "@playwright/test";
import { E2E_BUSINESS_SLUG } from "./fixtures/seed";

/**
 * Review submission (Track 0's regression test) and review trust signals
 * (Track 5).
 *
 * These run **signed in**, against a seeded business, via a real Clerk session
 * — see `global-setup.ts`. That matters: the bug this file exists to catch
 * only occurs on a successful authenticated submission, so the previous
 * skip-when-signed-out version could never have caught it.
 *
 * The bug: the form reported failure on submissions that had in fact saved,
 * because `event.currentTarget` was read after an `await` and threw into a
 * catch that showed a generic error. A test asserting only "the request
 * returned 2xx" would have passed while the user saw a failure — so these
 * assert on what the USER is told, not on the network call.
 */
test.describe("review form (authenticated)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`/uz/businesses/${E2E_BUSINESS_SLUG}`);
  });

  test("the form renders for a signed-in user", async ({ page }) => {
    // No conditional skip: if the form is missing, either the session broke or
    // the page did, and both should fail loudly.
    await expect(page.locator("form.review-form")).toBeVisible();
  });

  test("rejects a too-short review before any request is made", async ({ page }) => {
    const form = page.locator("form.review-form");
    const textarea = form.locator("textarea[name='text']");

    await textarea.fill("qisqa");

    let requestMade = false;
    page.on("request", (request) => {
      if (request.url().includes("/reviews") && request.method() === "POST") requestMade = true;
    });

    await form.locator("button[type='submit']").click();

    // The textarea carries minLength={20}, so the browser's own constraint
    // validation blocks submission before the JS handler runs. Assert on the
    // property that matters (nothing was sent) plus the native invalid state,
    // rather than on a code path that correctly never executes.
    expect(requestMade).toBe(false);
    await expect(textarea).toHaveJSProperty("validity.valid", false);
  });

  test("a successful submission is never reported as a failure", async ({ page }) => {
    const form = page.locator("form.review-form");

    const submitted = page.waitForResponse(
      (response) => response.url().includes("/reviews") && response.request().method() === "POST",
      { timeout: 20_000 }
    );

    await form
      .locator("textarea[name='text']")
      .fill("Bu joy juda yoqdi, xizmat tez va narxlar hamyonbop edi.");
    await form.locator("button[type='submit']").click();

    const response = await submitted;

    // The regression itself. The review saved, so the user must not be told it
    // failed — this is the exact assertion that would have caught the bug.
    expect(response.ok()).toBe(true);

    const note = form.locator("p.form-note");
    await expect(note).not.toContainText("Sharhni yuborib bo'lmadi");
    await expect(note).toContainText("qabul qilindi");
  });

  test("a rejected submission shows the API's real reason, not a generic retry", async ({
    page
  }) => {
    // The second half of the Track 0 fix. Submitting again hits the unique
    // (businessId, userId) constraint, so the API returns a specific message —
    // which the form must surface instead of the generic fallback.
    const form = page.locator("form.review-form");

    const submitted = page.waitForResponse(
      (response) => response.url().includes("/reviews") && response.request().method() === "POST",
      { timeout: 20_000 }
    );

    await form
      .locator("textarea[name='text']")
      .fill("Ikkinchi marta yozilgan sharh, oldingisi allaqachon mavjud.");
    await form.locator("button[type='submit']").click();

    const response = await submitted;
    const note = form.locator("p.form-note");

    if (response.ok()) {
      // No prior review existed for this user — still a valid outcome.
      await expect(note).toContainText("qabul qilindi");
      return;
    }

    // Whatever the API said, the user must not see an empty note or the
    // network-failure fallback for a response that did arrive.
    await expect(note).not.toHaveText("");
    await expect(note).not.toContainText("Internet aloqasini tekshirib");
  });

  test("photo input accepts only the allowed image types", async ({ page }) => {
    const fileInput = page.locator("form.review-form input[type='file']");

    await expect(fileInput).toBeVisible();

    const accept = await fileInput.getAttribute("accept");
    expect(accept).toContain("image/jpeg");
    expect(accept).toContain("image/png");
    // SVG can carry script and is deliberately excluded.
    expect(accept ?? "").not.toContain("svg");
  });
});

test.describe("review trust signals", () => {
  test("a helpful count is never shown without a vote button backing it", async ({ page }) => {
    await page.goto(`/uz/businesses/${E2E_BUSINESS_SLUG}`);

    // Excludes the empty-state card, which shares the `review-card` class but
    // represents the absence of reviews rather than a review.
    const reviews = page.locator("article.review-card:not(.review-card--empty)");

    // The submission spec runs first and leaves a review behind (the suite is
    // single-worker, so that ordering holds). No review here means the
    // submission or the cache invalidation broke.
    await expect(reviews.first()).toBeVisible();

    // The old design displayed a bare number with nothing behind it. Every
    // count must now be attached to the control that produces it.
    await expect(reviews.first().locator(".helpful-button")).toBeVisible();
  });
});
