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
import { BookingsRepository } from "./crm/bookings.repository";
import { GeocodingService } from "./crm/geocoding.service";
import { R2PresignService } from "./media/r2-presign.service";
import { SupabaseStorageService } from "./media/supabase-storage.service";
import { MEDIA_STORAGE_PROVIDER } from "./media/media-storage.provider";
import { ConsoleController } from "./console/console.controller";
import { ConsoleAuthController } from "./console/console-auth.controller";
import { ConsoleRepository } from "./console/console.repository";
import { ConsoleCurationRepository } from "./console/console-curation.repository";
import { ConsoleNotificationsRepository } from "./console/console-notifications.repository";
import { ConsoleSupabaseRepository } from "./console/console-supabase.repository";
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
import { WaitlistController } from "./waitlist/waitlist.controller";
import { WaitlistRepository } from "./waitlist/waitlist.repository";
import { BillingController } from "./billing/billing.controller";
import { StripeService } from "./billing/stripe.service";
import { GurmanController } from "./gurman/gurman.controller";
import { GurmanService } from "./gurman/gurman.service";
import { CatalogRetriever, GURMAN_RETRIEVER } from "./gurman/gurman.retriever";
import { AnthropicLlm, GURMAN_LLM } from "./gurman/gurman.llm";
import { IntelligenceModule } from "./intelligence/intelligence.module";
import { IDEMPOTENCY_PROVIDERS } from "./idempotency";
import { SecurityModule } from "./security/security.module";
import { RedisThrottlerStorage } from "./security/throttler-redis.storage";
import { ManzilThrottlerGuard } from "./security/manzil-throttler.guard";
import { DEFAULT_THROTTLE } from "./security/throttle.config";

@Module({
  imports: [
    SentryModule.forRoot(),
    CacheModule,
    // Contracts only (Epic 03): provider-empty by design, so importing it is
    // a safe no-op until intelligence engines bind their tokens in later epics.
    IntelligenceModule,
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
    ConsoleAuthController,
    PlansController,
    AnalyticsController,
    LegalController,
    HomeController,
    WaitlistController,
    BillingController,
    GurmanController
  ],
  providers: [
    // Reports unhandled exceptions to Sentry, then delegates to Nest's default
    // formatting — HttpExceptions (401/403/429) are passed through unreported.
    { provide: APP_FILTER, useClass: SentryGlobalFilter },
    // Rate limiting is global: a route is protected unless it opts out, so a
    // newly added endpoint is never silently unthrottled.
    { provide: APP_GUARD, useClass: ManzilThrottlerGuard },
    // Idempotency (Epic 18) is global for the same reason: any POST carrying
    // an `Idempotency-Key` is replay-safe unless it declares @NoIdempotency.
    // A POST without the header behaves exactly as it did before.
    ...IDEMPOTENCY_PROVIDERS,
    PrismaService,
    DatabaseRepository,
    CrmRepository,
    CustomersRepository,
    SegmentsRepository,
    LoyaltyService,
    CampaignsService,
    CampaignsRepository,
    BookingsRepository,
    GeocodingService,
    ClerkAuthService,
    ManzilAuthGuard,
    R2PresignService,
    SupabaseStorageService,
    MEDIA_STORAGE_PROVIDER,
    ConsoleRepository,
    ConsoleCurationRepository,
    ConsoleNotificationsRepository,
    ConsoleSupabaseRepository,
    AdminAuthService,
    PermissionGuard,
    AlertService,
    PlansRepository,
    EntitlementGuard,
    AnalyticsService,
    AnalyticsRepository,
    LegalService,
    ReviewTrustRepository,
    HomeRepository,
    WaitlistRepository,
    StripeService,
    // Interface + token pair (not a concrete class) so a future VectorRetriever
    // can replace CatalogRetriever without touching GurmanService.
    { provide: GURMAN_RETRIEVER, useClass: CatalogRetriever },
    { provide: GURMAN_LLM, useClass: AnthropicLlm },
    GurmanService
  ]
})
export class AppModule {}
