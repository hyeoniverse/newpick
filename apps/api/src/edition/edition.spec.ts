import { renderNewsletterHtml } from '../ai-summary/newsletterHtml';
import type { Story } from '../ai-summary/newsletterWriter.service';
import { parseNewsletterHtml, ParsedStory } from './parse';
import { editorPrompt, normalizeEditorial, Editorial } from './editor';
import { composeEdition, EditionNewsletter } from './compose';
import { renderEditionMail } from './mail';
import { EditionService } from './edition.service';

const story = (overrides: Partial<Story> = {}): Story => ({
  template: 'analysis',
  kicker: '증시',
  heading: '코스피 7개월 만에 최저',
  lead: '외국인 매도가 이어졌다',
  body: '첫 문단 ==핵심 구절== 이다\n\n둘째 문단',
  analysis: '시사점 문단',
  stats: [],
  timeline: [],
  qa: [],
  quote: { text: '', by: '' },
  sources: [1, 2],
  imageQuery: '',
  ...overrides,
});

const html = (stories: Story[], watch = ['FOMC 결과']) =>
  renderNewsletterHtml({ briefing: '브리핑', stories, watch }, [
    { source: 'KBS', link: 'https://news.kbs.co.kr/1' },
    { source: '연합뉴스' },
  ]);

const parsed = (heading: string, lead = `${heading} 리드`): ParsedStory => ({
  kicker: '',
  heading,
  lead,
  blocks: [{ type: 'body', paragraphs: [[{ text: `${heading} 본문` }]] }],
  sources: [],
});

const source = (
  newsletterId: number,
  categoryId: number,
  category: string,
  headings: string[],
  watch: string[] = [],
): EditionNewsletter => ({
  newsletterId,
  categoryId,
  category,
  title: `${category} 제목`,
  subtitle: `${category} 부제`,
  summary: `${category} 요약`,
  stories: headings.map((h) => parsed(h)),
  watch,
});

const DATE = new Date('2026-10-27T09:00:00+09:00');

describe('저장된 본문 HTML 다시 읽기 (#55)', () => {
  it('렌더링한 HTML에서 소식 구조·강조·출처·관전 포인트를 그대로 읽는다', () => {
    const result = parseNewsletterHtml(
      html([
        story({
          image: {
            url: 'https://img.example.com/a.jpg',
            alt: '사진',
            credit: 'KBS',
            creditUrl: 'https://news.kbs.co.kr/1',
            provider: 'article',
          },
        }),
      ]),
    );
    expect(result.briefing).toBe('브리핑');
    expect(result.watch).toEqual(['FOMC 결과']);
    const [s] = result.stories;
    expect(s).toMatchObject({
      kicker: '증시',
      heading: '코스피 7개월 만에 최저',
      lead: '외국인 매도가 이어졌다',
      image: { url: 'https://img.example.com/a.jpg', alt: '사진' },
      sources: [
        { text: 'KBS', url: 'https://news.kbs.co.kr/1' },
        { text: '연합뉴스' },
      ],
    });
    expect(s.blocks[0]).toEqual({
      type: 'body',
      paragraphs: [
        [
          { text: '첫 문단 ' },
          { text: '핵심 구절', mark: true },
          { text: ' 이다' },
        ],
        [{ text: '둘째 문단' }],
      ],
    });
    expect(s.blocks[1]).toMatchObject({ type: 'analysis', label: '시사점' });
  });

  it('템플릿별 요소(지표·경과·문답·인용)도 읽는다', () => {
    const [numbers, timeline, qa, quote] = parseNewsletterHtml(
      html([
        story({
          template: 'numbers',
          stats: [
            { label: '코스피', value: '5469.47', note: '-2.1%' },
            { label: '환율', value: '1,410원', note: '' },
          ],
        }),
        story({
          template: 'timeline',
          timeline: [
            { when: '10월 1일', what: '고발' },
            { when: '10월 20일', what: '압수수색' },
            { when: '10월 26일', what: '소환' },
          ],
        }),
        story({
          template: 'qa',
          qa: [{ q: '무엇이 바뀌나', a: '==세율== 인상' }],
        }),
        story({
          template: 'quote',
          quote: { text: '멈추지 않는다', by: '장관' },
        }),
      ]),
    ).stories;
    expect(numbers.blocks[0]).toEqual({
      type: 'stats',
      rows: [
        { label: '코스피', value: '5469.47', note: '-2.1%' },
        { label: '환율', value: '1,410원', note: '' },
      ],
    });
    expect(timeline.blocks[0]).toMatchObject({ type: 'timeline' });
    expect(timeline.blocks.find((b) => b.type === 'analysis')).toMatchObject({
      label: '전망',
    });
    expect(qa.blocks[1]).toEqual({
      type: 'qa',
      rows: [
        {
          q: '무엇이 바뀌나',
          a: [{ text: '세율', mark: true }, { text: ' 인상' }],
        },
      ],
    });
    expect(quote.blocks[0]).toEqual({
      type: 'quote',
      text: '멈추지 않는다',
      by: '장관',
    });
  });

  it('구조가 없는 예전 뉴스레터는 빈 소식', () => {
    expect(parseNewsletterHtml('<div style="color:red">옛날 글</div>')).toEqual(
      { briefing: '', stories: [], watch: [] },
    );
    expect(parseNewsletterHtml(null).stories).toEqual([]);
  });
});

