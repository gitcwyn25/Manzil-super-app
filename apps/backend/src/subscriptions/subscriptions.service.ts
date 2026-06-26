import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/database/prisma.service';

@Injectable()
export class SubscriptionsService {
  constructor(private prisma: PrismaService) {}

  async getUserSubscription(businessId: string) {
    return this.prisma.subscription.findUnique({
      where: { businessId },
    });
  }

  async createSubscription(businessId: string, tier: string) {
    return this.prisma.subscription.create({
      data: { businessId, tier },
    });
  }

  async upgradeSubscription(businessId: string, newTier: string) {
    return this.prisma.subscription.update({
      where: { businessId },
      data: { tier: newTier },
    });
  }
}
