import { Controller, Get, Post, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminService } from './admin.service';

@Controller('admin')
@UseGuards(JwtAuthGuard)
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Get('claims/pending')
  async getPendingClaims() {
    return this.adminService.getPendingClaims();
  }

  @Post('claims/:id/approve')
  async approveClaim(@Param('id') claimId: string) {
    return this.adminService.approveClaim(claimId);
  }

  @Post('claims/:id/reject')
  async rejectClaim(@Param('id') claimId: string) {
    return this.adminService.rejectClaim(claimId);
  }

  @Get('moderation-queue')
  async getModerationQueue() {
    return this.adminService.getModerationQueue();
  }
}
