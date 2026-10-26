import {
  BadRequestException,
  Controller,
  Get,
  NotFoundException,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { Public } from 'src/auth/decorators/auth.decorators';
import { CommonResponseInterceptor } from 'src/common/response.interceptor';
import { EditionService } from './edition.service';

@Controller('edition')
@UseInterceptors(CommonResponseInterceptor)
export class EditionController {
  constructor(private readonly editionService: EditionService) {}

  /**
   * 체험하기: 고른 분야로 받게 될 메일을 실제 메일과 같은 HTML로 (#55).
   * 이미 만든 최신 발행본과 편집본만 쓴다 (AI 호출 없음). categories: 분야 id, 쉼표로 구분
   */
  @Public()
  @Get('preview')
  async preview(@Query('categories') categories = '') {
    const interests = [
      ...new Set(categories.split(',').filter(Boolean).map(Number)),
    ];
    if (!interests.length || interests.some((n) => !Number.isInteger(n))) {
      throw new BadRequestException('분야 id를 쉼표로 구분해 주세요');
    }
    const edition = await this.editionService.latestEdition();
    const mail = edition && this.editionService.composeMail(edition, interests);
    if (!mail) throw new NotFoundException('고른 분야의 발행본이 없습니다');
    return { date: edition.date, subject: mail.subject, html: mail.html };
  }
}
