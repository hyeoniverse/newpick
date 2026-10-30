import { JwtService } from '@nestjs/jwt';
import { AuthService, ROTATION_GRACE_MS, hashToken } from '../auth.service';

process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';

const prismaMock = () => ({
  $transaction: jest.fn((ops: unknown[]) => Promise.all(ops)),
  user: {
    findUnique: jest.fn(),
    update: jest.fn(),
    create: jest.fn(),
  },
  oAuthToken: {
    create: jest.fn().mockResolvedValue({}),
    deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
    findUnique: jest.fn().mockResolvedValue(null),
    findFirst: jest.fn().mockResolvedValue(null),
    findMany: jest.fn().mockResolvedValue([]),
    updateMany: jest.fn().mockResolvedValue({ count: 1 }),
  },
});

const setup = () => {
  const prisma = prismaMock();
  const jwt = new JwtService({ secret: 'test-access-secret' });
  const service = new AuthService(jwt, prisma as never);
  return { prisma, jwt, service };
};

const future = () => new Date(Date.now() + 60_000);

describe('AuthService 세션', () => {
  it('로그인하면 이 기기의 세션을 해시로 저장하고, 만료된 세션만 정리한다', async () => {
    const { prisma, service } = setup();
    const token = await service.createSession(7);

    expect(prisma.oAuthToken.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ userId: 7, tokenHash: hashToken(token) }),
    });
    expect(prisma.oAuthToken.deleteMany).toHaveBeenCalledWith({
      where: { userId: 7, expiresAt: { lt: expect.any(Date) } },
    });
    // 같은 사용자의 토큰이라도 매번 다르다 (tokenHash 유일)
    expect(await service.createSession(7)).not.toBe(token);
  });

  it('지금 토큰으로 갱신하면 새 토큰으로 바꾸고 만료를 다시 30일로 미룬다', async () => {
    const { prisma, service } = setup();
    const token = await service.createSession(7);
    prisma.oAuthToken.findUnique.mockResolvedValue({
      id: 1,
      userId: 7,
      tokenHash: hashToken(token),
      expiresAt: future(),
    });

    const rotated = await service.rotateSession(token);

    expect(rotated?.userId).toBe(7);
    expect(rotated?.refreshToken).toBeDefined();
    expect(rotated?.refreshToken).not.toBe(token);
    const { data } = prisma.oAuthToken.updateMany.mock.calls[0][0];
    expect(data.tokenHash).toBe(hashToken(rotated!.refreshToken!));
    expect(data.prevHash).toBe(hashToken(token));
    expect(data.expiresAt.getTime() - Date.now()).toBeGreaterThan(
      29 * 24 * 60 * 60 * 1000,
    );
  });

  it('기기 정보가 없던 세션(이 기능 전 로그인)은 갱신할 때 브라우저 정보를 채운다', async () => {
    const { prisma, service } = setup();
    const token = await service.createSession(7);
    const row = {
      id: 1,
      userId: 7,
      tokenHash: hashToken(token),
      expiresAt: future(),
    };
    prisma.oAuthToken.findUnique.mockResolvedValue({ ...row, userAgent: null });
    await service.rotateSession(token, 'Mozilla/5.0 Safari');
    expect(prisma.oAuthToken.updateMany.mock.calls[0][0].data.userAgent).toBe(
      'Mozilla/5.0 Safari',
    );

    prisma.oAuthToken.findUnique.mockResolvedValue({
      ...row,
      userAgent: 'Chrome',
    });
    await service.rotateSession(token, 'Mozilla/5.0 Safari');
    expect(
      prisma.oAuthToken.updateMany.mock.calls[1][0].data,
    ).not.toHaveProperty('userAgent');
  });

  it('방금 바뀐 바로 전 토큰(다른 탭)은 같은 세션으로 보고 쿠키는 그대로 둔다', async () => {
    const { prisma, service } = setup();
    const token = await service.createSession(7);
    prisma.oAuthToken.findFirst.mockResolvedValue({ id: 1, userId: 7 });

    expect(await service.rotateSession(token)).toEqual({ userId: 7 });
    const { where } = prisma.oAuthToken.findFirst.mock.calls[0][0];
    expect(where.prevHash).toBe(hashToken(token));
    expect(Date.now() - where.rotatedAt.gte.getTime()).toBeLessThanOrEqual(
      ROTATION_GRACE_MS + 1000,
    );
  });

  it('동시에 두 요청이 같은 토큰으로 갱신하면 늦은 쪽은 바로 전 토큰으로 처리한다', async () => {
    const { prisma, service } = setup();
    const token = await service.createSession(7);
    prisma.oAuthToken.findUnique.mockResolvedValue({
      id: 1,
      userId: 7,
      tokenHash: hashToken(token),
      expiresAt: future(),
    });
    prisma.oAuthToken.updateMany.mockResolvedValue({ count: 0 });
    prisma.oAuthToken.findFirst.mockResolvedValue({ id: 1, userId: 7 });

    expect(await service.rotateSession(token)).toEqual({ userId: 7 });
  });

  it('모르는 토큰 · 오래전에 바뀐 토큰 · 만료된 세션 · 서명이 틀린 토큰은 거절한다', async () => {
    const { prisma, jwt, service } = setup();
    const token = await service.createSession(7);
    // 모르는(또는 60초가 지난 바로 전) 토큰: 두 조회 모두 없음
    expect(await service.rotateSession(token)).toBeNull();

    prisma.oAuthToken.findUnique.mockResolvedValue({
      id: 1,
      userId: 7,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() - 1000),
    });
    expect(await service.rotateSession(token)).toBeNull();

    const forged = jwt.sign({ sub: 7 }, { secret: 'other-secret' });
    expect(await service.rotateSession(forged)).toBeNull();
  });

  it('로그아웃은 이 기기의 세션만 지운다', async () => {
    const { prisma, service } = setup();
    await service.removeSession('a.b.c');
    expect(prisma.oAuthToken.deleteMany).toHaveBeenCalledWith({
      where: {
        OR: [
          { tokenHash: hashToken('a.b.c') },
          { prevHash: hashToken('a.b.c') },
        ],
      },
    });
    expect(await service.removeSession(undefined)).toBe(0);
  });
});

