import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { ClerkAuthService } from "../auth/clerk-auth.service";
import type { ManzilRequest } from "../auth/auth.types";
import { AdminAuthService, type ResolvedAdmin } from "./admin-auth.service";
import { REQUIRE_PERMISSION_KEY } from "./require-permission.decorator";

export type ConsoleRequest = ManzilRequest & {
  adminUser?: ResolvedAdmin;
  ip?: string;
  socket?: { remoteAddress?: string };
};

/**
 * Server-side authorization for the admin console. Resolves the Clerk actor,
 * confirms they are an active AdminUser, and enforces every declared
 * @RequirePermission. No admin endpoint is reachable without passing this.
 */
@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly clerkAuth: ClerkAuthService,
    private readonly adminAuth: AdminAuthService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required =
      this.reflector.getAllAndOverride<string[]>(REQUIRE_PERMISSION_KEY, [
        context.getHandler(),
        context.getClass()
      ]) ?? [];

    const request = context.switchToHttp().getRequest<ConsoleRequest>();
    const actor = await this.clerkAuth.resolveActorFromRequest(request);

    if (!actor?.userId) {
      throw new UnauthorizedException("Authentication required");
    }

    const admin = await this.adminAuth.resolveAdmin(actor);
    if (!admin) {
      throw new ForbiddenException("This account is not an active administrator");
    }

    request.adminUser = admin;

    for (const permission of required) {
      if (!admin.permissions.has(permission)) {
        throw new ForbiddenException(`Missing permission: ${permission}`);
      }
    }

    return true;
  }
}
