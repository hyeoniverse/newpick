import { Module } from '@nestjs/common';
import { EditionModule } from 'src/edition/edition.module';
import { MyPageController } from './mypage.controller';
import { MyPageService } from './mypage.service';
import { BookmarksService } from './bookmarks.service';
import { MyMailsService } from './my-mails.service';
import { HighlightsService } from './highlights.service';
import { FoldersService } from './folders.service';
import { TasteModule } from 'src/taste/taste.module';
import { MailModule } from 'src/mail/mail.module';
import { EmailChangeService } from './email-change.service';
import { TagFollowsService } from './tag-follows.service';
import { TagsModule } from 'src/tags/tags.module';

@Module({
	imports: [EditionModule, TasteModule, MailModule, TagsModule],
	controllers: [MyPageController],
	providers: [
		MyPageService,
		BookmarksService,
		MyMailsService,
		HighlightsService,
		FoldersService,
		EmailChangeService,
		TagFollowsService,
	],
})
export class MyPageModule {}
