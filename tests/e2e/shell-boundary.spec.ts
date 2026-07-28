import { expect, test } from "@playwright/test";

/**
 * The shell split is structural, so it is asserted structurally: the consumer
 * chrome must be absent from the workspace, and the workspace rail must be
 * absent from consumer pages. A banner would satisfy neither.
 */
test.describe("shell boundary", () => {
  test("consumer pages render the site shell", async ({ page }) => {
    await page.goto("/en");
    await expect(page.locator('[data-shell="site"]')).toBeVisible();
    await expect(page.locator('[data-shell="workspace"]')).toHaveCount(0);
  });

  test("discover renders the site shell", async ({ page }) => {
    await page.goto("/en/discover");
    await expect(page.locator('[data-shell="site"]')).toBeVisible();
    await expect(page.locator("nav.mobile-nav")).toHaveCount(1);
  });

  test("the workspace renders no consumer chrome", async ({ page }) => {
    await page.goto("/en/dashboard");
    await expect(page.locator('[data-shell="workspace"]')).toBeVisible();
    await expect(page.locator('[data-shell="site"]')).toHaveCount(0);
    await expect(page.locator("nav.mobile-nav")).toHaveCount(0);
    await expect(page.locator("footer")).toHaveCount(0);
  });

  test("the consumer nav offers no dashboard link", async ({ page }) => {
    await page.goto("/en");
    await expect(page.locator("nav.desktop-nav")).not.toContainText("Dashboard");
    await expect(page.locator("nav.mobile-nav")).not.toContainText("Dashboard");
    await expect(page.locator("nav.desktop-nav")).toContainText("Discover");
  });
});
