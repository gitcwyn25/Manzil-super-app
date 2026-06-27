import { Controller, Get } from "@nestjs/common";
import { DatabaseRepository } from "../repositories/database.repository";

@Controller("admin")
export class AdminController {
  constructor(private readonly repository: DatabaseRepository) {}

  @Get("overview")
  async overview() {
    return {
      data: await this.repository.getAdminOverview()
    };
  }
}
