import { SIGNAL_TEXT_LIMITS, TasteService } from './taste.service';

const prismaWith = (data: {
  bookmarks?: unknown[];
  highlights?: unknown[];
  follows?: { userId: number; tag: string }[];
}) => ({
  bookmark: { findMany: jest.fn().mockResolvedValue(data.bookmarks ?? []) },
  highlight: { findMany: jest.fn().mockResolvedValue(data.highlights ?? []) },
  tagRule: { findMany: jest.fn().mockResolvedValue([]) },
  newsCategory: { findMany: jest.fn().mockResolvedValue([]) },
  tagFollow: { findMany: jest.fn().mockResolvedValue(data.follows ?? []) },
});

describe('TasteService · 팔로우한 태그 (#123 5단계)', () => {
  it('북마크 · 스크랩이 없어도 팔로우한 태그로 취향이 생긴다', async () => {
    const service = new TasteService(
      prismaWith({ follows: [{ userId: 7, tag: 'AI 반도체' }] }) as never,
    );
    expect((await service.profiles([7])).get(7)).toEqual({
      topics: [],
      follows: [{ name: 'AI 반도체', key: 'ai반도체' }],
    });
  });

  it('신호 글: 태그는 개수 제한 밖에서 늘 넣는다', async () => {
    const at = new Date('2026-10-30T00:00:00Z');
    const highlights = Array.from(
      { length: SIGNAL_TEXT_LIMITS.count + 5 },
      (_, i) => ({ userId: 7, createdAt: at, text: `스크랩 ${i}`, note: null }),
    );
    const service = new TasteService(
      prismaWith({
        highlights,
        follows: [{ userId: 7, tag: '금리' }],
      }) as never,
    );
    const texts = (await service.signalTexts([7])).get(7)!;
    expect(texts[0]).toEqual({ kind: 'tag', label: '금리', text: '금리' });
    expect(texts.filter((t) => t.kind === 'scrap')).toHaveLength(
      SIGNAL_TEXT_LIMITS.count,
    );
  });
});
