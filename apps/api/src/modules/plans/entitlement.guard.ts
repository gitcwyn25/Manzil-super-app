import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { PrismaService } from "../prisma.service";
import { PlansRepository } from "./plans.repository";
import { REQUIRE_ENTITLEMENT_KEY } from "./require-entitlement.decorator";

type EntitlementRequest = {
  params?: Record<string, string>;
  entitlementError?: { key: string; requiredTier: string };
};

/**
 * Server-side plan entitlement enforcement. Resolves the target business from
 * the route param (`slug` or `businessId`), loads its plan's entitlement keys,
 * and rejects (402 Payment Required semantics via 403) if the required key is
 * absent. Runs after auth/ownership guards.
 */
@Injectable()
export class EntitlementGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
    private readonly plans: PlansRepository
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const key = this.reflector.getAllAndOverride<string>(REQUIRE_ENTITLEMENT_KEY, [
      context.getHandler(),
      context.getClass()
    ]);
    if (!key) return true;

    const request = context.switchToHttp().getRequest<EntitlementRequest>();
    const slug = request.params?.slug;
    const businessIdParam = request.params?.businessId ?? request.params?.id;

    const business = slug
      ? await this.prisma.business.findUnique({ where: { slug }, select: { id: true } })
      : businessIdParam
        ? await this.prisma.business.findUnique({ where: { id: businessIdParam }, select: { id: true } })
        : null;

    if (!business) {
      // Let the downstream handler produce the canonical 404.
      return true;
    }

    const entitlements = await this.plans.getEntitlements(business.id);
    if (!entitlements.has(key)) {
      throw new ForbiddenException({
        message: `This feature requires a plan that includes '${key}'.`,
        code: "UPGRADE_REQUIRED",
        entitlement: key
      });
    }

    return true;
  }
}
