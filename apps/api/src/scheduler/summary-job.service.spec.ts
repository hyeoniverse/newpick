import { kstDaysAgo, kstStamp } from 'src/common/kst';
import { setup } from './__tests__/jobs.setup';

describe('SummaryJobService.makeAiSummary', () => {
	it('카테고리 하나가 실패해도 나머지 카테고리는 요약한다', async () => {
		const { summaryJob, aiSummaryService } = setup(2);
		await summaryJob.makeAiSummary();
		const summarized = aiSummaryService.summarizeText.mock.calls.map((c) => c[1]);
		expect(summarized).toEqual([1, 3]);
	});

	it('실패한 관심사는 나머지를 만든 뒤 다시 시도한다 (일시적인 시간 초과)', async () => {
		const { summaryJob, aiSummaryService, prisma } = setup(0);
		aiSummaryService.summarizeText.mockRejectedValueOnce(new Error('Request timed out.'));
		await summaryJob.makeAiSummary();
		// 3개 관심사 + 실패한 1개 다시 = 4번
		expect(aiSummaryService.summarizeText).toHaveBeenCalledTimes(4);
		const finished = prisma.jobRun.update.mock.calls.at(-1)[0].data;
		expect(finished.status).toBe('success');
		expect(finished.message).toContain('다시 시도로 1편');
	});

	it('그날의 뉴스만: 어제 수집 시각부터 지금까지 모은 기사로, 오늘 05시 이후 보도는 아침 속보 (예전 지난 7일 전부가 아니라)', async () => {
		const { summaryJob, crawlingRepository, aiSummaryService } = setup(0);
		await summaryJob.makeAiSummary();
		const [start, end] = crawlingRepository.getCrawledNewsBetween.mock.calls[0];
		const kst = (d: Date) => kstStamp(d);
		// 기본 수집 시각 08:00 → 어제 08:00:00 KST부터
		expect(kst(start)).toBe(`${kstDaysAgo(1)} 08:00:00`);
		expect(Date.now() - end.getTime()).toBeLessThan(5000);
		const morningSince = (aiSummaryService.summarizeText.mock.calls[0] as unknown[])[3] as Date;
		expect(kst(morningSince)).toBe(`${kstDaysAgo(0)} 05:00:00`);
	});
});

