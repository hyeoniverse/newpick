import { Controller, Get } from '@nestjs/common';
import { Public } from './auth/decorators/auth.decorators';

@Controller()
export class AppController {
  @Public()
  @Get()
  getHello(): string {
    return 'Hello World';
  }

  /**
   * 헬스 체크. version은 이미지를 만든 커밋(sha-1a2b3c4)으로,
   * 배포 스크립트가 새 버전이 떴는지 확인할 때 씁니다. 로컬 빌드는 dev
   */
  @Public()
  @Get('health')
  getHealth() {
    return { status: 'ok', version: process.env.APP_VERSION || 'dev' };
  }
}
