import { Controller, Get, UseGuards } from "@nestjs/common";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import { DatabaseRepository } from "../repositories/database.repository";

@Controller("admin")
@UseGuards(RolesGuard)
@Roles("admin")
export class AdminController {
  constructor(private readonly repository: DatabaseRepository) {}

  @Get("overview")
  async overview() {
    return {
      data: await this.repository.getAdminOverview()
    };
  }
}
