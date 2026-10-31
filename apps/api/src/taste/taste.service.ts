import { Injectable } from '@nestjs/common';
import { MysqlPrismaService } from 'prisma/mysql.service';
import { tagKey, toRules } from 'src/tags/tags';
import { parseNewsletterHtml } from 'src/edition/parse';
import type { TasteProfile, TasteSignal } from 'src/edition/personalize';
import {
  HALF_LIFE_DAYS,
  STAR_BONUS,
  Signal,
  WEIGHTS,
  scoreTaste,
} from './taste';

const asKeywords = (value: unknown) =>
  Array.isArray(value)
    ? value.filter((v): v is string => typeof v === 'string')
    : [];

const NEWSLETTER = { select: { categoryId: true, keywords: true } } as const;

/** 맞춤 메일에서 뜻을 비교할 신호 (최근 것부터 이만큼, 이 기간 안) */
export const SIGNAL_TEXT_LIMITS = { count: 24, maxAgeDays: 30, label: 30 };

/** 임베딩할 신호 글 */
export type SignalText = Omit<TasteSignal, 'vector'> & { text: string };

/** 스크랩 문장은 앞부분만 이름으로 */
export const signalLabel = (text: string, max = SIGNAL_TEXT_LIMITS.label) => {
  const flat = text.replace(/\s+/g, ' ').trim();
  return flat.length > max ? `${flat.slice(0, max)}…` : flat;
};

/**
 * 취향 점수 (#123 2단계). 점수 표를 따로 두지 않고 북마크 · 스크랩 · 메모(원본)에서 그때그때 계산한다:
 * 북마크를 풀거나 스크랩을 지우면 바로 빠지고, 반감기도 지금 시각으로 정확하다. 사용자가 많아지면 그때 캐시를 둔다
 */
@Injectable()
export class TasteService {
  constructor(private readonly prisma: MysqlPrismaService) {}

  /** 사용자들의 신호 (userId → 신호 목록) */
  private async signals(userIds?: number[]) {
    const where = userIds ? { userId: { in: userIds } } : {};
    const [bookmarks, highlights, rules, categories] = await Promise.all([
      this.prisma.bookmark.findMany({
        where,
        select: { userId: true, createdAt: true, newsletter: NEWSLETTER },
      }),
      this.prisma.highlight.findMany({
        where,
        select: {
          userId: true,
          createdAt: true,
          text: true,
          note: true,
          starred: true,
          newsletter: NEWSLETTER,
        },
      }),
      this.prisma.tagRule.findMany(),
      this.prisma.newsCategory.findMany({ select: { id: true, name: true } }),
    ]);
    const byUser = new Map<number, Signal[]>();
    const push = (userId: number, signal: Signal) =>
      byUser.set(userId, [...(byUser.get(userId) ?? []), signal]);
    for (const b of bookmarks) {
      push(b.userId, {
        kind: 'bookmark',
        at: b.createdAt,
        categoryId: b.newsletter.categoryId,
        keywords: asKeywords(b.newsletter.keywords),
      });
    }
    for (const h of highlights) {
      push(h.userId, {
        kind: h.note ? 'memo' : 'scrap',
        at: h.createdAt,
        categoryId: h.newsletter.categoryId,
        keywords: asKeywords(h.newsletter.keywords),
        text: [h.text, h.note].filter(Boolean).join(' '),
        starred: h.starred,
      });
    }
    return {
      byUser,
      rules: toRules(rules),
      names: new Map(categories.map((c) => [c.id, c.name])),
    };
  }

  /**
   * 맞춤 메일용 취향 (#123 3단계): 사람마다 점수 큰 태그. 발송 때 구독자 모두를 한 번에 계산한다 (AI 호출 없음).
   * 신호가 없는 사람은 빠진다 (맞춤 없이 지금 그대로)
   */
  async profiles(userIds: number[]): Promise<Map<number, TasteProfile>> {
    if (!userIds.length) return new Map();
    const [{ byUser, rules }, follows] = await Promise.all([
      this.signals(userIds),
      this.prisma.tagFollow.findMany({
        where: { userId: { in: userIds } },
        select: { userId: true, tag: true },
      }),
    ]);
    const result = new Map<number, TasteProfile>();
    for (const [userId, signals] of byUser) {
      const { topics } = scoreTaste(signals, rules);
      if (topics.length)
        result.set(userId, {
          topics: topics.map((t) => ({
            name: t.topic,
            key: tagKey(t.topic),
            score: t.score,
          })),
        });
    }
    // 팔로우한 태그 (#123 5단계): 북마크 · 스크랩이 없어도 맞춤이 된다
    for (const { userId, tag } of follows) {
      const profile = result.get(userId) ?? { topics: [] };
      profile.follows = [
        ...(profile.follows ?? []),
        { name: tag, key: tagKey(tag) },
      ];
      result.set(userId, profile);
    }
    return result;
  }

