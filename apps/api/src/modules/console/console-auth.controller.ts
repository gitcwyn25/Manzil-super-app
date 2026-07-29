import {
  Controller,
  Get,
  HttpCode,
  InternalServerErrorException,
  Ip,
  Logger,
  Post,
  Req,
  Res,
  UnauthorizedException,
  Body
} from "@nestjs/common";
import { AdminAuthService } from "./admin-auth.service";
import { ClerkAuthService } from "../auth/clerk-auth.service";
import { PrismaService } from "../prisma.service";
import { writeAudit } from "./audit.util";
import { ConsoleLoginDto } from "./console-auth.dto";
import {
  ADMIN_SESSION_COOKIE_NAME,
  ADMIN_SESSION_COOKIE_PATH,
  readCookieValue,
  signAdminSession,
  verifyAdminSession
} from "./admin-session.util";
import { ThrottleAdminLogin } from "../security/throttle.config";
import type { ManzilRequest } from "../auth/auth.types";

/** Identical response for every failure mode — unknown username, wrong
 * password, and a deactivated account all read the same to the caller. */
const GENERIC_LOGIN_FAILURE = "Invalid username or password";

type ConsoleAuthRequest = ManzilRequest & { socket?: { remoteAddress?: string } };

/** Minimal shape actually used from the Express response — avoids depending
 * on `@types/express` (not installed in this workspace) just to set a cookie. */
type CookieCapableResponse = {
  cookie(name: string, value: string, options: Record<string, unknown>): void;
  clearCookie(name: string, options: Record<string, unknown>): void;
};

function cookieOptions(maxAgeMs?: number) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    // `secure` requires HTTPS; only enforced in production so local HTTP dev
    // still works. Dev/staging still get httpOnly + sameSite=lax.
    secure: process.env.NODE_ENV === "production",
    path: ADMIN_SESSION_COOKIE_PATH,
    ...(maxAgeMs !== undefined ? { maxAge: maxAgeMs } : {})
  };
}

/**
 * Admin console credential authentication — sign-in with a username/password
 * for admins who have no Clerk identity. Deliberately a separate, flat
 * controller rather than routes on `ConsoleController`: that controller's
 * class-level `PermissionGuard` would reject an unauthenticated login attempt
 * before the handler ever ran.
 */
@Controller("console/auth")
export class ConsoleAuthController {
  private readonly logger = new Logger(ConsoleAuthController.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly adminAuth: AdminAuthService,
    private readonly clerkAuth: ClerkAuthService
  ) {}

  @Post("login")
  @ThrottleAdminLogin()
  @HttpCode(200)
  async login(
    @Body() body: ConsoleLoginDto,
    @Req() request: ConsoleAuthRequest,
    @Res({ passthrough: true }) response: CookieCapableResponse,
    @Ip() ip: string
  ) {
    const ipAddress = ip ?? request.socket?.remoteAddress ?? null;
    const result = await this.adminAuth.verifyCredentials(body.username, body.password);

    if (result.outcome !== "success") {
      if (result.outcome === "unknown_username") {
        // No AdminUser id exists to attach an AuditLog row to (actorId is a
        // required FK) — logged here instead, username only, never the
        // password.
        this.logger.warn(`Admin login attempt for an unknown username (ip=${ipAddress ?? "unknown"})`);
      } else {
        await writeAudit(this.prisma, {
          actorId: result.adminId,
          action: "admin.login.failed",
          targetType: "AdminUser",
          targetId: result.adminId,
          reason: result.outcome,
          ipAddress
        });
      }

      throw new UnauthorizedException(GENERIC_LOGIN_FAILURE);
    }

    const admin = result.admin;

    // Sign before any success side-effect: if ADMIN_SESSION_SECRET is not
    // configured this throws, and login fails closed with no cookie issued,
    // no lastLoginAt stamp, and no "success" audit entry.
    let session: { value: string; maxAgeMs: number };
    try {
      session = signAdminSession(admin.id);
    } catch (error) {
      this.logger.error("Admin session secret is not configured; refusing to issue a session cookie", error as Error);
      throw new InternalServerErrorException("Admin login is temporarily unavailable");
    }

    response.cookie(ADMIN_SESSION_COOKIE_NAME, session.value, cookieOptions(session.maxAgeMs));

    await this.prisma.adminUser.update({ where: { id: admin.id }, data: { lastLoginAt: new Date() } });
    await writeAudit(this.prisma, {
      actorId: admin.id,
      action: "admin.login.success",
      targetType: "AdminUser",
      targetId: admin.id,
      ipAddress
    });

    return {
      data: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        permissions: [...admin.permissions],
        roles: admin.roles
      }
    };
  }

  @Post("logout")
  @HttpCode(200)
  logout(@Res({ passthrough: true }) response: CookieCapableResponse) {
    response.clearCookie(ADMIN_SESSION_COOKIE_NAME, cookieOptions());
    return { data: { ok: true } };
  }

  @Get("session")
  async session(@Req() request: ConsoleAuthRequest) {
    const cookieHeader = request.headers["cookie"];
    const rawCookieHeader = Array.isArray(cookieHeader) ? cookieHeader[0] : cookieHeader;
    const sessionValue = readCookieValue(rawCookieHeader, ADMIN_SESSION_COOKIE_NAME);
    const verified = verifyAdminSession(sessionValue);

    // Only fall back to Clerk when there is no valid session cookie — mirrors
    // PermissionGuard so this endpoint reports exactly what the guard would
    // decide for any other /console route.
    const actor = verified ? undefined : await this.clerkAuth.resolveActorFromRequest(request);

    const admin = await this.adminAuth.resolveAdmin({ sessionAdminId: verified?.adminId, actor });
    if (!admin) {
      throw new UnauthorizedException("Not authenticated");
    }

    return {
      data: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        permissions: [...admin.permissions],
        roles: admin.roles
      }
    };
  }
}