describe('AuthService 로그인한 기기', () => {
  const rows = (current: string) => [
    { id: 1, tokenHash: hashToken('other'), prevHash: null, userAgent: 'A' },
    { id: 2, tokenHash: 'x', prevHash: hashToken(current), userAgent: 'B' },
    { id: 3, tokenHash: hashToken('third'), prevHash: null, userAgent: 'C' },
  ];

  it('지금 이 기기를 current로 표시해 맨 위에 둔다 (방금 바뀐 바로 전 토큰이어도)', async () => {
    const { prisma, service } = setup();
    prisma.oAuthToken.findMany.mockResolvedValue(rows('mine'));
    const list = await service.listSessions(7, 'mine');
    expect(list.map((s) => [s.id, s.current])).toEqual([
      [2, true],
      [1, false],
      [3, false],
    ]);
    expect(list[0]).not.toHaveProperty('tokenHash');
  });

  it('다른 기기 모두 로그아웃은 이 기기만 남긴다 (prevHash가 비어 있는 세션도 지운다)', async () => {
    const { prisma, service } = setup();
    prisma.oAuthToken.findMany.mockResolvedValue(rows('mine'));
    await service.removeOtherSessions(7, 'mine');
    expect(prisma.oAuthToken.deleteMany).toHaveBeenCalledWith({
      where: { userId: 7, id: { in: [1, 3] } },
    });
  });

  it('기기 하나 로그아웃: 지금 이 기기는 지우지 않는다', async () => {
    const { prisma, service } = setup();
    prisma.oAuthToken.findMany.mockResolvedValue(rows('mine'));
    expect(await service.removeSessionById(7, 2, 'mine')).toBe(0);
    expect(prisma.oAuthToken.deleteMany).not.toHaveBeenCalled();

    prisma.oAuthToken.deleteMany.mockResolvedValue({ count: 1 });
    expect(await service.removeSessionById(7, 3, 'mine')).toBe(1);
    expect(prisma.oAuthToken.deleteMany).toHaveBeenCalledWith({
      where: { userId: 7, id: { in: [3] } },
    });
  });
});

describe('AuthService Google 로그인', () => {
  const user = { id: 3, email: 'me@example.com', googleSub: 'g-1' };

  it('Google 계정 ID로 찾는다 (이메일을 바꿨어도 같은 계정)', async () => {
    const { prisma, service } = setup();
    prisma.user.findUnique.mockResolvedValueOnce(user);
    expect(
      await service.validateOrCreateGoogleUser('g-1', 'old@gmail.com', 'n', ''),
    ).toBe(user);
    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  it('ID를 저장하기 전에 가입한 사용자는 이메일로 찾아 ID를 채운다', async () => {
    const { prisma, service } = setup();
    prisma.user.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ ...user, googleSub: null });
    prisma.user.update.mockResolvedValue(user);

    await service.validateOrCreateGoogleUser('g-1', 'me@example.com', 'n', '');
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 3 },
      data: { googleSub: 'g-1' },
    });
  });

  it('같은 이메일을 다른 Google 계정이 쓰고 있으면 로그인하지 않는다', async () => {
    const { prisma, service } = setup();
    prisma.user.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ ...user, googleSub: 'g-other' });

    expect(
      await service.validateOrCreateGoogleUser(
        'g-1',
        'me@example.com',
        'n',
        '',
      ),
    ).toBeNull();
    expect(prisma.user.update).not.toHaveBeenCalled();
    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  it('처음이면 Google 계정 ID와 함께 만든다', async () => {
    const { prisma, service } = setup();
    prisma.user.findUnique.mockResolvedValue(null);
    await service.validateOrCreateGoogleUser(
      'g-9',
      'new@example.com',
      'n',
      'p',
    );
    expect(prisma.user.create).toHaveBeenCalledWith({
      data: {
        email: 'new@example.com',
        googleSub: 'g-9',
        username: 'n',
        profileImg: 'p',
      },
    });
  });
});
