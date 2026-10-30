import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomUUID } from 'node:crypto';
import { MysqlPrismaService } from 'prisma/mysql.service';
import { ACCESS_TOKEN_MAX_AGE, REFRESH_TOKEN_MAX_AGE } from './cookie-options';

/** 바로 전 refresh token을 받아 주는 시간: 여러 탭이 거의 동시에 갱신하면 늦은 쪽은 이미 바뀐 토큰을 들고 온다 */
export const ROTATION_GRACE_MS = 60 * 1000;

/** refresh token은 원문 대신 이 값만 DB에 둔다 */
export const hashToken = (token: string) =>
  createHash('sha256').update(token).digest('hex');

/** 갱신 결과. refreshToken이 없으면(바로 전 토큰으로 온 늦은 탭) 쿠키는 그대로 둔다 */
export type RotatedSession = { userId: number; refreshToken?: string };

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: MysqlPrismaService,
  ) {}

  /**
   * Google 계정 ID(sub)로 사용자를 찾는다. 이메일은 마이페이지에서 바꿀 수 있어 기준이 될 수 없다.
   * googleSub를 저장하기 전에 가입한 사용자는 이메일로 찾아 이번에 sub를 채운다.
   * 같은 이메일을 다른 Google 계정이 이미 쓰고 있으면 로그인하지 않는다 (null)
   */
  async validateOrCreateGoogleUser(
    googleSub: string,
    email: string,
    username: string,
    profileImg: string,
  ) {
    if (!googleSub || !email || !username) return null; // 유효한 사용자만 저장

    const bySub = await this.prisma.user.findUnique({ where: { googleSub } });
    if (bySub) return bySub;

    const byEmail = await this.prisma.user.findUnique({ where: { email } });
    if (byEmail) {
      if (byEmail.googleSub) return null;
      return this.prisma.user.update({
        where: { id: byEmail.id },
        data: { googleSub },
      });
    }

    return this.prisma.user.create({
      data: { email, googleSub, username, profileImg },
    });
  }

  /** 다른 Google 계정으로 바꾸기 쿠키를 확인해 바꾸는 사람의 id. 아니면 null */
  linkUserId(token: string | undefined): number | null {
    if (!token) return null;
    try {
      const payload = this.jwtService.verify<{ sub: number; purpose?: string }>(
        token,
      );
      return payload.purpose === 'google-link' ? payload.sub : null;
    } catch {
      return null;
    }
  }

  /**
   * 로그인한 계정을 다른 Google 계정으로 바꾼다: 로그인 연결(googleSub)과 이메일을 함께.
   * 주소는 Google이 확인한 것이라 인증 코드가 필요 없다. 새 Google 계정 · 그 주소를 다른 뉴픽 계정이 쓰면 바꾸지 않는다 (합치지 않음)
   */
  async linkGoogleAccount(
    userId: number,
    googleSub: string,
    email: string,
  ): Promise<
    | { status: 'linked'; oldEmail: string; email: string }
    | { status: 'same' | 'taken' | 'failed' }
  > {
    const me = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, googleSub: true },
    });
    if (!me) return { status: 'failed' };
    if (me.googleSub === googleSub) return { status: 'same' };

    const [bySub, byEmail] = await Promise.all([
      this.prisma.user.findUnique({
        where: { googleSub },
        select: { id: true },
      }),
      this.prisma.user.findUnique({ where: { email }, select: { id: true } }),
    ]);
    if ((bySub && bySub.id !== userId) || (byEmail && byEmail.id !== userId))
      return { status: 'taken' };

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { googleSub, email },
      }),
      // 받는 주소 바꾸기를 하던 중이었으면 그만둔다
      this.prisma.emailChange.deleteMany({ where: { userId } }),
    ]);
    return { status: 'linked', oldEmail: me.email, email };
  }

  async generateAccessToken(userId: number) {
    return this.jwtService.sign(
      { sub: userId },
      { expiresIn: Math.floor(ACCESS_TOKEN_MAX_AGE / 1000) },
    );
  }

  /** jti를 넣어 같은 초에 만든 토큰도 서로 달라지게 (tokenHash가 유일해야 함) */
  private signRefreshToken(userId: number) {
    return this.jwtService.sign(
      { sub: userId, jti: randomUUID() },
      {
        expiresIn: Math.floor(REFRESH_TOKEN_MAX_AGE / 1000),
        secret: process.env.JWT_REFRESH_SECRET,
      },
    );
  }

  private expiresAt() {
    return new Date(Date.now() + REFRESH_TOKEN_MAX_AGE);
  }

  /** 로그인: 이 기기의 세션을 새로 만든다. 다른 기기의 세션은 그대로, 만료된 것만 정리 */
  async createSession(userId: number, userAgent?: string) {
    const refreshToken = this.signRefreshToken(userId);
    await this.prisma.$transaction([
      this.prisma.oAuthToken.deleteMany({
        where: { userId, expiresAt: { lt: new Date() } },
      }),
      this.prisma.oAuthToken.create({
        data: {
          userId,
          tokenHash: hashToken(refreshToken),
          expiresAt: this.expiresAt(),
          userAgent: userAgent?.slice(0, 255) || null,
        },
      }),
    ]);
    return refreshToken;
  }

  /**
   * 갱신: 지금 토큰이면 새 토큰으로 바꾸고 만료를 다시 30일로 미룬다(rotation · 연장).
   * 방금(60초 안) 바뀐 바로 전 토큰이면 같은 세션으로 보고 access token만 새로 준다.
   * 그 밖(모르는 토큰 · 만료 · 서명 틀림)은 null
   */
  async rotateSession(
    refreshToken: string,
    userAgent?: string,
  ): Promise<RotatedSession | null> {
    const userId = this.verifyRefreshToken(refreshToken);
    if (!userId) return null;

    const hash = hashToken(refreshToken);
    const now = new Date();
    const current = await this.prisma.oAuthToken.findUnique({
      where: { tokenHash: hash },
    });
    if (current) {
      if (current.userId !== userId || current.expiresAt < now) return null;
      const next = this.signRefreshToken(userId);
      // 다른 요청이 먼저 바꿨으면 0건: 그 경우는 아래 '바로 전 토큰'으로 처리
      const { count } = await this.prisma.oAuthToken.updateMany({
        where: { id: current.id, tokenHash: hash },
        data: {
          tokenHash: hashToken(next),
          prevHash: hash,
          rotatedAt: now,
          lastUsedAt: now,
          expiresAt: this.expiresAt(),
          // 기기 정보가 없던 세션(이 기능 전에 로그인)은 이번 브라우저로 채운다
          ...(!current.userAgent &&
            userAgent && { userAgent: userAgent.slice(0, 255) }),
        },
      });
      if (count === 1) return { userId, refreshToken: next };
    }

    const rotated = await this.prisma.oAuthToken.findFirst({
      where: {
        prevHash: hash,
        userId,
        rotatedAt: { gte: new Date(now.getTime() - ROTATION_GRACE_MS) },
        expiresAt: { gt: now },
      },
    });
    return rotated ? { userId } : null;
  }

  /** 로그아웃: 이 기기의 세션만 지운다 (지금 토큰이든 방금 바뀐 바로 전 토큰이든) */
  async removeSession(refreshToken: string | undefined) {
    if (!refreshToken) return 0;
    const hash = hashToken(refreshToken);
    const { count } = await this.prisma.oAuthToken.deleteMany({
      where: { OR: [{ tokenHash: hash }, { prevHash: hash }] },
    });
    return count;
  }

  /** 마이페이지 '로그인한 기기': 만료 안 된 세션, 최근에 쓴 순. 지금 이 기기는 current */
  async listSessions(userId: number, currentToken?: string) {
    const current = currentToken ? hashToken(currentToken) : null;
    const sessions = await this.prisma.oAuthToken.findMany({
      where: { userId, expiresAt: { gt: new Date() } },
      orderBy: { lastUsedAt: 'desc' },
      select: {
        id: true,
        tokenHash: true,
        prevHash: true,
        userAgent: true,
        createdAt: true,
        lastUsedAt: true,
      },
    });
    return sessions
      .map(({ tokenHash, prevHash, ...session }) => ({
        ...session,
        current: !!current && (tokenHash === current || prevHash === current),
      }))
      .sort((a, b) => Number(b.current) - Number(a.current));
  }

  /** 다른 기기 하나 로그아웃 (내 세션만. 지금 이 기기는 로그아웃 버튼으로) */
  async removeSessionById(userId: number, id: number, currentToken?: string) {
    return this.removeSessions(
      userId,
      currentToken,
      (session) => session.id === id,
    );
  }

  /** 이 기기만 남기고 모두 로그아웃 */
  async removeOtherSessions(userId: number, currentToken?: string) {
    return this.removeSessions(userId, currentToken, () => true);
  }

  /** 지금 이 기기를 뺀 내 세션 가운데 pick에 맞는 것을 지운다 (prevHash가 비어 있을 수 있어 SQL NOT 대신 고른 id로) */
  private async removeSessions(
    userId: number,
    currentToken: string | undefined,
    pick: (session: { id: number }) => boolean,
  ) {
    const current = currentToken ? hashToken(currentToken) : null;
    const sessions = await this.prisma.oAuthToken.findMany({
      where: { userId },
      select: { id: true, tokenHash: true, prevHash: true },
    });
    const ids = sessions
      .filter((s) => s.tokenHash !== current && s.prevHash !== current)
      .filter(pick)
      .map((s) => s.id);
    if (!ids.length) return 0;
    const { count } = await this.prisma.oAuthToken.deleteMany({
      where: { userId, id: { in: ids } },
    });
    return count;
  }

  /** 서명 · 만료가 맞으면 userId, 아니면 null */
  private verifyRefreshToken(refreshToken: string): number | null {
    try {
      const decoded = this.jwtService.verify<{ sub: number }>(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      });
      return decoded?.sub || null;
    } catch {
      return null;
    }
  }
}
