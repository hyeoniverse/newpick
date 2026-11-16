import { describe, expect, it } from 'vitest';
import type { AiLogRow } from '@newpick/shared';
import { canRerun, chainGroups, groupAttempts, modelNames, tokensText } from './aiLogs';

const log = (id: number, over: Partial<AiLogRow> = {}): AiLogRow =>
	({
		id,
		processType: 'summarization',
		status: 'success',
		categoryId: 1,
		category: 'IT',
		attempt: null,
		model: null,
		inputTokens: 0,
		outputTokens: 0,
		token: 0,
		...over,
	}) as AiLogRow;
const attempt = (chain: number, n: number, total: number, outcome = 'error') => ({ chain, n, total, outcome });

describe('canRerun', () => {
	it('분야가 있는 요약이 실패했고, 묶음의 마지막 시도도 실패일 때만', () => {
		expect(canRerun(log(1, { status: 'error' }))).toBe(true);
		expect(canRerun(log(1, { status: 'error', attempt: attempt(9, 3, 3) }))).toBe(true);
		// 묶음 중간 실패는 뒤에서 이미 다시 시도했다
		expect(canRerun(log(1, { status: 'error', attempt: attempt(9, 2, 3) }))).toBe(false);
		expect(canRerun(log(1, { status: 'error', attempt: attempt(9, 3, 3, 'success') }))).toBe(false);
		expect(canRerun(log(1, { status: 'success' }))).toBe(false);
		expect(canRerun(log(1, { status: 'error', processType: 'category' }))).toBe(false);
		expect(canRerun(log(1, { status: 'error', categoryId: null }))).toBe(false);
	});
});

describe('groupAttempts · chainGroups', () => {
	// 최신순으로 받은 목록: 묶음 9(시도 2개)가 사이에 다른 기록을 두고 떨어져 있다
	const items = [
		log(5, { attempt: attempt(9, 2, 2, 'success') }),
		log(4),
		log(3, { attempt: attempt(9, 1, 2) }),
		log(2, { attempt: attempt(7, 1, 1) }),
	];

	it('같은 묶음은 가장 최근 시도 자리에 붙여 놓고, 묶음 안은 최신순 그대로', () => {
		expect(groupAttempts(items).map((l) => l.id)).toEqual([5, 3, 4, 2]);
	});

	it('카드용: 이어진 같은 묶음만 한 덩어리 (시도 1개짜리는 묶음이 아님)', () => {
		expect(chainGroups(groupAttempts(items)).map((g) => g.map((l) => l.id))).toEqual([[5, 3], [4], [2]]);
	});
});

describe('modelNames · tokensText', () => {
	it("모델은 쉼표로 나누고 'claude-'를 뗀다, 없으면 빈 목록", () => {
		expect(modelNames('claude-haiku-5-5, claude-sonnet-5')).toEqual(['haiku-5-5', 'sonnet-5']);
		expect(modelNames(null)).toEqual([]);
	});

	it('토큰: 입력 / 출력을 알면 둘 다, 아니면 합계, 0이면 없음', () => {
		expect(tokensText({ inputTokens: 1200, outputTokens: 300, token: 1500 })).toBe('1,200 / 300');
		expect(tokensText({ inputTokens: 0, outputTokens: 0, token: 900 })).toBe('900');
		expect(tokensText({ inputTokens: 0, outputTokens: 0, token: 0 })).toBeNull();
	});
});
