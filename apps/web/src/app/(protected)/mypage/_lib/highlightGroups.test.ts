import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Highlight } from '@newpick/shared';
import { asText, byDay, byStory, dayLabel, sectionName } from './highlightGroups';

const hl = (over: Partial<Highlight>): Highlight =>
	({
		id: 1,
		newsletterId: 10,
		section: null,
		sectionTitle: null,
		text: '문장',
		note: null,
		starred: false,
		folderId: null,
		createdAt: '2026-11-15T01:00:00Z',
		newsletter: null,
		...over,
	}) as Highlight;

describe('sectionName', () => {
	it("브리핑은 '에디터 브리핑', 소식은 두 자리 번호 + 소식 제목, 모르면 비움", () => {
		expect(sectionName(hl({ section: 'briefing' }))).toEqual({ index: null, name: '에디터 브리핑' });
		expect(sectionName(hl({ section: 'story-3', sectionTitle: '금리 동결' }))).toEqual({
			index: '03',
			name: '금리 동결',
		});
		expect(sectionName(hl({ section: 'story-12' }))).toEqual({ index: '12', name: '소식 12' });
		expect(sectionName(hl({ section: null }))).toEqual({ index: null, name: null });
	});
});

describe('asText', () => {
	it('문장 · 출처(관심사 · 뉴스레터 · 소식) · 메모를 줄로, 스크랩 사이는 빈 줄', () => {
		const newsletter = { title: '오늘의 경제', category: { name: '경제' } } as Highlight['newsletter'];
		const text = asText([
			hl({ text: '첫 문장', section: 'story-1', sectionTitle: '금리', newsletter, note: '중요' }),
			hl({ id: 2, text: '둘째 문장', newsletter }),
		]);
		expect(text).toBe('“첫 문장”\n— 경제 · 오늘의 경제 · 01 금리\n메모: 중요\n\n“둘째 문장”\n— 경제 · 오늘의 경제');
	});
});

describe('dayLabel (한국 날짜 기준)', () => {
	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date('2026-11-15T03:00:00+09:00'));
	});
	afterEach(() => vi.useRealTimers());

	it("오늘 · 어제, 올해는 '월 일 (요일)', 지난해부터는 연도까지", () => {
		expect(dayLabel('2026-11-15')).toBe('오늘');
		expect(dayLabel('2026-11-14')).toBe('어제');
		expect(dayLabel('2026-10-27')).toBe('10월 27일 (화)');
		// 지난해도 요일은 괄호 안에 (예전에는 '2025년 10월 27일 월'로 괄호가 빠졌다)
		expect(dayLabel('2025-10-27')).toBe('2025년 10월 27일 (월)');
	});
});

describe('byDay · byStory', () => {
	it('받은 순서 그대로 한국 날짜별로 묶는다 (UTC 15시 = 한국 다음 날)', () => {
		const items = [
			hl({ id: 1, createdAt: '2026-11-15T16:00:00Z' }),
			hl({ id: 2, createdAt: '2026-11-15T15:30:00Z' }),
			hl({ id: 3, createdAt: '2026-11-15T14:59:00Z' }),
		];
		expect(byDay(items).map((g) => [g.day, g.items.map((h) => h.id)])).toEqual([
			['2026-11-16', [1, 2]],
			['2026-11-15', [3]],
		]);
	});

	it('이어진 같은 뉴스레터 · 같은 구역만 한 블록, 끊기면 새 블록', () => {
		const items = [
			hl({ id: 1, newsletterId: 10, section: 'story-1' }),
			hl({ id: 2, newsletterId: 10, section: 'story-1' }),
			hl({ id: 3, newsletterId: 10, section: 'story-2' }),
			hl({ id: 4, newsletterId: 11, section: 'story-2' }),
			hl({ id: 5, newsletterId: 10, section: 'story-1' }),
		];
		expect(byStory(items).map((b) => b.items.map((h) => h.id))).toEqual([[1, 2], [3], [4], [5]]);
	});
});
