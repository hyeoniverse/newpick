import { Injectable } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';

/** 기본 모델. 비용을 낮추려면 CLAUDE_MODEL로 바꿀 수 있습니다. (예: claude-haiku-5-5) */
export const CLAUDE_MODEL = process.env.CLAUDE_MODEL || 'claude-opus-5-5';

type GenerateOptions = {
  system: string;
  prompt: string;
  /** 깊이 생각할수록 품질이 오르고 비용·시간이 늘어납니다. 단순 작업은 low */
  effort?: 'low' | 'medium' | 'high';
  /** 지정하면 응답이 이 JSON 스키마를 따릅니다. */
  schema?: Record<string, unknown>;
  maxTokens?: number;
};

/** 모든 AI 호출의 공통 경로. 거절·잘림을 오류로 바꾸고 사용 토큰을 함께 돌려줍니다. */
@Injectable()
export class ClaudeService {
  constructor(private readonly client: Anthropic) {}

  async generate({
    system,
    prompt,
    effort = 'low',
    schema,
    maxTokens = 16000,
  }: GenerateOptions): Promise<{ text: string; tokens: number }> {
    const response = await this.client.beta.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: maxTokens,
      // 안전 분류기가 요청을 거절하면 서버가 권장 모델로 다시 실행합니다.
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      output_config: {
        effort,
        ...(schema && { format: { type: 'json_schema', schema } }),
      },
      system,
      messages: [{ role: 'user', content: prompt }],
    });

    if (response.stop_reason === 'refusal') {
      throw new Error(
        `요청이 거절되었습니다 (${response.stop_details?.category ?? 'unknown'})`,
      );
    }
    // 잘린 요약이 뉴스레터로 저장되지 않도록 실패로 처리합니다.
    if (response.stop_reason === 'max_tokens') {
      throw new Error(`응답이 max_tokens(${maxTokens})에서 잘렸습니다`);
    }

    const text = response.content
      .map((block) => (block.type === 'text' ? block.text : ''))
      .join('')
      .trim();
    const tokens = response.usage.input_tokens + response.usage.output_tokens;
    return { text, tokens };
  }
}
