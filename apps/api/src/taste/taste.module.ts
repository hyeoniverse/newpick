import { Module } from '@nestjs/common';
import { TasteService } from './taste.service';

/** 취향 점수 (#123 2단계): 마이페이지 · 관리자 통계 · (다음 단계) 맞춤 메일이 같이 쓴다 */
@Module({
  providers: [TasteService],
  exports: [TasteService],
})
export class TasteModule {}
