import {
  HighlightsService,
  normalizeText,
  sectionTitle,
  sectionTitles,
} from './highlights.service';

function fakePrisma(owned = true) {
  return {
    folder: {
      findFirst: jest.fn().mockResolvedValue(owned ? { id: 9 } : null),
      count: jest.fn().mockResolvedValue(0),
      create: jest.fn((args) => Promise.resolve({ id: 9, ...args.data })),
      update: jest.fn((args) => Promise.resolve(args)),
      delete: jest.fn().mockResolvedValue({}),
      findMany: jest.fn().mockResolvedValue([]),
    },
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
      deleteMany: jest.fn().mockResolvedValue({ count: 2 }),
      updateMany: jest.fn().mockResolvedValue({ count: 2 }),
      count: jest.fn().mockResolvedValue(3),
    },
    $transaction: jest.fn((ops) => Promise.all(ops)),
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
    await expect(service.update(7, 1, { note: '메모' })).rejects.toMatchObject({
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
    await new HighlightsService(prisma as never).update(7, 1, { note: '   ' });
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

  it('별표만 주면 별표만 바꾸고 메모는 건드리지 않는다', async () => {
    const prisma = fakePrisma();
    await new HighlightsService(prisma as never).update(7, 1, {
      starred: true,
    });
    expect(prisma.highlight.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { starred: true } }),
    );
  });

  it('여러 개 지우기는 내 것만, 겹친 번호는 한 번만', async () => {
    const prisma = fakePrisma();
    const result = await new HighlightsService(prisma as never).removeMany(
      7,
      [3, 4, 3],
    );
    expect(prisma.highlight.deleteMany).toHaveBeenCalledWith({
      where: { userId: 7, id: { in: [3, 4] } },
    });
    expect(result).toEqual({ count: 2 });
  });

  it('한꺼번에: 폴더로 옮기기 · 중요 표시 · 중요 빼기, 내 것만', async () => {
    const prisma = fakePrisma();
    const service = new HighlightsService(prisma as never);
    await service.bulk(7, { ids: [1, 2, 2], action: 'move', folderId: 9 });
    expect(prisma.folder.findFirst).toHaveBeenCalledWith({
      where: { id: 9, userId: 7 },
      select: { id: true },
    });
    expect(prisma.highlight.updateMany).toHaveBeenLastCalledWith({
      where: { userId: 7, id: { in: [1, 2] } },
      data: { folderId: 9 },
    });
    await service.bulk(7, { ids: [1], action: 'move', folderId: null });
    expect(prisma.highlight.updateMany).toHaveBeenLastCalledWith(
      expect.objectContaining({ data: { folderId: null } }),
    );
    await service.bulk(7, { ids: [1], action: 'unstar' });
    expect(prisma.highlight.updateMany).toHaveBeenLastCalledWith(
      expect.objectContaining({ data: { starred: false } }),
    );
  });

  it('남의 폴더로는 옮길 수 없다', async () => {
    const prisma = fakePrisma();
    prisma.folder.findFirst.mockResolvedValue(null);
    await expect(
      new HighlightsService(prisma as never).bulk(7, {
        ids: [1],
        action: 'move',
        folderId: 9,
      }),
    ).rejects.toMatchObject({ status: 404 });
    expect(prisma.highlight.updateMany).not.toHaveBeenCalled();
  });

  it('스크랩할 때 소식 제목을 본문에서 한 번 꺼내 저장한다 (브리핑은 빈 글)', async () => {
    const prisma = fakePrisma();
    prisma.newsletter.findUnique.mockResolvedValue({
      id: 66,
      contentAsHTML:
        '<article class="story"><h2>코스피 이탈</h2></article><article class="story"><h2>룰라 4선</h2></article>',
    });
    const service = new HighlightsService(prisma as never);
    await service.create(7, {
      newsletterId: 66,
      section: 'story-2',
      text: '문장 하나',
    });
    expect(prisma.highlight.upsert.mock.calls[0][0].create).toMatchObject({
      section: 'story-2',
      sectionTitle: '룰라 4선',
    });
    await service.create(7, {
      newsletterId: 66,
      section: 'briefing',
      text: '문장 둘',
    });
    expect(prisma.highlight.upsert.mock.calls[1][0].create.sectionTitle).toBe(
      '',
    );
  });

  it('목록은 꺼내 둔 제목을 쓰고, 없는 것(예전 스크랩 · 본문 고친 뒤)만 본문을 읽어 채운다', async () => {
    const prisma = fakePrisma();
    const row = (
      id: number,
      sectionTitle: string | null,
      section = 'story-1',
    ) => ({
      id,
      newsletterId: 66,
      section,
      sectionTitle,
    });
    prisma.highlight.findMany.mockResolvedValue([
      row(1, '저장된 제목'),
      row(2, ''),
    ]);
    const service = new HighlightsService(prisma as never);
    const stored = await service.list(7);
    expect(stored.map((h) => h.sectionTitle)).toEqual(['저장된 제목', '']);
    expect(prisma.newsletter.findMany).not.toHaveBeenCalled();

    prisma.highlight.findMany.mockResolvedValue([
      row(1, '저장된 제목'),
      row(3, null),
      row(4, null, 'briefing'),
    ]);
    prisma.newsletter.findMany.mockResolvedValue([
      {
        id: 66,
        contentAsHTML: '<article class="story"><h2>새 제목</h2></article>',
      },
    ]);
    const filled = await service.list(7);
    expect(filled.map((h) => h.sectionTitle)).toEqual([
      '저장된 제목',
      '새 제목',
      '',
    ]);
    expect(prisma.highlight.updateMany).toHaveBeenCalledWith({
      where: { id: { in: [3] } },
      data: { sectionTitle: '새 제목' },
    });
    expect(prisma.highlight.updateMany).toHaveBeenCalledWith({
      where: { id: { in: [4] } },
      data: { sectionTitle: '' },
    });
  });

  it('마이페이지 한 쪽: 폴더 · 보기로 거르고, 중요 · 메모는 고른 폴더 안에서 센다', async () => {
    const prisma = fakePrisma();
    prisma.highlight.findMany.mockResolvedValue([
      { id: 1, newsletterId: 66, section: 'briefing', sectionTitle: '' },
    ]);
    const page = await new HighlightsService(prisma as never).page(7, {
      offset: 30,
      limit: 30,
      folder: 9,
      filter: 'memo',
    });
    expect(prisma.highlight.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: 7, folderId: 9, note: { not: null } },
        skip: 30,
        take: 30,
      }),
    );
    const counted = prisma.highlight.count.mock.calls.map((c) => c[0].where);
    expect(counted).toEqual([
      { userId: 7, folderId: 9, note: { not: null } },
      { userId: 7 },
      { userId: 7, folderId: null },
      { userId: 7, folderId: 9, starred: true },
      { userId: 7, folderId: 9, note: { not: null } },
    ]);
    expect(page).toMatchObject({
      total: 3,
      counts: { all: 3, unfiled: 3, starred: 3, memo: 3 },
    });
    // 제목이 이미 있으면 본문을 읽지 않는다
    expect(prisma.newsletter.findMany).not.toHaveBeenCalled();
  });

  it('정렬: 기본은 최근 스크랩순, order=asc면 오래된순 (같은 시각이면 번호 순)', async () => {
    const prisma = fakePrisma();
    const service = new HighlightsService(prisma as never);
    await service.page(7);
    expect(prisma.highlight.findMany).toHaveBeenLastCalledWith(
      expect.objectContaining({
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      }),
    );
    await service.page(7, { order: 'asc' });
    expect(prisma.highlight.findMany).toHaveBeenLastCalledWith(
      expect.objectContaining({
        orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
      }),
    );
  });
});
