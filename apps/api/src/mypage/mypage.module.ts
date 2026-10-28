import { Module } from '@nestjs/common';
import { EditionModule } from '../edition/edition.module';
import { MyPageController } from './mypage.controller';
import { MyPageService } from './mypage.service';
import { HighlightsService } from './highlights.service';

@Module({
  imports: [EditionModule],
  controllers: [MyPageController],
  providers: [MyPageService, HighlightsService],
})
export class MyPageModule {}
