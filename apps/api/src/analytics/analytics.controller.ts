import { Body, Controller, Headers, HttpCode, Post } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { Public } from 'src/auth/decorators/auth.decorators';
import { AnalyticsService } from './analytics.service';
import { CollectDto } from './dto/collect.dto';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  /**
   * 방문 기록 받기 (#131). 로그인 없이, 쿠키 · IP는 남기지 않는다.
   * 모든 방문자가 웹 서버(/api 프록시) 하나를 거쳐 와서 IP별 요청 제한이 방문자 전체에 걸리므로 제한에서 뺀다
   * (한 보기는 한 줄을 덮어쓸 뿐이고, 값 크기는 DTO · 서비스에서 막는다)
   */
  @Public()
  @SkipThrottle()
  @Post('collect')
  @HttpCode(204)
  async collect(
    @Body() body: CollectDto,
    @Headers('user-agent') userAgent?: string,
  ) {
    await this.analyticsService.collect(body, userAgent);
  }
}
