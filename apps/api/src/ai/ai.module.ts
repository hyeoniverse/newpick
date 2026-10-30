import { Module } from '@nestjs/common';
import { AiSummaryModule } from '../ai-summary/ai-summary.module';
import { AiService } from './ai.service';
import { OpenModelService } from './open-model.service';

/** AI 공급자 고르기 (#119): 오픈 모델(Workers AI) · Claude. 맞춤 추천 · 스크랩 분석 등이 이것을 쓴다 */
@Module({
  imports: [AiSummaryModule],
  providers: [OpenModelService, AiService],
  exports: [AiService],
})
export class AiModule {}
