import { costUsd, usageLog } from './pricing';

describe('Claude 비용 (#21)', () => {
  it('모델 단가로 입력 · 출력을 따로 계산해 더한다', () => {
    // Sonnet 5.5: $2 / $10 per MTok, Haiku 5.5: $0.10 / $0.50
    expect(
      costUsd([
        { model: 'claude-sonnet-5-5', input: 10_000, output: 2_000 },
        { model: 'claude-haiku-5-5', input: 20_000, output: 1_000 },
      ]),
    ).toBeCloseTo(0.02 + 0.02 + 0.002 + 0.0005, 6);
  });

  it('Haiku 5.5는 입력이 10만 토큰을 넘으면 비싼 단가', () => {
    expect(
      costUsd([{ model: 'claude-haiku-5-5', input: 200_000, output: 0 }]),
    ).toBeCloseTo(0.1, 6);
  });

  it('모르는 모델이 섞이면 null', () => {
    expect(
      costUsd([{ model: 'some-local-model', input: 1, output: 1 }]),
    ).toBeNull();
  });

  it('로그용 요약', () => {
    expect(
      usageLog([
        { model: 'claude-haiku-5-5', input: 100, output: 10 },
        { model: 'claude-sonnet-5-5', input: 200, output: 20 },
        { model: 'claude-sonnet-5-5', input: 1, output: 1 },
      ]),
    ).toMatchObject({
      model: 'claude-haiku-5-5, claude-sonnet-5-5',
      inputTokens: 301,
      outputTokens: 31,
    });
  });
});
