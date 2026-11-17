import { Module } from '@nestjs/common';
import { MailService } from './mail.service';
import { NODEMAILER, NODEMAILER_CONFIG } from './constants';

@Module({
	providers: [
		MailService,
		{
			provide: NODEMAILER,
			useValue: NODEMAILER_CONFIG,
		},
	],
	exports: [MailService, NODEMAILER],
})
export class MailModule {}
