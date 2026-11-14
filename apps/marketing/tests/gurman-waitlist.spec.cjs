const fs = require("node:fs/promises");
const path = require("node:path");
const { test: base, expect } = require(process.env.MANZIL_PLAYWRIGHT_TEST || "@playwright/test");

const docsDirectory = path.resolve(__dirname, "../../../docs/gurman-waitlist");
const localHosts = new Set(["127.0.0.1", "localhost", "[::1]"]);
const tallyURL = "https://tally.so/r/eqJLdQ";

const test = base.extend({
  audit: [
    async ({ page, browser }, use, testInfo) => {
      const audit = {
        checkedAt: new Date().toISOString(),
        project: testInfo.project.name,
        test: testInfo.title,
        browser: browser.version(),
        viewport: page.viewportSize(),
        consoleErrors: [],
        pageErrors: [],
        failedLocalResponses: [],
        externalRequests: [],
      };
      await page.route("**/*", async (route) => {
        const url = new URL(route.request().url());
        if (localHosts.has(url.hostname) || ["data:", "blob:"].includes(url.protocol)) {
          await route.continue();
        } else {
          audit.externalRequests.push(route.request().url());
          await route.abort("blockedbyclient");
        }
      });
      page.on("console", (message) => {
        if (message.type() === "error") audit.consoleErrors.push(message.text());
      });
      page.on("pageerror", (error) => audit.pageErrors.push(error.message));
      page.on("response", (response) => {
        if (localHosts.has(new URL(response.url()).hostname) && response.status() >= 400) {
          audit.failedLocalResponses.push({ url: response.url(), status: response.status() });
        }
      });

      await use(audit);

      const directory = path.join(docsDirectory, "evidence/browser-observations");
      await fs.mkdir(directory, { recursive: true });
      const slug = testInfo.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/-$/, "");
      const output = path.join(directory, `${testInfo.project.name}-${slug}.json`);
      await fs.writeFile(output, `${JSON.stringify(audit, null, 2)}\n`);
      await testInfo.attach("browser observations", {
        path: output,
        contentType: "application/json",
      });
      expect.soft(audit.consoleErrors, "No browser console errors").toEqual([]);
      expect.soft(audit.pageErrors, "No runtime or hydration errors").toEqual([]);
      expect.soft(audit.failedLocalResponses, "No failed local page or asset requests").toEqual([]);
      expect.soft(audit.externalRequests, "No external browser requests").toEqual([]);
    },
    { auto: true },
  ],
});

async function open(page, pathname) {
  const response = await page.goto(pathname, { waitUntil: "networkidle" });
  expect(response.status(), pathname).toBe(200);
  await page.evaluate(() => document.fonts.ready);
  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  const layout = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    document: document.documentElement.scrollWidth,
    body: document.body.scrollWidth,
  }));
  expect(layout.document, JSON.stringify(layout)).toBeLessThanOrEqual(layout.viewport + 1);
  expect(layout.body, JSON.stringify(layout)).toBeLessThanOrEqual(layout.viewport + 1);
  await expect(page.locator("link[rel='canonical']")).toHaveAttribute(
    "href",
    `https://manzilgroup.uz${pathname}`,
  );
  return layout;
}

async function screenshot(page, name, testInfo) {
  const directory = path.join(docsDirectory, "screenshots");
  await fs.mkdir(directory, { recursive: true });
  const output = path.join(directory, `${name}-${testInfo.project.name}.png`);
  await page.screenshot({ path: output, fullPage: true, animations: "disabled" });
  await testInfo.attach(`${name} screenshot`, { path: output, contentType: "image/png" });
  return output;
}

