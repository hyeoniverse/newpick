import { Controller, Get, Query } from '@nestjs/common';
import { AdminOnly } from 'src/auth/decorators/auth.decorators';
import { DateRangeQueryDto } from 'src/common/dto/date-range-query.dto';
import { TasteService } from 'src/taste/taste.service';
import { PageStatsQueryDto } from './dto/page-stats-query.dto';
import { StatsService } from './stats.service';

/**
 * 관리자 통계 (#122 · #123 · #131): 구독자 · AI 비용 · 발송 · 취향 · 방문 · 페이지.
 * 경로는 예전처럼 /scheduler/stats/… (웹이 이 주소를 부른다)
 */
@AdminOnly()
@Controller('scheduler')
export class StatsController {
	constructor(
		private readonly statsService: StatsService,
		private readonly tasteService: TasteService,
	) {}

	/** 통계: 날짜별 구독 · 일시정지 · 해지와 구독 중 수, 관심사별 구독 중 (#122). 기간을 안 주면 최근 30일 */
	@Get('stats/subscribers')
	async subscriberStats(@Query() { from, to }: DateRangeQueryDto) {
		return {
			message: '구독자 통계 조회 성공',
			data: await this.statsService.subscribers(from, to),
		};
	}

	/** 통계: 날짜별 · 종류 · 관심사 · 모델 · 단계별 AI 비용, 이번 달 예상 (#122) */
	@Get('stats/cost')
	async costStats(@Query() { from, to }: DateRangeQueryDto) {
		return {
			message: 'AI 비용 통계 조회 성공',
			data: await this.statsService.cost(from, to),
		};
	}

	/** 통계: 날짜별 발송 · 작업 결과, 관심사별 조회수 (#122) */
	@Get('stats/delivery')
	async deliveryStats(@Query() { from, to }: DateRangeQueryDto) {
		return {
			message: '발송 통계 조회 성공',
			data: await this.statsService.delivery(from, to),
		};
	}

	/** 통계: 모두의 취향 신호 — 많이 모인 태그 · 관심사, 신호를 남긴 사람 수 (#123) */
	@Get('stats/taste')
	async tasteStats() {
		return {
			message: '취향 통계 조회 성공',
			data: await this.tasteService.overview(),
		};
	}

	/** 통계: 방문 · 유입 경로 · 페이지별 머문 시간 (#131) */
	@Get('stats/traffic')
	async trafficStats(@Query() { from, to }: DateRangeQueryDto) {
		return {
			message: '방문 통계 조회 성공',
			data: await this.statsService.traffic(from, to),
		};
	}

	/** 통계: 한 페이지의 구역별 머문 시간 · 20칸 머문 시간 · 클릭 위치 (#131) */
	@Get('stats/page')
	async pageStats(@Query() { route, device, from, to }: PageStatsQueryDto) {
		return {
			message: '페이지 통계 조회 성공',
			data: await this.statsService.page(route, device, from, to),
		};
	}
}
