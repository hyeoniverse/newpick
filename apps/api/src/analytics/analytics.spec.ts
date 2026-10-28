import {
  channelOf,
  cleanAttention,
  cleanClicks,
  cleanSections,
  deviceOf,
  isBot,
  isIgnoredPath,
  routeOf,
} from './analytics';

describe('방문 통계 계산 (#131)', () => {
  it('같은 화면끼리 묶는다 (숫자 조각 · 끝 / · 쿼리)', () => {
    expect(routeOf('/articles/detail/66?utm_source=newsletter')).toBe(
      '/articles/detail/:id',
    );
    expect(routeOf('/articles/')).toBe('/articles');
    expect(routeOf('/')).toBe('/');
  });

  it('관리자 화면 · API는 모으지 않는다', () => {
    expect(isIgnoredPath('/admin')).toBe(true);
    expect(isIgnoredPath('/admin/stats')).toBe(true);
    expect(isIgnoredPath('/administrator-guide')).toBe(false);
    expect(isIgnoredPath('/articles')).toBe(false);
  });

  it.each([
    [{ entry: true }, 'direct'],
    [{ entry: false, referrerHost: 'www.google.com' }, 'internal'],
    [{ entry: true, referrerHost: 'www.google.com' }, 'search'],
    [{ entry: true, referrerHost: 'm.search.naver.com' }, 'search'],
    [{ entry: true, referrerHost: 't.co' }, 'social'],
    [{ entry: true, referrerHost: 'hyeoniverse.com' }, 'referral'],
    [{ entry: true, utmSource: 'newsletter', utmMedium: 'email' }, 'email'],
    [{ entry: true, referrerHost: 'mail.google.com' }, 'email'],
  ])('유입 경로 %o → %s', (input, channel) => {
    expect(channelOf(input)).toBe(channel);
  });

  it('화면 너비로 기기를 나눈다', () => {
    expect([390, 800, 1280].map(deviceOf)).toEqual([
      'mobile',
      'tablet',
      'desktop',
    ]);
  });

  it('로봇 · 자동화 도구 · 빈 브라우저 정보는 거른다', () => {
    expect(isBot('Mozilla/5.0 (compatible; Googlebot/2.1)')).toBe(true);
    expect(isBot('Mozilla/5.0 HeadlessChrome/120')).toBe(true);
    expect(isBot('')).toBe(true);
    expect(
      isBot('Mozilla/5.0 (Macintosh) AppleWebKit/605.1.15 Safari/605.1.15'),
    ).toBe(false);
  });

  it('묶음 값은 모양 · 범위를 맞추고 이상한 값은 버린다', () => {
    expect(
      cleanSections({
        briefing: 1200.4,
        'story-1': -5,
        'bad name': 9,
        '<x>': 1,
      }),
    ).toEqual({
      briefing: 1200,
    });
    expect(cleanAttention([1000, 'x', -1])).toEqual([
      1000,
      ...Array(19).fill(0),
    ]);
    expect(cleanAttention([0, 0])).toBeNull();
    expect(
      cleanClicks([
        [0.5, 0.25, 'story-1'],
        [2, 0.1],
        'x',
        [0.1, 0.2, '<script>'],
      ]),
    ).toEqual([
      [0.5, 0.25, 'story-1'],
      [0.1, 0.2],
    ]);
    expect(
      cleanClicks(Array.from({ length: 300 }, () => [0.1, 0.1])),
    ).toHaveLength(100);
  });
});
