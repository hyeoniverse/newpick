import {
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AdminGuard } from '../guards/admin.guard';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { Public } from '../decorators/auth.decorators';

class Routes {
  @Public()
  open() {}
  closed() {}
}

function contextFor(handler: () => void, user?: { id: number }) {
  return {
    getHandler: () => handler,
    getClass: () => Routes,
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  } as unknown as ExecutionContext;
}

describe('JwtAuthGuard', () => {
  const guard = new JwtAuthGuard(new Reflector());

  it('@Public 라우트는 토큰 없이 통과한다', () => {
    expect(guard.canActivate(contextFor(Routes.prototype.open))).toBe(true);
  });

  it('그 외 라우트는 passport JWT 검증으로 넘긴다', () => {
    const passport = jest
      .spyOn(Object.getPrototypeOf(JwtAuthGuard.prototype), 'canActivate')
      .mockReturnValue(false);
    expect(guard.canActivate(contextFor(Routes.prototype.closed))).toBe(false);
    expect(passport).toHaveBeenCalled();
    passport.mockRestore();
  });
});

describe('AdminGuard', () => {
  const findUnique = jest.fn();
  const guard = new AdminGuard({ user: { findUnique } } as never);

  beforeEach(() => findUnique.mockReset());

  it('로그인 정보가 없으면 401', async () => {
    await expect(
      guard.canActivate(contextFor(Routes.prototype.closed)),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(findUnique).not.toHaveBeenCalled();
  });

  it('DB의 role이 admin이 아니면 403', async () => {
    findUnique.mockResolvedValue({ role: 'user' });
    await expect(
      guard.canActivate(contextFor(Routes.prototype.closed, { id: 1 })),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('DB에 없는 사용자도 403', async () => {
    findUnique.mockResolvedValue(null);
    await expect(
      guard.canActivate(contextFor(Routes.prototype.closed, { id: 1 })),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('DB의 role이 admin이면 통과한다', async () => {
    findUnique.mockResolvedValue({ role: 'admin' });
    await expect(
      guard.canActivate(contextFor(Routes.prototype.closed, { id: 1 })),
    ).resolves.toBe(true);
    expect(findUnique).toHaveBeenCalledWith({
      where: { id: 1 },
      select: { role: true },
    });
  });
});
