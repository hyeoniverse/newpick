import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * 메일 링크 클릭 기록 (#123 15). 메일 속 링크를 `/r/<토큰>`으로 감싸, 누르면 세고 원래 주소로 보낸다.
 * 토큰 = 링크 정보(JSON, base64url) + 서명. 서명이 맞는 링크만 보내므로 아무 주소로나 보내는 데 쓸 수 없다 (open redirect 방지).
 * 누가 눌렀는지는 넣지 않는다: 같은 메일 묶음(날짜 · 맞춤 여부)의 링크는 받는 사람이 달라도 같다
 */
export type MailLink = {
  /** 원래 주소 */
  url: string;
  /** 메일 날짜 (KST 'YYYY-MM-DD') */
  day: string;
  personal: boolean;
  kind: MailLinkKind;
};

export const MAIL_LINK_KINDS = ['newsletter', 'source', 'article'] as const;
export type MailLinkKind = (typeof MAIL_LINK_KINDS)[number];

function secret() {
  const own = process.env.MAIL_LINK_SECRET;
  if (own) return own;
  // 따로 정하지 않았으면 JWT_SECRET에서 용도를 붙여 뽑는다 (같은 값을 그대로 쓰지 않게)
  return createHmac('sha256', process.env.JWT_SECRET ?? '')
    .update('newpick:mail-link')
    .digest('hex');
}

const sign = (body: string) =>
  createHmac('sha256', secret())
    .update(`mail-link:${body}`)
    .digest('base64url');

export function createMailLinkToken(link: MailLink) {
  const body = Buffer.from(
    JSON.stringify({
      u: link.url,
      d: link.day,
      p: link.personal ? 1 : 0,
      k: link.kind,
    }),
  ).toString('base64url');
  return `${body}.${sign(body)}`;
}

/** 서명이 맞고 모양이 맞으면 링크, 아니면 null */
export function verifyMailLinkToken(token: unknown): MailLink | null {
  if (typeof token !== 'string') return null;
  const match = /^([A-Za-z0-9_-]{1,4000})\.([A-Za-z0-9_-]{43})$/.exec(token);
  if (!match) return null;
  const given = Buffer.from(match[2]);
  const expected = Buffer.from(sign(match[1]));
  if (given.length !== expected.length || !timingSafeEqual(given, expected))
    return null;
  try {
    const raw = JSON.parse(Buffer.from(match[1], 'base64url').toString()) as {
      u?: unknown;
      d?: unknown;
      p?: unknown;
      k?: unknown;
    };
    if (
      typeof raw.u !== 'string' ||
      !/^https?:\/\//.test(raw.u) ||
      typeof raw.d !== 'string' ||
      !/^\d{4}-\d{2}-\d{2}$/.test(raw.d) ||
      !MAIL_LINK_KINDS.includes(raw.k as MailLinkKind)
    )
      return null;
    return {
      url: raw.u,
      day: raw.d,
      personal: raw.p === 1,
      kind: raw.k as MailLinkKind,
    };
  } catch {
    return null;
  }
}
