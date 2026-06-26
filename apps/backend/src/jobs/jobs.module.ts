import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { JobsService } from './jobs.service';
import { DatabaseModule } from '../common/database/database.module';

@Module({
  imports: [
    BullModule.registerQueue(
      { name: 'photos' },
      { name: 'emails' },
      { name: 'ai-tasks' },
    ),
    DatabaseModule,
  ],
  providers: [JobsService],
  exports: [JobsService],
})
export class JobsModule {}
