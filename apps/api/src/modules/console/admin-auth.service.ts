import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma.service";
import type { ManzilActor } from "../auth/auth.types";

export type ResolvedAdmin = {
  id: string;
  email: string;
  name: string;
  permissions: Set<string>;
  roles: string[];
};

@Injectable()
export class AdminAuthService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Resolves the AdminUser for an authenticated actor and flattens their
   * role permissions into a set. Matches by Clerk id (production) or by the
   * actor's user id / linked user (dev-header impersonation and linked users).
   * Returns null when the actor is not an active admin.
   */
  async resolveAdmin(actor: ManzilActor): Promise<ResolvedAdmin | null> {
    const candidates = [actor.clerkId, actor.userId].filter(Boolean) as string[];
    if (candidates.length === 0) return null;

    const admin = await this.prisma.adminUser.findFirst({
      where: {
        isActive: true,
        OR: [{ clerkId: { in: candidates } }, { userId: { in: candidates } }]
      },
      include: {
        roles: {
          include: {
            role: { include: { permissions: { include: { permission: true } } } }
          }
        }
      }
    });

    if (!admin) return null;

    const permissions = new Set<string>();
    const roles: string[] = [];
    for (const link of admin.roles) {
      roles.push(link.role.slug);
      for (const rp of link.role.permissions) {
        permissions.add(rp.permission.slug);
      }
    }

    // Best-effort last-login stamp; never blocks the request.
    void this.prisma.adminUser
      .update({ where: { id: admin.id }, data: { lastLoginAt: new Date() } })
      .catch(() => undefined);

    return { id: admin.id, email: admin.email, name: admin.name, permissions, roles };
  }
}
