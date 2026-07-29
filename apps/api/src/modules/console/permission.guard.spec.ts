import { ExecutionContext, ForbiddenException, UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { PermissionGuard } from "./permission.guard";
import { REQUIRE_PERMISSION_KEY } from "./require-permission.decorator";

/**
 * Exercises the guard directly rather than through HTTP, mirroring how the
 * rest of this suite tests repositories/controllers with mocked collaborators
 * instead of a booted server. What matters for
 * `GET /console/notifications` (and every other `@RequirePermission` route):
 * an admin missing the declared permission gets a 403, not a silently empty
 * response — an empty list reads as "nothing to do" and would hide a
 * misconfigured grant.
 */
function makeContext(request: unknown): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => request }),
    getHandler: () => function handler() {},
    getClass: () => class Controller {}
  } as unknown as ExecutionContext;
}

function makeGuard(required: string[], adminPermissions: Set<string> | null) {
  const reflector = { getAllAndOverride: jest.fn().mockReturnValue(required) } as unknown as Reflector;
  const clerkAuth = { resolveActorFromRequest: jest.fn().mockResolvedValue({ userId: "user_1" }) };
  const adminAuth = {
    resolveAdmin: jest.fn().mockResolvedValue(
      adminPermissions
        ? { id: "admin_1", email: "a@x.com", name: "Admin", permissions: adminPermissions, roles: ["moderator"] }
        : null
    )
  };

  return new PermissionGuard(reflector, clerkAuth as never, adminAuth as never);
}

describe("PermissionGuard — @RequirePermission(\"notification.view\")", () => {
  it("rejects with 403 when the admin lacks the required permission", async () => {
    const guard = makeGuard(["notification.view"], new Set(["business.view"]));
    const request: Record<string, unknown> = {};

    await expect(guard.canActivate(makeContext(request))).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("rejects with 403 (not 401) even before checking permissions, for a non-admin authenticated user", async () => {
    const guard = makeGuard(["notification.view"], null);
    const request: Record<string, unknown> = {};

    await expect(guard.canActivate(makeContext(request))).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("rejects with 401 when there is no authenticated actor at all", async () => {
    const reflector = { getAllAndOverride: jest.fn().mockReturnValue(["notification.view"]) } as unknown as Reflector;
    const clerkAuth = { resolveActorFromRequest: jest.fn().mockResolvedValue(null) };
    const adminAuth = { resolveAdmin: jest.fn() };
    const guard = new PermissionGuard(reflector, clerkAuth as never, adminAuth as never);

    await expect(guard.canActivate(makeContext({}))).rejects.toBeInstanceOf(UnauthorizedException);
    expect(adminAuth.resolveAdmin).not.toHaveBeenCalled();
  });

  it("allows the request through when the admin holds the required permission", async () => {
    const guard = makeGuard(["notification.view"], new Set(["notification.view", "business.view"]));
    const request: Record<string, unknown> = {};

    await expect(guard.canActivate(makeContext(request))).resolves.toBe(true);
    expect(request.adminUser).toBeDefined();
  });
});

// Sanity check the decorator itself sets the metadata the guard reads.
describe("RequirePermission decorator", () => {
  it("stores the permission list under REQUIRE_PERMISSION_KEY", () => {
    class Fixture {
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      method() {}
    }
    const { RequirePermission } = require("./require-permission.decorator");
    RequirePermission("notification.view")(Fixture.prototype, "method", Object.getOwnPropertyDescriptor(Fixture.prototype, "method")!);
    const reflector = new Reflector();
    expect(reflector.get(REQUIRE_PERMISSION_KEY, Fixture.prototype.method)).toEqual(["notification.view"]);
  });
});
