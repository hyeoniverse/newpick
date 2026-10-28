import { Injectable } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';

/**
 * 기본 모델 (뉴스레터 쓰기, 무료 체험). 같은 기사로 비교했을 때 Opus 5.5와 품질이 거의 같고 가격은 절반 (#48).
 * 더 아끼려면 CLAUDE_MODEL=claude-haiku-5-5 (한 편 약 $0.005, 지표 정리가 다소 어색함)
 */
export const CLAUDE_MODEL = process.env.CLAUDE_MODEL || 'claude-sonnet-5-5';
/** 고르기·분류처럼 판단이 가벼운 작업용 (#47). Sonnet 5.5의 1/20 가격 */
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
    // 스트리밍으로 받는다: 긴 응답(뉴스레터 한 편 1만 토큰 안팎)을 한 번에 기다리면 SDK 대기 시간(10분)을 넘겨
    // 'Request timed out'으로 실패했다 (재시도까지 30분). 스트리밍은 조각이 계속 와서 끊기지 않고, 끝나면 finalMessage로 한 번에 받는다
    const response = await this.client.beta.messages
      .stream({
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
      })
      .finalMessage();

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
