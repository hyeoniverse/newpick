import { Injectable } from '@nestjs/common';

/**
 * 오픈 모델 (#119): Cloudflare Workers AI. 하루 무료 할당(10,000 neurons) 안에서는 0원이고,
 * 무료 요금제라 넘으면 요금이 붙지 않고 호출이 거절된다 (그때는 AiService가 Claude로 넘기거나 미룬다).
 * 같은 기사 6편 비교에서 Gemma 4 26B가 수치 오류 0 · 한 편 59~85 neurons (#119 1단계, scripts/compare-open-models.ts)
 */
export const OPEN_MODEL =
  process.env.AI_OPEN_MODEL || '@cf/google/gemma-4-26b-a4b-it';
/** 문장 임베딩 (한국어 포함 다국어, 1024차원) */
export const EMBED_MODEL = process.env.AI_EMBED_MODEL || '@cf/baai/bge-m3';

/** 오픈 모델을 지금 쓸 수 없음 (설정 없음 · 하루 할당을 다 씀 · 서비스 장애). 이때만 다른 길로 넘긴다 */
export class OpenModelUnavailable extends Error {}

type GenerateOptions = {
  system: string;
  prompt: string;
  /** 지정하면 응답이 이 JSON 스키마를 따른다 */
  schema?: Record<string, unknown>;
  maxTokens?: number;
  model?: string;
};

@Injectable()
export class OpenModelService {
  /** CF_ACCOUNT_ID · CF_AI_TOKEN이 있어야 쓴다. 없으면 오픈 모델 없이 Claude만 */
  get configured() {
    return !!(process.env.CF_ACCOUNT_ID && process.env.CF_AI_TOKEN);
  }

  async generate({
    system,
    prompt,
    schema,
    maxTokens = 4000,
    model = OPEN_MODEL,
  }: GenerateOptions) {
    const data = await this.call<{
      choices?: {
        message: { content: string | null };
        finish_reason?: string;
      }[];
      usage?: {
        prompt_tokens: number;
        completion_tokens: number;
        neurons?: number;
      };
    }>('chat/completions', {
      model,
      max_tokens: maxTokens,
      temperature: 0.3,
      // 생각(reasoning) 단계를 끈다: 켜져 있으면 본문 대신 생각만 돌려주는 모델이 있다
      chat_template_kwargs: { enable_thinking: false },
      ...(schema && {
        response_format: {
          type: 'json_schema',
          json_schema: { name: 'result', schema },
        },
      }),
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: prompt },
      ],
    });

    const choice = data.choices?.[0];
    if (choice?.finish_reason === 'length')
      throw new Error(`응답이 max_tokens(${maxTokens})에서 잘렸습니다`);
    const text = choice?.message.content?.trim();
    if (!text) throw new Error('오픈 모델이 빈 응답을 돌려줬습니다');

    const input = data.usage?.prompt_tokens ?? 0;
    const output = data.usage?.completion_tokens ?? 0;
    return {
      text,
      tokens: input + output,
      usage: { model, input, output },
      neurons: data.usage?.neurons ?? 0,
    };
  }

  /** 문장마다 임베딩 (입력과 같은 순서) */
  async embed(texts: string[], model = EMBED_MODEL): Promise<number[][]> {
    if (!texts.length) return [];
    const data = await this.call<{ data?: { embedding: number[] }[] }>(
      'embeddings',
      { model, input: texts },
    );
    if (data.data?.length !== texts.length)
      throw new Error('임베딩 개수가 입력과 다릅니다');
    return data.data.map((item) => item.embedding);
  }

  /** Workers AI의 OpenAI 호환 경로. 설정이 없거나 할당 초과 · 서비스 장애면 OpenModelUnavailable */
  private async call<T>(path: string, body: Record<string, unknown>) {
    if (!this.configured)
      throw new OpenModelUnavailable(
        '오픈 모델 설정(CF_ACCOUNT_ID · CF_AI_TOKEN)이 없습니다',
      );
    let res: Response;
    try {
      res = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${process.env.CF_ACCOUNT_ID}/ai/v1/${path}`,
        {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            authorization: `Bearer ${process.env.CF_AI_TOKEN}`,
          },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(120_000),
        },
      );
    } catch (error) {
      throw new OpenModelUnavailable(
        `오픈 모델에 닿지 못했습니다: ${(error as Error).message}`,
      );
    }
    if (res.status === 429 || res.status >= 500) {
      throw new OpenModelUnavailable(
        `오픈 모델을 지금 쓸 수 없습니다 (HTTP ${res.status}${res.status === 429 ? ', 하루 할당 초과일 수 있음' : ''})`,
      );
    }
    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      throw new Error(
        `오픈 모델 요청 실패 (HTTP ${res.status}): ${detail.slice(0, 200)}`,
      );
    }
    return (await res.json()) as T;
  }
}
