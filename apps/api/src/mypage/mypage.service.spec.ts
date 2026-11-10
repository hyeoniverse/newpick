import { MyPageService } from './mypage.service';

/**
 * 마이페이지 서비스의 지금 동작을 고정한다 (#229): #199에서 이 파일을 나눌 때 같은 입력에 같은 결과 · 같은 쿼리인지 본다.
 * prisma는 쓰는 함수만 가짜로 둔다
 */
const me = { email: 'me@example.com' };
const at = (iso: string) => new Date(iso);

function fakePrisma(overrides: Record<string, unknown> = {}) {
  return {
    user: {
      findUnique: jest.fn().mockResolvedValue(me),
      update: jest.fn().mockResolvedValue({}),
    },
    folder: { findFirst: jest.fn().mockResolvedValue({ id: 9 }) },
    bookmark: {
      findMany: jest.fn().mockResolvedValue([]),
      updateMany: jest.fn().mockResolvedValue({ count: 2 }),
    },
    emailArchive: {
      findFirst: jest.fn().mockResolvedValue({ id: 1 }),
      findMany: jest.fn().mockResolvedValue([]),
      groupBy: jest.fn().mockResolvedValue([]),
    },
    mailMark: {
      findMany: jest.fn().mockResolvedValue([]),
      upsert: jest.fn().mockImplementation(({ create }) => create),
    },
    mailPlan: {
      findMany: jest.fn().mockResolvedValue([]),
      findUnique: jest.fn().mockResolvedValue(null),
    },
    newsCategory: { findMany: jest.fn() },
    userInterest: {
      findMany: jest
        .fn()
        .mockResolvedValue([{ categoryId: 2 }, { categoryId: 5 }]),
      deleteMany: jest.fn().mockReturnValue('delete-op'),
      createMany: jest.fn().mockReturnValue('create-op'),
    },
    $transaction: jest.fn().mockResolvedValue([]),
    ...overrides,
  };
}
const serviceWith = (
  prisma: ReturnType<typeof fakePrisma>,
  edition: unknown = {},
) => new MyPageService(prisma as never, edition as never);

