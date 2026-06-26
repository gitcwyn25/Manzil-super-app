import { Injectable, Logger } from '@nestjs/common';
import { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';

@Injectable()
export class JobsService {
  private logger = new Logger('JobsService');

  constructor(
    @InjectQueue('photos') private photoQueue: Queue,
    @InjectQueue('emails') private emailQueue: Queue,
    @InjectQueue('ai-tasks') private aiQueue: Queue,
  ) {}

  async enqueuePhotoProcessing(photoId: string) {
    await this.photoQueue.add(
      'process-photo',
      { photoId },
      { delay: 1000, attempts: 3 },
    );
  }

  async enqueueModerationEmail(claimId: string) {
    await this.emailQueue.add(
      'send-claim-email',
      { claimId },
      { delay: 5000 },
    );
  }

  async enqueueAiTask(taskType: string, data: any) {
    await this.aiQueue.add(taskType, data, { delay: 1000 });
  }
}
