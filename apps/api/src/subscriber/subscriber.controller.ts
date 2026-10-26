import {
  Controller,
  Get,
  Post,
  Delete,
  Req,
  Body,
  UseGuards,
} from '@nestjs/common';
import { SubscriberService } from './subscriber.service';
import { StartSubscriptionDto } from './dto/start-subscription.dto';
import { AuthGuard } from '@nestjs/passport';
import { AdminOnly } from 'src/auth/decorators/auth.decorators';
import { AppException } from '../common/errors/app.exception';
@Controller('subscribers')
@UseGuards(AuthGuard('jwt'))
export class SubscriberController {
  constructor(private readonly subscriberService: SubscriberService) {}

  /**
   * 구독 시작
   */
  @Post('start')
  async startSubscription(@Req() req, @Body() data: StartSubscriptionDto) {
    const userId = this.validateAndParseUserId(req.user?.id);
    return this.subscriberService.startSubscription(userId, data.interests);
  }

  /**
   * 구독 일시정지
   */
  @Post('pause')
  async pauseSubscription(@Req() req) {
    const userId = this.validateAndParseUserId(req.user?.id);
    return this.subscriberService.pauseSubscription(userId);
  }

  /**
   * 구독 해지
   */
  @Delete('cancel')
  async cancelSubscription(@Req() req) {
    const userId = this.validateAndParseUserId(req.user?.id);
    return this.subscriberService.cancelSubscription(userId);
  }

  /**
   * 구독 상태 조회
   */
  @Get('status')
  async getSubscriptionStatus(@Req() req) {
    const userId = this.validateAndParseUserId(req.user?.id);
    return this.subscriberService.getSubscriptionStatus(userId);
  }

  /**
   * 구독 기록 조회
   */
  @Get('history')
  async getSubscriptionHistory(@Req() req) {
    const userId = this.validateAndParseUserId(req.user?.id);
    return this.subscriberService.getSubscriptionHistory(userId);
  }

  @AdminOnly()
  @Get('all')
  async getAllSubscribers() {
    return this.subscriberService.getSubscribers();
  }

  /**
   * userId를 검증하고 Int로 변환
   */
  private validateAndParseUserId(userId: string | number | undefined): number {
    if (!userId) {
      throw new AppException('UNAUTHORIZED');
    }

    const parsedId = typeof userId === 'string' ? parseInt(userId, 10) : userId;

    if (isNaN(parsedId) || parsedId < -2147483648 || parsedId > 2147483647) {
      throw new AppException('BAD_REQUEST', '회원 id가 올바르지 않습니다.');
    }

    return parsedId;
  }
}