describe('마이페이지: 맞춤 메일 · 프로필 · 북마크', () => {
  it('맞춤 메일은 기록이 없으면 켜짐, 바꾸면 그 값을 돌려준다', async () => {
    const prisma = fakePrisma();
    prisma.user.findUnique.mockResolvedValueOnce(null);
    const service = serviceWith(prisma);
    expect(await service.getPersonalMail(7)).toEqual({ enabled: true });
    expect(await service.setPersonalMail(7, false)).toEqual({ enabled: false });
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 7 },
      data: { personalMail: false },
    });
  });

  it('프로필: 관리자가 아닌 역할은 모두 user, 관심사는 번호 목록으로', async () => {
    const prisma = fakePrisma();
    const row = {
      id: 7,
      email: 'me@example.com',
      username: null,
      profileImg: null,
      timezone: 'Asia/Seoul',
      interests: [{ categoryId: 1 }, { categoryId: 4 }],
    };
    prisma.user.findUnique.mockResolvedValueOnce({ ...row, role: 'editor' });
    prisma.user.findUnique.mockResolvedValueOnce({ ...row, role: 'admin' });
    const service = serviceWith(prisma);
    expect(await service.getProfile(7)).toEqual({
      ...row,
      role: 'user',
      interests: [1, 4],
    });
    expect((await service.getProfile(7)).role).toBe('admin');
  });

  it('프로필: 사용자가 없으면 USER_NOT_FOUND', async () => {
    const prisma = fakePrisma();
    prisma.user.findUnique.mockResolvedValueOnce(null);
    await expect(serviceWith(prisma).getProfile(7)).rejects.toMatchObject({
      code: 'USER_NOT_FOUND',
    });
  });

  it('북마크 전체: 최신 북마크 순, 요약은 100자 + …, 빈 이미지는 null', async () => {
    const prisma = fakePrisma();
    prisma.bookmark.findMany.mockResolvedValueOnce([
      {
        createdAt: at('2026-10-28T00:00:00Z'),
        folderId: null,
        newsletter: {
          id: 3,
          title: '제목',
          imageUrl: '',
          content: '가'.repeat(120),
          createdAt: at('2026-10-27T00:00:00Z'),
          viewcount: 4,
          category: { id: 2, name: '정치' },
        },
      },
    ]);
    const [item] = await serviceWith(prisma).getBookmarks(7);
    expect(prisma.bookmark.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: 7 },
        orderBy: { createdAt: 'desc' },
      }),
    );
    expect(item).toEqual({
      bookmarkedAt: at('2026-10-28T00:00:00Z'),
      folderId: null,
      viewcount: 4,
      id: 3,
      newsTitle: '제목',
      newsImg: null,
      newsCreatedAt: at('2026-10-27T00:00:00Z'),
      newsSummary: `${'가'.repeat(100)}...`,
      category: { id: 2, name: '정치' },
    });
  });

  it('북마크 옮기기: 같은 뉴스레터는 한 번만, 폴더는 내 것인지 먼저 본다 (null이면 보지 않음)', async () => {
    const prisma = fakePrisma();
    const service = serviceWith(prisma);
    expect(await service.moveBookmarks(7, [3, 3, 4], 9)).toEqual({ count: 2 });
    expect(prisma.folder.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 9, userId: 7 } }),
    );
    expect(prisma.bookmark.updateMany).toHaveBeenCalledWith({
      where: { userId: 7, newsletterId: { in: [3, 4] } },
      data: { folderId: 9 },
    });
    prisma.folder.findFirst.mockClear();
    await service.moveBookmarks(7, [3], null);
    expect(prisma.folder.findFirst).not.toHaveBeenCalled();
  });

  it('북마크 옮기기: 남의 폴더면 NOT_FOUND', async () => {
    const prisma = fakePrisma();
    prisma.folder.findFirst.mockResolvedValueOnce(null);
    await expect(
      serviceWith(prisma).moveBookmarks(7, [3], 99),
    ).rejects.toMatchObject({ code: 'NOT_FOUND' });
    expect(prisma.bookmark.updateMany).not.toHaveBeenCalled();
  });
});

describe('마이페이지: 받은 메일 표시', () => {
  const sentAt = at('2026-10-28T23:30:00Z');

  it('준 것만 바꾸고, 표시가 처음이면 줄을 만든다', async () => {
    const prisma = fakePrisma();
    await serviceWith(prisma).markMail(7, sentAt, { starred: true });
    expect(prisma.mailMark.upsert).toHaveBeenCalledWith({
      where: { userId_sentAt: { userId: 7, sentAt } },
      create: { userId: 7, sentAt, starred: true },
      update: { starred: true },
      select: { sentAt: true, starred: true, folderId: true },
    });
    expect(prisma.folder.findFirst).not.toHaveBeenCalled();
  });

  it('폴더를 빼면(null) 폴더 확인 없이 null로', async () => {
    const prisma = fakePrisma();
    await serviceWith(prisma).markMail(7, sentAt, { folderId: null });
    expect(prisma.mailMark.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ update: { folderId: null } }),
    );
    expect(prisma.folder.findFirst).not.toHaveBeenCalled();
  });

  it('내가 받은 메일이 아니면 NOT_FOUND, 사용자가 없으면 USER_NOT_FOUND', async () => {
    const prisma = fakePrisma();
    prisma.emailArchive.findFirst.mockResolvedValueOnce(null);
    await expect(
      serviceWith(prisma).markMail(7, sentAt, { starred: true }),
    ).rejects.toMatchObject({
      code: 'NOT_FOUND',
    });
    prisma.user.findUnique.mockResolvedValueOnce(null);
    await expect(
      serviceWith(prisma).markMail(7, sentAt, { starred: true }),
    ).rejects.toMatchObject({
      code: 'USER_NOT_FOUND',
    });
    expect(prisma.mailMark.upsert).not.toHaveBeenCalled();
  });
});

