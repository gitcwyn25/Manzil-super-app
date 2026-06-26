import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/database/prisma.service';

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}

  async create(businessId: string, userId: string, data: any) {
    return this.prisma.review.create({
      data: {
        businessId,
        userId,
        ...data,
      },
    });
  }

  async findByBusiness(businessId: string) {
    return this.prisma.review.findMany({
      where: { businessId },
      include: { author: true, replies: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async replyToReview(reviewId: string, userId: string, text: string) {
    return this.prisma.reviewReply.create({
      data: {
        reviewId,
        businessOwnerId: userId,
        text,
      },
    });
  }

  async reportReview(reviewId: string, userId: string, reason: string) {
    return this.prisma.report.create({
      data: {
        targetType: 'REVIEW',
        targetId: reviewId,
        reporterUserId: userId,
        reason,
      },
    });
  }
}
