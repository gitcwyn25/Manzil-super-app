import { expect, test } from "@playwright/test";

/**
 * Landing/discover coverage (Track 4).
 *
 * Asserted to hold at BOTH populated and near-empty business counts, which is
 * the condition the plan calls out: sections self-hide when empty rather than
 * rendering an empty shelf, so the assertions check "renders coherently"
 * rather than "shows N cards".
 */
test.describe("discover page", () => {
  test("renders the browse state with search controls", async ({ page }) => {
    await page.goto("/uz/discover");

    await expect(page.locator("h1")).toBeVisible();
    // The search control is the page's core affordance and must exist
    // regardless of how many businesses are listed.
    await expect(page.locator("form, input[type='search'], input[name='q']").first()).toBeVisible();
  });

  test("keeps the web Discover surface separate from mobile Gurman", async ({ page }) => {
    await page.goto("/uz/discover");

    // Gurman is a mobile product with a waitlist, not a web chat embedded in
    // Discover. This protects the approved product boundary from regressing.
    await expect(page.locator(".gurman-hero")).toHaveCount(0);
    await expect(page.locator('a[href$="/gurman"], a[href$="/concierge"]')).toHaveCount(0);
  });

  test("search and category filters persist in the URL", async ({ page }) => {
    await page.goto("/uz/discover");

    await page.locator("form[role='search'] input").fill("coffee");
    await page.getByRole("button", { name: "Qidirish" }).click();
    await expect(page).toHaveURL(/\\/uz\\/discover\\?q=coffee/);

    await page.getByRole("button", { name: "Qahvaxonalar" }).click();
    await expect(page).toHaveURL(/category=cafes/);
  });

  test("curated sections give way to results once a search is run", async ({ page }) => {
    // Curated rows are the browse state; once the visitor has said what they
    // want, their results must come first.
    await page.goto("/uz/discover?q=osh");

    await expect(page.locator(".gurman-hero")).toHaveCount(0);
    await expect(page.locator(".home-sections")).toHaveCount(0);
  });

  test("empty categories invite a listing rather than dead-ending", async ({ page }) => {
    await page.goto("/uz/discover");

    const emptyCategories = page.locator(".home-category.is-empty");
    const count = await emptyCategories.count();

    // Only meaningful when at least one category is empty — true today, but the
    // test must not fail once every category fills up.
    test.skip(count === 0, "no empty categories in this environment");

    await expect(emptyCategories.first()).toHaveAttribute("href", /business\/register/);
  });

  test("a business with no reviews shows 'new', never a zero rating", async ({ page }) => {
    await page.goto("/uz/discover");

    const cards = page.locator(".home-card__rating");
    const count = await cards.count();
    test.skip(count === 0, "no curated cards in this environment");

    for (let index = 0; index < count; index += 1) {
      const text = await cards.nth(index).innerText();
      // "0.0 ★" reads as a bad rating rather than an absent one.
      expect(text).not.toMatch(/^0\.0\s*★/);
    }
  });
});