describe('마이페이지: 받은 메일 목록', () => {
  const a = at('2026-10-29T23:30:00Z');
  const b = at('2026-10-28T23:30:00Z');
  const c = at('2026-09-30T23:30:00Z');
  const marks = [
    { sentAt: a, starred: true, folderId: null },
    { sentAt: b, starred: false, folderId: 9 },
  ];

  /** groupBy 세 번: (쪽, 거른 전체, 거르지 않은 전체) */
  function withSends(
    prisma: ReturnType<typeof fakePrisma>,
    page: Date[],
    filtered: Date[],
    everything: Date[],
  ) {
    prisma.emailArchive.groupBy
      .mockResolvedValueOnce(page.map((sentAt) => ({ sentAt })))
      .mockResolvedValueOnce(filtered.map((sentAt) => ({ sentAt })))
      .mockResolvedValueOnce(everything.map((sentAt) => ({ sentAt })));
  }

  it('중요만: 표시에서 중요한 보낸 시각만 골라 건다, 개수는 거르기와 상관없이 전체 기준', async () => {
    const prisma = fakePrisma();
    prisma.mailMark.findMany.mockResolvedValueOnce(marks);
    withSends(prisma, [], [a], [a, b, c]);
    const result = await serviceWith(prisma).getMails(7, 0, 5, {
      starred: true,
    });
    expect(prisma.emailArchive.groupBy).toHaveBeenNthCalledWith(1, {
      by: ['sentAt'],
      where: { email: me.email, sentAt: { in: [a] } },
      orderBy: { sentAt: 'desc' },
      skip: 0,
      take: 5,
    });
    // 쪽이 비면 뉴스레터 · 짜임새를 읽지 않고 바로
    expect(result).toEqual({
      items: [],
      total: 1,
      counts: { all: 3, starred: 1, unfiled: 2 },
      months: [{ month: '2026-10', count: 1, firstIndex: 0 }],
    });
    expect(prisma.emailArchive.findMany).not.toHaveBeenCalled();
  });

  it('폴더 · 폴더 없음 · 관심사 · 오래된 순 거르기 조건', async () => {
    const prisma = fakePrisma();
    prisma.mailMark.findMany.mockResolvedValue(marks);
    const service = serviceWith(prisma);
    await service.getMails(7, 10, 5, { folder: 9, order: 'asc' });
    expect(prisma.emailArchive.groupBy).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        where: { email: me.email, sentAt: { in: [b] } },
        orderBy: { sentAt: 'asc' },
        skip: 10,
      }),
    );
    prisma.emailArchive.groupBy.mockClear();
    await service.getMails(7, 0, 5, { folder: 'none', categoryId: 3 });
    expect(prisma.emailArchive.groupBy).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        where: {
          email: me.email,
          sentAt: { notIn: [b] },
          newsletter: { categoryId: 3 },
        },
      }),
    );
  });

  it('한 통씩: 그때의 계획으로 짜임새를 다시 엮고, 표시 · 뉴스레터(첫 이미지 · 요약)를 붙인다', async () => {
    const prisma = fakePrisma();
    prisma.mailMark.findMany.mockResolvedValueOnce(marks);
    withSends(prisma, [a, b], [a, b], [a, b]);
    const news = (id: number, categoryId: number, sentAt: Date) => ({
      sentAt,
      newsletter: {
        id,
        title: `뉴스레터 ${id}`,
        subtitle: null,
        imageUrl: ',first.png,second.png',
        content: '짧은 요약',
        createdAt: at('2026-10-28T00:00:00Z'),
        category: { id: categoryId, name: `분야 ${categoryId}` },
      },
    });
    prisma.emailArchive.findMany.mockResolvedValueOnce([
      news(11, 1, a),
      news(12, 2, a),
      news(13, 1, b),
    ]);
    const plan = { kind: 'personal' };
    prisma.mailPlan.findMany.mockResolvedValueOnce([{ sentAt: a, plan }]);
    const section = (newsletterId: number, heading: string) => ({
      category: `분야 ${newsletterId}`,
      newsletterId,
      title: `뉴스레터 ${newsletterId}`,
      stories: [{ story: { heading }, alsoIn: [] }],
    });
    const edition = {
      rebuildDigest: jest.fn().mockImplementation(async (sentAt: Date) =>
        sentAt === a
          ? {
              subject: '10/30 아침',
              top: [
                {
                  category: 'IT',
                  heading: '반도체',
                  line: '한 줄',
                  extra: 'x',
                },
              ],
              threads: [],
              sections: [
                section(11, '첫 소식'),
                section(12, '둘째'),
                section(11, '같은 분야 다음'),
              ],
              watch: [],
            }
          : null,
      ),
    };
    const result = await serviceWith(prisma, edition).getMails(7);
    expect(edition.rebuildDigest).toHaveBeenCalledWith(a, [11, 12], plan);
    expect(edition.rebuildDigest).toHaveBeenCalledWith(b, [13], null);
    expect(result.items[0]).toMatchObject({
      sentAt: a,
      subject: '10/30 아침',
      starred: true,
      folderId: null,
      digest: {
        top: [{ category: 'IT', heading: '반도체', line: '한 줄' }],
        // 같은 뉴스레터의 소식은 한 줄로 (처음 나온 순서)
        sections: [
          {
            newsletterId: 11,
            stories: [
              { heading: '첫 소식', alsoIn: [] },
              { heading: '같은 분야 다음', alsoIn: [] },
            ],
          },
          { newsletterId: 12, stories: [{ heading: '둘째', alsoIn: [] }] },
        ],
      },
      newsletters: [
        { id: 11, image: 'first.png', summary: '짧은 요약...' },
        { id: 12, image: 'first.png' },
      ],
    });
    expect(result.items[0].digest?.top[0]).not.toHaveProperty('extra');
    expect(result.items[1]).toMatchObject({
      sentAt: b,
      subject: null,
      digest: null,
      starred: false,
      folderId: 9,
    });
  });
});

