import { Logger } from '@nestjs/common';
import { maskEmail, SubscriberService } from './subscriber.service';

/** Prisma 호출을 기록만 하는 가짜 클라이언트. $transaction에 넘어온 작업 목록을 확인합니다. */
function fakePrisma(user: unknown, categoryIds: number[] = [1, 2, 3]) {
  const op = (name: string) =>
    jest.fn((args) => ({ op: name, args }) as unknown);
  return {
    user: { findUnique: jest.fn().mockResolvedValue(user) },
    newsCategory: {
      findMany: jest.fn(({ where }) =>
        Promise.resolve(
          where.id.in
            .filter((id: number) => categoryIds.includes(id))
            .map((id: number) => ({ id })),
        ),
      ),
    },
    subscriber: {
      findFirst: jest.fn(),
      create: op('subscriber.create'),
      update: op('subscriber.update'),
    },
    userInterest: {
      deleteMany: op('userInterest.deleteMany'),
      createMany: op('userInterest.createMany'),
    },
    bookmark: { deleteMany: op('bookmark.deleteMany') },
    $transaction: jest.fn((ops: unknown[]) => Promise.resolve(ops)),
  };
}

const serviceWith = (prisma: ReturnType<typeof fakePrisma>) =>
  new SubscriberService(new Logger(), prisma as never);

describe('SubscriberService.startSubscription', () => {
  it('이미 구독 중이면 409를 던지고 관심사를 바꾸지 않는다', async () => {
    const prisma = fakePrisma({
      id: 1,
      subscribers: [{ id: 10, status: 'active' }],
    });
    await expect(
      serviceWith(prisma).startSubscription(1, [2, 3]),
    ).rejects.toMatchObject({ code: 'ALREADY_SUBSCRIBED', status: 409 });
    expect(prisma.userInterest.deleteMany).not.toHaveBeenCalled();
    expect(prisma.userInterest.createMany).not.toHaveBeenCalled();
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('존재하지 않는 카테고리가 있으면 400을 던지고 아무것도 쓰지 않는다', async () => {
    const prisma = fakePrisma({ id: 1, subscribers: [] });
    await expect(
      serviceWith(prisma).startSubscription(1, [1, 99]),
    ).rejects.toMatchObject({ code: 'INVALID_INTERESTS', status: 400 });
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('관심사 교체와 구독 생성을 한 트랜잭션으로 처리한다 (중복 id는 한 번만)', async () => {
    const prisma = fakePrisma({ id: 1, subscribers: [] });
    await serviceWith(prisma).startSubscription(1, [2, 2, 3]);

    const ops = prisma.$transaction.mock.calls[0][0].map(
      (o: { op: string }) => o.op,
    );
    expect(ops).toEqual([
      'userInterest.deleteMany',
      'userInterest.createMany',
      'subscriber.create',
    ]);
    expect(prisma.userInterest.createMany).toHaveBeenCalledWith({
      data: [
        { userId: 1, categoryId: 2 },
        { userId: 1, categoryId: 3 },
      ],
    });
  });

  it('해지했던 구독은 새로 만들지 않고 다시 활성화한다', async () => {
    const prisma = fakePrisma({
      id: 1,
      subscribers: [{ id: 10, status: 'cancelled' }],
    });
    await serviceWith(prisma).startSubscription(1, [1]);
    expect(prisma.subscriber.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 10 },
        data: expect.objectContaining({ status: 'active', endAt: null }),
      }),
    );
    expect(prisma.subscriber.create).not.toHaveBeenCalled();
  });
});

describe('SubscriberService.cancelSubscription', () => {
  it('관심사 삭제와 상태 변경을 한 트랜잭션으로 처리하고 북마크는 건드리지 않는다', async () => {
    const prisma = fakePrisma({ id: 1 });
    prisma.subscriber.findFirst.mockResolvedValue({ id: 10, status: 'active' });

    await serviceWith(prisma).cancelSubscription(1);

    const ops = prisma.$transaction.mock.calls[0][0].map(
      (o: { op: string }) => o.op,
    );
    expect(ops).toEqual(['userInterest.deleteMany', 'subscriber.update']);
    expect(prisma.bookmark.deleteMany).not.toHaveBeenCalled();
  });
});

describe('원클릭 해지 (#18)', () => {
  it('구독 중이면 해지한다 (관심사 비우기 · 상태 cancelled)', async () => {
    const prisma = fakePrisma(null);
    prisma.subscriber.findFirst.mockResolvedValue({ id: 10, status: 'active' });
    const result = await serviceWith(prisma).unsubscribeOneClick(22);
    expect(result).toEqual({ unsubscribed: true });
    const ops = (
      prisma.$transaction.mock.calls[0][0] as {
        op: string;
        args: { data?: unknown };
      }[]
    ).map((o) => o.op);
    expect(ops).toEqual(['userInterest.deleteMany', 'subscriber.update']);
  });

  it('이미 해지했거나 구독한 적이 없으면 그대로 두고 오류도 내지 않는다 (여러 번 눌러도 같음)', async () => {
    const prisma = fakePrisma(null);
    prisma.subscriber.findFirst.mockResolvedValue(null);
    await expect(serviceWith(prisma).unsubscribeOneClick(22)).resolves.toEqual({
      unsubscribed: false,
    });
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('확인 화면의 메일 주소는 앞 두 글자만 보인다', () => {
    expect(maskEmail('hyeoniverse.dev@gmail.com')).toBe(
      'hy*************@gmail.com',
    );
    expect(maskEmail('ab@x.com')).toBe('ab***@x.com');
    expect(maskEmail('broken')).toBe('***');
  });
});
