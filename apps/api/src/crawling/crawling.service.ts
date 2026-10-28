import { Injectable, Logger } from '@nestjs/common';
import { CrawlerService } from './crawler.service';
import { CrawlingRepository } from './crawling.repository';
import { CrawledNews } from './schema/crawling.schema';
import { FindCategoryService } from 'src/ai-summary/findCategory.service';

@Injectable()
export class CrawlingService {
  constructor(
    private readonly crawlerService: CrawlerService,
    private readonly crawlingRepository: CrawlingRepository,
    private readonly findCategoryService: FindCategoryService,
  ) {}

  private readonly logger = new Logger(CrawlingService.name);

  private readonly links = [
    'https://news.naver.com/section/100',
    'https://news.naver.com/section/101',
    'https://news.naver.com/section/102',
    'https://news.naver.com/section/103',
    'https://news.naver.com/section/104',
    'https://news.naver.com/section/105',
  ];

  async crawling() {
    const crawledData = await this.crawlingNews();
    if (crawledData.length) {
      // 카테고리 분류
      const checkNewsCategory: CrawledNews[] =
        await this.crawlerService.setQueue(
          crawledData.map((data: CrawledNews) => async () => {
            if (!data.category.length) {
              const setCategory = await this.findCategoryService.findCategory(
                data.content,
              );
              this.logger.log(setCategory);
              return {
                ...data,
                category: [...data.category, setCategory.categoryName],
              } as CrawledNews;
            } else {
              return data;
            }
          }),
        );
      const createdData =
        await this.crawlingRepository.createCrawledNews(checkNewsCategory);
      this.logger.log(`Successfully created ${createdData.length} items`);
      return createdData;
    }
  }

  async crawlingNews(): Promise<CrawledNews[]> {
    const crawlingResultData = [];
    try {
      for (const link of this.links) {
        // 섹션 페이지의 헤드라인 목록
        const document = await this.crawlerService.fetchDocument(link);
        const crawlingNews = Array.from(
          document.querySelectorAll<HTMLAnchorElement>(
            '.sa_item._SECTION_HEADLINE .sa_text_title',
          ),
        )
          .map((news) => ({
            title: news.textContent?.trim(),
            link: news.href || null,
          }))
          .filter((news) => news.link);
        // 하루 여러 번 모으므로 이미 모은 기사는 건너뛴다 (상세 요청 · 분야 분류 호출을 아낀다)
        const existing = await this.crawlingRepository.findExistingLinks(
          crawlingNews.map((news) => news.link),
        );
        const fresh = crawlingNews.filter((news) => !existing.has(news.link));
        this.logger.log(
          `${link}: 헤드라인 ${crawlingNews.length}건 중 새 기사 ${fresh.length}건`,
        );
        await this.crawlerService.setDelay();
        // 상세 페이지 크롤링
        const crawlingNewsDetail = await this.crawlerService.setQueue(
          fresh.map((news) => async () => this.crawlingNewsDetail(news)),
        );
        // 크롤링 최종 결과 배열에 저장
        crawlingResultData.push(
          ...crawlingNewsDetail.filter((news) => news != null),
        );
      }
      // 크롤링 결과 확인
      this.logger.log(
        `Successfully crawled ${crawlingResultData.length} items`,
      );
      return crawlingResultData;
    } catch (error) {
      this.logger.error(`Error during crawling: ${error.message}`);
      // 실패 전까지 모은 결과는 그대로 저장합니다. (undefined를 반환하면 호출부에서 .length 오류)
      return crawlingResultData;
    }
  }

  async crawlingNewsDetail(news: { title: string; link: string }) {
    try {
      const document = await this.crawlerService.fetchDocument(news.link);
      await this.crawlerService.setDelay();

      const meta = (selector: string) =>
        document.querySelector(selector)?.getAttribute('content') || null;
      // 언론사 로고는 스크립트로 그려지므로 메타 태그로 대체합니다.
      const source =
        document
          .querySelector('.media_end_head_top_logo_img')
          ?.getAttribute('title') ||
        meta('meta[name="twitter:creator"]') ||
        meta('meta[property="og:article:author"]')?.replace(/\s*\|.*$/, '') ||
        null;
      const content =
        document.querySelector('#dic_area')?.textContent?.trim() || null;
      // 모바일 UA로 받은 페이지에는 날짜 없는 같은 클래스 요소가 먼저 나와서, 날짜 속성이 있는 요소만 고릅니다.
      const publishedAt =
        document
          .querySelector('.media_end_head_info_datestamp_time[data-date-time]')
          ?.getAttribute('data-date-time') || null;
      const category = Array.from(
        document.querySelectorAll('.media_end_categorize_item'),
      )
        .map((item) => item.textContent?.trim())
        .filter(Boolean);
      const images = Array.from(document.querySelectorAll('.end_photo_org img'))
        .map((img) => img.getAttribute('data-src') || img.getAttribute('src'))
        .filter(Boolean);

      return {
        regionCode: 'KR',
        title: news.title,
        link: news.link,
        source,
        category,
        publishedAt,
        images,
        content,
      } as CrawledNews;
    } catch (error) {
      this.logger.error(`Error crawling news: ${news.link}`, error.message);
      return null;
    }
  }
}
