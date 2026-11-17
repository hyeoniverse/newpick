import { JOB_ENDPOINT } from '@newpick/shared';
import { Controller, Post, Get, Put, Body } from '@nestjs/common';
import { ScheduleDto } from './dto/schedule.dto';
import { SchedulerService } from './scheduler.service';
import { ScheduleConfigService } from './schedule-config.service';
import { SummaryJobService } from './summary-job.service';
import { MailJobService } from './mail-job.service';
import { MailSendCycleDto } from './dto/mail-send-cycle.dto';
import { ToggleDto } from './dto/toggle.dto';
import { ManualSummaryDto } from './dto/manual-summary.dto';
import { AppException } from 'src/common/errors/app.exception';
import { AdminOnly } from 'src/auth/decorators/auth.decorators';

@AdminOnly()
@Controller('scheduler')
export class SchedulerController {
  constructor(
    private readonly schedulerService: SchedulerService,
    private readonly scheduleConfig: ScheduleConfigService,
    private readonly summaryJob: SummaryJobService,
    private readonly mailJob: MailJobService,
  ) {}

  /** 예약 작업 시간 (#21) */
  @Get('schedule')
  getSchedule() {
    return {
      message: '예약 시간 조회 성공',
      data: this.scheduleConfig.getSchedule(),
    };
  }

  /** 예약 작업 시간 바꾸기: 수집 → AI 요약 → 메일 순서여야 하고, 바로 다시 건다 (#21) */
  @Put('schedule')
  async setSchedule(@Body() body: ScheduleDto) {
    return {
      message: '예약 시간을 변경했습니다.',
      data: await this.schedulerService.setSchedule(body),
    };
  }

  @Post(`toggle/${JOB_ENDPOINT.crawling}`)
  toggleCrawling(@Body() data: ToggleDto) {
    const enable = Boolean(data.enable);
    this.schedulerService.toggleCrawlingScheduler(enable);
    return {
      success: true,
      enabled: enable,
      message: `크롤링 스케줄러가 ${enable ? '활성화' : '비활성화'} 되었습니다.`,
    };
  }

  @Post(`toggle/${JOB_ENDPOINT.summary}`)
  toggleAiSummary(@Body() data: ToggleDto) {
    const enable = Boolean(data.enable);
    this.summaryJob.toggleAiSummaryScheduler(enable);
    return {
      success: true,
      enabled: enable,
      message: `뉴스레터 스케줄러가 ${enable ? '활성화' : '비활성화'} 되었습니다.`,
    };
  }

  @Post(`toggle/${JOB_ENDPOINT.mail}`)
  toggleMailSend(@Body() data: ToggleDto) {
    const enable = Boolean(data.enable);
    this.mailJob.toggleMailSendScheduler(enable);
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
  @Post(`manual/${JOB_ENDPOINT.crawling}`)
  startCrawling() {
    this.schedulerService.manualStartCrawling();
    return {
      success: true,
      message: '기사 수집을 시작했습니다.',
    };
  }
  @Post(`manual/${JOB_ENDPOINT.summary}`)
  async startAiSummary(
    @Body() { date, categoryId, newsletterId }: ManualSummaryDto = {},
  ) {
    // 요약은 한 번에 하나: 도는 중에 누르면 새로 시작하지 않고 그 실행에 합쳐져 버려서, 알려 주고 거절한다
    if (this.summaryJob.isSummaryRunning()) {
      throw new AppException(
        'BAD_REQUEST',
        'AI 요약이 이미 진행 중입니다. 완료된 후 다시 시도해 주십시오.',
      );
    }
    // 다시 쓰기: 그 뉴스레터의 날 · 분야로 (없거나 너무 오래되면 404 · 400)
    if (newsletterId) {
      const target = await this.summaryJob.regenerateTarget(newsletterId);
      this.schedulerService.manualStartAiSummary(
        target.at,
        target.categoryId,
        newsletterId,
      );
      return {
        success: true,
        message: `#${newsletterId} 뉴스레터를 다시 쓰기 시작했습니다.`,
      };
    }
    // 날짜가 맞지 않으면 시작하기 전에 400 (앞날 · 기사가 지워진 날)
    const at = date ? this.summaryJob.backfillMoment(date) : undefined;
    this.schedulerService.manualStartAiSummary(at, categoryId);
    return {
      success: true,
      message: date
        ? `${date} 빠진 뉴스레터를 만들기 시작했습니다.`
        : 'AI 요약 시작되었습니다.',
    };
  }
  @Post(`manual/${JOB_ENDPOINT.mail}`)
  startMailSend() {
    this.schedulerService.manualStartMailSend();
    return {
      success: true,
      message: '메일 발송을 시작했습니다.',
    };
  }

  @Get('mail-send-cycle')
  getMailSendCycle() {
    return this.schedulerService.getMailSendCycle();
  }
}
