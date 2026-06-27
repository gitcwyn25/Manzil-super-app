import { Module } from "@nestjs/common";
import { AdminController } from "./controllers/admin.controller";
import { AuthController } from "./controllers/auth.controller";
import { BusinessesController } from "./controllers/businesses.controller";
import { CategoriesController } from "./controllers/categories.controller";
import { ClaimsController } from "./controllers/claims.controller";
import { HealthController } from "./controllers/health.controller";
import { MediaController } from "./controllers/media.controller";
import { SearchController } from "./controllers/search.controller";
import { DemoRepository } from "./repositories/demo.repository";

@Module({
  controllers: [
    AdminController,
    AuthController,
    BusinessesController,
    CategoriesController,
    ClaimsController,
    HealthController,
    MediaController,
    SearchController
  ],
  providers: [DemoRepository]
})
export class AppModule {}
