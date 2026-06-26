import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/database/prisma.service';

@Injectable()
export class AchievementsService {
  constructor(private prisma: PrismaService) {}

  async checkAndAwardAchievements(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { reviews: true, photos: true },
    });

    // Check review count
    if (user.reviews.length >= 10) {
      await this.awardAchievement(userId, 'REVIEW_COUNT_10');
    }

    // Check photo count
    if (user.photos.length >= 5) {
      await this.awardAchievement(userId, 'PHOTO_COUNT_5');
    }
  }

  async awardAchievement(userId: string, achievementKey: string) {
    const achievement = await this.prisma.achievement.findUnique({
      where: { key: achievementKey },
    });

    if (achievement) {
      await this.prisma.userAchievement.create({
        data: { userId, achievementId: achievement.id },
      });
    }
  }
}