  /**
   * 맞춤 메일에서 뜻을 비교할 신호 글 (사람마다 최근 것부터): 북마크한 뉴스레터의 소식(제목 · 리드),
   * 스크랩한 문장(+메모). 임베딩은 EditionService가 한 번에 한다
   */
  async signalTexts(userIds: number[]): Promise<Map<number, SignalText[]>> {
    if (!userIds.length) return new Map();
    const since = new Date(
      Date.now() - SIGNAL_TEXT_LIMITS.maxAgeDays * 24 * 60 * 60 * 1000,
    );
    const where = { userId: { in: userIds }, createdAt: { gte: since } };
    const [bookmarks, highlights] = await Promise.all([
      this.prisma.bookmark.findMany({
        where,
        select: {
          userId: true,
          createdAt: true,
          newsletter: { select: { contentAsHTML: true } },
        },
      }),
      this.prisma.highlight.findMany({
        where,
        select: { userId: true, createdAt: true, text: true, note: true },
      }),
    ]);
    const rows = [
      ...bookmarks.map((b) => ({
        userId: b.userId,
        at: b.createdAt,
        texts: parseNewsletterHtml(b.newsletter.contentAsHTML).stories.map(
          (story): SignalText => ({
            kind: 'bookmark',
            label: story.heading,
            text: [story.heading, story.lead].filter(Boolean).join('\n'),
          }),
        ),
      })),
      ...highlights.map((h) => ({
        userId: h.userId,
        at: h.createdAt,
        texts: [
          {
            kind: 'scrap' as const,
            label: signalLabel(h.text),
            text: [h.text, h.note].filter(Boolean).join('\n'),
          },
        ],
      })),
    ].sort((a, b) => b.at.getTime() - a.at.getTime());

    const result = new Map<number, SignalText[]>();
    // 팔로우한 태그는 개수 제한 밖에서 늘 넣는다 (뜻이 가까운 소식 · 기사도 닿게)
    const follows = await this.prisma.tagFollow.findMany({
      where: { userId: { in: userIds } },
      select: { userId: true, tag: true },
    });
    for (const { userId, tag } of follows)
      result.set(userId, [
        ...(result.get(userId) ?? []),
        { kind: 'tag', label: tag, text: tag },
      ]);
    for (const row of rows) {
      const mine = result.get(row.userId) ?? [];
      const tags = mine.filter((t) => t.kind === 'tag');
      const others = mine.filter((t) => t.kind !== 'tag');
      result.set(row.userId, [
        ...tags,
        ...[...others, ...row.texts].slice(0, SIGNAL_TEXT_LIMITS.count),
      ]);
    }
    return result;
  }

  /** 마이페이지: 내 취향 (태그 20개까지, 관심사, 신호 수) */
  async forUser(userId: number) {
    const { byUser, rules, names } = await this.signals([userId]);
    const signals = byUser.get(userId) ?? [];
    const { topics, categories } = scoreTaste(signals, rules);
    return {
      weights: WEIGHTS,
      halfLifeDays: HALF_LIFE_DAYS,
      signals: {
        bookmark: signals.filter((s) => s.kind === 'bookmark').length,
        scrap: signals.filter((s) => s.kind === 'scrap').length,
        memo: signals.filter((s) => s.kind === 'memo').length,
      },
      topics: topics.slice(0, 20),
      categories: categories.map((c) => ({
        ...c,
        name: names.get(c.categoryId) ?? null,
      })),
    };
  }

  /**
   * 관리자 통계: 신호를 남긴 사람 수, 모두의 점수를 더한 태그 순위(그 태그를 가진 사람 수 함께), 관심사별 합.
   * 사람마다 따로 계산해 더하므로 한 사람이 많이 남겨도 그 사람 몫만큼만
   */
  async overview() {
    const { byUser, rules, names } = await this.signals();
    const topics = new Map<string, { score: number; users: number }>();
    const categories = new Map<number, number>();
    const totals = { bookmark: 0, scrap: 0, memo: 0 };
    for (const signals of byUser.values()) {
      for (const s of signals) totals[s.kind] += 1;
      const scored = scoreTaste(signals, rules);
      for (const t of scored.topics) {
        const sum = topics.get(t.topic) ?? { score: 0, users: 0 };
        sum.score += t.score;
        sum.users += 1;
        topics.set(t.topic, sum);
      }
      for (const c of scored.categories) {
        categories.set(
          c.categoryId,
          (categories.get(c.categoryId) ?? 0) + c.score,
        );
      }
    }
    return {
      weights: WEIGHTS,
      starBonus: STAR_BONUS,
      halfLifeDays: HALF_LIFE_DAYS,
      users: byUser.size,
      signals: totals,
      topics: [...topics.entries()]
        .map(([topic, v]) => ({
          topic,
          score: Math.round(v.score * 100) / 100,
          users: v.users,
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 20),
      categories: [...categories.entries()]
        .map(([categoryId, score]) => ({
          categoryId,
          name: names.get(categoryId) ?? null,
          score: Math.round(score * 100) / 100,
        }))
        .sort((a, b) => b.score - a.score),
    };
  }
}
