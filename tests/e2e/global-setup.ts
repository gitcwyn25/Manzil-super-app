import { chromium, type FullConfig } from "@playwright/test";
import { clerk, clerkSetup } from "@clerk/testing/playwright";
import { ensureClerkTestUser, E2E_USER } from "./fixtures/clerk-user";
import { resetE2EReviews, seedE2EData } from "./fixtures/seed";
import path from "node:path";

export const STORAGE_STATE = path.join(__dirname, ".auth", "user.json");

/**
 * Provisions a real signed-in session before the suite runs.
 *
 * The session is genuine: `clerkSetup` obtains a Testing Token (which bypasses
 * bot protection, not authentication), and `clerk.signIn` performs a real
 * password sign-in against the Clerk test instance. The token the browser then
 * carries is verified by `ManzilAuthGuard` through the same
 * `verifyToken(...)` path production uses.
 *
 * A hand-rolled JWT would have been far simpler and would have tested nothing:
 * it would exercise a code path that does not exist in production, and would
 * keep passing if real Clerk verification broke — which is precisely the class
 * of failure this suite exists to catch.
 */
async function globalSetup(config: FullConfig) {
  const baseURL = process.env.BASE_URL ?? config.projects[0]?.use?.baseURL ?? "http://localhost:3000";

  // Obtains the Testing Token from Clerk. Requires CLERK_PUBLISHABLE_KEY and
  // CLERK_SECRET_KEY; without them the authenticated specs cannot run.
  await clerkSetup();

  const { clerkId, email } = await ensureClerkTestUser();
  const seeded = await seedE2EData(clerkId, email);
  await resetE2EReviews();

  const browser = await chromium.launch();
  const page = await browser.newPage({ baseURL });

  try {
    // Sign-in must happen on a page served by the app, so Clerk's client is
    // loaded and the resulting session cookie is scoped to the right origin.
    await page.goto("/uz");
    await clerk.loaded({ page });

    // `email_code`, not `password`. This Clerk instance does not have password
    // sign-in enabled, and `clerk.signIn` with the password strategy returns
    // successfully while leaving `Clerk.user` null — a silent no-op that
    // produced a storageState with no `__session` cookie. The `+clerk_test`
    // address makes the emailed code deterministic, so no inbox is involved.
    await clerk.signIn({
      page,
      signInParams: {
        strategy: "email_code",
        identifier: E2E_USER.email
      }
    });

    // `clerk.signIn` establishes the session in Clerk's client, but the
    // server-readable `__session` cookie is only issued once the app has
    // handshaked with Clerk on a subsequent request. Saving storageState
    // before that lands captures `__client_uat` without `__session`, so
    // server components calling `auth()` still see a signed-out user — which
    // is exactly how the registration specs failed.
    // Polled through the context API rather than `document.cookie`, because
    // `__session` is HttpOnly and therefore invisible to page scripts.
    let hasSession = false;

    for (let attempt = 0; attempt < 10 && !hasSession; attempt += 1) {
      await page.goto("/uz/dashboard");
      await page.waitForLoadState("networkidle");

      const cookies = await page.context().cookies();
      hasSession = cookies.some((cookie) => cookie.name === "__session");

      if (!hasSession) await page.waitForTimeout(1000);
    }

    // Prove the session actually took before saving it. A storageState
    // captured from a failed sign-in would make every downstream spec fail for
    // a misleading reason, which is worse than failing here.
    if (!hasSession) {
      throw new Error(
        "Clerk sign-in did not yield a __session cookie; server-side auth() would see a signed-out user."
      );
    }

    await page.context().storageState({ path: STORAGE_STATE });

    console.log(
      `[e2e] signed in as ${E2E_USER.email}; seeded business ${seeded.businessSlug}, terms v${seeded.termsVersion}`
    );
  } finally {
    await browser.close();
  }
}

export default globalSetup;
