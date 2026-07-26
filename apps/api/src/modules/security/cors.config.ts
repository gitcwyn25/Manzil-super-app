const DEV_FALLBACK_ORIGINS = ["http://localhost:3000", "http://localhost:3001"];

export type ResolvedCors = {
  origins: string[];
  isWildcard: boolean;
};

/**
 * Parses `WEB_ORIGIN` into an explicit allowlist.
 *
 * Returns `isWildcard: true` when the configured value would allow any origin,
 * so the caller can refuse to boot in production. Credentialed CORS with a
 * wildcard lets any website issue authenticated requests on a user's behalf.
 *
 * Outside production a missing value falls back to localhost rather than
 * failing, so `npm run dev:api` works with no env setup.
 */
export function resolveCorsOrigins(
  rawWebOrigin: string | undefined,
  nodeEnv: string | undefined
): ResolvedCors {
  const isProduction = nodeEnv === "production";

  const configured = (rawWebOrigin ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);

  const hasWildcard = configured.some((origin) => origin === "*" || origin === "true");

  if (hasWildcard) {
    return { origins: configured, isWildcard: isProduction };
  }

  if (configured.length === 0) {
    // An unset WEB_ORIGIN in production is a misconfiguration, not a reason to
    // open up: treat it as wildcard so bootstrap refuses to start.
    return { origins: DEV_FALLBACK_ORIGINS, isWildcard: isProduction };
  }

  return { origins: configured, isWildcard: false };
}
