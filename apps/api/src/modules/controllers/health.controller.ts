import { Controller, Get } from "@nestjs/common";
import { SkipThrottle } from "@nestjs/throttler";
import { CacheService } from "../cache/cache.service";
import { PrismaService } from "../prisma.service";

/**
 * Exempt from rate limiting: Railway's deploy healthcheck and the CI smoke test
 * poll this endpoint repeatedly from a single address. Throttling it would make
 * a healthy deploy fail its own health gate.
 */
@SkipThrottle()
@Controller("health")
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService
  ) {}

  @Get()
  async health() {
    let database: "up" | "down" = "down";

    try {
      await this.prisma.$queryRaw`SELECT 1`;
      database = "up";
    } catch {
      database = "down";
    }

    return {
      data: {
        ok: database === "up",
        service: "manzil-api",
        database,
        cache: this.cache.backend
      }
    };
  }
}
