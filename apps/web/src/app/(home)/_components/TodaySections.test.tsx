import { cleanup, render, screen } from '@testing-library/react';
import type { HomeToday } from '@newpick/shared';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ContinuingSection, KeyLinesSection, PopularSection, ThreadsSection, TopicTrendSection } from './TodaySections';

vi.mock('@/components/common/Image', () => ({ default: () => null }));
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
	topics: [{ tag: 'AI', recent: 3, usual: 0, stories: [story(40, 'AI 규제', 2), story(41, 'AI 반도체', 2)] }],
	threads: [
		{
			title: '수출과 환율',
			text: '반도체 수출이 늘며',
			stories: [{ newsletterId: 10, storyIndex: 1, category: 'IT', heading: '반도체' }],
		},
	],
	continuing: [
		{
			steps: [
				{ newsletterId: 3, storyIndex: 1, category: '사회', heading: '압수수색', date: '2026-11-21', reason: '' },
				{ newsletterId: 5, storyIndex: 2, category: '정치', heading: '여야 공방', date: '2026-11-22', reason: '여야가 맞섰다' },
				{ newsletterId: 10, storyIndex: 1, category: '사회', heading: '구속영장 발부', date: '2026-11-23', reason: '법원이 영장을 발부했다' },
			],
		},
	],
	risingTags: [
		{ tag: '반도체', recent: 4, usual: 1 },
		{ tag: '젠슨 황', recent: 2, usual: 0 },
		{ tag: '농어민', recent: 2, usual: 1.4 },
	],
	mostRead: [{ newsletterId: 20, title: '경제 뉴스레터', category: '경제', views: 9 }],
	mostScrapped: [],
};

describe('홈 오늘 칸', () => {
	it('3줄 · 트렌드 · 흐름을 차례로, 소식은 그 뉴스레터로 잇는다', () => {
		render(
			<>
				<KeyLinesSection date={today.date} stories={today.topLines} />
				<TopicTrendSection topics={today.topics} />
				<ThreadsSection threads={today.threads} />
			</>,
		);
		expect(screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)).toEqual([
			'핵심 3줄',
			'최신 트렌드',
			'분야를 넘는 흐름',
		]);
		// 핵심 3줄: 1위가 먼저(크게), 2 · 3위가 그 뒤
		const lines = document.querySelector('[data-track-section="home-today-lines"]')!;
		expect([...lines.querySelectorAll('a')].map((a) => a.getAttribute('href'))).toEqual([
			'/articles/detail/10',
			'/articles/detail/20',
			'/articles/detail/30',
		]);
		// 주제별 트렌드: 주제마다 가장 새 소식 (#태그 · NEW · 소식 수), 그 태그 소식 더 보기
		expect(screen.getByRole('link', { name: /#AI\s*NEW\s*소식 2개\s*AI 규제/ }).getAttribute('href')).toBe(
			'/articles/detail/40',
		);
		expect(screen.getByRole('link', { name: '#AI 소식 더 보기' }).getAttribute('href')).toBe('/articles?keyword=AI');
	});

	it('제목에 오늘을 넣지 않고, 편집본 날짜는 발행일로 따로 (아침 발행 전에는 어제 것이다)', () => {
		render(<KeyLinesSection date="2026-11-22" stories={today.topLines} />);
		expect(screen.getByRole('heading', { level: 2, name: '핵심 3줄' })).toBeTruthy();
		expect(screen.getByText('11월 22일 기준')).toBeTruthy();
	});

	it('이어지는 이야기: 날짜순 마디, 며칠째인지, 앞 소식보다 새로 나온 것 (첫 마디는 없음), 분야가 바뀐 마디만 분야를 붙인다', () => {
		render(<ContinuingSection stories={today.continuing} />);
		expect(screen.getByRole('heading', { level: 2, name: '이어지는 이야기' })).toBeTruthy();
		expect(screen.getByText('3일째')).toBeTruthy();
		const links = screen.getAllByRole('link');
		expect(links.map((a) => a.getAttribute('href'))).toEqual([
			'/articles/detail/3',
			'/articles/detail/5',
			'/articles/detail/10',
		]);
		expect(links.map((a) => a.textContent)).toEqual([
			'11월 21일압수수색',
			'11월 22일 · 정치여야 공방여야가 맞섰다',
			'11월 23일구속영장 발부법원이 영장을 발부했다',
		]);
	});

	it('소식 · 주제 · 흐름이 비면 그 칸은 그리지 않는다', () => {
		const { container } = render(
			<>
				<KeyLinesSection date={today.date} stories={[]} />
				<TopicTrendSection topics={[]} />
				<ThreadsSection threads={[]} />
				<ContinuingSection stories={[]} />
			</>,
		);
		expect(container.innerHTML).toBe('');
	});

	it('뜨는 태그는 평균보다 늘어난 횟수(처음이면 NEW, 평소 1.4번이던 태그가 2번이면 +1), 비어 있는 칸(스크랩)은 빠진다', () => {
		render(<PopularSection risingTags={today.risingTags} mostRead={today.mostRead} mostScrapped={[]} />);
		expect(screen.getByRole('link', { name: /#반도체/ }).textContent).toBe('#반도체+3');
		expect(screen.getByRole('link', { name: /#농어민/ }).textContent).toBe('#농어민+1');
		expect(screen.getByRole('link', { name: /#젠슨 황/ }).textContent).toBe('#젠슨 황NEW');
		expect(screen.getByRole('link', { name: /#반도체/ }).getAttribute('href')).toBe(
			'/articles?keyword=%EB%B0%98%EB%8F%84%EC%B2%B4',
		);
		// 놓는 순서는 가나다, 크기는 많이 뜬 순서대로 (두 개씩 한 단계)
		expect(screen.getAllByRole('link', { name: /^#/ }).map((a) => a.textContent?.replace(/(NEW|\+\d+)$/, ''))).toEqual([
			'#농어민',
			'#반도체',
			'#젠슨 황',
		]);
		expect(screen.getByRole('link', { name: /#반도체/ }).className).toContain('text-[1.5rem]');
		expect(screen.getByRole('link', { name: /#농어민/ }).className).toContain('text-[1.25rem]');
		expect(screen.getByRole('heading', { level: 3, name: /지금 뜨는 태그\s*최근 3일/ })).toBeTruthy();
		expect(screen.getByRole('heading', { level: 3, name: /많이 읽은 뉴스레터\s*최근 7일/ })).toBeTruthy();
		expect(screen.queryByText('많이 스크랩한 소식')).toBeNull();
	});
});
