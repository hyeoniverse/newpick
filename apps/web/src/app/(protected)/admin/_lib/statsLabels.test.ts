import { describe, expect, it } from 'vitest';
import { modelName, money, people } from './statsLabels';

describe('modelName', () => {
	it("'claude-…' 모델 id를 짧은 이름으로 (뒤의 날짜 꼬리는 버린다)", () => {
		expect(modelName('claude-haiku-5-5')).toBe('Haiku 5.5');
		expect(modelName('claude-opus-5')).toBe('Opus 5');
		expect(modelName('claude-sonnet-4-5-20250929')).toBe('Sonnet 4.5');
	});

	it("나눔을 모르는 예전 기록은 'mixed' → 설명 글", () => {
		expect(modelName('mixed')).toBe('나눔 모름 (이전 기록)');
	});
});

describe('people · money', () => {
	it('사람 수는 천 단위 쉼표 + 명, 금액은 달러 (1센트 미만은 넷째 자리까지)', () => {
		expect(people(1234)).toBe('1,234명');
		expect(money(1.5)).toBe('$1.50');
		expect(money(0.0042)).toBe('$0.0042');
	});
});
