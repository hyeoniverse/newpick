import { Module } from '@nestjs/common';
import { NewsletterRepo } from './newsletter.repository';
import { BasicRepositoryController } from './controllers/newsletter.controller';
import { AiProcessingLogRepo } from './ai-processing-log.repository';
import { AiProcessingLogController } from './controllers/ai-processing-log.controller';
import { EmailArchivesRepo } from './email-archives.repository';
import { EmailArchivesController } from './controllers/email-archives.controller';

@Module({
  imports: [],
  providers: [NewsletterRepo, AiProcessingLogRepo, EmailArchivesRepo],
  controllers: [
    BasicRepositoryController,
    AiProcessingLogController,
    EmailArchivesController,
  ],
  exports: [NewsletterRepo, AiProcessingLogRepo, EmailArchivesRepo],
})
export class BasicRepositoryModule {}
