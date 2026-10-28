import { Module } from '@nestjs/common';
import { TagsService } from './tags.service';

/** 태그 정돈 (#20): 쓰기 단계(AiSummary)와 관리자 화면이 같이 쓴다 */
@Module({
  providers: [TagsService],
  exports: [TagsService],
})
export class TagsModule {}
