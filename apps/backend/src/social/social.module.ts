import { Module } from '@nestjs/common';
import { SocialService } from './social.service';
import { DatabaseModule } from '../common/database/database.module';

@Module({
  imports: [DatabaseModule],
  providers: [SocialService],
  exports: [SocialService],
})
export class SocialModule {}
