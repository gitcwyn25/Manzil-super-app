import { Injectable, UnauthorizedException } from "@nestjs/common";
import { createClerkClient, verifyToken } from "@clerk/backend";
import type { UserRole } from "@manzil/shared";
import type { ManzilActor, ManzilRequest } from "./auth.types";
import { DatabaseRepository } from "../repositories/database.repository";

@Injectable()
export class ClerkAuthService {
  private readonly secretKey = process.env.CLERK_SECRET_KEY;
  // Dev-header auth is strictly opt-in and never available in production.
  // Defaulting this on would let anyone forge an admin identity with a header.
  private readonly devAuthEnabled =
    process.env.MANZIL_DEV_AUTH === "true" && process.env.NODE_ENV !== "production";
  private readonly clerk = this.secretKey
    ? createClerkClient({ secretKey: this.secretKey })
    : null;

  constructor(private readonly repository: DatabaseRepository) {}

  isClerkConfigured() {
    return Boolean(this.secretKey);
  }

  allowsDevHeaders() {
    return this.devAuthEnabled && !this.isClerkConfigured();
  }

  async resolveActorFromRequest(request: ManzilRequest): Promise<ManzilActor | undefined> {
    const bearerToken = this.getBearerToken(request);

    if (bearerToken && this.clerk) {
      return this.resolveFromClerkToken(bearerToken);
    }

    if (this.allowsDevHeaders()) {
      return this.resolveFromDevHeaders(request);
    }

    return undefined;
  }

  async resolveFromClerkToken(token: string): Promise<ManzilActor> {
    if (!this.clerk || !this.secretKey) {
      throw new UnauthorizedException("Clerk is not configured");
    }

    const payload = await verifyToken(token, {
      secretKey: this.secretKey
    }).catch(() => {
      throw new UnauthorizedException("Invalid Clerk token");
    });

    const clerkId = payload.sub;

    if (!clerkId) {
      throw new UnauthorizedException("Invalid Clerk token");
    }

    const clerkUser = await this.clerk.users.getUser(clerkId).catch(() => null);
    const email = clerkUser?.emailAddresses[0]?.emailAddress;
    const displayName =
      clerkUser?.fullName ??
      ([clerkUser?.firstName, clerkUser?.lastName].filter(Boolean).join(" ") || "Manzil User");

    const user = await this.repository.syncUser({
      clerkId,
      email,
      displayName
    });

    return {
      userId: user.id,
      role: user.role,
      clerkId
    };
  }

  private resolveFromDevHeaders(request: ManzilRequest): ManzilActor | undefined {
    const role = this.getHeader(request, "x-manzil-role") as UserRole | undefined;
    const userId = this.getHeader(request, "x-manzil-user-id");

    if (!role || !userId) {
      return undefined;
    }

    if (role !== "admin" && role !== "business_owner" && role !== "consumer") {
      return undefined;
    }

    return { userId, role };
  }

  private getBearerToken(request: ManzilRequest) {
    const authorization = this.getHeader(request, "authorization");

    if (!authorization?.startsWith("Bearer ")) {
      return undefined;
    }

    return authorization.slice("Bearer ".length).trim();
  }

  private getHeader(request: ManzilRequest, name: string) {
    const value = request.headers[name];
    return Array.isArray(value) ? value[0] : value;
  }
}
