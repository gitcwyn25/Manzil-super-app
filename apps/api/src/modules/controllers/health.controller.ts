import { Controller, Get } from "@nestjs/common";
import { CacheService } from "../cache/cache.service";
import { PrismaService } from "../prisma.service";

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
