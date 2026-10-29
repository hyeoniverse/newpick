import { Injectable } from '@nestjs/common';
import { JSDOM } from 'jsdom';
import { MysqlPrismaService } from 'prisma/mysql.service';
import { AppException } from '../common/errors/app.exception';
import { assertOwnFolder } from './folders.service';
import { BulkHighlightsDto, CreateHighlightDto } from './dto/highlight.dto';

/** 문장의 공백을 하나로 (화면에서 고른 글은 줄바꿈 · 여러 칸이 섞여 온다) */
export const normalizeText = (text: string) => text.replace(/\s+/g, ' ').trim();

/**
 * 본문 HTML에서 소식마다 제목 (화면 수집기가 셀 때와 같은 순서: .story 차례). 브리핑 · 구역 모름은 null
 * 마이페이지에서 '소식 2' 대신 그 소식의 제목을 보이려고. 스크랩할 때 한 번 꺼내 highlights.sectionTitle에 둔다
 * (본문을 고치면 비워져 다음 목록에서 다시 꺼냄)
 */
export function sectionTitles(html: string | null) {
  if (!html) return [];
  const { document } = new JSDOM(html).window;
  return Array.from(document.querySelectorAll('.story')).map(
    (story) =>
      story.querySelector('h2')?.textContent?.replace(/\s+/g, ' ').trim() ||
      null,
  );
}

export function sectionTitle(
  titles: (string | null)[],
  section: string | null,
) {
  const story = section?.match(/^story-(\d+)$/);
  return story ? (titles[Number(story[1]) - 1] ?? null) : null;
}

const SELECT = {
  id: true,
  newsletterId: true,
  section: true,
  sectionTitle: true,
  text: true,
  note: true,
  starred: true,
  folderId: true,
  createdAt: true,
  updatedAt: true,
} as const;

/**
 * 스크랩 · 메모 (#123 1단계). 본인 것만 보고 바꾼다.
 * 같은 문장을 다시 스크랩하면 새로 만들지 않고 (메모를 주면 메모만) 고친다
 */
@Injectable()
export class HighlightsService {
  constructor(private readonly prisma: MysqlPrismaService) {}

  /** 내 스크랩. 뉴스레터를 주면 그 뉴스레터 것만 (상세 화면 형광펜용), 아니면 전체 (마이페이지) */
  async list(userId: number, newsletterId?: number) {
    const highlights = await this.prisma.highlight.findMany({
      where: { userId, ...(newsletterId && { newsletterId }) },
      orderBy: { createdAt: 'desc' },
      select: {
        ...SELECT,
        newsletter: {
          select: {
            title: true,
            createdAt: true,
            category: { select: { id: true, name: true } },
          },
        },
      },
    });
    // 소식 제목은 꺼내 둔 것을 쓴다. 아직 없는 것(예전 스크랩 · 본문을 고친 뒤)만 본문을 읽어 채워 둔다
    const missing = highlights.filter((h) => h.sectionTitle === null);
    if (missing.length) {
      const filled = await this.fillSectionTitles(missing);
      return highlights.map((h) => ({
        ...h,
        sectionTitle: filled.get(h.id) ?? h.sectionTitle,
      }));
    }
    return highlights;
  }

  /**
   * 마이페이지 스크랩 한 쪽 (최근 것부터, order=asc면 오래된 것부터). 폴더 · 보기(중요 · 메모)로 거르고,
   * 폴더 줄 · 보기 칩 개수(전체 · 폴더 없음 / 고른 폴더 안의 중요 · 메모)도 같이 준다
   */
  async page(
    userId: number,
    {
      offset = 0,
      limit = 30,
      folder,
      filter,
      order = 'desc',
    }: {
      offset?: number;
      limit?: number;
      folder?: 'none' | number;
      filter?: 'starred' | 'memo';
      order?: 'desc' | 'asc';
    } = {},
  ) {
    const mine = { userId };
    const inFolder = {
      ...mine,
      ...(folder !== undefined && {
        folderId: folder === 'none' ? null : folder,
      }),
    };
    const starred = { ...inFolder, starred: true };
    const memo = { ...inFolder, note: { not: null } };
    const where =
      filter === 'starred' ? starred : filter === 'memo' ? memo : inFolder;
    const [rows, total, all, unfiled, starredCount, memoCount] =
      await Promise.all([
        this.prisma.highlight.findMany({
          where,
          orderBy: [{ createdAt: order }, { id: order }],
          skip: offset,
          take: limit,
          select: {
            ...SELECT,
            newsletter: {
              select: {
                title: true,
                createdAt: true,
                category: { select: { id: true, name: true } },
              },
            },
          },
        }),
        this.prisma.highlight.count({ where }),
        this.prisma.highlight.count({ where: mine }),
        this.prisma.highlight.count({ where: { ...mine, folderId: null } }),
        this.prisma.highlight.count({ where: starred }),
        this.prisma.highlight.count({ where: memo }),
      ]);
    const missing = rows.filter((h) => h.sectionTitle === null);
    const filled = missing.length
      ? await this.fillSectionTitles(missing)
      : new Map<number, string>();
    return {
      items: rows.map((h) => ({
        ...h,
        sectionTitle: filled.get(h.id) ?? h.sectionTitle,
      })),
      total,
      counts: { all, unfiled, starred: starredCount, memo: memoCount },
    };
  }

