import { SetMetadata } from "@nestjs/common";

export const REQUIRE_PERMISSION_KEY = "requirePermission";

/**
 * Declares the permission(s) an admin must hold to call an endpoint.
 * Every admin console handler MUST carry this — including read endpoints on
 * sensitive data (PII, payouts). The PermissionGuard enforces it server-side.
 */
export function RequirePermission(...permissions: string[]) {
  return SetMetadata(REQUIRE_PERMISSION_KEY, permissions);
}
