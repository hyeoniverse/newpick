import { passedToday } from './catch-up';
import { setup } from './__tests__/jobs.setup';

// 2026-11-23(월) 09:00 KST = 00:00 UTC
const NINE_KST = new Date('2026-11-23T00:00:00Z');
const schedule = {
	crawl: { hour: 0, minute: 0 },
	summary: { hour: 8, minute: 30 },
	mail: { hour: 8, minute: 40, day: 7 },
};

describe('passedToday (#341)', () => {
	it('오늘 KST 예약 시각이 지났으면 그 시각, 아직이면 null', () => {
		expect(passedToday({ hour: 8, minute: 30 }, NINE_KST)?.toISOString()).toBe('2026-11-22T23:30:00.000Z');
		expect(passedToday({ hour: 9, minute: 30 }, NINE_KST)).toBeNull();
	});

	it('메일 요일: 매일(7)이거나 오늘 요일일 때만', () => {
		expect(passedToday({ hour: 8, minute: 40 }, NINE_KST, 7)).not.toBeNull();
		expect(passedToday({ hour: 8, minute: 40 }, NINE_KST, 1)).not.toBeNull(); // 월요일
		expect(passedToday({ hour: 8, minute: 40 }, NINE_KST, 2)).toBeNull();
	});

	it('KST 자정 직후(UTC로는 전날)에도 KST 날짜로 본다', () => {
		// 2026-11-23 00:10 KST: 오늘 08:30은 아직
		expect(passedToday({ hour: 8, minute: 30 }, new Date('2026-11-22T15:10:00Z'))).toBeNull();
	});
});

describe('SchedulerService.catchUp (#341 재시작으로 놓친 실행)', () => {
	it('예약 시각 뒤 실행 기록이 없으면 요약 → 메일 순서로 돌리고, 놓친 실행으로 남긴다', async () => {
		const { scheduler, summaryJob, mailJob, jobRuns, prisma } = setup(0);
		const summary = jest.spyOn(summaryJob, 'makeAiSummary').mockResolvedValue(undefined);
		const mail = jest.spyOn(mailJob, 'sendEmailSummary').mockResolvedValue(undefined);
		const mark = jest.spyOn(jobRuns, 'markTrigger');

		await scheduler.catchUp(schedule, NINE_KST);

		expect(summary).toHaveBeenCalledTimes(1);
		expect(mail).toHaveBeenCalledTimes(1);
		expect(summary.mock.invocationCallOrder[0]).toBeLessThan(mail.mock.invocationCallOrder[0]);
		expect(mark.mock.calls).toEqual([
			['summary', 'catchup'],
			['mail', 'catchup'],
		]);
		// 요약은 실패 기록만 있어도 다시, 메일은 기록이 하나라도 있으면 돌리지 않는다
		const [summaryQuery, mailQuery] = prisma.jobRun.count.mock.calls.map((c: [{ where: object }]) => c[0].where);
		expect(summaryQuery).toMatchObject({ job: 'summary', status: { not: 'failed' } });
		expect(mailQuery).toEqual({ job: 'mail', startedAt: { gte: new Date('2026-11-22T23:40:00Z') } });
	});

	it('이미 돌았으면(기록이 있으면) 아무것도 하지 않는다', async () => {
		const { scheduler, summaryJob, mailJob, prisma } = setup(0);
		prisma.jobRun.count.mockResolvedValue(1);
		const summary = jest.spyOn(summaryJob, 'makeAiSummary');
		const mail = jest.spyOn(mailJob, 'sendEmailSummary');

		await scheduler.catchUp(schedule, NINE_KST);

		expect(summary).not.toHaveBeenCalled();
		expect(mail).not.toHaveBeenCalled();
	});

	it('예약 시각 전이면 기록을 보지도 않는다', async () => {
		const { scheduler, prisma } = setup(0);
		await scheduler.catchUp(schedule, new Date('2026-11-22T22:00:00Z')); // 07:00 KST
		expect(prisma.jobRun.count).not.toHaveBeenCalled();
	});
});
