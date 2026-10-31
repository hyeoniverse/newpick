import { CrawlingRepository } from 'src/crawling/crawling.repository';
import { usageLog } from './pricing';
import { Injectable, Logger } from '@nestjs/common';
import { MysqlPrismaService } from '../../prisma/mysql.service';
import { FindCategoryService } from './findCategory.service';
import { CreateNewsletterService } from './createNewsletter.service';
import { CrawledNews } from 'src/crawling/schema/crawling.schema';
import { NewsletterWriterService } from './newsletterWriter.service';
import { renderNewsletterHtml } from './newsletterHtml';
import { StoryImageService } from './storyImages';
import { TagsService } from '../tags/tags.service';

/**
 * 뉴스레터에 쓴 기사만 남깁니다. 썸네일·관련 기사가 실제로 다룬 소식에서 나오게 (#43).
 * 예전에는 받은 기사 전부를 넣어, IT 뉴스레터 썸네일이 증시 기사 사진이 되기도 했습니다.
 */
export function usedArticles(news: CrawledNews[], sources: number[]) {
  const used = sources.map((n) => news[n - 1]).filter(Boolean);
  return used.length ? used : news;
}

/** 최근 소재로 보는 기간 (이 안에 다룬 소식은 새 진전이 있을 때만 다시 쓴다) */
export const RECENT_DAYS = 5;

@Injectable()
export class AiSummaryService {
  private readonly logger = new Logger(AiSummaryService.name);
  constructor(
    private readonly prisma: MysqlPrismaService,
    private readonly findCategoryService: FindCategoryService,
    private readonly createNewsletterService: CreateNewsletterService,
    private readonly newsletterWriterService: NewsletterWriterService,
    private readonly storyImageService: StoryImageService,
    private readonly tagsService: TagsService,
    private readonly crawlingRepository: CrawlingRepository,
  ) {}

  /** 최근 RECENT_DAYS일 이 분야 뉴스레터: 제목 · 부제 · 쓴 기사 링크 */
  private async recentNewsletters(categoryId: number) {
    const since = new Date(Date.now() - RECENT_DAYS * 24 * 60 * 60 * 1000);
    const rows = await this.prisma.newsletter.findMany({
      where: { categoryId, createdAt: { gte: since } },
      orderBy: { createdAt: 'desc' },
      select: { title: true, subtitle: true, usedNews: true, createdAt: true },
    });
    return rows.map((row) => ({
      ...row,
      date: row.createdAt.toLocaleDateString('ko-KR', {
        timeZone: 'Asia/Seoul',
        month: 'numeric',
        day: 'numeric',
      }),
    }));
  }

  async summarizeText(
    news: CrawledNews[],
    categoryId: number,
    test: boolean,
  ): Promise<{
    summary: string;
    categoryId: number;
    newsletter: any;
  }> {
    // 최근 이 분야 뉴스레터 (최근 소재와 겹치지 않게): 이미 쓴 기사는 빼고, 다룬 소식은 고르기 · 쓰기에 알려 준다
    const recent = await this.recentNewsletters(categoryId);
    const usedLinks = new Set(recent.flatMap((n) => n.usedNews.split(',')));
    news = news.filter((item) => !usedLinks.has(item.link));
    if (news.length === 0) {
      this.logger.error('No news found');
      throw new Error('No news found');
    }
    const recentTopics = recent.map(
      (n) => `${n.date} ${n.title}${n.subtitle ? ` — ${n.subtitle}` : ''}`,
    );
    const startTime = Date.now();
    try {
      // 분야를 알려 줘야 IT 뉴스레터가 증시 기사로 채워지지 않습니다 (#42)
      const category = (
        await this.prisma.newsCategory.findUnique({
          where: { id: categoryId },
          select: { name: true },
        })
      )?.name;
      const {
        newsletter: written,
        tokens,
        usage,
        selection,
        embeddings = [],
      } = await this.newsletterWriterService.write(news, category, {
        // 같은 주제면 이미 쓰는 태그를 다시 쓰게 (#20 태그 정돈)
        existingTags: await this.tagsService.recentTags(),
        recentTopics,
      });
      const { title, subtitle, summary, stories } = written;
      // 같은 사건 묶기로 계산한 임베딩을 남긴다 (추천 기사에서 다시 계산하지 않게). 실패해도 뉴스레터는 계속
      if (!test && embeddings.length)
        await this.crawlingRepository
          .saveEmbeddings(
            embeddings.map(({ index, vector }) => ({
              link: news[index].link,
              embedding: vector,
            })),
          )
          .catch((error) =>
            this.logger.warn(`기사 임베딩 저장 실패: ${error.message}`),
          );
      // 저장 전에 합치기 · 지우기 규칙과 기존 표기로 맞춘다 (띄어쓰기 · 대소문자만 다른 태그가 갈라지지 않게)
      const keywords = await this.tagsService.canonicalize(written.keywords);

      const used = usedArticles(
        news,
        stories.flatMap((s) => s.sources),
      );
      const newslinks = used.map((item) => item.link).toString();
      const imageUrl = used.map((item) => item.images).toString();
      // 상세 화면 맨 위 대표 이미지와 같은 사진은 소식에 다시 쓰지 않는다 (#49)
      const hero = used.flatMap((item) => item.images ?? []).find(Boolean);
      const withImages = await this.storyImageService.attach(
        stories,
        news,
        hero,
      );
      const html = renderNewsletterHtml(
        { ...written, stories: withImages },
        news,
      );
      this.logger.debug(
        `뉴스레터 작성 완료: 소식 ${stories.length}개, 기사 ${news.length}건 중 ${used.length}건 사용`,
      );

      await this.prisma.aiProcessLog.create({
        data: {
          newsId: test ? 'test' : newslinks,
          processType: 'summarization',
          // 고르기 점수도 함께 남겨, 어떤 소식이 왜 빠졌는지 관리자 AI 기록에서 본다
          result: `${title} | ${subtitle}\n${summary}${selection ? `\n\n[고르기]\n${selection}` : ''}`,
          duration: (Date.now() - startTime) / 1000,
          status: 'success',
          token: tokens,
          error: null,
          ...usageLog(usage),
        },
      });

      if (test) {
        return {
          summary,
          categoryId,
          newsletter: {
            message:
              '요약 완료 이 요청은 테스트 요약입니다. DB에 저장되지 않습니다.',
            title,
            subtitle,
            summary,
            newslinks,
            categoryId,
            html,
            imageUrl,
            keywords,
          },
        };
      }
      const newsletter = await this.createNewsletterService.createNewsletter(
        title,
        subtitle,
        summary,
        newslinks,
        categoryId,
        html,
        imageUrl,
        keywords,
      );

      return { summary, categoryId, newsletter };
    } catch (error) {
      const duration = (Date.now() - startTime) / 1000;
      const newsIds = news.map((item) => item._id).toString();
      await this.prisma.aiProcessLog.create({
        data: {
          newsId: test ? 'test' : newsIds,
          processType: 'summarization',
          result: error.message,
          duration: duration,
          status: 'error',
          error: error.message,
          token: 0,
        },
      });

      this.logger.error(`요약 실패: ${error.message}`);
      throw new Error('Summarization failed.');
    }
  }
}
