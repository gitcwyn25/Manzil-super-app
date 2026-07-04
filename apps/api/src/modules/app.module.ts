import { Module } from "@nestjs/common";
import { AdminController } from "./controllers/admin.controller";
import { AuthController } from "./controllers/auth.controller";
import { BusinessesController } from "./controllers/businesses.controller";
import { CrmController } from "./controllers/crm.controller";
import { CategoriesController } from "./controllers/categories.controller";
import { ClaimsController } from "./controllers/claims.controller";
import { HealthController } from "./controllers/health.controller";
import { ListsController } from "./controllers/lists.controller";
import { MediaController } from "./controllers/media.controller";
import { OccasionsController } from "./controllers/occasions.controller";
import { ReviewsController } from "./controllers/reviews.controller";
import { SearchController } from "./controllers/search.controller";
import { PrismaService } from "./prisma.service";
import { DatabaseRepository } from "./repositories/database.repository";
import { CacheService } from "./cache/cache.service";
import { ClerkAuthService } from "./auth/clerk-auth.service";
import { ManzilAuthGuard } from "./auth/manzil-auth.guard";
import { CrmRepository } from "./crm/crm.repository";
import { GeocodingService } from "./crm/geocoding.service";
import { R2PresignService } from "./media/r2-presign.service";

@Module({
  controllers: [
    AdminController,
    AuthController,
    BusinessesController,
    CrmController,
    CategoriesController,
    ClaimsController,
    HealthController,
    ListsController,
    MediaController,
    OccasionsController,
    ReviewsController,
    SearchController
  ],
  providers: [
    PrismaService,
    CacheService,
    DatabaseRepository,
    CrmRepository,
    GeocodingService,
    ClerkAuthService,
    ManzilAuthGuard,
    R2PresignService
  ]
})
export class AppModule {}
