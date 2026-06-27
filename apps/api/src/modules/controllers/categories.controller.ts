import { Controller, Get } from "@nestjs/common";
import { DemoRepository } from "../repositories/demo.repository";

@Controller("categories")
export class CategoriesController {
  constructor(private readonly repository: DemoRepository) {}

  @Get()
  listCategories() {
    return {
      data: {
        categories: this.repository.listCategories()
      }
    };
  }
}
