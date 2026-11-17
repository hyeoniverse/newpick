import { Module } from '@nestjs/common';
import { MailService } from './mail.service';
import { Logger } from '@nestjs/common';
import { NODEMAILER, NODEMAILER_CONFIG } from './constants';

@Module({
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
