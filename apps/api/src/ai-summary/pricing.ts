/** Claude 호출 한 번의 사용량. stage는 그 호출이 한 일 (뉴스레터 쓰기의 select · write 등, #122) */
export interface ClaudeUsage {
  model: string;
  input: number;
  output: number;
  stage?: string;
}

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
    })),
    model: [...new Set(usage.map((u) => u.model))].join(', ') || null,
    inputTokens: usage.reduce((sum, u) => sum + u.input, 0),
    outputTokens: usage.reduce((sum, u) => sum + u.output, 0),
    costUsd: costUsd(usage),
  };
}
