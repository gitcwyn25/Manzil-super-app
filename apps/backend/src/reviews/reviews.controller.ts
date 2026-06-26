import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('businesses/:businessId/reviews')
export class ReviewsController {
  constructor(private reviewsService: ReviewsService) {}

  @Get()
  async findByBusiness(@Param('businessId') businessId: string) {
    return this.reviewsService.findByBusiness(businessId);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(
    @Param('businessId') businessId: string,
    @Body() body: { userId: string; rating: number; text: string },
  ) {
    return this.reviewsService.create(businessId, body.userId, {
      rating: body.rating,
      text: body.text,
    });
  }

  @Post(':reviewId/replies')
  @UseGuards(JwtAuthGuard)
  async replyToReview(
    @Param('reviewId') reviewId: string,
    @Body() body: { userId: string; text: string },
  ) {
    return this.reviewsService.replyToReview(reviewId, body.userId, body.text);
  }

  @Post(':reviewId/report')
  async reportReview(
    @Param('reviewId') reviewId: string,
    @Body() body: { userId: string; reason: string },
  ) {
    return this.reviewsService.reportReview(reviewId, body.userId, body.reason);
  }
}
