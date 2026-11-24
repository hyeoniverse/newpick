import { cleanup, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { PipelineLive, PipelineRun } from '@newpick/shared';
import LiveSection from './LiveSection';

const live = vi.fn<() => Promise<PipelineLive>>();
vi.mock('@/api/edition', () => ({ fetchPipelineLive: () => live() }));
afterEach(cleanup);

const crawl = (over: Partial<PipelineRun> = {}): PipelineRun => ({
	kind: 'crawl',
	status: 'done',
	startedAt: '2026-11-24T01:00:00.000Z',
	finishedAt: '2026-11-24T01:03:00.000Z',
	steps: [
		{ key: 'fetch', label: '기사 모으기', state: 'done', count: 48, progress: [6, 6] },
		{ key: 'classify', label: '분야 나누기', state: 'done', count: 46 },
		{ key: 'cluster', label: '같은 사건 묶기', state: 'done', count: 2 },
		{ key: 'breaking', label: '속보 판정', state: 'done', count: 0 },
	],
	categories: [
		{ name: '경제', count: 12 },
		{ name: '정치', count: 6 },
	],
	keywords: [{ word: '코스피', count: 5 }],
	clusters: [{ label: '룰라 · 브라질', size: 3 }],
	...over,
});

const renderIt = () =>
	render(
		<QueryClientProvider client={new QueryClient()}>
			<LiveSection />
		</QueryClientProvider>,
	);

describe("홈 '지금 뉴픽은'", () => {
	it('마지막 수집: 단계마다 센 수, 분야별 건수 · 낱말 · 묶음, 마지막 · 다음 수집 시각 (KST)', async () => {
		live.mockResolvedValueOnce({
			crawl: crawl(),
			summary: null,
			next: { crawl: '2026-11-24T02:00:00.000Z', summary: null },
		});
		renderIt();
		expect(await screen.findByText('새 기사 48건')).toBeTruthy();
		expect(screen.getByText('46건 저장')).toBeTruthy();
		expect(screen.getByText('묶음 2개')).toBeTruthy();
		expect(screen.getByText('속보 없음')).toBeTruthy();
		expect(screen.getByText('마지막 수집 10:03 · 다음 수집 11:00')).toBeTruthy();
		expect(screen.getByText('룰라 · 브라질')).toBeTruthy();
		expect(screen.getByText('코스피')).toBeTruthy();
		expect(screen.getByRole('listitem', { name: '기사 모으기: 끝남' })).toBeTruthy();
	});

	it('도는 중: 진행(끝낸 수/전체)과 기다리는 단계, 시작 시각', async () => {
		live.mockResolvedValueOnce({
			crawl: crawl({
				status: 'running',
				finishedAt: null,
				steps: [
					{ key: 'fetch', label: '기사 모으기', state: 'running', count: 9, progress: [2, 6] },
					{ key: 'classify', label: '분야 나누기', state: 'waiting' },
					{ key: 'cluster', label: '같은 사건 묶기', state: 'waiting' },
					{ key: 'breaking', label: '속보 판정', state: 'waiting' },
				],
			}),
			summary: null,
			next: { crawl: null, summary: null },
		});
		renderIt();
		expect(await screen.findByText('2/6 분야')).toBeTruthy();
		expect(screen.getAllByText('기다림')).toHaveLength(3);
		expect(screen.getByText('새 기사를 모으고 있어요 · 10:00 시작')).toBeTruthy();
	});

	it('아직 한 번도 돌지 않았으면 그리지 않는다', async () => {
		live.mockResolvedValueOnce({ crawl: null, summary: null, next: { crawl: null, summary: null } });
		const { container } = renderIt();
		await new Promise((r) => setTimeout(r, 0));
		expect(container.textContent).toBe('');
	});
});
