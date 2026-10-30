import { Module } from '@nestjs/common';
import { EditionModule } from '../edition/edition.module';
import { MyPageController } from './mypage.controller';
import { MyPageService } from './mypage.service';
import { HighlightsService } from './highlights.service';
import { FoldersService } from './folders.service';
import { TasteModule } from '../taste/taste.module';
import { MailModule } from '../mail/mail.module';
import { EmailChangeService } from './email-change.service';

@Module({
  imports: [EditionModule, TasteModule, MailModule],
  controllers: [MyPageController],
  providers: [
    MyPageService,
    HighlightsService,
    FoldersService,
    EmailChangeService,
  ],
})
export class MyPageModule {}