describe('다시 만들기 (빠진 날 · AI 기록에서 실패한 줄)', () => {
	it('만든 편수를 제대로 센다 (예전엔 늘 0편)', async () => {
		const { summaryJob, prisma } = setup(0);
		await summaryJob.makeAiSummary();
		expect(prisma.jobRun.update.mock.calls.at(-1)[0].data.message).toContain('뉴스레터 3편 생성');
	});

	it('그날 이미 있는 분야는 건너뛴다 (일부만 실패해 다시 실행해도 같은 날 두 편이 되지 않게)', async () => {
		const { summaryJob, aiSummaryService, prisma } = setup(0);
		prisma.newsletter.findMany.mockResolvedValue([{ categoryId: 2 }]);
		await summaryJob.makeAiSummary();
		const summarized = aiSummaryService.summarizeText.mock.calls.map((call) => call[1]);
		expect(summarized).toEqual([1, 3]);
		expect(prisma.jobRun.update.mock.calls.at(-1)[0].data.message).toContain('이미 있어 건너뜀 1');
	});

	it('지난 날짜는 그날 기사 · 그날 발행 시각으로, 메일 편집 · 후속 판정은 하지 않는다', async () => {
		const { summaryJob, crawlingRepository, aiSummaryService, editionService, followsService, prisma } = setup(0);
		const at = new Date('2026-11-08T08:30:00+09:00');
		await summaryJob.makeAiSummary(at);
		const [start, end] = crawlingRepository.getCrawledNewsBetween.mock.calls[0];
		expect(kstStamp(start)).toBe('2026-11-07 08:00:00');
		expect(end).toBe(at);
		expect((aiSummaryService.summarizeText.mock.calls[0] as unknown[])[4]).toBe(at);
		// 그날 있는 분야를 그날 범위로 찾는다
		const where = prisma.newsletter.findMany.mock.calls[0][0].where;
		expect(kstStamp(where.createdAt.gte)).toBe('2026-11-08 00:00:00');
		expect(editionService.ensureEdition).not.toHaveBeenCalled();
		expect(followsService.detect).not.toHaveBeenCalled();
		expect(prisma.jobRun.update.mock.calls.at(-1)[0].data.message).toContain('2026-11-08 다시 만들기');
	});

	it('다시 쓰기는 그날 있어도 건너뛰지 않고 그 뉴스레터를 바꾼다 (메일 편집 · 후속 판정 없이)', async () => {
		const { summaryJob, aiSummaryService, editionService, prisma } = setup(0);
		prisma.newsletter.findMany.mockResolvedValue([{ categoryId: 3 }]);
		const at = new Date('2026-11-09T13:11:44+09:00');
		await summaryJob.makeAiSummary(at, 3, 86);
		const call = aiSummaryService.summarizeText.mock.calls[0] as unknown[];
		expect(call[1]).toBe(3);
		expect(call[4]).toBe(at);
		expect(call[5]).toBe(86);
		expect(editionService.ensureEdition).not.toHaveBeenCalled();
		expect(prisma.jobRun.update.mock.calls.at(-1)[0].data.message).toContain('#86');
	});

	it('다시 쓸 뉴스레터: 그 뉴스레터를 만든 시각 · 분야, 없으면 404 · 모은 기사가 지워졌으면 400', async () => {
		const { summaryJob, prisma } = setup(0);
		const createdAt = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
		Object.assign(prisma.newsletter, {
			findUnique: jest
				.fn()
				.mockResolvedValueOnce({ createdAt, categoryId: 4 })
				.mockResolvedValueOnce(null)
				.mockResolvedValueOnce({
					createdAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000),
					categoryId: 4,
				}),
		});
		await expect(summaryJob.regenerateTarget(86)).resolves.toEqual({
			at: createdAt,
			categoryId: 4,
		});
		await expect(summaryJob.regenerateTarget(1)).rejects.toThrow();
		await expect(summaryJob.regenerateTarget(2)).rejects.toThrow();
	});

	it('도는 중인지 알 수 있다 (도는 중에 누르면 합쳐지지 않게 거절하려고)', async () => {
		const { summaryJob } = setup(0);
		expect(summaryJob.isSummaryRunning()).toBe(false);
		const run = summaryJob.makeAiSummary();
		expect(summaryJob.isSummaryRunning()).toBe(true);
		await run;
		expect(summaryJob.isSummaryRunning()).toBe(false);
	});

	it('분야를 주면 그 분야만', async () => {
		const { summaryJob, aiSummaryService } = setup(0);
		await summaryJob.makeAiSummary(undefined, 3);
		expect(aiSummaryService.summarizeText.mock.calls.map((c) => c[1])).toEqual([3]);
	});
});

describe('사이트 캐시 (#73)', () => {
	it('새 뉴스레터를 만든 뒤 사이트 캐시를 한 번 비운다', async () => {
		const { summaryJob, siteCache, editionService } = setup(0);
		await summaryJob.makeAiSummary();
		expect(siteCache.refresh).toHaveBeenCalledTimes(1);
		expect(siteCache.refresh.mock.invocationCallOrder[0]).toBeGreaterThan(
			editionService.ensureEdition.mock.invocationCallOrder[0],
		);
	});

	it('만든 뉴스레터가 없으면 비우지 않는다', async () => {
		const { summaryJob, siteCache, aiSummaryService } = setup(0);
		aiSummaryService.summarizeText.mockResolvedValue({ newsletter: null });
		await summaryJob.makeAiSummary();
		expect(siteCache.refresh).not.toHaveBeenCalled();
	});
});
