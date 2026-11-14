import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { JSDOM } from 'jsdom';
import { MysqlPrismaService } from 'prisma/mysql.service';
import { AppException } from '../common/errors/app.exception';
import { tagKey } from '../tags/tags';
import { assertOwnFolder } from './folders.service';
import { monthIndex } from './mypage.service';
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

/** 본문 HTML에서 소식마다 사진 주소 (.story 차례, 사진이 없으면 null). 마이페이지 스크랩 블록을 소식 사진으로 */
export function sectionImages(html: string | null) {
  if (!html) return [];
  const { document } = new JSDOM(html).window;
  return Array.from(document.querySelectorAll('.story')).map((story) => {
    const src = story.querySelector('figure img')?.getAttribute('src') ?? '';
    return /^https?:\/\//.test(src) ? src : null;
  });
}

/** 뉴스레터 태그 배열 (JSON) → 문자열만 */
const keywordList = (value: Prisma.JsonValue | null | undefined) =>
  Array.isArray(value)
    ? value.filter((k): k is string => typeof k === 'string')
    : [];

/**
 * 소식마다 태그 (.story 차례): 소식 태그(data-tags)가 있으면 그것, 없으면(예전 뉴스레터)
 * 뉴스레터 태그 중 그 소식 글(제목 · 본문)에 나오는 것. 메일 '팔로우한 태그' 칸이 소식을 고를 때와 같은 기준
 */
