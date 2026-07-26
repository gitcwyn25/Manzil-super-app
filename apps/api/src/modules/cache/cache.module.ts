import { Global, Module } from "@nestjs/common";
import { CacheService } from "./cache.service";

/**
 * Global so every consumer (repositories, rate-limit storage) shares one
 * CacheService instance — and therefore one Redis connection. A non-global
 * module re-instantiates the provider per importing module, which would open a
 * second connection and silently split the cache namespace.
 */
@Global()
@Module({
  providers: [CacheService],
  exports: [CacheService]
})
export class CacheModule {}
