import type { ClockTime } from '@newpick/shared';
import { Controller, Get } from '@nestjs/common';
import { Public } from 'src/auth/decorators/auth.decorators';
import { ScheduleConfigService } from './schedule-config.service';

/**
 * 뉴스레터 발행 시각 (누구나): 매일 AI 요약(뉴스레터 만들기)을 시작하는 시각 (KST).
 * 홈 '오늘의 뉴스레터'가 이 시각 전에는 전날 것을, 지난 뒤에는 오늘 것(없으면 준비 중)을 보여 준다.
 * 예약 시각 전체(GET /scheduler/schedule)는 관리자만이라 발행 시각만 따로 연다
 */
@Controller('schedule')
export class PublishTimeController {
	constructor(private readonly scheduleConfig: ScheduleConfigService) {}

	@Public()
	@Get('publish-time')
	publishTime(): { message: string; data: ClockTime } {
		return { message: '뉴스레터 발행 시각 조회 성공', data: this.scheduleConfig.getSchedule().summary };
	}
}
