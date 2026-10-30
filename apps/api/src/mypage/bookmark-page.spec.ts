import { MyPageService } from './mypage.service';

const newsletter = {
  id: 66,
  title: '코스피 이탈',
  imageUrl: 'a.png,b.png',
  content: '본문',
  createdAt: new Date('2026-10-27'),
  viewcount: 137,
  category: { id: 3, name: '경제' },
};

function fakePrisma() {
  return {
    bookmark: {
      findMany: jest
        .fn()
        .mockResolvedValue([
          { createdAt: new Date('2026-10-28'), folderId: 9, newsletter },
        ]),
      count: jest.fn().mockResolvedValue(5),
    },
    newsCategory: {
      findMany: jest.fn().mockResolvedValue([{ id: 3, name: '경제' }]),
    },
  };
}

describe('마이페이지 북마크 쪽 (#123)', () => {
  it('폴더 · 관심사로 거르고 정렬해 한 쪽만, 개수 · 관심사 칩도 같이', async () => {
    const prisma = fakePrisma();
    const service = new MyPageService(prisma as never, {} as never);
    const page = await service.getBookmarkPage(7, {
      offset: 24,
      limit: 24,
      folder: 9,
      categoryId: 3,
      sort: 'views',
    });
    expect(prisma.bookmark.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: 7, folderId: 9, newsletter: { categoryId: 3 } },
        orderBy: [{ newsletter: { viewcount: 'desc' } }, { id: 'desc' }],
        skip: 24,
        take: 24,
      }),
    );
    // 폴더 줄 개수는 거르기와 상관없이 전체 · 폴더 없음
    expect(prisma.bookmark.count).toHaveBeenCalledWith({
      where: { userId: 7 },
    });
    expect(prisma.bookmark.count).toHaveBeenCalledWith({
      where: { userId: 7, folderId: null },
    });
    expect(page.items[0]).toMatchObject({
      id: 66,
      folderId: 9,
      viewcount: 137,
      newsTitle: '코스피 이탈',
      category: { id: 3, name: '경제' },
    });
    expect(page.categories).toEqual([{ id: 3, name: '경제' }]);
  });

  it("'폴더 없음'은 folderId null, 정렬을 안 주면 북마크한 순", async () => {
    const prisma = fakePrisma();
    await new MyPageService(prisma as never, {} as never).getBookmarkPage(7, {
      folder: 'none',
    });
    expect(prisma.bookmark.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: 7, folderId: null },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip: 0,
        take: 24,
      }),
    );
  });
});
