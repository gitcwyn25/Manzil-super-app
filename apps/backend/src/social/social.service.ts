import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/database/prisma.service';

@Injectable()
export class SocialService {
  constructor(private prisma: PrismaService) {}

  async followUser(followerId: string, followedId: string) {
    return this.prisma.follow.create({
      data: { followerId, followedId },
    });
  }

  async unfollowUser(followerId: string, followedId: string) {
    return this.prisma.follow.deleteMany({
      where: { followerId, followedId },
    });
  }

  async getUserFollowers(userId: string) {
    return this.prisma.follow.findMany({
      where: { followedId: userId },
      include: { follower: true },
    });
  }

  async savePlace(userId: string, businessId: string) {
    return this.prisma.save.create({
      data: { userId, businessId },
    });
  }

  async unsavePlace(userId: string, businessId: string) {
    return this.prisma.save.deleteMany({
      where: { userId, businessId },
    });
  }
}
