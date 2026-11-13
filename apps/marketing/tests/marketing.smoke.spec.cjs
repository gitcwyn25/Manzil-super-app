const fs = require("node:fs/promises");
const path = require("node:path");
const { test: base, expect } = require(process.env.MANZIL_PLAYWRIGHT_TEST || "@playwright/test");

const docsDirectory = path.resolve(__dirname, "../../../docs/v3");
const localHosts = new Set(["127.0.0.1", "localhost", "[::1]"]);
const concepts = [
  ["Illustrative Manzil mobile community feed with local conversations.", 941, 1672],
  ["Illustrative Manzil mobile discovery view for places in Tashkent.", 941, 1672],
  ["Product concept connecting a community post, a place and shared experiences.", 1672, 941],
  ["Illustrative Manzil desktop community dashboard.", 1536, 1024],
];

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
        consoleWarnings: [],
        pageErrors: [],
        failedLocalResponses: [],
        externalResources: [],
        blockedExternalNavigations: [],
      };

      // Read local pages and their resources. Never follow a customer, business,
      // legal or social link to a public browser page or submit a form.
      await page.route("**/*", async (route) => {
        const request = route.request();
        const url = new URL(request.url());
        if (localHosts.has(url.hostname) || ["data:", "blob:"].includes(url.protocol)) {
          await route.continue();
          return;
        }
        if (request.isNavigationRequest()) {
          audit.blockedExternalNavigations.push(request.url());
          await route.abort("blockedbyclient");
          return;
        }
        audit.externalResources.push({ url: request.url(), type: request.resourceType() });
        // The final frontend owns its fonts and imagery, so even subresources
        // must remain local during this automated verification.
        await route.abort("blockedbyclient");
      });
      page.on("console", (message) => {
        if (message.type() === "error") audit.consoleErrors.push(message.text());
        if (message.type() === "warning") audit.consoleWarnings.push(message.text());
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
      expect.soft(audit.pageErrors, "No uncaught runtime/hydration errors").toEqual([]);
      expect.soft(audit.failedLocalResponses, "No failed local page or asset requests").toEqual([]);
      expect
        .soft(audit.blockedExternalNavigations, "No public page navigation attempted")
        .toEqual([]);
      expect.soft(audit.externalResources, "No external runtime resources requested").toEqual([]);
    },
    { auto: true },
  ],
});

async function openHome(page) {
  const response = await page.goto("/", { waitUntil: "networkidle" });
  expect(response.status()).toBe(200);
  await page.evaluate(() => document.fonts.ready);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "The intelligence layer for local markets.",
  );
}

async function assertNoHorizontalOverflow(page) {
  const layout = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    document: document.documentElement.scrollWidth,
    body: document.body.scrollWidth,
  }));
  expect(layout.document, JSON.stringify(layout)).toBeLessThanOrEqual(layout.viewport + 1);
  expect(layout.body, JSON.stringify(layout)).toBeLessThanOrEqual(layout.viewport + 1);
  return layout;
}