export function sectionTags(html: string | null, keywords: string[]) {
  if (!html) return [];
  const { document } = new JSDOM(html).window;
  return Array.from(document.querySelectorAll('.story')).map((story) => {
    const own = story.getAttribute('data-tags');
    if (own)
      return own
        .split('|')
        .map((t) => t.trim())
        .filter(Boolean);
    const text = tagKey(story.textContent ?? '');
    return keywords.filter(
      (k) => tagKey(k).length >= 2 && text.includes(tagKey(k)),
    );
  });
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
  sectionImage: true,
  sectionTags: true,
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
    // 소식 태그는 DB에 JSON으로 있다: 응답은 문자열 배열로 (아직 꺼내지 않은 것은 빈 배열)
    const rows = highlights.map((h) => ({
      ...h,
      sectionTags: keywordList(h.sectionTags),
    }));
    // 소식 제목은 꺼내 둔 것을 쓴다. 아직 없는 것(예전 스크랩 · 본문을 고친 뒤)만 본문을 읽어 채워 둔다
    const missing = rows.filter((h) => h.sectionTitle === null);
    if (missing.length) {
      const filled = await this.fillSectionTitles(missing);
      return rows.map((h) => ({
        ...h,
        sectionTitle: filled.get(h.id)?.title ?? h.sectionTitle,
      }));
    }
    return rows;
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
    const [rows, times, all, unfiled, starredCount, memoCount] =
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
                imageUrl: true,
                category: { select: { id: true, name: true } },
              },
            },
          },
        }),
        // 달 이동용: 거른 것 전부의 스크랩 시각 (개수도 여기서)
        this.prisma.highlight.findMany({ where, select: { createdAt: true } }),
        this.prisma.highlight.count({ where: mine }),
        this.prisma.highlight.count({ where: { ...mine, folderId: null } }),
        this.prisma.highlight.count({ where: starred }),
        this.prisma.highlight.count({ where: memo }),
      ]);
    // 소식 제목 · 사진은 꺼내 둔 것을 쓴다. 아직 없는 것(예전 스크랩 · 본문을 고친 뒤)만 본문을 읽어 채워 둔다
    const missing = rows.filter(
      (h) =>
        h.sectionTitle === null ||
        h.sectionImage === null ||
        h.sectionTags === null,
    );
    const filled = missing.length
      ? await this.fillSectionTitles(missing)
      : new Map<number, { title: string; image: string; tags: string[] }>();
    return {
      items: rows.map(({ newsletter, ...h }) => ({
        ...h,
        sectionTitle: filled.get(h.id)?.title ?? h.sectionTitle,
        // '' = 사진 없음 → 화면은 뉴스레터 대표 사진
        sectionImage: (filled.get(h.id)?.image ?? h.sectionImage) || null,
        sectionTags: filled.get(h.id)?.tags ?? keywordList(h.sectionTags),
        // 썸네일: 그림 주소 여러 개 중 첫 것
        newsletter: newsletter && {
          title: newsletter.title,
          createdAt: newsletter.createdAt,
          category: newsletter.category,
          image: newsletter.imageUrl?.split(',').find(Boolean) ?? null,
        },
      })),
      total: times.length,
      counts: { all, unfiled, starred: starredCount, memo: memoCount },
      // 스크랩한 달마다 개수와 그 달 첫 스크랩의 순번 (정렬 순서대로, 한국 시각) — 달 막대에서 바로 가기
      months: monthIndex(
        times.map((t) => t.createdAt),
        order,
      ),
    };
  }

  /** 소식 제목 · 사진을 본문에서 꺼내 저장 (뉴스레터마다 본문은 한 번만 읽음). id → { 제목, 사진 } ('' = 없음) */
  private async fillSectionTitles(
    rows: { id: number; newsletterId: number; section: string | null }[],
  ) {
    const ids = [...new Set(rows.map((h) => h.newsletterId))];
    const bodies = await this.prisma.newsletter.findMany({
      where: { id: { in: ids } },
      select: { id: true, contentAsHTML: true, keywords: true },
    });
    const parsed = new Map(
      bodies.map((b) => [
        b.id,
        {
          titles: sectionTitles(b.contentAsHTML),
          images: sectionImages(b.contentAsHTML),
          tags: sectionTags(b.contentAsHTML, keywordList(b.keywords)),
        },
      ]),
    );
    const filled = new Map(
      rows.map((h) => {
        const body = parsed.get(h.newsletterId);
        const title = sectionTitle(body?.titles ?? [], h.section) ?? '';
        const image = sectionTitle(body?.images ?? [], h.section) ?? '';
        const story = h.section?.match(/^story-(\d+)$/);
        const tags = story ? (body?.tags[Number(story[1]) - 1] ?? []) : [];
        return [
          h.id,
          { title: title.slice(0, 200), image: image.slice(0, 500), tags },
        ];
      }),
    );
    // 같은 제목 · 사진끼리 묶어 한 번에 저장
    const groups = new Map<
      string,
      { title: string; image: string; tags: string[]; ids: number[] }
    >();
    filled.forEach((value, id) => {
      const key = JSON.stringify([value.title, value.image, value.tags]);
      const group = groups.get(key) ?? { ...value, ids: [] };
      group.ids.push(id);
      groups.set(key, group);
    });
    await this.prisma.$transaction(
      [...groups.values()].map(({ title, image, tags, ids }) =>
        this.prisma.highlight.updateMany({
          where: { id: { in: ids } },
          data: { sectionTitle: title, sectionImage: image, sectionTags: tags },
        }),
      ),
    );
    return filled;
  }

  async create(userId: number, dto: CreateHighlightDto) {
    const text = normalizeText(dto.text);
    if (text.length < 2) {
      throw new AppException('BAD_REQUEST', '두 글자 이상 선택해 주십시오.');
    }
    const newsletter = await this.prisma.newsletter.findUnique({
      where: { id: dto.newsletterId },
      select: { id: true, contentAsHTML: true, keywords: true },
    });
    if (!newsletter) throw new AppException('NEWSLETTER_NOT_FOUND');
    // 소식 제목은 지금 한 번 꺼내 둔다 (목록에서 본문을 다시 읽지 않게)
    const section = dto.section ?? null;
    const title = (
      sectionTitle(sectionTitles(newsletter.contentAsHTML), section) ?? ''
    ).slice(0, 200);
    const image = (
      sectionTitle(sectionImages(newsletter.contentAsHTML), section) ?? ''
    ).slice(0, 500);
    const storyNo = section?.match(/^story-(\d+)$/);
    const tags = storyNo
      ? (sectionTags(
          newsletter.contentAsHTML,
          keywordList(newsletter.keywords),
        )[Number(storyNo[1]) - 1] ?? [])
      : [];

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
        sectionImage: image,
        sectionTags: tags,
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