describe('하루 한 번 편집 (#55)', () => {
  const sources = [
    source(10, 1, 'IT', ['반도체 수출 규제']),
    source(20, 3, '경제', ['코스피 급락', '환율 상승']),
  ];
  const categoryOf = (ref: string) =>
    ({ '10-1': 1, '20-1': 3, '20-2': 3 })[ref];

  it('전 분야 소식을 번호와 함께 한 번에 보낸다', () => {
    const prompt = editorPrompt(sources);
    expect(prompt).toContain('[10-1] (IT) 반도체 수출 규제');
    expect(prompt).toContain('[20-2] (경제) 환율 상승');
    expect(prompt).toContain('본문: 코스피 급락 본문');
  });

  it('없는 번호는 버리고, 중요도는 1~5, 흐름은 두 분야 이상일 때만', () => {
    const editorial = normalizeEditorial(
      {
        ranking: [
          { ref: '10-1', importance: 9, line: ' 한 줄 ' },
          { ref: '99-1', importance: 3, line: '없는 소식' },
          { ref: '20-1', importance: 0, line: '코스피' },
        ],
        duplicates: [
          ['10-1', '99-1'],
          ['20-1', '10-1', '20-1'],
        ],
        threads: [
          { refs: ['10-1', '20-1'], title: '규제가 증시로', text: '이어진다' },
          { refs: ['20-1', '20-2'], title: '같은 분야', text: '빼야 한다' },
        ],
      },
      categoryOf,
    );
    expect(editorial.ranking).toEqual({
      '10-1': { importance: 5, line: '한 줄' },
      '20-1': { importance: 1, line: '코스피' },
    });
    expect(editorial.duplicates).toEqual([['20-1', '10-1']]);
    expect(editorial.threads.map((t) => t.title)).toEqual(['규제가 증시로']);
  });
});

