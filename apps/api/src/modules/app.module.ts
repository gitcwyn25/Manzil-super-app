import { Module } from "@nestjs/common";
import { APP_FILTER, APP_GUARD } from "@nestjs/core";
import { SentryGlobalFilter, SentryModule } from "@sentry/nestjs/setup";
import { ThrottlerModule, ThrottlerStorage } from "@nestjs/throttler";
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
import { CacheModule } from "./cache/cache.module";
import { ClerkAuthService } from "./auth/clerk-auth.service";
import { ManzilAuthGuard } from "./auth/manzil-auth.guard";
import { CrmRepository } from "./crm/crm.repository";
import { CustomersRepository } from "./crm/customers.repository";
import { SegmentsRepository } from "./crm/segments.repository";
import { LoyaltyService } from "./crm/loyalty.service";
import { CampaignsService } from "./crm/campaigns.service";
import { CampaignsRepository } from "./crm/campaigns.repository";
import { GeocodingService } from "./crm/geocoding.service";
import { R2PresignService } from "./media/r2-presign.service";
import { ConsoleController } from "./console/console.controller";
import { ConsoleRepository } from "./console/console.repository";
import { ConsoleCurationRepository } from "./console/console-curation.repository";
import { AdminAuthService } from "./console/admin-auth.service";
import { PermissionGuard } from "./console/permission.guard";
import { AlertService } from "./alerts/alert.service";
import { PlansController } from "./plans/plans.controller";
import { PlansRepository } from "./plans/plans.repository";
import { EntitlementGuard } from "./plans/entitlement.guard";
import { AnalyticsController } from "./analytics/analytics.controller";
import { AnalyticsRepository } from "./analytics/analytics.repository";
import { AnalyticsService } from "./analytics/analytics.service";
import { LegalController } from "./legal/legal.controller";
import { LegalService } from "./legal/legal.service";
import { ReviewTrustRepository } from "./reviews/review-trust.repository";
import { HomeController } from "./home/home.controller";
import { HomeRepository } from "./home/home.repository";
import { SecurityModule } from "./security/security.module";
import { RedisThrottlerStorage } from "./security/throttler-redis.storage";
import { ManzilThrottlerGuard } from "./security/manzil-throttler.guard";
import { DEFAULT_THROTTLE } from "./security/throttle.config";

@Module({
  imports: [
    SentryModule.forRoot(),
    CacheModule,
    // Storage is resolved async so it shares the CacheService Redis connection
    // rather than opening a second one (or adding a datastore just for limits).
    ThrottlerModule.forRootAsync({
      imports: [SecurityModule],
      inject: [RedisThrottlerStorage],
      useFactory: (storage: ThrottlerStorage) => ({
        throttlers: [{ name: "default", ...DEFAULT_THROTTLE }],
        storage
      })
    })
  ],
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
    SearchController,
    ConsoleController,
    PlansController,
    AnalyticsController,
    LegalController,
    HomeController
  ],
  providers: [
    // Reports unhandled exceptions to Sentry, then delegates to Nest's default
    // formatting — HttpExceptions (401/403/429) are passed through unreported.
    { provide: APP_FILTER, useClass: SentryGlobalFilter },
    // Rate limiting is global: a route is protected unless it opts out, so a
    // newly added endpoint is never silently unthrottled.
    { provide: APP_GUARD, useClass: ManzilThrottlerGuard },
    PrismaService,
    DatabaseRepository,
    CrmRepository,
    CustomersRepository,
    SegmentsRepository,
    LoyaltyService,
    CampaignsService,
    CampaignsRepository,
    GeocodingService,
    ClerkAuthService,
    ManzilAuthGuard,
    R2PresignService,
    ConsoleRepository,
    ConsoleCurationRepository,
    AdminAuthService,
    PermissionGuard,
    AlertService,
    PlansRepository,
    EntitlementGuard,
    AnalyticsService,
    AnalyticsRepository,
    LegalService,
    ReviewTrustRepository,
    HomeRepository
  ]
})
export class AppModule {}
