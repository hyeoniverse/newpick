import { Newsletter } from '@prisma/client';
import {
  clean,
  LIMITS,
  normalize,
  NewsletterWriterService,
  numberArticles,
  writerPrompt,
  WrittenNewsletter,
} from './newsletterWriter.service';
import { renderNewsletterHtml } from './newsletterHtml';
import { AiSummaryService, usedArticles } from './ai-summary.service';
import { newsletterTemplate } from '../mail/htmlTemplate';

const written = (
  overrides: Partial<WrittenNewsletter> = {},
): WrittenNewsletter => ({
  title: '제목',
  subtitle: '부제목',
  summary: '요약',
  intro: '여는 말',
  stories: [
    {
      heading: '소제목',
      lead: '한 줄 핵심',
      points: ['포인트 1', '포인트 2'],
      why: '첫 문단\n\n둘째 문단',
      sources: [2],
    },
  ],
  outro: '맺는 말',
  ...overrides,
});

describe('뉴스레터 프롬프트', () => {
  const articles = [
    { title: '기사 A', content: '본문 A', source: '연합뉴스' },
    { title: '기사 B', content: '본문 B' },
  ];

  it('기사에 번호를 붙여 근거를 번호로 받는다', () => {
    expect(numberArticles(articles)).toBe(
      '[1] (연합뉴스) 기사 A\n본문 A\n\n[2] 기사 B\n본문 B',
    );
  });

  it('주요 소식만 최대 3개, 개수를 채우려고 덜 중요한 소식을 넣지 않는다 (#43)', () => {
    const prompt = writerPrompt(articles, 'IT');
    expect(prompt).toContain(`최대 ${LIMITS.stories}개`);
    expect(prompt).toContain('개수를 채우려고 덜 중요한 소식을 넣지 않습니다');
    expect(prompt).toContain('시상식·행사·후보 발표');
    expect(prompt).toContain('IT 분야에 해당하는 소식을 고릅니다');
  });

  it('요약은 짧게, 본문은 소식마다 한 줄 핵심·포인트·왜 중요한지 (#41)', () => {
    const prompt = writerPrompt(articles);
    expect(prompt).toContain(`2~3문장, ${LIMITS.summary}자 이내`);
    expect(prompt).toContain(`${LIMITS.why.min}~${LIMITS.why.max}자`);
    expect(prompt).toContain(`${LIMITS.points.min}~${LIMITS.points.max}개`);
    expect(prompt).not.toMatch(/words/);
  });

  it('기사체가 아니라 해요체 뉴스레터 말투, 여는 말·맺는 말', () => {
    const prompt = writerPrompt(articles);
    expect(prompt).toContain('해요체');
    expect(prompt).toContain('- intro:');
    expect(prompt).toContain('- outro:');
  });

  it('제목은 헤드라인 하나, 나열·날짜·"주요 소식" 금지 (#42)', () => {
    const prompt = writerPrompt(articles);
    expect(prompt).toContain(`${LIMITS.title}자 이내`);
    expect(prompt).toContain('나열하지 않고');
    expect(prompt).toContain('"주요 소식"');
  });
});

describe('응답 정리', () => {
  it('제목 전체를 감싼 따옴표만 걷어 내고, 제목 안의 인용은 그대로 둔다', () => {
    expect(clean(' “우주쓰레기 잡는 위성” ')).toBe('우주쓰레기 잡는 위성');
    // 실제 응답: 끝의 닫는 따옴표까지 지워 "아니다로 끝나던 버그
    expect(clean('이 대통령 "농지 전수조사, 땅 뺏는 것 아니다"')).toBe(
      '이 대통령 "농지 전수조사, 땅 뺏는 것 아니다"',
    );
    expect(clean('"A" 그리고 "B"')).toBe('"A" 그리고 "B"');
  });

  it('없는 기사 번호·중복은 버리고, 소식은 최대 3개', () => {
    const result = normalize(
      written({
        stories: Array.from({ length: 4 }, (_, i) => ({
          heading: `소식 ${i}`,
          lead: '핵심',
          points: ['- 글머리를 붙여 온 포인트', '• 둘째', '셋째', '넷째'],
          why: '이유',
          sources: [1, 1, 0, 9, 2],
        })),
      }),
      3,
    );
    expect(result.stories).toHaveLength(3);
    expect(result.stories[0].sources).toEqual([1, 2]);
    // 글머리 기호는 걷어 내고 포인트는 최대 3개
    expect(result.stories[0].points).toEqual([
      '글머리를 붙여 온 포인트',
      '둘째',
      '셋째',
    ]);
  });

  it('제목이 비거나 소식이 없으면 저장하지 않게 실패', () => {
    expect(() => normalize(written({ title: ' ' }), 3)).toThrow('빈 제목');
    expect(() => normalize(written({ stories: [] }), 3)).toThrow('소식이 없음');
  });

  it('한 번의 호출에서 JSON 스키마로 받는다', async () => {
    const claude = {
      generate: jest
        .fn()
        .mockResolvedValue({ text: JSON.stringify(written()), tokens: 42 }),
    };
    const result = await new NewsletterWriterService(claude as never).write(
      [{ title: 't', content: 'c' }],
      'IT',
    );

    expect(claude.generate).toHaveBeenCalledTimes(1);
    const [{ schema, effort }] = claude.generate.mock.calls[0];
    expect(schema.required).toEqual([
      'title',
      'subtitle',
      'summary',
      'intro',
      'stories',
      'outro',
    ]);
    expect(effort).toBe('medium');
    expect(result.tokens).toBe(42);
  });
});

