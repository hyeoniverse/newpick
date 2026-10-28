/** 방문 통계 (#131)의 순수 계산: 경로 묶기 · 유입 경로 · 기기 · 봇 · 묶음 값 거르기 */

/** 문서를 몇 칸으로 나눠 머문 시간을 세는지 (브라우저 수집기와 같음) */
export const ATTENTION_BANDS = 20;
/** 한 페이지 보기에서 받는 클릭 수 */
export const MAX_CLICKS = 100;
/** 기록 보관 (일) */
export const RETENTION_DAYS = 180;

const MAX_MS = 24 * 60 * 60 * 1000;

/** 같은 화면끼리 묶는다: 숫자 조각은 :id (/articles/detail/66 → /articles/detail/:id), 끝의 / · 쿼리는 뺀다 */
export function routeOf(path: string) {
  const clean = path.split(/[?#]/)[0].replace(/\/+$/, '') || '/';
  return clean
    .split('/')
    .map((part) => (/^\d+$/.test(part) ? ':id' : part))
    .join('/')
    .slice(0, 120);
}

/** 모으지 않는 경로: 관리자 화면 · API */
export const isIgnoredPath = (path: string) =>
  /^\/(admin|api)(\/|$)/.test(path);

const SEARCH =
  /(^|\.)(google|naver|daum|bing|duckduckgo|yahoo|ecosia|baidu|yandex)\./;
const SOCIAL =
  /(^|\.)(t\.co|twitter\.com|x\.com|facebook\.com|fb\.com|instagram\.com|threads\.net|linkedin\.com|kakao\.com|youtube\.com|reddit\.com)$/;
const EMAIL =
  /(^|\.)(mail\.google\.com|mail\.naver\.com|mail\.daum\.net|outlook\.(live|office)\.com)$/;

/**
 * 유입 경로: 메일(utm 또는 웹메일) · 검색 · SNS · 다른 사이트 · 직접 · 사이트 안 이동(첫 페이지가 아님).
 * 첫 페이지가 아니면 이전 사이트를 따지지 않는다
 */
export function channelOf(input: {
  entry: boolean;
  referrerHost?: string | null;
  utmSource?: string | null;
  utmMedium?: string | null;
}) {
  if (!input.entry) return 'internal';
  const medium = input.utmMedium?.toLowerCase() ?? '';
  const source = input.utmSource?.toLowerCase() ?? '';
  const host = input.referrerHost?.toLowerCase() ?? '';
  if (medium === 'email' || source === 'newsletter' || EMAIL.test(host))
    return 'email';
  if (/^(cpc|paid|social)$/.test(medium))
    return medium === 'social' ? 'social' : 'referral';
  if (host && SEARCH.test(host)) return 'search';
  if (host && SOCIAL.test(host)) return 'social';
  if (host) return 'referral';
  if (source) return 'referral';
  return 'direct';
}

/** 화면 너비로 기기 (사이트 화면 나눔과 같게: 모바일 ~767 · 태블릿 ~1023) */
export const deviceOf = (width: number) =>
  width < 768 ? 'mobile' : width < 1024 ? 'tablet' : 'desktop';

/** 검색 로봇 · 미리보기 · 자동화 도구 */
export const isBot = (userAgent = '') =>
  !userAgent ||
  /bot|crawl|spider|slurp|preview|facebookexternalhit|headless|lighthouse|python|curl|wget|httpclient|axios|node-fetch/i.test(
    userAgent,
  );

const ms = (value: unknown) =>
  typeof value === 'number' && Number.isFinite(value)
    ? Math.min(MAX_MS, Math.max(0, Math.round(value)))
    : 0;

/** 구역 이름(영문 · 숫자 · - · _, 60자)과 시간만, 40개까지 */
export function cleanSections(input?: Record<string, unknown>) {
  if (!input || typeof input !== 'object') return null;
  const entries = Object.entries(input)
    .filter(([key]) => /^[A-Za-z0-9_-]{1,60}$/.test(key))
    .slice(0, 40)
    .map(([key, value]) => [key, ms(value)] as const)
    .filter(([, value]) => value > 0);
  return entries.length ? Object.fromEntries(entries) : null;
}

/** 20칸 머문 시간 (모자라면 0으로 채움) */
export function cleanAttention(input?: unknown[]) {
  if (!Array.isArray(input)) return null;
  const bands = Array.from({ length: ATTENTION_BANDS }, (_, i) => ms(input[i]));
  return bands.some(Boolean) ? bands : null;
}

/** 클릭 [가로 비율, 세로 비율, 구역?] — 0~1 밖이거나 모양이 틀리면 뺀다 */
export function cleanClicks(input?: unknown[]) {
  if (!Array.isArray(input)) return null;
  const ratio = (v: unknown) =>
    typeof v === 'number' && v >= 0 && v <= 1
      ? Math.round(v * 10000) / 10000
      : null;
  const clicks = input
    .slice(0, MAX_CLICKS)
    .map((click) => {
      if (!Array.isArray(click)) return null;
      const x = ratio(click[0]);
      const y = ratio(click[1]);
      if (x === null || y === null) return null;
      const section =
        typeof click[2] === 'string' && /^[A-Za-z0-9_-]{1,60}$/.test(click[2])
          ? click[2]
          : null;
      return section ? [x, y, section] : [x, y];
    })
    .filter(Boolean);
  return clicks.length ? clicks : null;
}
