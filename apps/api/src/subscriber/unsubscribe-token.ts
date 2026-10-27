import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * 원클릭 구독 해지 토큰 (#18). 메일마다 넣어 로그인 없이 해지할 수 있게 한다.
 * 모양: `<회원 id>.<서명>`. 서명은 회원 id를 비밀 값으로 HMAC-SHA256 한 것이라 다른 회원 것으로 바꿀 수 없다.
 * 만료는 두지 않는다 (몇 달 전 메일의 수신 거부도 동작해야 한다). 비밀 값을 바꾸면 이전 메일의 링크는 모두 무효
 */
function secret() {
  const own = process.env.UNSUBSCRIBE_SECRET;
  if (own) return own;
  // 따로 정하지 않았으면 JWT_SECRET에서 용도를 붙여 뽑는다 (같은 값을 그대로 쓰지 않게)
  return createHmac('sha256', process.env.JWT_SECRET ?? '')
    .update('newpick:unsubscribe')
    .digest('hex');
}

const sign = (userId: number) =>
  createHmac('sha256', secret())
    .update(`unsubscribe:${userId}`)
    .digest('base64url');

export function createUnsubscribeToken(userId: number) {
  return `${userId}.${sign(userId)}`;
}

/** 맞으면 회원 id, 아니면 null */
export function verifyUnsubscribeToken(token: unknown): number | null {
  if (typeof token !== 'string') return null;
  const match = /^(\d{1,10})\.([A-Za-z0-9_-]{43})$/.exec(token);
  if (!match) return null;
  const userId = Number(match[1]);
  const given = Buffer.from(match[2]);
  const expected = Buffer.from(sign(userId));
  return given.length === expected.length && timingSafeEqual(given, expected)
    ? userId
    : null;
}