test("Docs is an honest responsive overview with noindex and working section anchors", async ({
  page,
  audit,
}, testInfo) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  audit.layout = await open(page, "/docs");
  await expect(page.locator("meta[name='robots']").first()).toHaveAttribute("content", /noindex/);
  await expect(page.getByRole("main")).toContainText(
    /documentation.*(being prepared|in preparation)|preparing.*documentation/i,
  );
  await expect(page.getByRole("link", { name: /back to manzil/i }).first()).toHaveAttribute(
    "href",
    "/",
  );
  const anchors = await page
    .locator("main a[href^='#']")
    .evaluateAll((elements) => elements.map((element) => element.getAttribute("href")));
  for (const anchor of anchors) {
    expect(await page.locator(`[id=${JSON.stringify(anchor.slice(1))}]`).count(), anchor).toBe(1);
  }
  await expect(page.locator("main form, main input, main textarea")).toHaveCount(0);
  audit.screenshot = await screenshot(page, "docs", testInfo);
  const sitemap = await page.request.get("/sitemap.xml");
  expect(sitemap.status()).toBe(200);
  expect(await sitemap.text()).not.toMatch(/<loc>[^<]*\/docs(?:<|\/)/);
});

test("Gurman offers the real waitlist link without a signup form or premature success", async ({
  page,
  audit,
}, testInfo) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  audit.layout = await open(page, "/gurman");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Gurman.");
  const ctas = page.getByRole("link", { name: "Join the waitlist", exact: true });
  expect(await ctas.count()).toBeGreaterThan(0);
  for (const cta of await ctas.all()) {
    await expect(cta).toHaveAttribute("href", "/gurman/waitlist");
  }
  await expect(page.getByRole("main")).toContainText(/forthcoming|in development|being prepared/i);
  await expect(page.getByRole("link", { name: /back to manzil/i }).first()).toHaveAttribute(
    "href",
    "/",
  );
  await expect(page.locator("main form, main input, main textarea")).toHaveCount(0);
  await expect(page.getByRole("main")).not.toContainText(
    /you(?:'re| are) (?:registered|on the (?:wait)?list)|your (?:response|signup) (?:has been|is) (?:recorded|confirmed)|successfully (?:submitted|registered)/i,
  );
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior)).toBe(
    "auto",
  );
  audit.screenshot = await screenshot(page, "gurman", testInfo);
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Skip to content", exact: true })).toBeFocused();
});

test("temporary waitlist redirect has the exact destination and preserves legacy business routing", async ({
  request,
  audit,
}) => {
  audit.redirects = [];
  for (const pathname of [
    "/gurman/waitlist",
    "/gurman/waitlist?email=qa%40example.invalid&source=qa",
    "/gurman/waitlist/",
    "/en/gurman/waitlist?source=qa",
    "/uz/gurman/waitlist?source=qa",
    "/ru/gurman/waitlist?source=qa",
  ]) {
    const response = await request.get(pathname, { maxRedirects: 0 });
    expect(response.status()).toBe(307);
    expect(response.headers().location).toBe(tallyURL);
    expect(response.headers()["cache-control"]).toBe("no-store");
    audit.redirects.push({
      pathname,
      status: response.status(),
      location: response.headers().location,
    });
  }
  for (const [pathname, destination] of [
    ["/business", "https://business.manzilgroup.uz/"],
    ["/businesses", "https://business.manzilgroup.uz/"],
    ["/business/plans", "https://business.manzilgroup.uz/plans"],
    ["/businesses/register/photos", "https://business.manzilgroup.uz/register/photos"],
    ["/en/business", "https://business.manzilgroup.uz/en/business"],
    ["/uz/businesses", "https://business.manzilgroup.uz/uz/business"],
    ["/ru/business/plans", "https://business.manzilgroup.uz/ru/business/plans"],
    [
      "/en/businesses/register/photos",
      "https://business.manzilgroup.uz/en/business/register/photos",
    ],
  ]) {
    const response = await request.get(pathname, { maxRedirects: 0 });
    expect([301, 302, 307, 308]).toContain(response.status());
    expect(response.headers().location).toBe(destination);
    audit.redirects.push({
      pathname,
      status: response.status(),
      location: response.headers().location,
    });
  }
  for (const pathname of [
    "/waitlist/gurman",
    "/en/waitlist/gurman",
    "/uz/waitlist/gurman",
    "/ru/waitlist/gurman",
  ]) {
    const legacy = await request.get(pathname, { maxRedirects: 0 });
    expect(legacy.status()).toBe(307);
    expect(legacy.headers().location).toBe("/gurman");
    audit.redirects.push({
      pathname,
      status: legacy.status(),
      location: legacy.headers().location,
    });
  }
});

