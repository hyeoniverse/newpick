import { NewsletterRepo } from './newsletter.repository';

describe('뉴스레터 고치기', () => {
  const fakePrisma = () => ({
    newsletter: { update: jest.fn().mockResolvedValue({ id: 66 }) },
    highlight: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
  });

  it('본문을 고치면 스크랩에 꺼내 둔 소식 제목을 비운다 (다음 목록에서 새 본문으로 다시 꺼냄)', async () => {
    const prisma = fakePrisma();
    await new NewsletterRepo(prisma as never).updateNewsletter(66, {
      contentAsHTML: '<p>새 본문</p>',
    });
    expect(prisma.highlight.updateMany).toHaveBeenCalledWith({
      where: { newsletterId: 66 },
      data: { sectionTitle: null },
    });
  });

  it('본문 말고 제목만 고치면 그대로 둔다', async () => {
    const prisma = fakePrisma();
    await new NewsletterRepo(prisma as never).updateNewsletter(66, {
      title: '새 제목',
    });
    expect(prisma.highlight.updateMany).not.toHaveBeenCalled();
  });
});

describe('오늘의 트렌드', () => {
  const at = (iso: string) => new Date(iso);

  it('가장 최근 뉴스레터가 나온 날(KST)의 것만, 분야마다 가장 늦게 만든 한 편', async () => {
    const findMany = jest.fn().mockResolvedValue([
      { id: 12, categoryId: 1, createdAt: at('2026-10-31T00:30:00Z') },
      { id: 11, categoryId: 1, createdAt: at('2026-10-30T23:40:00Z') },
      { id: 13, categoryId: 3, createdAt: at('2026-10-30T23:35:00Z') },
    ]);
    const prisma = {
      newsletter: {
        // 가장 최근: 10월 31일 09:30 KST
        findFirst: jest
          .fn()
          .mockResolvedValue({ createdAt: at('2026-10-31T00:30:00Z') }),
        findMany,
      },
    };
    const result = await new NewsletterRepo(
      prisma as never,
    ).getLatestNewslettersForAllCategories();

    // 10월 31일(KST) 하루만: 며칠 전 다른 분야 뉴스레터가 섞이지 않는다
    expect(findMany.mock.calls[0][0].where).toEqual({
      createdAt: {
        gte: at('2026-10-30T15:00:00Z'),
        lte: at('2026-10-31T14:59:59.999Z'),
      },
    });
    expect(result.map((n) => n.id)).toEqual([12, 13]);
  });

  it('뉴스레터가 하나도 없으면 빈 목록', async () => {
    const prisma = {
      newsletter: {
        findFirst: jest.fn().mockResolvedValue(null),
        findMany: jest.fn(),
      },
    };
    expect(
      await new NewsletterRepo(
        prisma as never,
      ).getLatestNewslettersForAllCategories(),
    ).toEqual([]);
    expect(prisma.newsletter.findMany).not.toHaveBeenCalled();
  });
});
