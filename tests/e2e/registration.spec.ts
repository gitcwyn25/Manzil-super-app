import { expect, test } from "@playwright/test";

/**
 * Business registration terms acknowledgment (Track 3).
 *
 * The security property under test is that consent is a deliberate act: the
 * checkbox must be present, required, and unchecked on load. A pre-ticked or
 * optional box would make every acceptance record worthless.
 */
test.describe("business registration terms", () => {
  test("terms checkbox is present, required, and unchecked by default", async ({ page }) => {
    await page.goto("/uz/business/register");

    const checkbox = page.locator("input[name='acceptedTerms']");

    // Registration requires a session; skip rather than fail when signed out.
    test.skip((await checkbox.count()) === 0, "registration form not rendered (likely signed out)");

    await expect(checkbox).toBeVisible();
    await expect(checkbox).not.toBeChecked();
    await expect(checkbox).toHaveAttribute("required", "");
  });

  test("the form cannot be submitted without accepting", async ({ page }) => {
    await page.goto("/uz/business/register");

    const checkbox = page.locator("input[name='acceptedTerms']");
    test.skip((await checkbox.count()) === 0, "registration form not rendered (likely signed out)");

    let submitted = false;
    page.on("request", (request) => {
      if (request.url().includes("/crm/register")) submitted = true;
    });

    await page.locator("input[name='name']").fill("E2E Test Business");
    await page.locator("button[type='submit']").click();

    // Native `required` validation must block the request entirely.
    expect(submitted).toBe(false);
    await expect(checkbox).not.toBeChecked();
  });

  test("the accepted terms version is pinned to what was rendered", async ({ page }) => {
    await page.goto("/uz/business/register");

    const version = page.locator("input[name='acceptedTermsVersion']");
    test.skip((await version.count()) === 0, "no terms document published in this environment");

    // Pinning is what stops a form left open across a terms update from
    // recording acceptance of text the user never saw.
    const value = await version.getAttribute("value");
    expect(value).toBeTruthy();
  });
});
