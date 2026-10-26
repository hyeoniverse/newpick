import { Injectable } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';

/** 기본 모델 (뉴스레터 쓰기 등). 비용을 낮추려면 CLAUDE_MODEL로 바꿀 수 있습니다. */
export const CLAUDE_MODEL = process.env.CLAUDE_MODEL || 'claude-opus-5-5';
/** 고르기·분류처럼 판단이 가벼운 작업용 (#47). Opus 5.5의 1/40 가격 */
export const CLAUDE_FAST_MODEL =
  process.env.CLAUDE_FAST_MODEL || 'claude-haiku-5-5';

/** Haiku 5.5는 서버 측 대체 모델(fallbacks)을 받지 않고 400을 돌려줍니다 */
const supportsFallback = (model: string) => !model.includes('haiku');

type GenerateOptions = {
  /** 지정하지 않으면 CLAUDE_MODEL */
  model?: string;
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
    model = CLAUDE_MODEL,
  }: GenerateOptions): Promise<{
    text: string;
    tokens: number;
    usage: { model: string; input: number; output: number };
  }> {
    const response = await this.client.beta.messages.create({
      model,
      max_tokens: maxTokens,
      // 안전 분류기가 요청을 거절하면 서버가 권장 모델로 다시 실행합니다.
      ...(supportsFallback(model) && {
        betas: ['server-side-fallback-2026-07-01'],
        fallbacks: 'default' as const,
      }),
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
    const { input_tokens: input, output_tokens: output } = response.usage;
    return {
      text,
      tokens: input + output,
      usage: { model: response.model ?? model, input, output },
    };
  }
}
