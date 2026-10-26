import { Injectable, Logger } from '@nestjs/common';
import { MysqlPrismaService } from '../../prisma/mysql.service';
import { FindCategoryService } from './findCategory.service';
import { CreateNewsletterService } from './createNewsletter.service';
import { CrawledNews } from 'src/crawling/schema/crawling.schema';
import { NewsletterWriterService } from './newsletterWriter.service';
import { renderNewsletterHtml } from './newsletterHtml';
import { StoryImageService } from './storyImages';

/**
 * 뉴스레터에 쓴 기사만 남깁니다. 썸네일·관련 기사가 실제로 다룬 소식에서 나오게 (#43).
 * 예전에는 받은 기사 전부를 넣어, IT 뉴스레터 썸네일이 증시 기사 사진이 되기도 했습니다.
 */
export function usedArticles(news: CrawledNews[], sources: number[]) {
  const used = sources.map((n) => news[n - 1]).filter(Boolean);
  return used.length ? used : news;
}

@Injectable()
export class AiSummaryService {
  private readonly logger = new Logger(AiSummaryService.name);
  constructor(
    private readonly prisma: MysqlPrismaService,
    private readonly findCategoryService: FindCategoryService,
    private readonly createNewsletterService: CreateNewsletterService,
    private readonly newsletterWriterService: NewsletterWriterService,
    private readonly storyImageService: StoryImageService,
  ) {}

  async summarizeText(
    news: CrawledNews[],
    categoryId: number,
    test: boolean,
  ): Promise<{
    summary: string;
    categoryId: number;
    newsletter: any;
  }> {
    if (news.length === 0) {
      this.logger.error('No news found');
      throw new Error('No news found');
    }
    const startTime = Date.now();
    try {
      // 분야를 알려 줘야 IT 뉴스레터가 증시 기사로 채워지지 않습니다 (#42)
      const category = (
        await this.prisma.newsCategory.findUnique({
          where: { id: categoryId },
          select: { name: true },
        })
      )?.name;
      const { newsletter: written, tokens } =
        await this.newsletterWriterService.write(news, category);
      const { title, subtitle, summary, stories } = written;

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
          result: `${title} | ${subtitle}\n${summary}`,
          duration: (Date.now() - startTime) / 1000,
          status: 'success',
          token: tokens,
          error: null,
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
