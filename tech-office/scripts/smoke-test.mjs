#!/usr/bin/env node
/**
 * Post-deploy smoke test.
 *
 * Railway's healthcheck already gates a deploy on `/v1/health` returning 200
 * before traffic switches over — but it only checks that one endpoint, once,
 * and never again afterwards. This verifies the deployment is actually serving
 * the API correctly: that the database is reachable *through* the app, that
 * public reads work, and that the security controls added in Track 1 are live.
 *
 * Exits non-zero on the first hard failure so the workflow can roll back.
 *
 * Usage: node smoke-test.mjs <base-url>
 *   e.g. node smoke-test.mjs https://api.manzil.uz
 */

const baseUrl = (process.argv[2] ?? process.env.SMOKE_BASE_URL ?? "").replace(/\/$/, "");

if (!baseUrl) {
  console.error("Usage: node smoke-test.mjs <base-url>");
  process.exit(2);
}

const TIMEOUT_MS = 15_000;
const RETRIES = 5;
const RETRY_DELAY_MS = 6_000;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

const results = [];

function record(name, ok, detail) {
  results.push({ name, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
}

/**
 * Retries only the first check. A container that just started may still be
 * warming; every later check runs once, because by then the service has already
 * proven it is up and a failure is a real defect rather than a cold start.
 */
async function waitForHealth() {
  for (let attempt = 1; attempt <= RETRIES; attempt += 1) {
    try {
      const response = await fetchWithTimeout(`${baseUrl}/v1/health`);
      const body = await response.json().catch(() => null);

      if (response.status === 200 && body?.data?.ok === true) {
        record("health returns 200 and ok:true", true, `database=${body.data.database}`);
        return body;
      }

      console.log(`  attempt ${attempt}/${RETRIES}: status=${response.status} ok=${body?.data?.ok}`);
    } catch (error) {
      console.log(`  attempt ${attempt}/${RETRIES}: ${error.message}`);
    }

    if (attempt < RETRIES) await sleep(RETRY_DELAY_MS);
  }

  record("health returns 200 and ok:true", false, `no healthy response after ${RETRIES} attempts`);
  return null;
}

async function main() {
  console.log(`Smoke testing ${baseUrl}\n`);

  const health = await waitForHealth();

  if (!health) {
    console.error("\nHealth check never passed — aborting.");
    process.exit(1);
  }

  // The app reports its own database connectivity; a 200 with database:"down"
  // means the process is up but useless, which the platform check would miss.
  record(
    "database reachable from the app",
    health.data.database === "up",
    `database=${health.data.database}`
  );

  // Public read path — exercises Prisma + serialization end to end.
  try {
    const response = await fetchWithTimeout(`${baseUrl}/v1/categories`);
    const body = await response.json().catch(() => null);
    record(
      "GET /v1/categories returns data",
      response.status === 200 && Array.isArray(body?.data?.categories ?? body?.data),
      `status=${response.status}`
    );
  } catch (error) {
    record("GET /v1/categories returns data", false, error.message);
  }

  // Public business reads must not expose suspended or merged listings. This
  // catches a stale API deployment even when health and basic reads succeed.
  try {
    const response = await fetchWithTimeout(`${baseUrl}/v1/businesses`);
    const body = await response.json().catch(() => null);
    const businesses = body?.data?.businesses;
    const visible = Array.isArray(businesses)
      && businesses.every((business) => business?.status !== "suspended" && !business?.mergedIntoId);
    record(
      "public business list excludes suspended and merged listings",
      response.status === 200 && visible,
      `status=${response.status} count=${Array.isArray(businesses) ? businesses.length : "invalid"}`
    );
  } catch (error) {
    record("public business list excludes suspended and merged listings", false, error.message);
  }

  // Search is a separate public read path and must apply the same visibility
  // predicate as the directory list.
  try {
    const response = await fetchWithTimeout(`${baseUrl}/v1/search?q=ravotsoy`);
    const body = await response.json().catch(() => null);
    const businesses = body?.data?.businesses;
    const visible = Array.isArray(businesses)
      && businesses.every((business) => business?.status !== "suspended" && !business?.mergedIntoId);
    record(
      "public search excludes suspended and merged listings",
      response.status === 200 && visible,
      `status=${response.status} count=${Array.isArray(businesses) ? businesses.length : "invalid"}`
    );
  } catch (error) {
    record("public search excludes suspended and merged listings", false, error.message);
  }

  // Legal identity fields belong to owner/admin views, never anonymous public
  // responses. Keep this assertion on a list endpoint so it covers the normal
  // catalog serialization path rather than only a special-case fixture.
  try {
    const response = await fetchWithTimeout(`${baseUrl}/v1/businesses`);
    const body = await response.json().catch(() => null);
    const businesses = body?.data?.businesses;
    const omitted = Array.isArray(businesses)
      && businesses.every((business) => !("legalName" in business) && !("taxId" in business));
    record(
      "public business list omits legal identity fields",
      response.status === 200 && omitted,
      `status=${response.status} count=${Array.isArray(businesses) ? businesses.length : "invalid"}`
    );
  } catch (error) {
    record("public business list omits legal identity fields", false, error.message);
  }

  // Security headers must survive the deploy — a stripped helmet would be
  // invisible without an explicit assertion.
  try {
    const response = await fetchWithTimeout(`${baseUrl}/v1/health`);
    const csp = response.headers.get("content-security-policy");
    const nosniff = response.headers.get("x-content-type-options");
    record(
      "security headers present",
      Boolean(csp) && nosniff === "nosniff",
      `csp=${csp ? "set" : "MISSING"} nosniff=${nosniff ?? "MISSING"}`
    );
  } catch (error) {
    record("security headers present", false, error.message);
  }

  // Protected route must reject anonymous callers. A deploy that accidentally
  // disables the auth guard would still pass a plain health check.
  try {
    const response = await fetchWithTimeout(`${baseUrl}/v1/auth/me`);
    record(
      "protected route rejects anonymous access",
      response.status === 401 || response.status === 403,
      `status=${response.status}`
    );
  } catch (error) {
    record("protected route rejects anonymous access", false, error.message);
  }

  const failed = results.filter((result) => !result.ok);

  console.log(`\n${results.length - failed.length}/${results.length} checks passed`);

  if (failed.length > 0) {
    console.error(`\nFAILED: ${failed.map((f) => f.name).join(", ")}`);
    process.exit(1);
  }

  console.log("Smoke test passed.");
}

main().catch((error) => {
  console.error(`Smoke test crashed: ${error.stack ?? error.message}`);
  process.exit(1);
});
