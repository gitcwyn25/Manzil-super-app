import { Body, Controller, Post } from "@nestjs/common";
import { DatabaseRepository } from "../repositories/database.repository";

@Controller("auth")
export class AuthController {
  constructor(private readonly repository: DatabaseRepository) {}

  @Post("sync")
  async syncUser(@Body() body: { clerkId?: string; email?: string; displayName?: string; locale?: string }) {
    return {
      data: await this.repository.syncUser(body)
    };
  }
}
