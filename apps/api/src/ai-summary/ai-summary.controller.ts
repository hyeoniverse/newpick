import { Controller, Body, Post, NotFoundException } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { TrialSummarizeDto } from './dto/trial-summarize.dto';
import { OpenAiService } from './openai.service';
import { CrawlingRepository } from 'src/crawling/crawling.repository';
import { Logger } from '@nestjs/common';
import { AdminOnly, Public } from 'src/auth/decorators/auth.decorators';

const TRIAL_CACHE_TTL = 6 * 60 * 60 * 1000;
const TRIAL_CACHE_MAX = 200;

@Controller('ai-summary')
export class AiSummaryController {
  private readonly trialCache = new Map<
    string,
    {
      value: { newsletter: unknown; openaiResponse: unknown };
      expiresAt: number;
    }
  >();

  constructor(
    private readonly openAiService: OpenAiService,
    private readonly crawlingRepository: CrawlingRepository,
    private readonly logger: Logger,
  ) {}

  /**
   * 홈 화면 무료 체험용 AI 요약. 로그인 없이 호출되므로 비용을 막는 장치를 둡니다.
   * - 항상 체험 모드(test)로 실행해 뉴스레터로 저장하지 않습니다.
   * - 같은 카테고리·기간 요청은 6시간 동안 캐시된 결과를 돌려줍니다.
   * - IP당 10분에 5회로 제한합니다.
   */
  @Public()
  @Throttle({ default: { limit: 5, ttl: 10 * 60_000 } })
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
    const result = await this.openAiService.summarizeText(
      news.news,
      categoryId,
      true,
    );
    const value = {
      newsletter: result.newsletter,
      openaiResponse: result.openai,
    };

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
