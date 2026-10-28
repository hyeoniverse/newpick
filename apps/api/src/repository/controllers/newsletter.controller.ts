import {
  Controller,
  UseInterceptors,
  Get,
  Query,
  Param,
  Delete,
  ParseIntPipe,
  Patch,
  Body,
  ValidationPipe,
  Post,
} from '@nestjs/common';
import { CommonResponseInterceptor } from 'src/common/response.interceptor';
import { NewsletterRepo } from '../newsletter.repository';
import {
  NewsletterQueryDto,
  NewsletterTrendDto,
  NewsletterCategoryDto,
  NewsletterRandomDto,
  NewsletterSearchDto,
  NewsletterKeywordsDto,
  NewsletterAllKeywordsDto,
  UpdateNewsletterDto,
} from './newsletter.dto';
import { sanitizeNewsletterHtml } from 'src/common/sanitize-newsletter-html';
import { toBooleanQuery } from '../search/search-terms';
import { kstDayRange, kstDaysAgo } from '../../common/kst';
import dayjs from 'dayjs';
import { AdminOnly, Public } from 'src/auth/decorators/auth.decorators';
import { AppException } from '../../common/errors/app.exception';
import { SiteCacheService } from '../../site-cache/site-cache.service';

@Controller('newsletters')
@UseInterceptors(CommonResponseInterceptor)
export class BasicRepositoryController {
  constructor(
    private readonly newsletterRepo: NewsletterRepo,
    private readonly siteCache: SiteCacheService,
  ) {}

  @Public()
  @Get('')
  async getNewsletters(@Query() query: NewsletterQueryDto) {
    const offset = Number(query.offset);
    const limit = Number(query.limit);
    const trend = query.trend;
    const categoryId = query.categoryId || null;
    console.log('trend', trend);

    let startDate = null;
    let endDate = null;

    if (query.startDate && dayjs(query.startDate).isValid()) {
      startDate = dayjs(query.startDate).toDate();
    }

    if (query.endDate && dayjs(query.endDate).isValid()) {
      endDate = dayjs(query.endDate).toDate();
    }
    if (trend === undefined) {
      return {
        message: '정렬 없이 목록 조회 성공',
        data: await this.newsletterRepo.getNewsletterList(
          offset,
          limit,
          startDate,
          endDate,
          null,
          categoryId,
        ),
      };
    }

    if (trend) {
      return {
        message: `인기 순으로 내림차순 조회 성공`,
        data: await this.newsletterRepo.getNewsletterList(
          offset,
          limit,
          startDate,
          endDate,
          trend,
          categoryId,
        ),
      };
    } else {
      return {
        message: '오름차순 정렬 목록 조회 성공',
        data: await this.newsletterRepo.getNewsletterList(
          offset,
          limit,
          startDate,
          endDate,
        ),
      };
    }
  }

  /**
   * 지난 뉴스레터 검색 · 필터 (#20). 검색어 · 키워드 · 관심사 · 기간 · 정렬, 페이지와 전체 건수.
   * 조건이 하나도 없으면 전체 목록(최신순)과 같다
   */
  @Public()
  @Get('search')
  async searchNewsletters(@Query() query: NewsletterSearchDto) {
    const booleanQuery = query.q ? toBooleanQuery(query.q) : null;
    if (query.q && !booleanQuery) {
      throw new AppException(
        'BAD_REQUEST',
        '검색어는 2글자 이상인 낱말로 입력해 주세요.',
      );
    }
    const from = query.from
      ? kstDayRange(query.from, query.from).start
      : undefined;
    const to = query.to ? kstDayRange(query.to, query.to).end : undefined;
    if (from && to && from > to) {
      throw new AppException('BAD_REQUEST', '시작 날짜가 끝 날짜보다 늦어요.');
    }

    const limit = query.limit ?? 10;
    const offset = query.offset ?? 0;
    const { items, total } = await this.newsletterRepo.searchNewsletters({
      booleanQuery,
      keyword: query.keyword,
      categoryId: query.categoryId,
      from,
      to,
      sort: query.sort ?? 'latest',
      limit,
      offset,
    });

    return {
      message: '뉴스레터 검색 성공',
      data: { items, total, limit, offset },
    };
  }