describe('마이페이지: 받은 메일 한 통 · 관심사', () => {
  const sentAt = at('2026-10-28T23:30:00Z');

  it('받은 그대로 다시 만든다 (저장한 계획으로), 발송 기록이 없으면 NOT_FOUND', async () => {
    const prisma = fakePrisma();
    prisma.emailArchive.findMany.mockResolvedValueOnce([
      { newsletterId: 11 },
      { newsletterId: 12 },
    ]);
    prisma.mailPlan.findUnique.mockResolvedValueOnce({
      plan: { kind: 'personal' },
    });
    const edition = {
      rebuildMail: jest
        .fn()
        .mockResolvedValue({ subject: '제목', html: '<p>본문</p>' }),
    };
    expect(await serviceWith(prisma, edition).getMail(7, sentAt)).toEqual({
      sentAt,
      subject: '제목',
      html: '<p>본문</p>',
    });
    expect(edition.rebuildMail).toHaveBeenCalledWith(sentAt, [11, 12], {
      kind: 'personal',
    });

    prisma.emailArchive.findMany.mockResolvedValueOnce([]);
    await expect(
      serviceWith(prisma, edition).getMail(7, sentAt),
    ).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });

  it('관심사 바꾸기: 중복을 없애고 한 트랜잭션으로 지우고 넣은 뒤 다시 읽어 준다', async () => {
    const prisma = fakePrisma();
    prisma.newsCategory.findMany.mockResolvedValueOnce([{ id: 2 }, { id: 5 }]);
    const result = await serviceWith(prisma).updateInterests(7, [5, 2, 5]);
    expect(prisma.userInterest.createMany).toHaveBeenCalledWith({
      data: [
        { userId: 7, categoryId: 5 },
        { userId: 7, categoryId: 2 },
      ],
    });
    expect(prisma.$transaction).toHaveBeenCalledWith([
      'delete-op',
      'create-op',
    ]);
    expect(result).toEqual({ interests: [2, 5] });
  });

  it('없는 분야가 있으면 INVALID_INTERESTS, 아무것도 바꾸지 않는다', async () => {
    const prisma = fakePrisma();
    prisma.newsCategory.findMany.mockResolvedValueOnce([{ id: 2 }]);
    await expect(
      serviceWith(prisma).updateInterests(7, [2, 99]),
    ).rejects.toMatchObject({
      code: 'INVALID_INTERESTS',
    });
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});
