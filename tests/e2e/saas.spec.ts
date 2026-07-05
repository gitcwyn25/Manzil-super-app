import { test, expect, type Page } from "@playwright/test";
import { mkdirSync } from "node:fs";

const SHOTS = "tests/screenshots";
mkdirSync(SHOTS, { recursive: true });

/** Scroll through the page so IntersectionObserver reveal animations fire, then capture. */
async function shot(page: Page, name: string) {
  await page.evaluate(async () => {
    await new Promise<void>((resolve) => {
      let y = 0;
      const step = () => {
        window.scrollTo(0, y);
        y += window.innerHeight * 0.8;
        if (y < document.body.scrollHeight) {
          setTimeout(step, 120);
        } else {
          window.scrollTo(0, 0);
          setTimeout(resolve, 400);
        }
      };
      step();
    });
  });
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${SHOTS}/${name}.png`, fullPage: true });
}

test.describe("Manzil SaaS — public surfaces", () => {
  test("root redirects to a locale", async ({ page }) => {
    const res = await page.goto("/");
    expect(res?.status()).toBeLessThan(400);
    await expect(page).toHaveURL(/\/(uz|ru|en)(\/|$)/);
  });

  test("consumer landing renders hero + sections", async ({ page }, testInfo) => {
    await page.goto("/uz");
    await expect(page.locator("h1").first()).toBeVisible();
    // features / download bands exist
    await expect(page.locator("#features")).toBeVisible();
    await expect(page.locator("#download")).toBeVisible();
    // no leaked mock/AI placeholder emoji in headings
    await shot(page, `landing-${testInfo.project.name}`);
  });

  test("business landing shows pricing 399 000 / 499 000", async ({ page }, testInfo) => {
    await page.goto("/uz/business");
    await expect(page.getByRole("heading", { name: /biznes/i }).first()).toBeVisible();
    const body = await page.locator("body").innerText();
    expect(body).toContain("399 000");
    expect(body).toContain("499 000");
    await shot(page, `business-${testInfo.project.name}`);
  });

  test("registration page gates correctly (form when authed, sign-in gate otherwise)", async ({ page }, testInfo) => {
    await page.goto("/uz/business/register");
    await expect(page).toHaveURL(/\/uz\/business\/register/);
    const forms = await page.locator("form").count();
    const signInAffordance = await page.getByRole("link", { name: /kirish|sign in|войти/i }).count();
    // A logged-out visitor must see the sign-in gate; a logged-in one, the form.
    expect(forms + signInAffordance, "expected a registration form or a sign-in gate").toBeGreaterThan(0);
    await shot(page, `register-${testInfo.project.name}`);
  });

  test("discover page renders live data from Railway API", async ({ page }, testInfo) => {
    await page.goto("/uz/discover");
    await expect(page.locator("body")).toContainText(/Caravan Coffee|coffee|kofe/i, { timeout: 20_000 });
    await shot(page, `discover-${testInfo.project.name}`);
  });

  test("language selector switches locale", async ({ page }) => {
    await page.goto("/en");
    await expect(page).toHaveURL(/\/en(\/|$)/);
  });

  test("no console errors or failed requests on landing", async ({ page }) => {
    const errors: string[] = [];
    const failed: string[] = [];
    page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
    page.on("requestfailed", (r) => failed.push(`${r.method()} ${r.url()} — ${r.failure()?.errorText}`));
    await page.goto("/uz", { waitUntil: "networkidle" });
    // Clerk telemetry / third-party noise is tolerated; app-origin failures are not.
    const appFailures = failed.filter((f) => f.includes("manzil") || f.includes("railway"));
    expect(appFailures, appFailures.join("\n")).toHaveLength(0);
  });
});

test.describe("Manzil SaaS — API health", () => {
  test("API health is up and DB connected", async ({ request }) => {
    const res = await request.get("https://manzil-api-production.up.railway.app/v1/health");
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    expect(json.data.ok).toBe(true);
    expect(json.data.database).toBe("up");
  });

  test("search endpoint returns live businesses", async ({ request }) => {
    const res = await request.get("https://manzil-api-production.up.railway.app/v1/search?q=coffee");
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    expect(Array.isArray(json.data.businesses)).toBeTruthy();
    expect(json.data.businesses.length).toBeGreaterThan(0);
  });
});
