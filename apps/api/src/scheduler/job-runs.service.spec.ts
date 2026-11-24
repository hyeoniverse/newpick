import { setup } from './__tests__/jobs.setup';

describe('서버 재시작', () => {
	it('서버가 다시 시작되면 진행 중으로 남은 기록을 실패로 닫는다 (대시보드가 계속 막히지 않게)', async () => {
		const { jobRuns, prisma } = setup(0);
		await jobRuns.closeInterruptedRuns();
		const { where, data } = prisma.jobRun.updateMany.mock.calls[0][0];
		expect(where).toEqual({ status: 'running' });
		expect(data.status).toBe('failed');
	});
});

describe('작업 실행 기록 (#21)', () => {
	it('요약: 일부 관심사가 실패하면 partial과 실패한 관심사를 남긴다', async () => {
		const { jobRuns, summaryJob } = setup(2);
		await summaryJob.makeAiSummary();
		expect(jobRuns.getRuns().summary).toMatchObject({
			running: false,
			status: 'partial',
			// 끝에 '· HH:mm에 자동 재시도'가 붙는다 (자정 가까이면 붙지 않음)
			message: expect.stringMatching(/^뉴스레터 2편 생성 · 실패: 정치( · \d\d:\d\d에 자동 재시도)?$/),
		});
	});

	it('메일: 보낸 결과를 남기고, 오늘 뉴스레터가 없으면 skipped', async () => {
		const edition = { date: '2026-10-27', sources: [], editorial: null };
		const sent = setup(0, edition);
		await sent.mailJob.sendEmailSummary();
		expect(sent.jobRuns.getRuns().mail).toMatchObject({
			status: 'success',
			message: '성공 1 · 실패 0 · 해당 없음 0',
		});

		const none = setup(0, null);
		await none.mailJob.sendEmailSummary();
		expect(none.jobRuns.getRuns().mail).toMatchObject({
			status: 'skipped',
			message: '오늘 나온 뉴스레터 없음',
		});
	});

	it('꺼진 작업은 실행하지 않고 skipped', async () => {
		const { jobRuns, summaryJob, aiSummaryService } = setup(0);
		summaryJob.toggleAiSummaryScheduler(false);
		await summaryJob.makeAiSummary();
		expect(aiSummaryService.summarizeText).not.toHaveBeenCalled();
		expect(jobRuns.getRuns().summary.status).toBe('skipped');
	});

	it('진행 중이면 running', async () => {
		const { jobRuns, summaryJob, aiSummaryService } = setup(0);
		let finish: () => void;
		aiSummaryService.summarizeText.mockImplementationOnce(
			() => new Promise((resolve) => (finish = () => resolve({ newsletter: null }))),
		);
		const run = summaryJob.makeAiSummary();
		await new Promise((r) => setImmediate(r));
		expect(jobRuns.getRuns().summary.running).toBe(true);
		finish!();
		await run;
		expect(jobRuns.getRuns().summary.running).toBe(false);
	});
});

describe('실행 기록 DB (#21)', () => {
	const flush = () => new Promise((r) => setImmediate(r));

	it('예약 실행: 시작할 때 running으로 남기고, 끝나면 같은 줄을 결과로 고친다', async () => {
		const { summaryJob, prisma } = setup(2);
		await summaryJob.makeAiSummary();
		await flush();
		expect(prisma.jobRun.create).toHaveBeenCalledWith({
			data: expect.objectContaining({
				job: 'summary',
				trigger: 'schedule',
				status: 'running',
			}),
			select: { id: true },
		});
		expect(prisma.jobRun.update).toHaveBeenCalledWith({
			where: { id: 41 },
			data: expect.objectContaining({
				status: 'partial',
				// 끝에 '· HH:mm에 자동 재시도'가 붙는다 (자정 가까이면 붙지 않음)
				message: expect.stringMatching(/^뉴스레터 2편 생성 · 실패: 정치( · \d\d:\d\d에 자동 재시도)?$/),
			}),
		});
	});

	it("관리자의 '지금 실행'은 manual로 남는다", async () => {
		const edition = { date: '2026-10-27', sources: [], editorial: null };
		const { jobRuns, scheduler, prisma } = setup(0, edition);
		await scheduler.manualStartMailSend();
		await flush();
		expect(prisma.jobRun.create.mock.calls[0][0].data).toMatchObject({
			job: 'mail',
			trigger: 'manual',
		});
		expect(jobRuns.getRuns().mail.trigger).toBe('manual');
	});

	it('꺼져 있어 건너뛰면 skipped 한 줄만', async () => {
		const { scheduler, prisma } = setup(0);
		scheduler.toggleCrawlingScheduler(false);
		await scheduler.startCrawling();
		await flush();
		expect(prisma.jobRun.create).toHaveBeenCalledTimes(1);
		expect(prisma.jobRun.create.mock.calls[0][0].data).toMatchObject({
			job: 'crawling',
			status: 'skipped',
		});
	});
});

describe('수집 뒤 속보 판정', () => {
	const flush = () => new Promise((r) => setImmediate(r));

	it('새로 모은 기사로 속보를 판정하고, 찾으면 수집 기록에 적는다 (판정이 실패해도 수집은 성공)', async () => {
		const { scheduler, breaking, prisma } = setup(0);
		const created = [{ title: '대통령 비상계엄 선포' }];
		(scheduler as unknown as { crawlingService: unknown }).crawlingService = {
			crawling: jest.fn().mockResolvedValue(created),
		};
		breaking.detect.mockResolvedValueOnce(2);
		await scheduler.startCrawling();
		await flush();
		expect(breaking.detect).toHaveBeenCalledWith(created);
		expect(JSON.stringify(prisma.jobRun.update.mock.calls.at(-1))).toContain(
			'기사 1건 수집 · 속보 2건 (관리자 › 속보)',
		);

		breaking.detect.mockRejectedValueOnce(new Error('down'));
		await scheduler.startCrawling();
		await flush();
		expect(JSON.stringify(prisma.jobRun.update.mock.calls.at(-1))).toContain('success');
	});
	it("홈 '지금 뉴픽은': 수집을 시작 · 끝낼 때 과정을 남기고, 모은 기사로 건수 · 키워드 · 묶음을 채운다 (실패하면 실패로)", async () => {
		const { scheduler, breaking } = setup(0);
		const pipeline = {
			begin: jest.fn(),
			step: jest.fn(),
			describe: jest.fn().mockResolvedValue(undefined),
			finish: jest.fn(),
		};
		const self = scheduler as unknown as { crawlingService: unknown; pipeline: unknown };
		self.pipeline = pipeline;
		const created = [{ title: '코스피 급락', category: ['경제'] }];
		self.crawlingService = { crawling: jest.fn().mockResolvedValue(created) };
		breaking.detect.mockResolvedValueOnce(1);
		await scheduler.startCrawling();
		expect(pipeline.begin).toHaveBeenCalledWith('crawl');
		expect(pipeline.describe).toHaveBeenCalledWith('crawl', created);
		expect(pipeline.step).toHaveBeenCalledWith('crawl', 'breaking', { state: 'done', count: 1 });
		expect(pipeline.finish).toHaveBeenLastCalledWith('crawl', 'done');

		self.crawlingService = { crawling: jest.fn().mockRejectedValue(new Error('naver down')) };
		await expect(scheduler.startCrawling()).rejects.toThrow('naver down');
		expect(pipeline.finish).toHaveBeenLastCalledWith('crawl', 'failed');
	});
});
