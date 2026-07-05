import { SetMetadata } from "@nestjs/common";

export const REQUIRE_ENTITLEMENT_KEY = "requireEntitlement";

/**
 * Declares the plan entitlement a business must hold to call an endpoint
 * (e.g. `booking`, `analytics.advanced`). Enforced server-side by
 * EntitlementGuard — the locked-feature UI is a sales tool, never the boundary.
 * The business is resolved from the route's `:slug` (or `:businessId`) param.
 */
export function RequireEntitlement(key: string) {
  return SetMetadata(REQUIRE_ENTITLEMENT_KEY, key);
}
