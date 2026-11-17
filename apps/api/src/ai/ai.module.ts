import { Module } from '@nestjs/common';
import { LlmModule } from 'src/llm/llm.module';
import { AiService } from './ai.service';

/** AI 공급자 고르기 (#119): 오픈 모델(Workers AI) · Claude. 맞춤 추천 · 스크랩 분석 등이 이것을 쓴다 */
@Module({
  imports: [LlmModule],
  providers: [AiService],
  exports: [AiService],
})
export class AiModule {}
