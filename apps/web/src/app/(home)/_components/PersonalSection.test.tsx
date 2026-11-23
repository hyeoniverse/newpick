import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import PersonalSection from './PersonalSection';

const state = vi.hoisted(() => ({
	user: { id: 7 } as { id: number } | null,
	follows: [] as unknown[],
	tagFollows: [] as unknown[],
}));
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ user: state.user }) }));
vi.mock('@/hooks/useFollows', () => ({ useFollows: () => ({ data: state.follows, isPending: false }) }));
vi.mock('@/hooks/useTagFollows', () => ({ useTagFollows: () => ({ follows: state.tagFollows, isPending: false }) }));
afterEach(() => {
	cleanup();
	state.user = { id: 7 };
	state.follows = [];
	state.tagFollows = [];
});

const update = (id: number, heading: string, createdAt: string, seenAt: string | null) => ({
	id,
	heading,
	reason: '',
	storyIndex: 1,
	createdAt,
	seenAt,
	newsletter: { id: 100 + id, createdAt, category: { name: '경제' } },
});

describe('나를 위한 소식', () => {
	it('로그인하지 않으면 그리지 않는다', () => {
		state.user = null;
		const { container } = render(<PersonalSection />);
		expect(container.innerHTML).toBe('');
	});

	it('지켜보는 소식의 새 소식: 안 본 것 먼저, 그다음 새것부터 3개 · 팔로우한 태그: 태그마다 가장 새 뉴스레터, 새것이 나온 태그부터', () => {
		state.follows = [
			{
				id: 1,
				heading: '반도체 수출',
				updates: [
					update(1, '본 지 오래된 후속', '2026-11-20T00:00:00Z', '2026-11-21T00:00:00Z'),
					update(2, '안 본 후속', '2026-11-19T00:00:00Z', null),
				],
			},
			{
				id: 2,
				heading: '환율',
				updates: [
					update(3, '본 최신 후속', '2026-11-23T00:00:00Z', '2026-11-23T05:00:00Z'),
					update(4, '더 오래된 본 후속', '2026-11-10T00:00:00Z', '2026-11-11T00:00:00Z'),
				],
			},
		];
		state.tagFollows = [
			{
				tag: '룰라',
				news: [
					{ id: 1, title: '룰라 옛 소식', createdAt: '2026-11-01T00:00:00Z', category: '세계' },
					{ id: 2, title: '룰라 4선', createdAt: '2026-11-22T00:00:00Z', category: '세계' },
				],
			},
			{ tag: '코스피', news: [{ id: 3, title: '코스피 급락', createdAt: '2026-11-23T00:00:00Z', category: '경제' }] },
			{ tag: '빈 태그', news: [] },
		];
		render(<PersonalSection />);

		const [followList, tagList] = screen.getAllByRole('list');
		expect(
			within(followList)
				.getAllByRole('link')
				.map((a) => a.querySelector('strong')?.textContent),
		).toEqual(['안 본 후속', '본 최신 후속', '본 지 오래된 후속']);
		expect(within(followList).getAllByRole('link')[0].textContent).toContain('NEW');
		expect(within(followList).getAllByRole('link')[0].textContent).toContain('반도체 수출에 이어진 소식');
		expect(within(followList).getAllByRole('link')[0].getAttribute('href')).toBe('/articles/detail/102');

		expect(
			within(tagList)
				.getAllByRole('link')
				.map((a) => a.querySelector('strong')?.textContent),
		).toEqual(['코스피 급락', '룰라 4선']);
	});

	it('아무것도 지켜보지 · 팔로우하지 않았으면 없다고 알리고, 어떻게 하면 모이는지 안내', () => {
		render(<PersonalSection />);
		expect(screen.getByText('아직 구독한 소식이 없어요')).toBeTruthy();
		expect(screen.getByText('아직 팔로우한 태그가 없어요')).toBeTruthy();
		expect(screen.getByRole('link', { name: '뉴스레터 보러 가기' }).getAttribute('href')).toBe('/articles');
		expect(screen.getByRole('link', { name: '태그 둘러보기' }).getAttribute('href')).toBe('/tags');
	});
});
