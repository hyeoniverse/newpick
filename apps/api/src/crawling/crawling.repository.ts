import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CrawledNews } from './schema/crawling.schema';
import { CategoryRepository } from 'src/category/category.repository';
import { kstDayRange } from 'src/common/kst';
import { AppException } from '../common/errors/app.exception';

@Injectable()
export class CrawlingRepository {
  constructor(
    @InjectModel(CrawledNews.name)
    private readonly crawledNews: Model<CrawledNews>,
    private readonly categoryRepository: CategoryRepository,
  ) {}

  private readonly logger = new Logger(CrawlingRepository.name);

  async getAllNews(): Promise<CrawledNews[]> {
    return await this.crawledNews.find().exec();
  }
  // 크롤링 데이터 저장
  async createCrawledNews(dataArray: CrawledNews[]): Promise<CrawledNews[]> {
    const news: CrawledNews[] = [];
    try {
      for (const data of dataArray) {
        await this.crawledNews.findOneAndUpdate(
          { link: data.link },
          { $setOnInsert: data },
          { upsert: true, new: false },
        );
        news.push(data);
      }
      return news;
    } catch (error) {
      this.logger.error(`Failed to create data: ${error.message}`);
      throw error;
    }
  }
  /** 이미 모은 링크 (하루 여러 번 수집하므로, 상세 페이지를 열기 전에 겹친 기사를 건너뛴다) */
  async findExistingLinks(links: string[]): Promise<Set<string>> {
    if (!links.length) return new Set();
    const rows = await this.crawledNews
      .find({ link: { $in: links } }, { link: 1 })
      .lean();
    return new Set(rows.map((row) => row.link));
  }

  /**
   * 요약할 기사: [start, end] 사이에 처음 모은 이 분야 기사 (AI 요약은 '그날의 뉴스'만, 최신부터)
   */
  async getCrawledNewsBetween(start: Date, end: Date, categoryId: number) {
    const category = await this.categoryRepository.findById(categoryId);
    return this.crawledNews
      .find({ createdAt: { $gte: start, $lte: end }, category: category.name })
      .sort({ createdAt: -1 })
      .lean<CrawledNews[]>()
      .exec();
  }

  // 가장 최근 크롤링 데이터 조회
  async getLatestCrawledNews(): Promise<CrawledNews> {
    return await this.crawledNews.findOne().sort({ createdAt: -1 });
  }
  /**
   * 관리자 목록 (#31): 기간 안 수집 기사를 최신순으로, 관심사 · 언론사 · 제목으로 거르고 쪽 단위로.
   * 본문은 무거워 빼고, 사진은 첫 장만
   */
  async listForAdmin(q: {
    start: Date;
    end: Date;
    category?: string;
    source?: string;
    title?: string;
    limit: number;
    offset: number;
    /** 제목 가나다순 (없으면 최신 수집부터) */
    sortByTitle?: 'asc' | 'desc';
  }) {
    const escape = (text: string) =>
      text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const period = { createdAt: { $gte: q.start, $lte: q.end } };
    // 언론사 고르기 칸: 거르기와 상관없이 이 기간에 수집된 언론사 전부
    const sources = (
      (await this.crawledNews.distinct('source', period)) as string[]
    )
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b, 'ko'));
    // 목록에서 고른 이름이면 그 언론사만 ('연합뉴스'가 '연합뉴스TV'까지 잡지 않게), 아니면 이름 일부로
    const sourceFilter =
      q.source &&
      (sources.includes(q.source)
        ? q.source
        : { $regex: escape(q.source), $options: 'i' });
    const filter: Record<string, unknown> = {
      ...period,
      ...(q.category && { category: q.category }),
      ...(sourceFilter && { source: sourceFilter }),
      ...(q.title && { title: { $regex: escape(q.title), $options: 'i' } }),
    };
    const [items, total] = await Promise.all([
      this.crawledNews
        .find(filter, {
          title: 1,
          link: 1,
          source: 1,
          category: 1,
          publishedAt: 1,
          createdAt: 1,
          images: { $slice: 1 },
        })
        .sort(
          q.sortByTitle
            ? { title: q.sortByTitle === 'asc' ? 1 : -1, _id: -1 }
            : { createdAt: -1, _id: -1 },
        )
        // 한국어 가나다순
        .collation({ locale: 'ko' })
        .skip(q.offset)
        .limit(q.limit)
        .lean(),
      this.crawledNews.countDocuments(filter),
    ]);
    return { items, total, sources };
  }

  /** 이 관심사로 since 이후 모은 기사 수 (관리자 관심사 현황 #31) */
  async countByCategorySince(category: string, since: Date): Promise<number> {
    return this.crawledNews.countDocuments({
      category,
      createdAt: { $gte: since },
    });
  }

  /** 기간 [start, end] 동안 수집한 기사 수 (#21 관리자 대시보드) */
  async countBetween(start: Date, end: Date): Promise<number> {
    return this.crawledNews.countDocuments({
      createdAt: { $gte: start, $lte: end },
    });
  }
  // 가장 오래된 데이터 조회
  async getOldestCrawledNews(): Promise<CrawledNews> {
    return await this.crawledNews.findOne().sort({ createdAt: 1 });
  }
  // 크롤링 데이터 조회
  async getCrawledNews(
    dateStart: string,
    dateEnd: string,
    categoryId: number,
  ): Promise<{ news: CrawledNews[]; dateStart: string; dateEnd: string }> {
    // KST 기준 하루 단위. (이전 .utc(true)는 범위를 9시간 늦게 밀어 당일 08:00 크롤링 결과가 빠졌음)
    const { start: startDate, end: endDate } = kstDayRange(dateStart, dateEnd);
    const categoryName = await this.categoryRepository.findById(categoryId);
    // 디버깅을 위한 로그 추가
    this.logger.debug('DB 검색 범위:', {
      startDate,
      endDate,
      categoryName,
    });
    try {
      const news = await this.crawledNews
        .find({
          createdAt: {
            $gte: startDate,
            $lte: endDate,
          },
          category: categoryName.name,
        })
        .sort({ createdAt: -1 })
        .lean<CrawledNews[]>()
        .exec();
      return {
        news,
        dateStart,
        dateEnd,
      };
    } catch (error) {
      this.logger.error(`Failed to fetch data: ${error.message}`);
      throw error;
    }
  }
  // 고유 링크로 해당 크롤링 데이터 조회
  async getCrawledNewsByLink(link: string): Promise<CrawledNews> {
    try {
      const news = await this.crawledNews
        .findOne({
          link: link,
        })
        .exec();

      if (!news) {
        throw new AppException('NOT_FOUND');
      }

      return news;
    } catch (error) {
      this.logger.error(`Failed to fetch data: ${error.message}`);
      throw error;
    }
  }
  // 카테고리별 크롤링 데이터 조회
  async getCrawledNewsByCategory(category: string): Promise<CrawledNews[]> {
    return await this.crawledNews.find({ category: category }).exec();
  }
  // 카테고리별 크롤링 데이터 수 조회
  async getNewsCountPerCategory() {
    const news = await this.getAllNews();
    const categories = await this.categoryRepository.findAll();
    console.log(news.length, categories.length);

    const newsCountPerCategory = {};
    categories.map(async (category) => {
      newsCountPerCategory[category.id] = news.filter((item) =>
        item.category.includes(category.name),
      ).length;
    });
    return newsCountPerCategory;
  }
}
