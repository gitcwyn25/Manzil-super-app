import { expect, test } from "@playwright/test";

test.describe("html lang matches the URL locale", () => {
  for (const locale of ["uz", "ru", "en"] as const) {
    test(`/${locale} serves lang="${locale}"`, async ({ page }) => {
      await page.goto(`/${locale}`);
      await expect(page.locator("html")).toHaveAttribute("lang", locale);
    });
  }
});
