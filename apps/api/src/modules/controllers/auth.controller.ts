import { Body, Controller, Post } from "@nestjs/common";

@Controller("auth")
export class AuthController {
  @Post("sync")
  syncUser(@Body() body: { clerkId?: string; email?: string; displayName?: string; locale?: string }) {
    return {
      data: {
        id: body.clerkId ?? "demo_user",
        email: body.email,
        displayName: body.displayName ?? "Demo User",
        locale: body.locale ?? "uz",
        role: "consumer"
      }
    };
  }
}
