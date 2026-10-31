import { Injectable, Logger } from '@nestjs/common';
import { MysqlPrismaService } from 'prisma/mysql.service';
import { AiService } from '../ai/ai.service';
import { embeddingText } from '../ai-summary/articlePrep';
import { kstDayRange, kstDaysAgo } from '../common/kst';
import { CrawlingRepository } from '../crawling/crawling.repository';
import { parseNewsletterHtml } from '../edition/parse';
import {
  ArticlePick,
  Candidate,
  pickArticles,
  RECOMMEND_LIMITS,
  Signal,
  signalLabel,
} from './pick';

/** 임베딩은 한 번에 이만큼씩 */
const BATCH = 50;

const links = (usedNews?: string | null) =>
  (usedNews ?? '')
    .split(',')
    .map((link) => link.trim())
    .filter(Boolean);

type SignalText = Omit<Signal, 'vector'> & { text: string };

/**
 * 추천 기사 (#123): 사람마다 북마크 · 스크랩한 소식과 뜻이 가까운 오늘 기사를 고른다.
 * 기사 임베딩은 뉴스레터를 쓸 때 남긴 것을 다시 쓰고(없는 것만 계산), 신호는 그때그때 계산한다.
 * 임베딩을 못 하는 날(할당 초과 등)은 추천 없이 보낸다
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
   * 사람마다 추천 기사. newsletterIds = 그 사람 메일에 엮은 뉴스레터 (그 기사들은 이미 실렸으니 뺀다)
   */
  async forUsers(
    users: { userId: number; newsletterIds: number[] }[],
    date = kstDaysAgo(0),
  ): Promise<Map<number, ArticlePick[]>> {
    const result = new Map<number, ArticlePick[]>();
    if (!users.length) return result;
    try {
      const signals = await this.signals(users.map((u) => u.userId));
      if (![...signals.values()].some((s) => s.texts.length)) return result;
      const candidates = await this.candidates(date);
      if (!candidates.length) return result;

      // 신호 글은 사람마다 겹칠 수 있어 한 번씩만 계산
      const texts = [
        ...new Set(
          [...signals.values()].flatMap((s) => s.texts.map((t) => t.text)),
        ),
      ];
      const vectors = new Map<string, number[]>();
      for (let i = 0; i < texts.length; i += BATCH) {
        const batch = texts.slice(i, i + BATCH);
        (await this.ai.embed(batch)).forEach((v, j) =>
          vectors.set(batch[j], v),
        );
      }

      const mailLinks = await this.usedLinks(
        users.flatMap((u) => u.newsletterIds),
      );
      for (const user of users) {
        const mine = signals.get(user.userId);
        if (!mine?.texts.length) continue;
        const exclude = new Set([
          ...mine.usedLinks,
          ...user.newsletterIds.flatMap((id) => mailLinks.get(id) ?? []),
        ]);
        const picks = pickArticles(
          mine.texts.map(({ text, ...rest }) => ({
            ...rest,
            vector: vectors.get(text)!,
          })),
          candidates,
          exclude,
        );
        if (picks.length) result.set(user.userId, picks);
      }
      this.logger.log(
        `추천 기사: ${users.length}명 중 ${result.size}명 (후보 기사 ${candidates.length}건)`,
      );
    } catch (error) {
      this.logger.warn(
        `추천 기사 실패, 추천 없이 보냄: ${(error as Error).message}`,
      );
    }
    return result;
  }

  /**
   * 사람마다 최근 신호: 스크랩한 문장(+메모)과 북마크한 뉴스레터의 소식(제목 · 리드).
   * 그 뉴스레터에 이미 쓴 기사는 다시 권하지 않게 모아 둔다
   */
  private async signals(userIds: number[]) {
    const since = new Date(
      Date.now() - RECOMMEND_LIMITS.maxAgeDays * 24 * 60 * 60 * 1000,
    );
    const where = { userId: { in: userIds }, createdAt: { gte: since } };
    const newsletter = {
      select: { id: true, contentAsHTML: true, usedNews: true },
    };
    const [bookmarks, highlights] = await Promise.all([
      this.prisma.bookmark.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        select: { userId: true, createdAt: true, newsletter },
      }),
      this.prisma.highlight.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        select: {
          userId: true,
          createdAt: true,
          text: true,
          note: true,
          newsletter,
        },
      }),
    ]);

    type Row = { at: Date; texts: SignalText[]; used: string[] };
    const rows = new Map<number, Row[]>();
    const add = (userId: number, row: Row) =>
      rows.set(userId, [...(rows.get(userId) ?? []), row]);
    for (const b of bookmarks)
      add(b.userId, {
        at: b.createdAt,
        used: links(b.newsletter.usedNews),
        texts: parseNewsletterHtml(b.newsletter.contentAsHTML).stories.map(
          (story) => ({
            kind: 'bookmark' as const,
            label: story.heading,
            text: [story.heading, story.lead].filter(Boolean).join('\n'),
          }),
        ),
      });
    for (const h of highlights)
      add(h.userId, {
        at: h.createdAt,
        used: links(h.newsletter.usedNews),
        texts: [
          {
            kind: 'scrap' as const,
            label: signalLabel(h.text),
            text: [h.text, h.note].filter(Boolean).join('\n'),
          },
        ],
      });

    const result = new Map<
      number,
      { texts: SignalText[]; usedLinks: string[] }
    >();
    for (const [userId, list] of rows) {
      const recent = list.sort((a, b) => b.at.getTime() - a.at.getTime());
      result.set(userId, {
        texts: recent
          .flatMap((r) => r.texts)
          .slice(0, RECOMMEND_LIMITS.signals),
        usedLinks: recent.flatMap((r) => r.used),
      });
    }
    return result;
  }

  /** 오늘 모은 기사와 임베딩. 뉴스레터를 쓸 때 남기지 못한 것만 계산해 남긴다 */
  private async candidates(date: string): Promise<Candidate[]> {
    const { start, end } = kstDayRange(date, date);
    const articles = await this.crawling.findForRecommend(start, end);
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

  /** 뉴스레터마다 쓴 기사 링크 */
  private async usedLinks(newsletterIds: number[]) {
    const rows = await this.prisma.newsletter.findMany({
      where: { id: { in: [...new Set(newsletterIds)] } },
      select: { id: true, usedNews: true },
    });
    return new Map(rows.map((r) => [r.id, links(r.usedNews)]));
  }
}
