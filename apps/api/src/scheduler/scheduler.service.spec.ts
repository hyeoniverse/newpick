import { setup } from './__tests__/jobs.setup';

describe('예약 시간 바꾸기 (#21)', () => {
	const at = (hour: number, minute: number) => ({ hour, minute });

	it('수집 → 요약 → 메일 순서면 저장하고 세 작업을 다시 건다', async () => {
		const { scheduleConfig, scheduler, prisma, registry, cronJob } = setup(0);
		const next = {
			crawl: at(7, 0),
			summary: at(7, 20),
			mail: { ...at(7, 45), day: 1 },
		};
		await expect(scheduler.setSchedule(next)).resolves.toEqual(next);
		expect(prisma.scheduleConfig.upsert).toHaveBeenCalledWith(
			expect.objectContaining({
				update: {
					crawlHour: 7,
					crawlMinute: 0,
					summaryHour: 7,
					summaryMinute: 20,
					hour: 7,
					mailMinute: 45,
					day: 1,
				},
			}),
		);
		expect(registry.getCronJob.mock.calls.map((c) => c[0])).toEqual([
			'startCrawling',
			'makeAiSummary',
			'sendNewsletter',
		]);
		expect(cronJob.setTime).toHaveBeenCalledTimes(3);
		expect(scheduleConfig.getSchedule()).toEqual(next);
	});

	it('순서가 어긋나면 거절하고 아무것도 바꾸지 않는다', async () => {
		const { scheduler, prisma } = setup(0);
		await expect(
			scheduler.setSchedule({
				crawl: at(8, 30),
				summary: at(8, 0),
				mail: { ...at(8, 40), day: 7 },
			}),
		).rejects.toThrow('순서');
		expect(prisma.scheduleConfig.upsert).not.toHaveBeenCalled();
	});
});
