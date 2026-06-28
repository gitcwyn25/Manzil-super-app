import { Body, Controller, Get, Headers, Post, Req, UnauthorizedException, UseGuards } from "@nestjs/common";
import type { ManzilRequest } from "../auth/auth.types";
import { ClerkAuthService } from "../auth/clerk-auth.service";
import { ManzilAuthGuard } from "../auth/manzil-auth.guard";
import { RequireAuth } from "../auth/require-auth.decorator";
import { DatabaseRepository } from "../repositories/database.repository";

@Controller("auth")
export class AuthController {
  constructor(
    private readonly repository: DatabaseRepository,
    private readonly clerkAuth: ClerkAuthService
  ) {}

  @Post("sync")
  async syncUser(@Body() body: { clerkId?: string; email?: string; displayName?: string; locale?: string }) {
    return {
      data: await this.repository.syncUser(body)
    };
  }

  @Post("session")
  async createSession(@Body() body: { token?: string }, @Headers("authorization") authorization?: string) {
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
