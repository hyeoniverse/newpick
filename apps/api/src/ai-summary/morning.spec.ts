import { renderNewsletterHtml } from './newsletterHtml';
import { isMorning, prepare } from './articlePrep';
import {
  describeClusters,
  LIMITS,
  MIN_TOTAL,
  normalize,
  selectPrompt,
  splitPicks,
  WRITER_SCHEMA,
  writerPrompt,
} from './newsletterWriter.service';
import { parseNewsletterHtml } from '../edition/parse';
import { composeEdition } from '../edition/compose';
import { renderEditionMail } from '../edition/mail';

const MORNING_SINCE = '2026-11-06 05:00:00';

const article = (title: string, publishedAt: string) => ({
  title,
  content: `${title} 본문`,
  source: 'KBS',
  publishedAt,
});

const story = (heading: string) => ({
  template: 'brief' as const,
  kicker: '',
  heading,
  lead: `${heading} 리드`,
  body: `${heading} 본문`,
  analysis: '',
  stats: [],
  timeline: [],
  qa: [],
  quote: { text: '', by: '' },
  debate: [],
  sources: [1],
  imageQuery: '',
});

const score = (n: number, point: number) => ({
  n,
  impact: point,
  novelty: point,
  relevance: point,
  followup: point,
  excluded: false,
  repeat: false,
  reason: '',
});

