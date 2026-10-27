import { Controller, Get, HttpCode, Post, Query } from '@nestjs/common';
import { Public } from 'src/auth/decorators/auth.decorators';
import { AppException } from '../common/errors/app.exception';
import { SubscriberService } from './subscriber.service';
import { verifyUnsubscribeToken } from './unsubscribe-token';

/**
 * 원클릭 구독 해지 (#18). 로그인 없이 메일의 토큰으로만 동작한다.
 * - GET: 확인 화면용 (가린 메일 주소 · 지금 구독 중인지). 아무것도 바꾸지 않는다
 *   (메일 보안 검사기가 링크를 미리 열어도 해지되지 않게)
 * - POST: 해지. 메일 앱의 원클릭 버튼(List-Unsubscribe-Post, RFC 8058)과 확인 화면의 버튼이 부른다
 * 로그인이 필요한 구독 API(SubscriberController)와 나눠 둔다
 */
@Public()
@Controller('subscribers/unsubscribe')
export class UnsubscribeController {
  constructor(private readonly subscriberService: SubscriberService) {}

  @Get()
  async check(@Query('token') token: string) {
    const target = await this.subscriberService.unsubscribeTarget(
      this.userIdFrom(token),
    );
    if (!target) throw new AppException('UNSUBSCRIBE_LINK_INVALID');
    return { message: '수신 거부 대상', data: target };
  }

  @Post()
  @HttpCode(200)
  async unsubscribe(@Query('token') token: string) {
    const result = await this.subscriberService.unsubscribeOneClick(
      this.userIdFrom(token),
    );
    return { message: '수신 거부를 처리했습니다.', data: result };
  }

  private userIdFrom(token: string) {
    const userId = verifyUnsubscribeToken(token);
    if (userId === null) throw new AppException('UNSUBSCRIBE_LINK_INVALID');
    return userId;
  }
}