describe('구독자별로 엮기 (#55)', () => {
  const sources = [
    source(10, 1, 'IT', ['반도체 수출 규제', 'AI 기본법'], ['규제 시행일']),
    source(
      20,
      3,
      '경제',
      ['코스피 급락', '반도체주 하락'],
      ['FOMC', '규제 시행일'],
    ),
    source(30, 6, '세계', ['미 대선'], ['개표']),
  ];
  const editorial: Editorial = {
    ranking: {
      '10-1': { importance: 4, line: '규제 한 줄' },
      '10-2': { importance: 2, line: 'AI 한 줄' },
      '20-1': { importance: 5, line: '코스피 한 줄' },
      '20-2': { importance: 3, line: '반도체주 한 줄' },
      '30-1': { importance: 4, line: '대선 한 줄' },
    },
    duplicates: [['10-1', '20-2']],
    threads: [
      { refs: ['10-1', '20-1'], title: '규제가 증시로', text: '이어진다' },
      { refs: ['20-1', '30-1'], title: '대선과 증시', text: '이어진다' },
    ],
  };

  it('고른 분야 전체에서 중요도 순으로, 같은 사건은 한 번만', () => {
    const edition = composeEdition(sources, editorial, [1, 3], DATE)!;
    expect(edition.subject).toBe('10월 27일 뉴픽 · 코스피 급락');
    expect(edition.top.map((t) => [t.category, t.line])).toEqual([
      ['경제', '코스피 한 줄'],
      ['IT', '규제 한 줄'],
      ['IT', 'AI 한 줄'],
    ]);
    // 섹션은 가장 중요한 소식이 높은 분야부터, 같은 사건은 중요도가 높은 IT 쪽에만
    expect(edition.sections.map((s) => s.category)).toEqual(['경제', 'IT']);
    expect(edition.sections[0].stories.map((s) => s.ref)).toEqual(['20-1']);
    expect(edition.sections[1].stories[0]).toMatchObject({
      ref: '10-1',
      alsoIn: ['경제'],
    });
  });

  it('흐름은 이어지는 분야를 모두 고른 구독자에게만', () => {
    expect(composeEdition(sources, editorial, [1, 3], DATE)!.threads).toEqual([
      { title: '규제가 증시로', text: '이어진다', categories: ['IT', '경제'] },
    ]);
    expect(composeEdition(sources, editorial, [1], DATE)!.threads).toEqual([]);
  });

  it('관전 포인트는 분야마다 돌아가며 하나씩, 중복 제거', () => {
    expect(composeEdition(sources, editorial, [1, 3, 6], DATE)!.watch).toEqual([
      'FOMC',
      '규제 시행일',
      '개표',
    ]);
  });

  it('편집이 없으면 분야 순서·소식 순서로 엮고 흐름은 뺀다', () => {
    const edition = composeEdition(sources, null, [1, 3], DATE)!;
    expect(edition.top.map((t) => t.heading)).toEqual([
      '반도체 수출 규제',
      '코스피 급락',
      'AI 기본법',
      '반도체주 하락',
    ]);
    expect(edition.top[0].line).toBe('반도체 수출 규제 리드');
    expect(edition.threads).toEqual([]);
  });

  it('구조가 없는 예전 뉴스레터는 제목·부제·요약으로', () => {
    const old = { ...source(40, 2, '정치', []), stories: [] };
    const edition = composeEdition([old], null, [2], DATE)!;
    expect(edition.top[0]).toMatchObject({
      heading: '정치 제목',
      line: '정치 부제',
    });
    expect(edition.sections[0].fallback).toEqual({
      subtitle: '정치 부제',
      summary: '정치 요약',
    });
  });

  it('고른 분야 소식이 없으면 null (보내지 않음)', () => {
    expect(composeEdition(sources, editorial, [5], DATE)).toBeNull();
  });
});

describe('메일 HTML (#55)', () => {
  const full = parseNewsletterHtml(
    html([
      story({
        heading: '<script>alert(1)</script>',
        image: {
          url: 'https://img.example.com/a.jpg',
          alt: '사진',
          credit: '작가',
          creditUrl: 'javascript:alert(1)',
          provider: 'pexels',
          providerUrl: 'https://www.pexels.com',
        },
      }),
    ]),
  );
  const edition = composeEdition(
    [{ ...source(10, 1, 'IT', []), stories: full.stories, watch: full.watch }],
    null,
    [1],
    DATE,
  )!;
  const mail = renderEditionMail(edition, 'https://newpick.app/');

  it('사이트 CSS 없이 보이도록 인라인 스타일만 쓴다', () => {
    expect(mail).not.toMatch(/<style|class=/);
    expect(mail).toContain('오늘 한눈에');
    expect(mail).toContain('관전 포인트');
  });

  it('본문·강조·시사점·출처 링크·전문 보기까지 담는다', () => {
    expect(mail).toContain('둘째 문단');
    expect(mail).toMatch(/<span style="background:[^"]+">핵심 구절<\/span>/);
    expect(mail).toContain('시사점 문단');
    expect(mail).toContain('href="https://news.kbs.co.kr/1"');
    expect(mail).toContain('href="https://newpick.app/articles/detail/10"');
    expect(mail).toContain('href="https://newpick.app/mypage?tab=settings"');
  });

  it('글자는 이스케이프하고, http(s)가 아닌 링크는 걸지 않는다', () => {
    expect(mail).not.toContain('<script>');
    expect(mail).toContain('&lt;script&gt;');
    expect(mail).not.toContain('javascript:');
  });
});

