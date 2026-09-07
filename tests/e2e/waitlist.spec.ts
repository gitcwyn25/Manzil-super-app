import { expect, test } from "@playwright/test";

function uniqueEmail() {
  return `wl-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.com`;
}

test.describe("waitlist", () => {
  test("city signup asks for a city and confirms a position", async ({ page }) => {
    await page.goto("/en/waitlist/city");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Tashkent");
    await page.selectOption('select[name="city"]', "Buxoro");
    await page.fill('input[name="email"]', uniqueEmail());
    await page.click(".wl-submit");
    await expect(page.locator(".wl-done")).toBeVisible();
    await expect(page.locator(".wl-done")).toContainText("number");
  });

  test("gurman signup collects profile and research answers", async ({ page }) => {
    await page.goto("/en/waitlist/gurman");
    await expect(page.locator('input[name="firstName"]')).toBeVisible();
    await expect(page.locator('input[name="lastName"]')).toBeVisible();
    await page.fill('input[name="firstName"]', "Test");
    await page.fill('input[name="lastName"]', "Visitor");
    await page.fill('input[name="email"]', uniqueEmail());
    await page.check('input[name="heardAbout"][value="search"]');
    await page.check('input[name="featureInterest"][value="planning"]');
    await page.click(".wl-submit");
    await expect(page.locator(".wl-done")).toBeVisible();
  });

  test("pro signup offers a business name field", async ({ page }) => {
    await page.goto("/en/waitlist/pro");
    await expect(page.locator('input[name="businessName"]')).toBeVisible();
  });

  test("an unknown topic 404s", async ({ page }) => {
    const response = await page.goto("/en/waitlist/spaceship");
    expect(response?.status()).toBe(404);
  });

  test("a bad email is rejected without leaving the page", async ({ page }) => {
    await page.goto("/en/waitlist/gurman");
    await page.fill('input[name="email"]', "nope");
    await page.click(".wl-submit");
    await expect(page.locator(".wl-done")).toHaveCount(0);
  });
});
