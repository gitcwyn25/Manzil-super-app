import { expect, test } from "@playwright/test";

const discoverUrl = "https://discover.manzilgroup.uz/";
const reviewsUrl = "https://review.manzilgroup.uz/";

test.describe("Manzil app hub", () => {
  test("the public unprefixed URL reaches the default-language hub", async ({ request }) => {
    const response = await request.get("/discover", { maxRedirects: 0 });
    expect(response.status()).toBe(307);
    expect(new URL(response.headers().location, response.url()).pathname).toBe("/uz/discover");
  });

  for (const locale of ["uz", "ru", "en"] as const) {
    test(`/${locale}/discover renders a localized hub with independent app destinations`, async ({ request }) => {
      const response = await request.get(`/${locale}/discover`, { maxRedirects: 0 });
      expect(response.status()).toBe(200);
      const html = await response.text();
      expect(html).toContain("data-discover-hub");
      expect(html).toContain(`href="${discoverUrl}"`);
      expect(html).toContain(`href="${reviewsUrl}"`);
      expect(html).toContain(`rel="canonical" href="https://manzilgroup.uz/${locale}/discover"`);
      expect(html).toContain("Manzil Discover");
      expect(html).toContain("Manzil Reviews");
      expect(html).not.toContain("data-shell=\"workspace\"");
    });
  }

  test("old marketplace filters do not become app parameters", async ({ request }) => {
    const response = await request.get("/en/discover?q=coffee&category=cafes", { maxRedirects: 0 });
    expect(response.status()).toBe(200);
    const html = await response.text();
    expect(html).toContain(`href="${discoverUrl}"`);
    expect(html).toContain(`href="${reviewsUrl}"`);
    expect(html).not.toContain(`${discoverUrl}?`);
  });

  test("desktop and mobile navigation lead to the hub and retain Cooperation", async ({ request }) => {
    const response = await request.get("/en");
    expect(response.ok()).toBeTruthy();
    const html = await response.text();
    expect(html.split('href="/en/discover"').length - 1).toBeGreaterThanOrEqual(2);
    expect(html).toContain("Cooperation");
  });

  test("the sitemap includes each public hub locale", async ({ request }) => {
    const response = await request.get("/sitemap.xml");
    expect(response.ok()).toBeTruthy();
    const xml = await response.text();
    for (const locale of ["uz", "ru", "en"]) {
      expect(xml).toContain(`<loc>https://manzilgroup.uz/${locale}/discover</loc>`);
    }
  });

  test("Google ownership verification remains available at the root", async ({ request }) => {
    const response = await request.get("/google59f31b8e52736256.html", { maxRedirects: 0 });
    expect(response.status()).toBe(200);
    expect((await response.text()).trim()).toBe("google-site-verification: google59f31b8e52736256.html");
  });
});
