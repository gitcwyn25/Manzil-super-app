import { Module } from '@nestjs/common';
import { AchievementsService } from './achievements.service';
import { DatabaseModule } from '../common/database/database.module';

@Module({
  imports: [DatabaseModule],
  providers: [AchievementsService],
  exports: [AchievementsService],
})
export class AchievementsModule {}
