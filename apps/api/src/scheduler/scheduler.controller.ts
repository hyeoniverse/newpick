import { Controller, Post, Get, Body } from '@nestjs/common';
import { SchedulerService } from './scheduler.service';
import { MailSendCycleDto } from './dto/mail-send-cycle.dto';
import { ToggleDto } from './dto/toggle.dto';
import { Logger } from '@nestjs/common';
import { MailService } from '../mail/mail.service';
import { SubscriberService } from 'src/subscriber/subscriber.service';
import { NewsletterRepo } from 'src/repository/newsletter.repository';
import { AdminOnly } from 'src/auth/decorators/auth.decorators';
import { DashboardService } from './dashboard.service';

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
  ) {}

  /** 관리자 대시보드: 스케줄러 · 오늘 수집 · 발행 · AI 요약 기록 · 발송을 한 번에 (#21) */
  @Get('dashboard')
  async getDashboard() {
    return {
      message: '대시보드 조회 성공',
      data: await this.dashboardService.getDashboard(),
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