  /** 태그 전체 (#20, 태그 화면 /tags). 많이 쓴 순, 쓰인 횟수 · 마지막 날 · 관심사 */
  @Public()
  @Get('keywords/all')
  async getAllKeywords(@Query() query: NewsletterAllKeywordsDto) {
    return {
      message: '태그 전체 조회 성공',
      data: await this.newsletterRepo.getAllKeywords({
        categoryId: query.categoryId,
        q: query.q?.trim() || undefined,
      }),
    };
  }

  /** 최근 자주 나온 키워드(태그) (#20). 목록의 태그 줄에 쓴다. 기본 30일 · 15개 */
  @Public()
  @Get('keywords')
  async getPopularKeywords(@Query() query: NewsletterKeywordsDto) {
    const days = query.days ?? 30;
    const { start } = kstDayRange(kstDaysAgo(days - 1), kstDaysAgo(days - 1));
    return {
      message: '자주 나온 키워드 조회 성공',
      data: await this.newsletterRepo.getPopularKeywords(
        start,
        query.limit ?? 15,
        query.categoryId,
      ),
    };
  }

  /**
   * 어제 작성된 뉴스레터를 카테고리별로 조회하는 엔드포인트
   * Query 파라미터로 categoryId가 전달되면 해당 카테고리만 조회하고,
   * 전달되지 않으면 모든 카테고리에 대해 어제의 뉴스레터(각 카테고리 1건)를 조회합니다.
   */
  @Public()
  @Get('trends')
  async getLatestNewsletters(@Query() query: NewsletterTrendDto) {
    if (query.categoryId) {
      const newsletter = await this.newsletterRepo.getNewsletterByCategoryId(
        Number(query.categoryId),
        0, // 최신 뉴스 1개 가져오기
        1,
      );
      // 아직 발행본이 없으면 오류가 아니라 빈 결과 (200, data: null)
      return {
        message: '해당 카테고리 최신 뉴스레터 조회 성공',
        data: newsletter[0] ?? null,
      };
    } else {
      const newsletters =
        await this.newsletterRepo.getLatestNewslettersForAllCategories();
      return {
        message: '모든 카테고리 최신 뉴스레터 조회 성공',
        data: newsletters,
      };
    }
  }

  @Public()
  @Get(':id')
  async getNewsletterById(
    @Param(
      'id',
      new ParseIntPipe({
        errorHttpStatusCode: 400,
      }),
    )
    id: number,
  ) {
    id = Number(id);
    if (!id) {
      throw new AppException('BAD_REQUEST', '뉴스레터 id가 필요합니다.');
    }
    const newsletter = await this.newsletterRepo.getNewsletterById(id);
    if (!newsletter) {
      throw new AppException('NEWSLETTER_NOT_FOUND');
    }
    return {
      message: '상세 조회 성공',
      data: {
        newsletter: newsletter,
        previousNewsletter:
          (await this.newsletterRepo.getPreviousNewsletter(
            newsletter.id,
            newsletter.createdAt,
          )) || null,
        nextNewsletter:
          (await this.newsletterRepo.getNextNewsletter(
            newsletter.id,
            newsletter.createdAt,
          )) || null,
      },
    };
  }

  @Public()
  @Get('category/:categoryId')
  async getNewsletterByCategoryId(
    @Param(
      'categoryId',
      new ParseIntPipe({
        errorHttpStatusCode: 400,
      }),
    )
    categoryId: number,
    @Query(new ValidationPipe({ transform: true, whitelist: true }))
    query: NewsletterCategoryDto,
  ) {
    if (!categoryId) {
      throw new AppException('BAD_REQUEST', '분야 id가 필요합니다.');
    }
    const offset = Number(query.offset);
    const limit = Number(query.limit);
    const data = await this.newsletterRepo.getNewsletterByCategoryId(
      categoryId,
      offset,
      limit,
    );
    if (!data) {
      throw new AppException('NEWSLETTER_NOT_FOUND');
    }
    return {
      message: '카테고리 조회 성공',
      data: data,
    };
  }

