import { expect, test } from "@playwright/test";
import { E2E_TERMS_VERSION } from "./fixtures/seed";

/**
 * Business registration terms acknowledgment (Track 3).
 *
 * Runs signed in against a seeded published terms version, so these are real
 * assertions rather than skips. The property under test is that consent is a
 * deliberate act: the checkbox must be present, required, and unchecked on
 * load. A pre-ticked or optional box would make every acceptance record
 * worthless.
 */
/**
 * Skipped only when auth setup was explicitly disabled (no Clerk secrets, e.g.
 * a fork PR). This is deliberately NOT a content-based skip: the original
 * version skipped when the form "wasn't rendered", which silently masked the
 * exact breakage the suite exists to catch. Declaring auth unavailable is a
 * decision; failing to find a form is a symptom.
 */
test.skip(
  Boolean(process.env.SKIP_AUTH_SETUP),
  "SKIP_AUTH_SETUP is set — no Clerk session available for authenticated specs"
);

test.describe("business registration terms (authenticated)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/uz/business/register");
  });

  test("the registration form renders for a signed-in user", async ({ page }) => {
    await expect(page.locator("input[name='acceptedTerms']")).toBeVisible();
  });

  test("terms checkbox is present, required, and unchecked by default", async ({ page }) => {
    const checkbox = page.locator("input[name='acceptedTerms']");

    await expect(checkbox).toBeVisible();
    await expect(checkbox).not.toBeChecked();
    await expect(checkbox).toHaveAttribute("required", "");
  });

  test("the form cannot be submitted without accepting", async ({ page }) => {
    const checkbox = page.locator("input[name='acceptedTerms']");

    let submitted = false;
    page.on("request", (request) => {
      if (request.url().includes("/crm/register")) submitted = true;
    });

    await page.locator("input[name='name']").fill("E2E Test Business");
    await page.locator("button[type='submit']").click();

    // Native `required` validation must block the request entirely.
    expect(submitted).toBe(false);
    await expect(checkbox).not.toBeChecked();
    await expect(checkbox).toHaveJSProperty("validity.valid", false);
  });

  test("the accepted terms version is pinned to the published version", async ({ page }) => {
    const version = page.locator("input[name='acceptedTermsVersion']");

    // Pinning is what stops a form left open across a terms update from
    // recording acceptance of text the user never saw. The seeded document is
    // the most recently published one, so it is what the form must carry.
    await expect(version).toHaveValue(E2E_TERMS_VERSION);
  });

  test("the terms text itself is readable before accepting", async ({ page }) => {
    // Consent to text you cannot read is not consent. The document body must
    // be reachable on the page, not merely linked from a checkbox label.
    const details = page.locator("details.crm-terms-doc");
    await expect(details).toBeVisible();

    await details.locator("summary").click();
    await expect(details.locator(".crm-terms-body")).toBeVisible();
  });
});
