import { Body, Controller, Get, Headers, Post, Req, UnauthorizedException, UseGuards } from "@nestjs/common";
import type { ManzilRequest } from "../auth/auth.types";
import { ClerkAuthService } from "../auth/clerk-auth.service";
import { ManzilAuthGuard } from "../auth/manzil-auth.guard";
import { RequireAuth } from "../auth/require-auth.decorator";
import { DatabaseRepository } from "../repositories/database.repository";
import { ThrottleAuth } from "../security/throttle.config";
import { CreateSessionDto, SyncUserDto } from "./auth.dto";

@Controller("auth")
export class AuthController {
  constructor(
    private readonly repository: DatabaseRepository,
    private readonly clerkAuth: ClerkAuthService
  ) {}

  /**
   * Syncs the authenticated user into the local database.
   * Identity always comes from the verified Clerk token (or explicit dev
   * headers in dev mode) — never from the request body, which would allow
   * anyone to overwrite another user's record.
   */
  @Post("sync")
  @UseGuards(ManzilAuthGuard)
  @RequireAuth()
  async syncUser(
    @Body() body: SyncUserDto,
    @Req() request: ManzilRequest
  ) {
    const actor = request.manzilActor!;

    return {
      data: await this.repository.syncUser({
        clerkId: actor.clerkId,
        existingUserId: actor.userId,
        displayName: body.displayName,
        locale: body.locale
      })
    };
  }

  @Post("session")
  @ThrottleAuth()
  async createSession(@Body() body: CreateSessionDto, @Headers("authorization") authorization?: string) {
    const token = body.token ?? this.extractBearerToken(authorization);

    if (!token) {
      throw new UnauthorizedException("Clerk session token is required");
    }

    const actor = await this.clerkAuth.resolveFromClerkToken(token);

    return {
      data: {
        user: await this.repository.getUserById(actor.userId)
      }
    };
  }

  @Get("me")
  @UseGuards(ManzilAuthGuard)
  @RequireAuth()
  async getCurrentUser(@Req() request: ManzilRequest) {
    return {
      data: {
        user: await this.repository.getUserById(request.manzilActor!.userId)
      }
    };
  }

  private extractBearerToken(authorization?: string) {
    if (!authorization?.startsWith("Bearer ")) {
      return undefined;
    }

    return authorization.slice("Bearer ".length).trim();
  }
}
