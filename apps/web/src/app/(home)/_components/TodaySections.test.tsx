import { cleanup, render, screen, within } from '@testing-library/react';
import type { HomeToday } from '@newpick/shared';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PopularSection, TodayTop } from './TodaySections';

vi.mock('@/components/common/Card', () => ({
	default: ({ data }: { data: { main: { title: string }; url: string } }) => <a href={data.url}>{data.main.title}</a>,
}));
afterEach(cleanup);

const story = (newsletterId: number, heading: string, importance: number) => ({
	newsletterId,
	storyIndex: 1,
	category: 'IT',
	heading,
	line: `${heading} 한 줄`,
	importance,
	image: null,
});

const today: HomeToday = {
	date: '2026-11-23',
	topLines: [story(10, '반도체', 5), story(20, '환율', 4), story(30, '금리', 3)],
	trending: [story(40, 'AI 규제', 2)],
	threads: [
		{
			title: '수출과 환율',
			text: '반도체 수출이 늘며',
			stories: [{ newsletterId: 10, storyIndex: 1, category: 'IT', heading: '반도체' }],
		},
	],
	risingTags: [
		{ tag: '반도체', today: 4, average: 1 },
		{ tag: '젠슨 황', today: 2, average: 0 },
	],
	mostRead: [{ newsletterId: 20, title: '경제 뉴스레터', category: '경제', views: 9 }],
	mostScrapped: [],
};

describe('홈 오늘 칸', () => {
	it('3줄 · 트렌드 · 흐름을 차례로, 소식은 그 뉴스레터로 잇는다', () => {
		render(<TodayTop today={today} />);
		expect(screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)).toEqual([
			'오늘의 3줄',
			'오늘의 트렌드',
			'분야를 넘는 흐름',
		]);
		expect(screen.getByText('11월 23일 모든 분야에서')).toBeTruthy();
		const lines = screen.getAllByRole('listitem').slice(0, 3);
		expect(lines.map((li) => within(li).getByRole('link').getAttribute('href'))).toEqual([
			'/articles/detail/10',
			'/articles/detail/20',
			'/articles/detail/30',
		]);
		expect(screen.getByRole('link', { name: 'AI 규제' }).getAttribute('href')).toBe('/articles/detail/40');
	});

	it('편집본이 없으면(null) 아무것도 그리지 않는다', () => {
		const { container } = render(<TodayTop today={null} />);
		expect(container.innerHTML).toBe('');
	});

	it('뜨는 태그는 평균의 몇 배(처음이면 새로), 비어 있는 칸(스크랩)은 빠진다', () => {
		render(<PopularSection risingTags={today.risingTags} mostRead={today.mostRead} mostScrapped={[]} />);
		expect(screen.getByRole('link', { name: /#반도체/ }).textContent).toBe('#반도체4배');
		expect(screen.getByRole('link', { name: /#젠슨 황/ }).textContent).toBe('#젠슨 황새로');
		expect(screen.getByRole('link', { name: /#반도체/ }).getAttribute('href')).toBe(
			'/articles?keyword=%EB%B0%98%EB%8F%84%EC%B2%B4',
		);
		expect(screen.getByText('많이 읽은 뉴스레터')).toBeTruthy();
		expect(screen.queryByText('많이 스크랩한 소식')).toBeNull();
	});
});