test("JavaScript-disabled CTA reaches the real temporary server redirect", async ({
  browser,
  baseURL,
  audit,
}, testInfo) => {
  const context = await browser.newContext({
    baseURL,
    javaScriptEnabled: false,
    viewport: testInfo.project.use.viewport,
  });
  const page = await context.newPage();
  const externalTargets = [];
  let interceptedRedirect;
  await page.route("**/*", async (route) => {
    const url = new URL(route.request().url());
    if (localHosts.has(url.hostname) && url.pathname === "/gurman/waitlist") {
      // A browser route handler is invoked only for the first URL in a redirect
      // chain. Fetch without following redirects and inspect the actual server
      // response here, then stop browser navigation at this external boundary.
      const response = await route.fetch({ maxRedirects: 0 });
      interceptedRedirect = {
        status: response.status(),
        location: response.headers().location,
        cacheControl: response.headers()["cache-control"],
      };
      await response.dispose();
      await route.fulfill({
        status: 200,
        contentType: "text/plain",
        body: "Local QA intercepted the server redirect before external navigation.",
      });
    } else if (localHosts.has(url.hostname) || ["data:", "blob:"].includes(url.protocol)) {
      await route.continue();
    } else {
      externalTargets.push(route.request().url());
      await route.abort("blockedbyclient");
    }
  });
  try {
    const response = await page.goto("/gurman", { waitUntil: "networkidle" });
    expect(response.status()).toBe(200);
    const cta = page.getByRole("link", { name: "Join the waitlist", exact: true }).first();
    await expect(cta).toBeVisible();
    await expect(cta).toHaveAttribute("href", "/gurman/waitlist");
    await cta.click();
    expect(interceptedRedirect).toEqual({
      status: 307,
      location: tallyURL,
      cacheControl: "no-store",
    });
    expect(externalTargets).toEqual([]);
    audit.noJavaScriptRedirect = {
      ...interceptedRedirect,
      interceptedBeforeExternalNavigation: true,
    };
  } finally {
    await context.close();
  }
});

test("corporate footer exposes Docs and Gurman while account and business destinations stay intact", async ({
  page,
  audit,
}) => {
  await open(page, "/");
  const footer = page.getByRole("navigation", { name: "Footer", exact: true });
  await expect(footer.getByRole("link", { name: "Docs", exact: true })).toHaveAttribute(
    "href",
    "/docs",
  );
  await expect(footer.getByRole("link", { name: "Gurman", exact: true })).toHaveAttribute(
    "href",
    "/gurman",
  );
  const destinations = await page.locator("a[href]").evaluateAll((elements) =>
    elements.map((element) => ({
      text: element.textContent.replace(/\s+/g, " ").trim(),
      href: element.getAttribute("href"),
    })),
  );
  for (const destination of destinations.filter(({ text }) =>
    /^(Get Started|Join Manzil)/.test(text),
  )) {
    const url = new URL(destination.href);
    expect(url.origin).toBe("https://app.manzilgroup.uz");
    expect(url.pathname).toBe("/auth");
    expect(url.searchParams.get("mode")).toBe("signup");
    expect(url.searchParams.get("next")).toBe("/");
  }
  for (const destination of destinations.filter(({ text }) => /^Log In/.test(text))) {
    const url = new URL(destination.href);
    expect(url.origin).toBe("https://app.manzilgroup.uz");
    expect(url.pathname).toBe("/auth");
    expect(url.searchParams.get("mode")).toBeNull();
  }
  for (const destination of destinations.filter(({ text }) => /^For Businesses/.test(text))) {
    expect(new URL(destination.href).href).toBe("https://business.manzilgroup.uz/");
  }
  expect(destinations.some(({ href }) => /(?:review|discover)\.manzilgroup\.uz/.test(href))).toBe(
    false,
  );
  audit.destinations = destinations;
});