  /**
   * 뉴스레터 고치기 (#31): 제목 · 부제 · 요약 · 본문 HTML · 키워드 · 관심사. 본문은 허용 목록으로 정리해 저장(XSS, #6).
   * 이미 보낸 메일은 그대로, 상세 페이지 · 이후 메일(받은 메일 다시 보기 포함)에 반영
   */
  @AdminOnly()
  @Patch(':id')
  async updateNewsletter(
    @Param('id', new ParseIntPipe({ errorHttpStatusCode: 400 })) id: number,
    @Body() body: UpdateNewsletterDto,
  ) {
    const exists = await this.newsletterRepo.getNewsletterById(id);
    if (!exists) throw new AppException('NEWSLETTER_NOT_FOUND');
    const data = await this.newsletterRepo.updateNewsletter(id, {
      ...(body.title !== undefined && { title: body.title.trim() }),
      ...(body.subtitle !== undefined && {
        subtitle: body.subtitle.trim() || null,
      }),
      ...(body.content !== undefined && { content: body.content.trim() }),
      ...(body.contentAsHTML !== undefined && {
        contentAsHTML: sanitizeNewsletterHtml(body.contentAsHTML),
      }),
      ...(body.keywords !== undefined && {
        keywords: [
          ...new Set(
            body.keywords
              .map((k) => k.trim().replace(/^#+/, ''))
              .filter(Boolean),
          ),
        ],
      }),
      ...(body.categoryId !== undefined && {
        category: { connect: { id: body.categoryId } },
      }),
    });
    // 고친 글이 첫 화면 · 목록에 10분 동안 옛 모습으로 남지 않게 (#73)
    await this.siteCache.refresh(`뉴스레터 ${id} 수정`);
    return { message: '수정 성공', data };
  }

  @AdminOnly()
  @Delete(':id')
  async deleteNewsletter(@Param('id') id: number) {
    id = Number(id);
    if (!id) {
      throw new AppException('BAD_REQUEST', '뉴스레터 id가 필요합니다.');
    }
    const data = await this.newsletterRepo.deleteNewsletter(id);
    if (!data) {
      throw new AppException('NEWSLETTER_NOT_FOUND');
    }
    // 지운 글이 첫 화면·목록에 10분 동안 남지 않게 (#73)
    await this.siteCache.refresh(`뉴스레터 ${id} 삭제`);
    return {
      message: '삭제 성공',
      data: data,
    };
  }

  @Public()
  @Get('random/:num/:from')
  async getRandomNewsletter(@Param() params: NewsletterRandomDto) {
    const num = params.num || 1;
    const from = params.from || 7;

    const dateStart = dayjs().subtract(from, 'day').startOf('day').toDate();
    const dateEnd = dayjs().endOf('day').toDate();

    const newsletters = await this.newsletterRepo.getRandomNewsletters(
      dateStart,
      dateEnd,
      num,
    );

    return {
      message: '랜덤 조회 성공',
      data: newsletters,
    };
  }

  @Public()
  @Post('viewcount/:id')
  async addViewcount(@Param('id') id: number) {
    id = Number(id);
    if (!id) {
      throw new AppException('BAD_REQUEST', '뉴스레터 id가 필요합니다.');
    }
    const data = await this.newsletterRepo.addViewcount(id);
    if (!data) {
      throw new AppException('NEWSLETTER_NOT_FOUND');
    }
    return {
      message: '조회수 증가 성공',
      data: data.viewcount,
    };
  }

  @AdminOnly()
  @Post('reset-viewcount/:id')
  async resetViewcount(@Param('id') id: number) {
    id = Number(id);
    if (!id) {
      throw new AppException('BAD_REQUEST', '뉴스레터 id가 필요합니다.');
    }
    const data = await this.newsletterRepo.resetViewcount(id);
    if (!data) {
      throw new AppException('NEWSLETTER_NOT_FOUND');
    }
    return {
      message: '조회수 초기화 성공',
      data: data.viewcount,
    };
  }
}
