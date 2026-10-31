import { Injectable, Logger } from '@nestjs/common';
import { MysqlPrismaService } from 'prisma/mysql.service';
import { AiService } from '../ai/ai.service';
import { embeddingText } from '../ai-summary/articlePrep';
import { CrawlingRepository } from '../crawling/crawling.repository';
import type { TasteSignal } from '../edition/personalize';
import { SIGNAL_TEXT_LIMITS } from '../taste/taste.service';
import { ArticlePick, Candidate, pickArticles } from './pick';

/** 임베딩은 한 번에 이만큼씩 */
const BATCH = 50;

/**
 * 추천 기사 (#123): 사람마다 북마크 · 스크랩한 소식과 뜻이 가까운 오늘 기사를 원문으로 권한다.
 * 신호 임베딩은 맞춤 메일이 이미 계산한 것(EditionService.embedForPlans)을 그대로 쓰고,
 * 기사 임베딩은 뉴스레터를 쓸 때 남긴 것을 다시 쓴다(없는 것만 계산).
 * 그날 뉴스레터에 쓴 기사, 그 사람이 북마크 · 스크랩한 뉴스레터에 쓴 기사(이미 본 기사)는 권하지 않는다.
 * 임베딩을 못 하는 날은 추천 없이 보낸다
 */
@Injectable()
export class RecommendService {
  private readonly logger = new Logger(RecommendService.name);

  constructor(
    private readonly prisma: MysqlPrismaService,
    private readonly ai: AiService,
    private readonly crawling: CrawlingRepository,
  ) {}

  /**
   * 사람마다 추천 기사. shown: 그 사람 메일에 실린 소식의 임베딩 (같은 사건 기사는 뺀다),
   * window: 그날 뉴스레터 재료와 같은 창 (모았고 나온 시각), newsletterIds: 그날 뉴스레터 (거기 쓴 기사는 뺀다)
   */
  async forUsers(
    users: {
      userId: number;
      signals: TasteSignal[];
      shown?: number[][];
      /** 팔로우한 태그의 비교 열쇠 (#123 5단계) */
      keywords?: string[];
    }[],
    window: { start: Date; end: Date },
    newsletterIds: number[],
  ): Promise<Map<number, ArticlePick[]>> {
    const result = new Map<number, ArticlePick[]>();
    const withSignals = users.filter(
      (u) => u.signals.length || u.keywords?.length,
    );
    if (!withSignals.length) return result;
    try {
      const candidates = await this.candidates(window);
      if (!candidates.length) return result;
      const used = links(
        await this.prisma.newsletter.findMany({
          where: { id: { in: newsletterIds } },
          select: { usedNews: true },
        }),
      );
      const seen = await this.seenLinks(withSignals.map((u) => u.userId));
      for (const user of withSignals) {
        const picks = pickArticles(
          user.signals,
          candidates,
          new Set([...used, ...(seen.get(user.userId) ?? [])]),
          user.shown,
          user.keywords,
        );
        if (picks.length) result.set(user.userId, picks);
      }
      this.logger.log(
        `추천 기사: ${withSignals.length}명 중 ${result.size}명 (후보 기사 ${candidates.length}건)`,
      );
    } catch (error) {
      this.logger.warn(
        `추천 기사 실패, 추천 없이 보냄: ${(error as Error).message}`,
      );
    }
    return result;
  }

  /** 창 안의 기사와 임베딩. 뉴스레터를 쓸 때 남기지 못한 것만 계산해 남긴다 */
  private async candidates(window: {
    start: Date;
    end: Date;
  }): Promise<Candidate[]> {
    const articles = await this.crawling.findForRecommend(
      window.start,
      window.end,
    );
    const missing = articles.filter((a) => !a.embedding?.length);
    for (let i = 0; i < missing.length; i += BATCH) {
      const batch = missing.slice(i, i + BATCH);
      const made = await this.ai.embed(
        batch.map((a, j) =>
          embeddingText({
            index: j,
            title: a.title,
            content: a.content,
            source: a.source,
          }),
        ),
      );
      batch.forEach((a, j) => (a.embedding = made[j]));
      await this.crawling.saveEmbeddings(
        batch.map((a) => ({ link: a.link, embedding: a.embedding! })),
      );
    }
    return articles.map((a) => ({
      title: a.title,
      link: a.link,
      source: a.source,
      category: a.category.join(' · '),
      vector: a.embedding!,
    }));
  }

  /** 사람마다 최근 북마크 · 스크랩한 뉴스레터에 쓴 기사 링크 (신호와 같은 기간) */
  private async seenLinks(userIds: number[]) {
    const where = {
      userId: { in: userIds },
      createdAt: {
        gte: new Date(
          Date.now() - SIGNAL_TEXT_LIMITS.maxAgeDays * 24 * 60 * 60 * 1000,
        ),
      },
    };
    const newsletter = { select: { usedNews: true } };
    const rows = [
      ...(await this.prisma.bookmark.findMany({
        where,
        select: { userId: true, newsletter },
      })),
      ...(await this.prisma.highlight.findMany({
        where,
        select: { userId: true, newsletter },
      })),
    ];
    const result = new Map<number, string[]>();
    for (const row of rows)
      result.set(row.userId, [
        ...(result.get(row.userId) ?? []),
        ...links([row.newsletter]),
      ]);
    return result;
  }
}

/** 뉴스레터들에 쓴 기사 링크 */
const links = (rows: { usedNews: string | null }[]) =>
  new Set(
    rows.flatMap((r) =>
      (r.usedNews ?? '')
        .split(',')
        .map((link) => link.trim())
        .filter(Boolean),
    ),
  );
