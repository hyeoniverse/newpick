import { Module } from '@nestjs/common';
import { EditionModule } from '../edition/edition.module';
import { MyPageController } from './mypage.controller';
import { MyPageService } from './mypage.service';
import { HighlightsService } from './highlights.service';
import { FoldersService } from './folders.service';
import { TasteModule } from '../taste/taste.module';

@Module({
  imports: [EditionModule, TasteModule],
  controllers: [MyPageController],
  providers: [MyPageService, HighlightsService, FoldersService],
})
export class MyPageModule {}
