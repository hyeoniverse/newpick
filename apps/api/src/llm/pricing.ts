/** Claude 호출 한 번의 사용량. stage는 그 호출이 한 일 (뉴스레터 쓰기의 select · write 등, #122) */
export interface ClaudeUsage {
  model: string;
  input: number;
  output: number;
  stage?: string;
  /** 도중에 실패해 끝까지 받지 못한 호출: 받은 데까지의 사용량 (실제 청구는 이보다 같거나 많다) */
  partial?: boolean;
}

/**
 * 사용량을 실어 보내는 오류: 실패한 요약도 그때까지 쓴 토큰 · 비용을 AI 기록에 남기게.
 * 앞 단계(고르기)가 끝난 뒤 쓰기에서 실패해도, 끊긴 스트리밍도 청구는 된다
 */
export class UsageError extends Error {
  /** 원래 오류 (SDK 오류 등) */
  readonly origin?: unknown;

  constructor(
    message: string,
    readonly usage: ClaudeUsage[],
    options?: { cause?: unknown },
  ) {
    super(message);
    this.name = 'UsageError';
    this.origin = options?.cause;
  }
}

/** 오류에 실린 사용량 (없으면 빈 배열) */
export const usageOf = (error: unknown): ClaudeUsage[] =>
  error instanceof UsageError ? error.usage : [];

/**
 * 모델별 단가 (USD / 100만 토큰). 2026-10 기준 Claude API 공개 가격.
 * 프롬프트 캐시는 쓰지 않으므로 입력 · 출력만 센다. 가격이 바뀌면 여기만 고친다
 */
const PRICES: {
  prefix: string;
  input: number;
  output: number;
  long?: { over: number; input: number; output: number };
}[] = [
  { prefix: 'claude-fable-5', input: 10, output: 50 },
  { prefix: 'claude-mythos-5', input: 10, output: 50 },
  { prefix: 'claude-opus-5-5', input: 4, output: 20 },
  { prefix: 'claude-opus-5', input: 5, output: 25 },
  { prefix: 'claude-sonnet-5', input: 2, output: 10 },
  // 오픈 모델 (Workers AI, #119): 무료 요금제의 하루 할당 안에서만 쓰고 넘으면 거절되므로 0원
  { prefix: '@cf/', input: 0, output: 0 },
  // Haiku 5.5는 입력이 10만 토큰을 넘으면 비싸진다
  {
    prefix: 'claude-haiku-5-5',
    input: 0.1,
    output: 0.5,
    long: { over: 100_000, input: 0.5, output: 2.5 },
  },
];

const priceOf = (model: string) =>
  PRICES.find((price) => model.startsWith(price.prefix)) ?? null;

/**
 * 사용량 → 비용(USD). 모르는 모델이 하나라도 섞이면 null (틀린 금액을 보이지 않게)
 */
export function costUsd(usage: ClaudeUsage[]): number | null {
  let total = 0;
  for (const { model, input, output } of usage) {
    const price = priceOf(model);
    if (!price) return null;
    const rate = price.long && input > price.long.over ? price.long : price;
    total += (input * rate.input + output * rate.output) / 1_000_000;
  }
  return Math.round(total * 1_000_000) / 1_000_000;
}

/**
 * 로그에 남길 사용량 요약: 모델(여럿이면 이어 붙임) · 입력 · 출력 · 비용,
 * 그리고 호출별 사용량(calls, #122 통계에서 모델 · 단계별로 나눠 본다)
 */
export function usageLog(usage: ClaudeUsage[], stage?: string) {
  return {
    calls: usage.map((u) => ({
      stage: u.stage ?? stage ?? null,
      model: u.model,
      input: u.input,
      output: u.output,
      costUsd: costUsd([u]),
      ...(u.partial && { partial: true }),
    })),
    model: [...new Set(usage.map((u) => u.model))].join(', ') || null,
    inputTokens: usage.reduce((sum, u) => sum + u.input, 0),
    outputTokens: usage.reduce((sum, u) => sum + u.output, 0),
    costUsd: costUsd(usage),
  };
}
