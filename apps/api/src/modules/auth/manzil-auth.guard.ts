import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { UserRole } from "@manzil/shared";
import type { ManzilRequest } from "./auth.types";
import { ClerkAuthService } from "./clerk-auth.service";
import { REQUIRE_AUTH_KEY } from "./require-auth.decorator";
import { ROLES_KEY } from "./roles.decorator";

@Injectable()
export class ManzilAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly clerkAuth: ClerkAuthService
  ) {}

  async canActivate(context: ExecutionContext) {
    const requireAuth = this.reflector.getAllAndOverride<boolean>(REQUIRE_AUTH_KEY, [
      context.getHandler(),
      context.getClass()
    ]);
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass()
    ]);
    const authRequired = requireAuth || (requiredRoles?.length ?? 0) > 0;

    if (!authRequired) {
      return true;
    }

    const request = context.switchToHttp().getRequest<ManzilRequest>();
    const actor = await this.clerkAuth.resolveActorFromRequest(request);

    if (!actor?.userId) {
      throw new UnauthorizedException("Authentication required");
    }

    request.manzilActor = actor;

    if (requiredRoles?.length && !requiredRoles.includes(actor.role)) {
      throw new ForbiddenException("Insufficient role");
    }

    return true;
  }
}
