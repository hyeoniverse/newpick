import {
  HighlightsService,
  normalizeText,
  sectionTitle,
  sectionTitles,
} from './highlights.service';

function fakePrisma(owned = true) {
  return {
    newsletter: {
      findUnique: jest.fn().mockResolvedValue({ id: 66 }),
      findMany: jest.fn().mockResolvedValue([]),
    },
    highlight: {
      findMany: jest.fn().mockResolvedValue([]),
      findFirst: jest.fn().mockResolvedValue(owned ? { id: 1 } : null),
      upsert: jest.fn((args) => Promise.resolve(args)),
      update: jest.fn((args) => Promise.resolve(args)),
      delete: jest.fn().mockResolvedValue({}),
    },
  };
}

describe('스크랩 · 메모 (#123)', () => {
  it('고른 글의 줄바꿈 · 여러 칸을 공백 하나로 맞춘다', () => {
    expect(normalizeText('  코스피가\n  26일   하락 ')).toBe(
      '코스피가 26일 하락',
    );
  });

  it('같은 문장이면 새로 만들지 않고, 메모를 주면 메모만 고친다', async () => {
    const prisma = fakePrisma();
    const service = new HighlightsService(prisma as never);
    await service.create(7, {
      newsletterId: 66,
      section: 'story-1',
      text: '코스피가\n26일 하락',
      note: ' 중요 ',
    });
    expect(prisma.highlight.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          userId_newsletterId_text: {
            userId: 7,
            newsletterId: 66,
            text: '코스피가 26일 하락',
          },
        },
        create: expect.objectContaining({ section: 'story-1', note: '중요' }),
        update: { note: '중요' },
      }),
    );
    await service.create(7, { newsletterId: 66, text: '코스피가 26일 하락' });
    expect(prisma.highlight.upsert.mock.calls[1][0].update).toEqual({});
  });

  it('없는 뉴스레터면 404, 공백만 고르면 400', async () => {
    const prisma = fakePrisma();
    prisma.newsletter.findUnique.mockResolvedValue(null);
    const service = new HighlightsService(prisma as never);
    await expect(
      service.create(7, { newsletterId: 1, text: '문장 하나' }),
    ).rejects.toMatchObject({
      code: 'NEWSLETTER_NOT_FOUND',
    });
    await expect(
      service.create(7, { newsletterId: 1, text: '   a  ' }),
    ).rejects.toMatchObject({ status: 400 });
  });

  it('남의 스크랩은 고치거나 지울 수 없다 (404)', async () => {
    const prisma = fakePrisma(false);
    const service = new HighlightsService(prisma as never);
    await expect(service.updateNote(7, 1, '메모')).rejects.toMatchObject({
      code: 'HIGHLIGHT_NOT_FOUND',
    });
    await expect(service.remove(7, 1)).rejects.toMatchObject({
      code: 'HIGHLIGHT_NOT_FOUND',
    });
    expect(prisma.highlight.update).not.toHaveBeenCalled();
    expect(prisma.highlight.delete).not.toHaveBeenCalled();
    expect(prisma.highlight.findFirst).toHaveBeenCalledWith({
      where: { id: 1, userId: 7 },
      select: { id: true },
    });
  });

  it('메모를 비우면 지운다', async () => {
    const prisma = fakePrisma();
    await new HighlightsService(prisma as never).updateNote(7, 1, '   ');
    expect(prisma.highlight.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { note: null } }),
    );
  });

  it('소식 구역(story-N)은 본문에서 그 소식의 제목을 꺼낸다 (브리핑 · 모르는 구역은 없음)', () => {
    const html =
      '<div class="newsletter"><section class="briefing"><h3>에디터 브리핑</h3></section>' +
      '<article class="story story-numbers"><p class="kicker">01</p><h2>코스피,  외인 매도에\n5500선 이탈</h2></article>' +
      '<article class="story"><h2>룰라 4선</h2></article></div>';
    const titles = sectionTitles(html);
    expect(titles).toEqual(['코스피, 외인 매도에 5500선 이탈', '룰라 4선']);
    expect(sectionTitle(titles, 'story-2')).toBe('룰라 4선');
    expect(sectionTitle(titles, 'story-9')).toBeNull();
    expect(sectionTitle(titles, 'briefing')).toBeNull();
    expect(sectionTitles(null)).toEqual([]);
  });
});
