import { Controller, Get, Query } from '@nestjs/common';
import { AdminOnly } from 'src/auth/decorators/auth.decorators';
import { DashboardService } from './dashboard.service';
import {
	DashboardAiLogsQueryDto,
	DashboardArticlesQueryDto,
	DashboardJobRunsQueryDto,
	DashboardMailsQueryDto,
	DashboardNewslettersQueryDto,
	DashboardQueryDto,
	MailRecipientsQueryDto,
} from './dto/dashboard-query.dto';

/** 예약 작업 대시보드와 상세 목록 (#21). 경로는 예전처럼 /scheduler/dashboard… */
@AdminOnly()
@Controller('scheduler')
export class DashboardController {
	constructor(private readonly dashboardService: DashboardService) {}

	/** 상세: 수집 기사 (기간 · 관심사 · 언론사 · 제목, 쓰인 뉴스레터, 페이지) (#31) */
	@Get('dashboard/articles')
	async listArticles(@Query() query: DashboardArticlesQueryDto) {
		return {
			message: '수집 기사 조회 성공',
			data: await this.dashboardService.listArticles(query),
		};
	}

	/** 상세: 예약 작업 실행 기록 (작업 · 결과, 페이지) (#21) */
	@Get('dashboard/job-runs')
	async listJobRuns(@Query() query: DashboardJobRunsQueryDto) {
		return {
			message: '실행 기록 조회 성공',
			data: await this.dashboardService.listJobRuns(query),
		};
	}

	/** 상세: 기간 안에 발행한 뉴스레터 (페이지) (#21) */
	@Get('dashboard/newsletters')
	async listNewsletters(@Query() query: DashboardNewslettersQueryDto) {
		return {
			message: '발행 목록 조회 성공',
			data: await this.dashboardService.listNewsletters(query),
		};
	}

	/** 상세: 기간 안 발송 기록 (하루 한 사람 한 줄, 페이지) (#21) */
	@Get('dashboard/mails')
	async listMails(@Query() query: DashboardMailsQueryDto) {
		return {
			message: '발송 기록 조회 성공',
			data: await this.dashboardService.listMails(query),
		};
	}

	/** 상세: 기간 안 AI 기록 (종류 · 결과, 페이지, 비용 합계) (#21) */
	@Get('dashboard/ai-logs')
	async listAiLogs(@Query() query: DashboardAiLogsQueryDto) {
		return {
			message: 'AI 기록 조회 성공',
			data: await this.dashboardService.listAiLogs(query),
		};
	}

	/** 그날 메일을 받은 사람 (이메일 · 보낸 시각 · 받은 관심사) (#21) */
	@Get('dashboard/mail')
	async getMailRecipients(@Query() query: MailRecipientsQueryDto) {
		return {
			message: '받은 사람 조회 성공',
			data: await this.dashboardService.getMailRecipients(query.date),
		};
	}

	/** 관리자 대시보드: 스케줄러 · 오늘 수집 · 발행 · AI 요약 기록 · 발송을 한 번에 (#21) */
	@Get('dashboard')
	async getDashboard(@Query() query: DashboardQueryDto) {
		return {
			message: '대시보드 조회 성공',
			data: await this.dashboardService.getDashboard(query.from, query.to),
		};
	}
}
