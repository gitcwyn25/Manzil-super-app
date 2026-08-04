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
 * `actor` is accepted purely for source compatibility with existing callers
 * (`PermissionGuard`, `ConsoleAuthController#session`) that still resolve a
 * Clerk actor upstream before calling in here — `resolveAdmin` never reads
 * it. See the comment on `resolveAdmin` for why.
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
   * Resolves the current admin from a verified session cookie ONLY.
   *
   * The admin console used to also accept a Clerk actor here (matched by
   * `clerkId`/`userId`) as a second way in. Product decision: exactly one
   * door. `identity.actor`, even though callers upstream (`PermissionGuard`,
   * `ConsoleAuthController#session`) still resolve and pass one, is
   * deliberately never consulted below.
   *
   * `AdminUser.clerkId` stays in the schema — existing rows carry it, and
   * dropping a column is not reversible — but it is no longer a credential.
   *
   * Recovery: there is now no "forgot password" flow for the credential
   * admin. Losing the password is recovered by re-running
   * `packages/db/prisma/seed-admin-credentials.ts` with a new
   * `ADMIN_BOOTSTRAP_PASSWORD` in the root `.env` — it upserts by
   * `username` and overwrites `passwordHash`, so re-running it is safe.
   */
  async resolveAdmin(identity: AdminIdentity): Promise<ResolvedAdmin | null> {
    if (!identity.sessionAdminId) {
      return null;
    }

    return this.loadResolvedAdminById(identity.sessionAdminId);
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
