import { Controller, Get } from '@nestjs/common';
import { Public } from './auth/decorators/auth.decorators';

@Controller()
export class AppController {
  /** 헬스 체크 */
  @Public()
  @Get()
  getHello(): string {
    return 'Hello World';
  }
}