  /** 소식 제목을 본문에서 꺼내 저장 (뉴스레터마다 본문은 한 번만 읽음). id → 제목('' = 없음) */
  private async fillSectionTitles(
    rows: { id: number; newsletterId: number; section: string | null }[],
  ) {
    const ids = [...new Set(rows.map((h) => h.newsletterId))];
    const bodies = await this.prisma.newsletter.findMany({
      where: { id: { in: ids } },
      select: { id: true, contentAsHTML: true },
    });
    const titles = new Map(
      bodies.map((b) => [b.id, sectionTitles(b.contentAsHTML)]),
    );
    const filled = new Map(
      rows.map((h) => [
        h.id,
        sectionTitle(titles.get(h.newsletterId) ?? [], h.section) ?? '',
      ]),
    );
    // 같은 제목끼리 묶어 한 번에 저장
    const byTitle = new Map<string, number[]>();
    filled.forEach((title, id) =>
      byTitle.set(title, [...(byTitle.get(title) ?? []), id]),
    );
    await this.prisma.$transaction(
      [...byTitle].map(([title, ids]) =>
        this.prisma.highlight.updateMany({
          where: { id: { in: ids } },
          data: { sectionTitle: title.slice(0, 200) },
        }),
      ),
    );
    return filled;
  }

  async create(userId: number, dto: CreateHighlightDto) {
    const text = normalizeText(dto.text);
    if (text.length < 2) {
      throw new AppException('BAD_REQUEST', '두 글자 이상 골라 주세요.');
    }
    const newsletter = await this.prisma.newsletter.findUnique({
      where: { id: dto.newsletterId },
      select: { id: true, contentAsHTML: true },
    });
    if (!newsletter) throw new AppException('NEWSLETTER_NOT_FOUND');
    // 소식 제목은 지금 한 번 꺼내 둔다 (목록에서 본문을 다시 읽지 않게)
    const section = dto.section ?? null;
    const title = (
      sectionTitle(sectionTitles(newsletter.contentAsHTML), section) ?? ''
    ).slice(0, 200);

    const note = dto.note?.trim() || undefined;
    return this.prisma.highlight.upsert({
      where: {
        userId_newsletterId_text: {
          userId,
          newsletterId: dto.newsletterId,
          text,
        },
      },
      create: {
        userId,
        newsletterId: dto.newsletterId,
        section,
        sectionTitle: title,
        text,
        note: note ?? null,
      },
      update: note ? { note } : {},
      select: SELECT,
    });
  }

  /** 메모 · 별표 중 준 것만 바꾼다 (빈 메모는 지우기) */
  async update(
    userId: number,
    id: number,
    changes: { note?: string; starred?: boolean },
  ) {
    await this.own(userId, id);
    return this.prisma.highlight.update({
      where: { id },
      data: {
        ...(changes.note !== undefined && {
          note: changes.note.trim() || null,
        }),
        ...(changes.starred !== undefined && { starred: changes.starred }),
      },
      select: SELECT,
    });
  }

  async remove(userId: number, id: number) {
    await this.own(userId, id);
    await this.prisma.highlight.delete({ where: { id } });
    return { id };
  }

  /** 여러 개 지우기: 내 것만 지우고(남의 번호는 조용히 건너뜀) 지운 수를 돌려준다 */
  async removeMany(userId: number, ids: number[]) {
    const { count } = await this.prisma.highlight.deleteMany({
      where: { userId, id: { in: [...new Set(ids)] } },
    });
    return { count };
  }

  /**
   * 선택한 스크랩 한꺼번에 (#123): 폴더로 옮기기 · 중요 표시 · 중요 빼기. 내 것만 바꾸고 바꾼 수를 돌려준다.
   * 옮길 폴더도 내 것이어야 한다 (null = 폴더 없음)
   */
  async bulk(userId: number, dto: BulkHighlightsDto) {
    if (dto.action === 'move' && dto.folderId) {
      await assertOwnFolder(this.prisma, userId, dto.folderId);
    }
    const data =
      dto.action === 'move'
        ? { folderId: dto.folderId ?? null }
        : { starred: dto.action === 'star' };
    const { count } = await this.prisma.highlight.updateMany({
      where: { userId, id: { in: [...new Set(dto.ids)] } },
      data,
    });
    return { count };
  }

  /** 남의 스크랩은 없는 것처럼 (있는지도 알려 주지 않게 404) */
  private async own(userId: number, id: number) {
    const found = await this.prisma.highlight.findFirst({
      where: { id, userId },
      select: { id: true },
    });
    if (!found) throw new AppException('HIGHLIGHT_NOT_FOUND');
  }
}
