import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { UserRole } from "@manzil/shared";
import { ROLES_KEY } from "./roles.decorator";

type RequestWithHeaders = {
  headers: Record<string, string | string[] | undefined>;
};

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext) {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass()
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithHeaders>();
    const role = this.getRoleFromRequest(request);

    if (!role) {
      throw new UnauthorizedException("Authentication required");
    }

    if (!requiredRoles.includes(role)) {
      throw new ForbiddenException("Insufficient role");
    }

    return true;
  }

  private getRoleFromRequest(request: RequestWithHeaders): UserRole | undefined {
    if (process.env.NODE_ENV === "production" || process.env.MANZIL_DEV_AUTH === "false") {
      return undefined;
    }

    const headerRole = this.getHeader(request, "x-manzil-role");

    if (headerRole === "admin" || headerRole === "business_owner" || headerRole === "consumer") {
      return headerRole;
    }

    return undefined;
  }

  private getHeader(request: RequestWithHeaders, name: string) {
    const value = request.headers[name];
    return Array.isArray(value) ? value[0] : value;
  }
}
