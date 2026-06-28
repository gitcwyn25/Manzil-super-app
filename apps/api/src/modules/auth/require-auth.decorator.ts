import { SetMetadata } from "@nestjs/common";

export const REQUIRE_AUTH_KEY = "requireAuth";

export function RequireAuth() {
  return SetMetadata(REQUIRE_AUTH_KEY, true);
}
