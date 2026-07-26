import { Module } from "@nestjs/common";
import { CacheModule } from "../cache/cache.module";
import { RedisThrottlerStorage } from "./throttler-redis.storage";

/**
 * Exports the rate-limit storage so `ThrottlerModule.forRootAsync` can inject
 * it. Kept separate from AppModule to avoid a circular import: AppModule
 * imports ThrottlerModule, which needs the storage AppModule would otherwise
 * be providing.
 */
@Module({
  imports: [CacheModule],
  providers: [RedisThrottlerStorage],
  exports: [RedisThrottlerStorage]
})
export class SecurityModule {}
