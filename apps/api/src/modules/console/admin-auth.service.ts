import { Injectable } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma.service";
import type { ManzilActor } from "../auth/auth.types";
import { verifyPassword } from "./admin-password.util";

export type ResolvedAdmin = {
  id: string;
  email: string;
  name: string;
  permissions: Set<string>;
  roles: string[];
};

/**
 * Identity signals a request can carry.
 *
 * A session id is accepted only after the caller verifies the signed session
 * cookie. A Clerk actor is accepted only after `ClerkAuthService` verifies
 * the bearer token. In both cases the identity must resolve to an active
 * `AdminUser`; authentication alone never grants console access.
 */
export type AdminIdentity = {
  actor?: ManzilActor;
  /** Admin id already extracted from a *verified* session cookie signature —
   * callers must verify the cookie (see `admin-session.util`) before passing
   * this in; this service does not re-check the signature. */
  sessionAdminId?: string;
};

export type CredentialCheckResult =
  | { outcome: "success"; admin: ResolvedAdmin }
  | { outcome: "unknown_username" }
  | { outcome: "invalid_password"; adminId: string }
  | { outcome: "inactive"; adminId: string };

const ADMIN_WITH_ROLES = {
  roles: {
    include: {
      role: { include: { permissions: { include: { permission: true } } } }
    }
  }
} satisfies Prisma.AdminUserInclude;

type AdminWithRoles = Prisma.AdminUserGetPayload<{ include: typeof ADMIN_WITH_ROLES }>;

@Injectable()
export class AdminAuthService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Resolves the current admin from either a verified credential session or a
   * verified Clerk actor. The two paths are deliberately fail-closed: a
   * verified identity still needs an active AdminUser row and assigned roles.
   */
  async resolveAdmin(identity: AdminIdentity): Promise<ResolvedAdmin | null> {
    if (identity.sessionAdminId) {
      return this.loadResolvedAdminById(identity.sessionAdminId);
    }

    if (!identity.actor) {
      return null;
    }

    const identityFilters: Prisma.AdminUserWhereInput[] = [
      { userId: identity.actor.userId }
    ];
    if (identity.actor.clerkId) {
      identityFilters.push({ clerkId: identity.actor.clerkId });
    }

    const admin = await this.prisma.adminUser.findFirst({
      where: { isActive: true, OR: identityFilters },
      include: ADMIN_WITH_ROLES
    });

    return admin ? this.toResolvedAdmin(admin) : null;
  }

  /**
   * Verifies a username/password pair for the admin console credential login.
   *
   * The password hash comparison always runs — even when `username` matches
   * no admin — so an unknown-username attempt costs the same as a
   * known-username-wrong-password one. The caller (the login route) must
   * return the identical generic error for every non-`success` outcome; the
   * distinct outcomes here exist only so the route can write an accurate
   * audit entry, never to change what the client sees.
   */
  async verifyCredentials(username: string, password: string): Promise<CredentialCheckResult> {
    const row = await this.prisma.adminUser.findFirst({ where: { username } });

    const passwordOk = verifyPassword(password, row?.passwordHash);

    if (!row) {
      return { outcome: "unknown_username" };
    }
    if (!passwordOk) {
      return { outcome: "invalid_password", adminId: row.id };
    }
    if (!row.isActive) {
      return { outcome: "inactive", adminId: row.id };
    }

    const resolved = await this.loadResolvedAdminById(row.id);
    if (!resolved) {
      // isActive was just checked above; this only guards against a
      // concurrent deactivation between the two reads.
      return { outcome: "inactive", adminId: row.id };
    }

    return { outcome: "success", admin: resolved };
  }

  private async loadResolvedAdminById(id: string): Promise<ResolvedAdmin | null> {
    const admin = await this.prisma.adminUser.findFirst({
      where: { id, isActive: true },
      include: ADMIN_WITH_ROLES
    });

    return admin ? this.toResolvedAdmin(admin) : null;
  }

  private toResolvedAdmin(admin: AdminWithRoles): ResolvedAdmin {
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
