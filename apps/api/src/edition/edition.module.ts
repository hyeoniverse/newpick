import { Module } from '@nestjs/common';
import { AiSummaryModule } from '../ai-summary/ai-summary.module';
import { EditionController } from './edition.controller';
import { EditionService } from './edition.service';

/** 구독 메일 한 통 엮기: 하루 한 번 편집 + 구독자별 조합 (#55) */
@Module({
  imports: [AiSummaryModule],
  controllers: [EditionController],
  providers: [EditionService],
  exports: [EditionService],
})
export class EditionModule {}