describe('오늘 아침 속보 (05시 이후 보도는 뉴스레터 맨 위에 따로)', () => {
  const prepared = prepare(
    [
      article('어젯밤 소식', '2026-11-05 22:10:00'),
      article('아침 속보 A', '2026-11-06 06:30:00'),
      article('아침 속보 B', '2026-11-06 07:50:00'),
      article('어제 낮 소식', '2026-11-05 14:00:00'),
    ],
    MORNING_SINCE,
  );
  const clusters = prepared.map((a) => ({ articles: [a] }));

  it('보도 시각이 기준 이후인 기사만 아침으로 표시한다 (기준이 없으면 표시하지 않음)', () => {
    expect(prepared.map((a) => !!a.morning)).toEqual([
      false,
      true,
      true,
      false,
    ]);
    expect(
      prepare([article('x', '2026-11-06 07:00:00')]).map((a) => a.morning),
    ).toEqual([undefined]);
    expect(isMorning({ articles: [prepared[0], prepared[1]] })).toBe(true);
  });

  it('고르기: 아침 묶음은 주요한 것만 최대 개수까지 따로, 나머지는 지금처럼', () => {
    const picks = splitPicks(clusters, [
      score(1, 4),
      score(2, 5),
      score(3, 2),
      score(4, 4),
    ]);
    expect(picks).toEqual({ morning: [2], stories: [1, 4] });
    expect(LIMITS.morning.max).toBe(2);
    expect(MIN_TOTAL).toBe(13);
  });

  it('고르기: 아침 묶음뿐이거나 하나도 없으면 예전처럼 본문 소식으로만', () => {
    const only = clusters.slice(1, 3);
    expect(splitPicks(only, [score(1, 5), score(2, 4)])).toEqual({
      morning: [],
      stories: [1, 2],
    });
    const none = [clusters[0], clusters[3]];
    expect(splitPicks(none, [score(1, 5), score(2, 2)])).toEqual({
      morning: [],
      stories: [1],
    });
  });

  it('프롬프트: 고르기에는 [오늘 아침] 표시와 설명, 쓰기에는 속보 기사 번호와 morning 항목', () => {
    expect(describeClusters(clusters)).toContain('[2] [오늘 아침] 보도 1건');
    expect(selectPrompt(clusters)).toContain("'오늘 아침 속보'에 최대 2개");
    const prompt = writerPrompt([prepared[0]], undefined, [], [], new Date(), [
      prepared[1],
    ]);
    expect(prompt).toContain('기사 1건(2~2번)은 오늘 아침');
    expect(prompt).toContain('- morning: 오늘 아침 속보 1개');
    expect(prompt).toContain('kicker · heading · lead · body');
    expect(writerPrompt([prepared[0]])).toContain('- morning: 빈 배열');
    expect((WRITER_SCHEMA.required as string[]).includes('morning')).toBe(true);
  });

  it('스키마: 아침 속보는 brief 칸만 받는다 (본문 소식 스키마를 두 번 넣으면 문법 한도를 넘는다)', () => {
    const props = WRITER_SCHEMA.properties as unknown as Record<
      string,
      { items: { properties: object } }
    >;
    const morning = Object.keys(props.morning.items.properties);
    expect(morning).toEqual([
      'kicker',
      'heading',
      'lead',
      'body',
      'next',
      'tags',
      'sources',
      'imageQuery',
    ]);
    expect(Object.keys(props.stories.items.properties)).toContain('stats');
    // 스키마 전체 크기: 본문 소식 스키마를 두 번 넣던 때보다 작다
    expect(JSON.stringify(WRITER_SCHEMA).length).toBeLessThan(
      2 * JSON.stringify(props.stories.items).length + 600,
    );
  });

  it('정리: brief 칸만 온 아침 속보도 소식 모양으로 채운다', () => {
    const written = normalize(
      {
        title: '제목',
        subtitle: '',
        summary: '요약',
        briefing: '',
        stories: [story('어젯밤 소식')],
        morning: [
          {
            kicker: '속보',
            heading: '아침 속보 B',
            lead: '리드',
            body: '본문',
            next: '다음',
            tags: ['태그'],
            sources: [2],
            imageQuery: 'q',
          } as never,
        ],
        watch: [],
        keywords: [],
      },
      (n) => n,
    );
    expect(written.morning![0]).toMatchObject({
      template: 'brief',
      heading: '아침 속보 B',
      analysis: '',
      stats: [],
      qa: [],
      quote: { text: '', by: '' },
      sources: [2],
    });
  });

  it('정리 · HTML · 파싱 · 메일: 별도 소식으로 맨 위 묶음에, 번호는 아침부터, 메일 맨 위 상자', () => {
    const written = normalize(
      {
        title: '제목',
        subtitle: '',
        summary: '요약',
        briefing: '',
        stories: [story('어젯밤 소식')],
        morning: [
          {
            ...story(' "아침 속보 A" '),
            template: 'analysis',
            analysis: '시사점은 비운다',
            next: '다음 발표',
            sources: [2, 2],
          },
          { ...story(''), sources: [] },
        ],
        watch: [],
        keywords: [],
      },
      (n) => n,
    );
    expect(written.morning).toHaveLength(1);
    expect(written.morning![0]).toMatchObject({
      heading: '아침 속보 A',
      template: 'brief',
      analysis: '',
      next: '다음 발표',
      sources: [2],
    });
    // 관전 포인트 모음도 아침 속보부터
    expect(written.watch).toEqual(['다음 발표']);

    const html = renderNewsletterHtml(written, [
      { source: 'KBS', link: 'https://n.news/1' },
      { source: '연합뉴스', link: 'https://n.news/2' },
    ]);
    expect(html).toContain(
      '<div class="newsletter"><section class="morning"><h3>오늘 아침 속보</h3><article class="story story-brief"><p class="kicker"><span class="index">01</span>',
    );
    // 본문 소식은 아침 다음 번호
    expect(html).toContain('<span class="index">02</span>');
    expect(html).not.toContain('<section class="watch">');

    const parsed = parseNewsletterHtml(html);
    expect(parsed.morning.map((s) => s.heading)).toEqual(['아침 속보 A']);
    expect(parsed.stories.map((s) => s.heading)).toEqual(['어젯밤 소식']);
    expect(parsed.morning[0].sources).toEqual([
      { text: '연합뉴스', url: 'https://n.news/2' },
    ]);
    expect(parsed.watch).toEqual(['다음 발표']);

    const edition = composeEdition(
      [
        {
          newsletterId: 10,
          categoryId: 1,
          category: 'IT',
          title: '제목',
          subtitle: '',
          summary: '요약',
          stories: parsed.stories,
          watch: parsed.watch,
          morning: parsed.morning,
        },
      ],
      null,
      [1],
      new Date('2026-11-06T08:40:00+09:00'),
    )!;
    expect(edition.morning).toEqual([
      {
        heading: '아침 속보 A',
        line: '"아침 속보 A" 리드',
        category: 'IT',
        newsletterId: 10,
      },
    ]);
    // 오늘을 한눈에 · 분야 칸은 본문 소식만
    expect(edition.top.map((t) => t.heading)).toEqual(['어젯밤 소식']);
    const mail = renderEditionMail(edition, 'https://newpick.example');
    expect(mail.indexOf('오늘 아침 속보')).toBeLessThan(
      mail.indexOf('오늘을 한눈에'),
    );
    expect(mail).toContain('/articles/detail/10?utm_source=newsletter');
  });

  it('아침 속보가 없으면 상자 · 카드 모두 없다', () => {
    const html = renderNewsletterHtml(
      { briefing: '', stories: [story('소식')], watch: [] },
      [],
    );
    expect(html).not.toContain('class="morning"');
    expect(parseNewsletterHtml(html).morning).toEqual([]);
  });
});
