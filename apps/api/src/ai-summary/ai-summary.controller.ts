import { Controller, Body, Post, NotFoundException } from '@nestjs/common';
import { TrialSummarizeDto } from './dto/trial-summarize.dto';
import { AiSummaryService } from './ai-summary.service';
import { CrawlingRepository } from 'src/crawling/crawling.repository';
import { Logger } from '@nestjs/common';
import { AdminOnly } from 'src/auth/decorators/auth.decorators';

const TRIAL_CACHE_TTL = 6 * 60 * 60 * 1000;
const TRIAL_CACHE_MAX = 200;

@Controller('ai-summary')
export class AiSummaryController {
  private readonly trialCache = new Map<
    string,
    {
      value: { newsletter: unknown };
      expiresAt: number;
    }
  >();

  constructor(
    private readonly aiSummaryService: AiSummaryService,
    private readonly crawlingRepository: CrawlingRepository,
    private readonly logger: Logger,
  ) {}

  /**
   * 기간·카테고리를 지정해 뉴스레터를 저장하지 않고 생성해 보는 관리자용 도구 (Claude 호출).
   * 예전에는 홈 무료 체험이 로그인 없이 이 경로를 불러 IP만 바꾸면 비용이 무제한으로 들 수 있었습니다.
   * 체험은 이제 최신 발행본을 보여 줍니다(#54).
   * - 항상 체험 모드(test)로 실행해 뉴스레터로 저장하지 않습니다.
   * - 같은 카테고리·기간 요청은 6시간 동안 캐시된 결과를 돌려줍니다.
   */
  @AdminOnly()
  @Post('summarize')
  async summarize(
    @Body() { dateStart, dateEnd, categoryId }: TrialSummarizeDto,
  ) {
    const cacheKey = `${categoryId}:${dateStart}:${dateEnd}`;
    const cached = this.trialCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) return cached.value;

    const news = await this.crawlingRepository.getCrawledNews(
      dateStart,
      dateEnd,
      categoryId,
    );
    this.logger.debug(
      `dateStart: ${dateStart}, dateEnd: ${dateEnd}, categoryId: ${categoryId}, 검색된 뉴스 수: ${news.news.length}`,
    );
    if (news.news.length === 0) {
      throw new NotFoundException('No news found');
    }
    const result = await this.aiSummaryService.summarizeText(
      news.news,
      categoryId,
      true,
    );
    const value = { newsletter: result.newsletter };

    if (this.trialCache.size >= TRIAL_CACHE_MAX) this.trialCache.clear();
    this.trialCache.set(cacheKey, {
      value,
      expiresAt: Date.now() + TRIAL_CACHE_TTL,
    });
    return value;
  }

  @AdminOnly()
  @Post('get-news')
  async getNews(
    @Body() data: { dateStart: string; dateEnd: string; categoryId: number },
  ) {
    const { dateStart, dateEnd, categoryId } = data;
    const news = await this.crawlingRepository.getCrawledNews(
      dateStart,
      dateEnd,
      categoryId,
    );
    return {
      count: news.news.length,
      news: news.news,
    };
  }
}
