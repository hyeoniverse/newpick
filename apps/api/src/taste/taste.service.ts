import { Injectable } from '@nestjs/common';
import { MysqlPrismaService } from 'prisma/mysql.service';
import { toRules } from 'src/tags/tags';
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
