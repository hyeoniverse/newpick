import { IS_PUBLIC_KEY } from 'src/auth/decorators/auth.decorators';
import { PublishTimeController } from './publish-time.controller';

describe('GET /schedule/publish-time', () => {
	it('AI 요약 예약 시각을 누구나 볼 수 있다', () => {
		const scheduleConfig = {
			getSchedule: () => ({
				crawl: { hour: 6, minute: 0 },
				summary: { hour: 6, minute: 30 },
				mail: { hour: 7, minute: 0, day: 7 },
			}),
		};
		const controller = new PublishTimeController(scheduleConfig as never);
		expect(controller.publishTime().data).toEqual({ hour: 6, minute: 30 });
		expect(Reflect.getMetadata(IS_PUBLIC_KEY, PublishTimeController.prototype.publishTime)).toBe(true);
	});
});