describe('EditionService (#55)', () => {
  const newsletter = (id: number, categoryId: number, name: string) => ({
    id,
    categoryId,
    title: `${name} 제목`,
    subtitle: null,
    content: '요약',
    contentAsHTML: html([story({ heading: `${name} 소식` })]),
    category: { name },
  });

  function setup(saved: unknown = null) {
    const prisma = {
      dailyEdition: {
        findUnique: jest.fn().mockResolvedValue(saved),
        upsert: jest.fn(),
      },
      newsletter: {
        findMany: jest
          .fn()
          .mockResolvedValue([
            newsletter(11, 1, 'IT'),
            newsletter(10, 1, 'IT'),
            newsletter(20, 3, '경제'),
          ]),
        findFirst: jest
          .fn()
          .mockResolvedValue({ createdAt: new Date('2026-10-26T23:40:00Z') }),
      },
    };
    const claude = {
      generate: jest.fn().mockResolvedValue({
        text: JSON.stringify({
          ranking: [{ ref: '20-1', importance: 5, line: '경제 한 줄' }],
          duplicates: [],
          threads: [],
        }),
        tokens: 1234,
      }),
    };
    const service = new EditionService(prisma as never, claude as never);
    return { service, prisma, claude };
  }

  it('하루 처음이면 분야마다 최신 한 편으로 편집해 저장한다', async () => {
    const { service, prisma, claude } = setup();
    const edition = await service.ensureEdition('2026-10-27');

    expect(claude.generate).toHaveBeenCalledTimes(1);
    expect(edition!.sources.map((s) => s.newsletterId)).toEqual([11, 20]);
    expect(prisma.dailyEdition.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          date: '2026-10-27',
          newsletterIds: [11, 20],
          token: 1234,
        }),
      }),
    );
  });

  it('이미 편집했으면 다시 호출하지 않는다', async () => {
    const editorial = { ranking: {}, duplicates: [], threads: [] };
    const { service, claude } = setup({ newsletterIds: [11, 20], editorial });
    const edition = await service.ensureEdition('2026-10-27');
    expect(claude.generate).not.toHaveBeenCalled();
    expect(edition!.editorial).toBe(editorial);
  });

  it('편집 호출이 실패해도 편집 없이 돌려주고, 저장하지 않는다 (다음에 다시 시도)', async () => {
    const { service, prisma, claude } = setup();
    claude.generate.mockRejectedValue(new Error('overloaded'));
    const edition = await service.ensureEdition('2026-10-27');
    expect(edition).toMatchObject({ editorial: null });
    expect(prisma.dailyEdition.upsert).not.toHaveBeenCalled();
  });

  it('미리보기는 최신 발행일 기준이고 편집을 새로 하지 않는다 (공개 API)', async () => {
    const { service, claude } = setup();
    const edition = await service.latestEdition();
    expect(edition!.date).toBe('2026-10-27');
    expect(edition!.editorial).toBeNull();
    expect(claude.generate).not.toHaveBeenCalled();

    const mail = service.composeMail(edition!, [3])!;
    expect(mail.subject).toBe('10월 27일 뉴픽 · 경제 소식');
    expect(mail.newsletterIds).toEqual([20]);
  });
});
