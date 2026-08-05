import { expect, test } from "@playwright/test";

test.describe("html lang matches the URL locale", () => {
  for (const locale of ["uz", "ru", "en"] as const) {
    test(`/${locale} serves lang="${locale}"`, async ({ page }) => {
      await page.goto(`/${locale}`);
      await expect(page.locator("html")).toHaveAttribute("lang", locale);
    });
  }

  /**
   * The locale layout's inline <script> only sets `document.documentElement.lang`
   * on fresh parse. A client-side locale switch (router.push, no reload) must
   * still land on the right lang — that's LocaleLangSync's job, covered here by
   * driving the actual switcher UI instead of page.goto.
   */
  test("switching locale via the switcher (soft navigation) updates lang", async ({ page }) => {
    await page.goto("/uz");
    await expect(page.locator("html")).toHaveAttribute("lang", "uz");

    await page.getByRole("button", { name: "Language" }).click();
    await page.getByRole("menuitem", { name: "Русский" }).click();

    await expect(page).toHaveURL(/\/ru(\/|$)/);
    await expect(page.locator("html")).toHaveAttribute("lang", "ru");
  });
});
