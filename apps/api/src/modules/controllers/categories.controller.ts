import { Controller, Get } from "@nestjs/common";
import { DatabaseRepository } from "../repositories/database.repository";

@Controller("categories")
export class CategoriesController {
  constructor(private readonly repository: DatabaseRepository) {}

  @Get()
  async listCategories() {
    return {
      data: {
        categories: await this.repository.listCategories()
      }
    };
  }
}
