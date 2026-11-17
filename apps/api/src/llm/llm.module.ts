import { Module } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';
import { ClaudeService } from './claude.service';
import { OpenModelService } from './open-model.service';

/**
 * 모델 호출 (#199에서 ai · ai-summary에서 떼어 냄): Claude · 오픈 모델(Workers AI) 클라이언트와 가격 계산(pricing).
 * 어느 모듈이 어느 모델을 쓸지는 쓰는 쪽이 정한다 (AiService는 공급자 고르기, 뉴스레터 쓰기는 Claude 직접)
 */
@Module({
  providers: [
    {
      // ANTHROPIC_API_KEY를 읽습니다.
      provide: Anthropic,
      useFactory: () => new Anthropic(),
    },
    ClaudeService,
    OpenModelService,
  ],
  exports: [ClaudeService, OpenModelService],
})
export class LlmModule {}
