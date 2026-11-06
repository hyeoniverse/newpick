import { TAG_FOLLOW_LIMIT, TagFollowsService } from './tag-follows.service';

const setup = (existing: { tag: string }[] = []) => {
  const prisma = {
    tagFollow: {
      findMany: jest.fn().mockResolvedValue(existing),
      findUnique: jest.fn(
        async ({ where }) =>
          existing.find((e) => e.tag === where.userId_tag.tag) ?? null,
      ),
      count: jest.fn().mockResolvedValue(existing.length),
      create: jest.fn().mockResolvedValue({}),
      deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
    },
  };
  // 뉴스레터 태그 표기에 맞춘다: 'nvidia' → '엔비디아'
  const tags = {
    canonicalize: jest.fn(async (list: string[]) =>
      list.map((t) => (t.toLowerCase() === 'nvidia' ? '엔비디아' : t)),
    ),
  };
  return {
    service: new TagFollowsService(prisma as never, tags as never),
    prisma,
  };
};

describe('태그 팔로우 (#123 5단계)', () => {
  it('뉴스레터 태그 표기로 맞춰 저장한다', async () => {
    const { service, prisma } = setup();
    expect(await service.follow(7, ' NVIDIA ')).toEqual({ tag: '엔비디아' });
    expect(prisma.tagFollow.create).toHaveBeenCalledWith({
      data: { userId: 7, tag: '엔비디아' },
    });
  });

  it('이미 팔로우한 태그는 그대로, 20개를 넘으면 거절한다', async () => {
    const already = setup([{ tag: '엔비디아' }]);
    await already.service.follow(7, '엔비디아');
    expect(already.prisma.tagFollow.create).not.toHaveBeenCalled();

    const full = setup(
      Array.from({ length: TAG_FOLLOW_LIMIT }, (_, i) => ({ tag: `태그${i}` })),
    );
    await expect(full.service.follow(7, '금리')).rejects.toMatchObject({
      code: 'TAG_FOLLOW_LIMIT',
    });
  });

  it('끊기는 그 사람 것만', async () => {
    const { service, prisma } = setup();
    await service.unfollow(7, '금리');
    expect(prisma.tagFollow.deleteMany).toHaveBeenCalledWith({
      where: { userId: 7, tag: '금리' },
    });
  });
});
