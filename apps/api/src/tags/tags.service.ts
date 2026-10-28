import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { MysqlPrismaService } from '../../prisma/mysql.service';
import { AppException } from '../common/errors/app.exception';
import { canonicalTags, mergeInto, removeTag, tagKey, toRules } from './tags';

/**
 * 태그 정돈 (#20). 새 뉴스레터의 태그를 규칙 · 기존 표기에 맞추고, 관리자가 합치기 · 지우기를 한다.
 * 태그는 뉴스레터마다 JSON 배열(newsletters.keywords)로 들고 있고, 규칙만 tag_rules에 둔다
 */
@Injectable()
export class TagsService {
  constructor(private readonly prisma: MysqlPrismaService) {}

  /** 지금까지 쓴 태그, 많이 쓴 순 (최근 days일만 보려면 since) */
  private async tagCounts(limit: number, since?: Date) {
    const period = since
      ? Prisma.sql`AND n.createdAt >= ${since}`
      : Prisma.empty;
    const rows = await this.prisma.$queryRaw<
      Array<{ keyword: string; count: bigint }>
    >`
      SELECT k.keyword AS keyword, COUNT(*) AS count
      FROM newsletters n,
           JSON_TABLE(n.keywords, '$[*]' COLUMNS (keyword VARCHAR(100) PATH '$')) AS k
      WHERE n.keywords IS NOT NULL ${period}
      GROUP BY k.keyword
      ORDER BY count DESC, MAX(n.createdAt) DESC
      LIMIT ${limit}`;
    return rows.map((r) => ({ keyword: r.keyword, count: Number(r.count) }));
  }

  /** 쓰기 단계에 줄 '이미 쓰고 있는 태그' (최근 30일 많이 쓴 순) */
  async recentTags(limit = 40) {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    return (await this.tagCounts(limit, since)).map((t) => t.keyword);
  }

  /** 새 뉴스레터의 태그를 규칙 · 기존 표기에 맞춘다 */
  async canonicalize(tags: string[]) {
    const [rules, existing] = await Promise.all([
      this.prisma.tagRule.findMany(),
      this.tagCounts(5000),
    ]);
    return canonicalTags(
      tags,
      toRules(rules),
      existing.map((t) => t.keyword),
    );
  }

  /** 관리자 태그 화면: 규칙 목록 */
  async rules() {
    return this.prisma.tagRule.findMany({ orderBy: { createdAt: 'desc' } });
  }

  /** 뉴스레터들의 태그를 바꿔 저장한다. 바뀐 편 수 */
  private async rewrite(change: (tags: string[]) => string[] | null) {
    const rows = await this.prisma.newsletter.findMany({
      where: { keywords: { not: Prisma.DbNull } },
      select: { id: true, keywords: true },
    });
    const updates = rows
      .map((row) => ({
        id: row.id,
        next: Array.isArray(row.keywords)
          ? change(row.keywords as string[])
          : null,
      }))
      .filter((u) => u.next !== null);
    await this.prisma.$transaction(
      updates.map((u) =>
        this.prisma.newsletter.update({
          where: { id: u.id },
          data: { keywords: u.next },
        }),
      ),
    );
    return updates.length;
  }

  /**
   * 합치기: from 태그들을 to로 바꾸고, 앞으로 새 뉴스레터에서도 바꿔 쓰게 규칙을 남긴다 (이름 바꾸기도 이것)
   */
  async merge(from: string[], to: string) {
    const target = to.trim();
    const sources = [
      ...new Set(from.map((f) => f.trim()).filter(Boolean)),
    ].filter((f) => f !== target);
    if (!target || !sources.length) {
      throw new AppException(
        'BAD_REQUEST',
        '합칠 태그와 새 이름이 필요합니다.',
      );
    }
    const changed = await this.rewrite((tags) =>
      mergeInto(tags, sources, target),
    );
    await this.prisma.$transaction([
      // 합쳐진 쪽이 다른 규칙의 대상이었으면 새 이름으로 이어 준다 (A→B, B→C 이면 A→C)
      this.prisma.tagRule.updateMany({
        where: { action: 'alias', target: { in: sources } },
        data: { target },
      }),
      // 새 이름에 걸려 있던 규칙은 없앤다 (지운 태그를 다시 살리는 경우 포함)
      this.prisma.tagRule.deleteMany({ where: { keyword: target } }),
      ...sources
        .filter((s) => tagKey(s) !== tagKey(target) || s !== target)
        .map((keyword) =>
          this.prisma.tagRule.upsert({
            where: { keyword },
            create: { keyword, action: 'alias', target },
            update: { action: 'alias', target },
          }),
        ),
    ]);
    return { changed };
  }

  /** 지우기: 모든 뉴스레터에서 빼고, 앞으로도 쓰지 않게 규칙을 남긴다 */
  async remove(tag: string) {
    const keyword = tag.trim();
    if (!keyword)
      throw new AppException('BAD_REQUEST', '지울 태그가 필요합니다.');
    const changed = await this.rewrite((tags) => removeTag(tags, keyword));
    await this.prisma.tagRule.upsert({
      where: { keyword },
      create: { keyword, action: 'block' },
      update: { action: 'block', target: null },
    });
    return { changed };
  }

  /** 규칙 지우기 (앞으로의 새 뉴스레터에만 영향, 이미 바꾼 태그는 그대로) */
  async deleteRule(id: number) {
    await this.prisma.tagRule.delete({ where: { id } });
    return { id };
  }
}
