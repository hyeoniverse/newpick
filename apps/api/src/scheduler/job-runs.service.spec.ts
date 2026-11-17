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
			message: '뉴스레터 2편 생성 · 실패: 정치',
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
				message: '뉴스레터 2편 생성 · 실패: 정치',
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
