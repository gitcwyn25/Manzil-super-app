import { expect, test } from "@playwright/test";

const discoverUrl = "https://discover.manzilgroup.uz/";

test.describe("standalone Discover boundary", () => {
  for (const locale of ["uz", "ru", "en"] as const) {
    test(`old /${locale}/discover bookmarks redirect to the full app`, async ({ request }) => {
      const response = await request.get(`/${locale}/discover`, { maxRedirects: 0 });
      expect(response.status()).toBe(308);
      expect(response.headers().location).toBe(discoverUrl);
    });
  }

  test("old marketplace filters do not become planner parameters", async ({ request }) => {
    const response = await request.get("/en/discover?q=coffee&category=cafes", { maxRedirects: 0 });
    expect(response.status()).toBe(308);
    expect(response.headers().location).toBe(discoverUrl);
  });

  test("desktop and mobile navigation open the independent app", async ({ request }) => {
    const response = await request.get("/en");
    expect(response.ok()).toBeTruthy();
    const html = await response.text();
    expect(html.split(`href="${discoverUrl}"`).length - 1).toBeGreaterThanOrEqual(2);
    expect(html).toContain("Cooperation");
  });

  test("the sitemap omits the removed marketplace redirects", async ({ request }) => {
    const response = await request.get("/sitemap.xml");
    expect(response.ok()).toBeTruthy();
    const xml = await response.text();
    for (const locale of ["uz", "ru", "en"]) {
      expect(xml).not.toContain(`<loc>https://manzilgroup.uz/${locale}/discover</loc>`);
    }
  });
});
