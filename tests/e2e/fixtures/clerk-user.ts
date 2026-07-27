import { createClerkClient } from "@clerk/backend";

/**
 * Dedicated end-to-end user.
 *
 * Deliberately obvious in the Clerk dashboard: this account is created by the
 * test suite in a **test** Clerk instance (pk_test_/sk_test_) and is never
 * intended to exist in production.
 */
export const E2E_USER = {
  // Clerk's `+clerk_test` convention: in a development instance these addresses
  // skip real email delivery and verification entirely. A `.test` TLD is
  // rejected outright by Clerk's address validation, so this is not merely a
  // stylistic choice.
  email: "e2e-review-bot+clerk_test@example.com",
  password: "Manzil-E2E-Passw0rd!2026",
  firstName: "E2E",
  lastName: "Review Bot"
};

export type EnsuredUser = { clerkId: string; email: string };

/**
 * Finds or creates the E2E user in Clerk, returning its id.
 *
 * Idempotent by design — the suite runs repeatedly, and a create-only path
 * would fail on the second run or, worse, accumulate accounts. Uses the real
 * Backend API rather than fabricating a session, so the token the browser ends
 * up carrying is verified by `ManzilAuthGuard` exactly as a production one is.
 */
export async function ensureClerkTestUser(): Promise<EnsuredUser> {
  const secretKey = process.env.CLERK_SECRET_KEY;

  if (!secretKey) {
    throw new Error("CLERK_SECRET_KEY is required to provision the E2E user");
  }

  if (!secretKey.startsWith("sk_test_")) {
    // Guard rail, not politeness: this function creates a user and would
    // otherwise happily do so in a live instance.
    throw new Error(
      "Refusing to provision an E2E user against a non-test Clerk instance. " +
        "CLERK_SECRET_KEY must be a sk_test_ key."
    );
  }

  const clerk = createClerkClient({ secretKey });

  const existing = await clerk.users.getUserList({
    emailAddress: [E2E_USER.email]
  });

  if (existing.data.length > 0) {
    return { clerkId: existing.data[0].id, email: E2E_USER.email };
  }

  const created = await clerk.users.createUser({
    emailAddress: [E2E_USER.email],
    password: E2E_USER.password,
    firstName: E2E_USER.firstName,
    lastName: E2E_USER.lastName,
    skipPasswordChecks: true
  });

  return { clerkId: created.id, email: E2E_USER.email };
}
