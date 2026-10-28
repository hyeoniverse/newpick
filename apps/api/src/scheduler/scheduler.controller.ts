import { Controller, Post, Get, Put, Body, Query } from '@nestjs/common';
import { ScheduleDto } from './dto/schedule.dto';
import { SchedulerService } from './scheduler.service';
import { MailSendCycleDto } from './dto/mail-send-cycle.dto';
import { ToggleDto } from './dto/toggle.dto';
import { Logger } from '@nestjs/common';
import { MailService } from '../mail/mail.service';
import { SubscriberService } from 'src/subscriber/subscriber.service';
import { NewsletterRepo } from 'src/repository/newsletter.repository';
import { AdminOnly } from 'src/auth/decorators/auth.decorators';
import { DashboardService } from './dashboard.service';
import { StatsService } from './stats.service';
import {
  DashboardAiLogsQueryDto,
  DashboardArticlesQueryDto,
  DashboardJobRunsQueryDto,
  DashboardMailsQueryDto,
  DashboardNewslettersQueryDto,
  DashboardQueryDto,
  MailRecipientsQueryDto,
} from './dto/dashboard-query.dto';

@AdminOnly()
@Controller('scheduler')
export class SchedulerController {
  constructor(
    private readonly schedulerService: SchedulerService,
    private readonly subscriberService: SubscriberService,
    private readonly logger: Logger,
    private readonly mailService: MailService,
    private readonly newsletterRepository: NewsletterRepo,
    private readonly dashboardService: DashboardService,
    private readonly statsService: StatsService,
  ) {}

  /** 관리자 대시보드: 스케줄러 · 오늘 수집 · 발행 · AI 요약 기록 · 발송을 한 번에 (#21) */
  /** 예약 작업 시간 (#21) */
  @Get('schedule')
  getSchedule() {
    return {
      message: '예약 시간 조회 성공',
      data: this.schedulerService.getSchedule(),
    };
  }

  /** 예약 작업 시간 바꾸기: 수집 → AI 요약 → 메일 순서여야 하고, 바로 다시 건다 (#21) */
  @Put('schedule')
  async setSchedule(@Body() body: ScheduleDto) {
    return {
      message: '예약 시간을 바꿨습니다.',
      data: await this.schedulerService.setSchedule(body),
    };
  }

  /** 통계: 날짜별 구독 · 일시정지 · 해지와 구독 중 수, 관심사별 구독 중 (#122). 기간을 안 주면 최근 30일 */
  @Get('stats/subscribers')
  async subscriberStats(@Query() { from, to }: DashboardQueryDto) {
    return {
      message: '구독자 통계 조회 성공',
      data: await this.statsService.subscribers(from, to),
    };
  }

  /** 통계: 날짜별 · 종류 · 관심사 · 모델 · 단계별 AI 비용, 이번 달 예상 (#122) */
  @Get('stats/cost')
  async costStats(@Query() { from, to }: DashboardQueryDto) {
    return {
      message: 'AI 비용 통계 조회 성공',
      data: await this.statsService.cost(from, to),
    };
  }

  /** 통계: 날짜별 발송 · 작업 결과, 관심사별 조회수 (#122) */
  @Get('stats/delivery')
  async deliveryStats(@Query() { from, to }: DashboardQueryDto) {
    return {
      message: '발송 통계 조회 성공',
      data: await this.statsService.delivery(from, to),
    };
  }

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

  @Get('dashboard')
  async getDashboard(@Query() query: DashboardQueryDto) {
    return {
      message: '대시보드 조회 성공',
      data: await this.dashboardService.getDashboard(query.from, query.to),
    };
  }

  @Post('toggle/crawling')
  toggleCrawling(@Body() data: ToggleDto) {
    const enable = Boolean(data.enable);
    this.schedulerService.toggleCrawlingScheduler(enable);
    return {
      success: true,
      enabled: enable,
      message: `크롤링 스케줄러가 ${enable ? '활성화' : '비활성화'} 되었습니다.`,
    };
  }

  @Post('toggle/ai-summary')
  toggleAiSummary(@Body() data: ToggleDto) {
    const enable = Boolean(data.enable);
    this.schedulerService.toggleAiSummaryScheduler(enable);
    return {
      success: true,
      enabled: enable,
      message: `뉴스레터 스케줄러가 ${enable ? '활성화' : '비활성화'} 되었습니다.`,
    };
  }

  @Post('toggle/mail-send')
  toggleMailSend(@Body() data: ToggleDto) {
    const enable = Boolean(data.enable);
    this.schedulerService.toggleMailSendScheduler(enable);
    return {
      success: true,
      enabled: enable,
      message: `메일 발송 스케줄러가 ${enable ? '활성화' : '비활성화'} 되었습니다.`,
    };
  }

  @Get('status')
  getStatus() {
    return {
      status: this.schedulerService.getSchedulerStatus(),
      message: '스케줄러 상태 조회 완료',
    };
  }

  @Post('change/mail-send-cycle')
  async changeMailSendCycle(@Body() data: MailSendCycleDto) {
    const cycle = await this.schedulerService.setMailSendCycle(
      data.hour,
      data.day,
    );
    return {
      success: true,
      message: '메일 발송 주기가 변경되었습니다.',
      cycle,
    };
  }
  @Post('manual/crawling')
  startCrawling() {
    this.schedulerService.manualStartCrawling();
    return {
      success: true,
      message: '크롤링 시작되었습니다.',
    };
  }
  @Post('manual/ai-summary')
  startAiSummary() {
    this.schedulerService.manualStartAiSummary();
    return {
      success: true,
      message: 'AI 요약 시작되었습니다.',
    };
  }
  @Post('manual/mail-send')
  startMailSend() {
    this.schedulerService.manualStartMailSend();
    return {
      success: true,
      message: '메일 발송 시작되었습니다.',
    };
  }

  @Get('mail-send-cycle')
  getMailSendCycle() {
    return this.schedulerService.getMailSendCycle();
  }
}