describe('본문 HTML (#43)', () => {
  it('인라인 스타일 없이 구조와 class만 만든다 (모양은 웹의 테마)', () => {
    expect(renderNewsletterHtml(written())).toBe(
      '<div class="newsletter"><p class="intro">여는 말</p>' +
        '<section class="story"><span class="story-index">01</span><h2>소제목</h2>' +
        '<p class="lead">한 줄 핵심</p><ul class="points"><li>포인트 1</li><li>포인트 2</li></ul>' +
        '<div class="why"><strong>왜 중요할까요?</strong><p>첫 문단</p><p>둘째 문단</p></div></section>' +
        '<p class="outro">맺는 말</p></div>',
    );
  });

  it('모델이 쓴 글의 HTML은 글자로 바꾼다', () => {
    const html = renderNewsletterHtml(
      written({
        stories: [
          {
            heading: '<b>x</b>',
            lead: '',
            points: ['<script>alert(1)</script>'],
            why: '<img src=x onerror=alert(1)>',
            sources: [],
          },
        ],
      }),
    );
    expect(html).not.toContain('<img');
    expect(html).toContain('&lt;b&gt;x&lt;/b&gt;');
  });
});

describe('파이프라인', () => {
  const news = [
    { title: '증시', content: 'c1', link: 'l1', images: ['i1'] },
    { title: 'IT 소식', content: 'c2', link: 'l2', images: ['i2'] },
  ];

  it('썸네일·관련 기사는 소식이 실제로 쓴 기사에서 (없으면 전부)', () => {
    expect(usedArticles(news as never, [2])).toEqual([news[1]]);
    expect(usedArticles(news as never, [])).toEqual(news);
  });

  it('분야 이름을 넘기고, 쓴 기사의 링크·이미지와 렌더링한 HTML을 저장한다', async () => {
    const createNewsletter = jest.fn().mockResolvedValue({ id: 1 });
    const write = jest
      .fn()
      .mockResolvedValue({ newsletter: written(), tokens: 1 });
    const prisma = {
      aiProcessLog: { create: jest.fn() },
      newsCategory: { findUnique: jest.fn().mockResolvedValue({ name: 'IT' }) },
    };
    const service = new AiSummaryService(
      prisma as never,
      {} as never,
      { createNewsletter } as never,
      { write } as never,
    );

    await service.summarizeText(news as never, 1, false);

    expect(write).toHaveBeenCalledWith(news, 'IT');
    expect(createNewsletter).toHaveBeenCalledWith(
      '제목',
      '부제목',
      '요약',
      'l2',
      1,
      renderNewsletterHtml(written()),
      'i2',
    );
  });
});

describe('구독 메일 카드', () => {
  const base = {
    id: 1,
    title: '제목',
    content: '가'.repeat(150),
    imageUrl: null,
    viewcount: 0,
    createdAt: new Date('2026-10-27'),
  };

  it('부제목이 있으면 본문 앞부분 대신 부제목을 보여 준다', () => {
    const html = newsletterTemplate({
      ...base,
      subtitle: '부제목 한 줄',
    } as Newsletter);
    expect(html).toContain('부제목 한 줄');
    expect(html).not.toContain('가'.repeat(100));
  });

  it('부제목이 없는 이전 뉴스레터는 본문 앞 100자', () => {
    const html = newsletterTemplate({ ...base, subtitle: null } as Newsletter);
    expect(html).toContain('가'.repeat(100) + '...');
  });
});
