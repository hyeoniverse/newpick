import { Module } from '@nestjs/common';
import { EditionModule } from '../edition/edition.module';
import { MyPageController } from './mypage.controller';
import { MyPageService } from './mypage.service';

@Module({
  imports: [EditionModule],
  controllers: [MyPageController],
  providers: [MyPageService],
})
export class MyPageModule {}