test("home imagery, navigation, destinations and responsive screenshots", async ({
  page,
  audit,
}, testInfo) => {
  await openHome(page);
  audit.layout = await assertNoHorizontalOverflow(page);

  const hero = page.getByAltText("The tiled dome of Chorsu Bazaar in Tashkent", { exact: true });
  await expect(hero).toBeVisible();
  expect(await hero.evaluate((image) => image.complete && image.naturalWidth > 0)).toBe(true);
  expect(localHosts.has(new URL(await hero.evaluate((image) => image.currentSrc)).hostname)).toBe(
    true,
  );

  audit.images = [];
  for (const [alt, width, height] of concepts) {
    const image = page.getByAltText(alt, { exact: true });
    await image.scrollIntoViewIfNeeded();
    await expect(image).toBeVisible();
    await expect
      .poll(() => image.evaluate((element) => element.complete && element.naturalWidth > 0))
      .toBe(true);
    const dimensions = await image.evaluate((element) => ({
      naturalWidth: element.naturalWidth,
      naturalHeight: element.naturalHeight,
      width: Number(element.getAttribute("width")),
      height: Number(element.getAttribute("height")),
      currentSrc: element.currentSrc,
      objectFit: getComputedStyle(element).objectFit,
      renderedWidth: element.getBoundingClientRect().width,
      renderedHeight: element.getBoundingClientRect().height,
    }));
    expect(dimensions.naturalWidth).toBe(width);
    expect(dimensions.naturalHeight).toBe(height);
    expect(dimensions.width).toBe(width);
    expect(dimensions.height).toBe(height);
    expect(dimensions.objectFit).toBe("contain");
    expect(dimensions.renderedWidth / dimensions.renderedHeight).toBeCloseTo(width / height, 2);
    expect(localHosts.has(new URL(dimensions.currentSrc).hostname)).toBe(true);
    audit.images.push({ alt, ...dimensions });
  }
  await expect(page.getByText("Product concept · illustrative UI", { exact: true })).toHaveCount(4);

  const anchors = await page
    .locator("a[href^='#'], a[href^='/#']")
    .evaluateAll((elements) => [
      ...new Set(elements.map((element) => element.getAttribute("href"))),
    ]);
  for (const href of anchors) {
    const id = href.slice(href.indexOf("#") + 1);
    expect(await page.locator(`[id=${JSON.stringify(decodeURIComponent(id))}]`).count(), href).toBe(
      1,
    );
  }
  const destinations = await page.locator("a[href]").evaluateAll((elements) =>
    elements.map((element) => ({
      text: element.textContent.replace(/\s+/g, " ").trim(),
      href: element.getAttribute("href"),
    })),
  );
  expect(destinations.some(({ href }) => /(?:review|discover)\.manzilgroup\.uz/.test(href))).toBe(
    false,
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
    expect(destination.href).toBe("https://business.manzilgroup.uz");
  }
  audit.destinations = destinations;

  const footer = page.getByRole("navigation", { name: "Footer", exact: true });
  await footer.scrollIntoViewIfNeeded();
  await expect(footer).toBeVisible();
  for (const [name, pathname] of [
    ["Privacy", "/en/legal/privacy"],
    ["Terms", "/en/legal/terms"],
    ["Community rules", "/en/legal/reviews"],
  ]) {
    const href = await footer.getByRole("link", { name, exact: true }).getAttribute("href");
    expect(new URL(href, "https://manzilgroup.uz").pathname).toBe(pathname);
  }

  // Capture the full composition in the supported reduced-motion state so all
  // editorial content is readable and reveal transitions cannot create blanks.
  await page.emulateMedia({ reducedMotion: "reduce" });
  const metro = page.getByAltText(
    "Ornate columns and chandeliers of Mustaqillik Maydoni metro station, Tashkent",
  );
  await metro.scrollIntoViewIfNeeded();
  await expect
    .poll(() => metro.evaluate((image) => image.complete && image.naturalWidth > 0))
    .toBe(true);
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect(page.getByRole("heading", { level: 1 })).toBeInViewport();
  await assertNoHorizontalOverflow(page);
  const screenshotDirectory = path.join(docsDirectory, "screenshots");
  await fs.mkdir(screenshotDirectory, { recursive: true });
  const viewportScreenshot = path.join(screenshotDirectory, `home-${testInfo.project.name}.png`);
  const fullScreenshot = path.join(screenshotDirectory, `home-${testInfo.project.name}-full.png`);
  await page.screenshot({ path: viewportScreenshot, animations: "disabled" });
  await page.screenshot({ path: fullScreenshot, fullPage: true, animations: "disabled" });
  await testInfo.attach("viewport screenshot", {
    path: viewportScreenshot,
    contentType: "image/png",
  });
  audit.screenshots = {
    viewport: viewportScreenshot,
    fullPage: fullScreenshot,
    reducedMotion: true,
  };
  if (page.viewportSize().width === 1440) {
    audit.screenshots.panels = [];
    for (const id of ["community", "discover", "connected"]) {
      const panelScreenshot = path.join(screenshotDirectory, `${id}-1440x900.png`);
      await page.locator(`#${id}`).screenshot({ path: panelScreenshot, animations: "disabled" });
      audit.screenshots.panels.push(panelScreenshot);
    }
    const desktopScreenshot = path.join(screenshotDirectory, "inside-app-1440x900.png");
    await page
      .locator("section")
      .filter({ has: page.locator("#app-title") })
      .screenshot({ path: desktopScreenshot, animations: "disabled" });
    audit.screenshots.panels.push(desktopScreenshot);
  }
});

test("responsive menu, keyboard containment, close and section navigation", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await openHome(page);
  const trigger = page.getByRole("button", { name: "Open menu", exact: true });
  const mainNavigation = page.getByRole("navigation", { name: "Main", exact: true });
  if (page.viewportSize().width >= 1024) {
    await expect(trigger).toBeHidden();
    await expect(mainNavigation).toBeVisible();
    await mainNavigation.getByRole("link", { name: "Discover", exact: true }).click();
    await expect(page).toHaveURL(/#discover$/);
    await expect(page.locator("#discover")).toBeInViewport();
    return;
  }
  await expect(mainNavigation).toBeHidden();
  await expect(trigger).toBeVisible();
  await trigger.click();
  const dialog = page.getByRole("dialog", { name: "Menu", exact: true });
  await expect(dialog).toBeVisible();
  await expect
    .poll(() => dialog.evaluate((element) => element.contains(document.activeElement)))
    .toBe(true);
  for (const key of ["Shift+Tab", "Tab", "Tab"]) {
    await page.keyboard.press(key);
    expect(await dialog.evaluate((element) => element.contains(document.activeElement))).toBe(true);
  }
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();

  await trigger.click();
  await dialog
    .getByRole("navigation", { name: "Mobile", exact: true })
    .getByRole("link", { name: "Community", exact: true })
    .click();
  await expect(dialog).toBeHidden();
  await expect(page).toHaveURL(/#community$/);
  await expect(page.locator("#community")).toBeInViewport();

  await trigger.click();
  await dialog.getByRole("button", { name: "Close", exact: true }).click();
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
  await assertNoHorizontalOverflow(page);
});

test("reduced motion preserves readable content and local legal pages", async ({ page, audit }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await openHome(page);
  expect(await page.evaluate(() => matchMedia("(prefers-reduced-motion: reduce)").matches)).toBe(
    true,
  );
  const hiddenEditorialContent = await page
    .locator(".reveal")
    .evaluateAll(
      (elements) =>
        elements.filter((element) => Number(getComputedStyle(element).opacity) < 1).length,
    );
  expect(hiddenEditorialContent).toBe(0);
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior)).toBe(
    "auto",
  );
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Skip to content", exact: true })).toBeFocused();

  audit.legalPages = [];
  for (const pathname of [
    "/en/legal/privacy",
    "/en/legal/terms",
    "/en/legal/reviews",
    "/en/contact",
    "/en/about",
  ]) {
    const response = await page.goto(pathname, { waitUntil: "networkidle" });
    expect(response.status(), pathname).toBe(200);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await assertNoHorizontalOverflow(page);
    audit.legalPages.push({ pathname, status: response.status(), title: await page.title() });
  }
});
