import { Module } from '@nestjs/common';
import { MailClickController } from './mail-click.controller';

/** 메일 링크 클릭 기록 (#123 15) */
@Module({ controllers: [MailClickController] })
export class MailClickModule {}
