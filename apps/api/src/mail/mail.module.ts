import { Module } from '@nestjs/common';
import { MailService } from './mail.service';
import { Logger } from '@nestjs/common';
import { NODEMAILER, NODEMAILER_CONFIG } from './constants';
import { AiSummaryModule } from '../ai-summary/ai-summary.module';

@Module({
  imports: [AiSummaryModule],
  providers: [
    MailService,
    {
      provide: Logger,
      useClass: Logger,
    },
    {
      provide: NODEMAILER,
      useValue: NODEMAILER_CONFIG,
    },
  ],
  exports: [MailService, NODEMAILER],
})
export class MailModule {}
