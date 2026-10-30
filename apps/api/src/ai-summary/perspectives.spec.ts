import { clusterArticles, prepare, SAME_EVENT_EMBEDDING } from './articlePrep';
import { CLAUDE_FAST_MODEL } from './claude.service';
import { renderNewsletterHtml } from './newsletterHtml';
import {
  diverseArticles,
  LIMITS,
  NewsletterWriterService,
  perspectivesOf,
  pickArticles,
  Story,
  writerPrompt,
} from './newsletterWriter.service';
import { parseNewsletterHtml } from '../edition/parse';
import { renderEditionMail } from '../edition/mail';
import { composeEdition } from '../edition/compose';

/** 같은 사건, 언론사가 겹치는 묶음 (긴 기사 순서) */
const cluster = prepare([
  {
    title: '특검 투표지 공개 검증',
    content: 'a'.repeat(900),
    source: '동아일보',
  },
  {
    title: '특검 투표지 공개 검증 착수',
    content: 'b'.repeat(800),
    source: '동아일보',
  },
  { title: '특검, 투표지 검증', content: 'c'.repeat(700), source: '한겨레' },
  {
    title: '투표지 공개 검증 시작',
    content: 'd'.repeat(600),
    source: '조선일보',
  },
]);

describe('언론사별 시각: 기사 고르기', () => {
  it('같은 사건 안에서 서로 다른 언론사 기사를 먼저 고른다', () => {
    expect(diverseArticles(cluster, 3).map((a) => a.source)).toEqual([
      '동아일보',
      '한겨레',
      '조선일보',
    ]);
    // 언론사가 모자라면 남은 기사로 채운다
    expect(diverseArticles(cluster, 4).map((a) => a.source)).toEqual([
      '동아일보',
      '한겨레',
      '조선일보',
      '동아일보',
    ]);
  });

  it('정치 · 사회는 소식마다 3건, 다른 분야는 2건', () => {
    const clusters = [{ articles: cluster }];
    expect(pickArticles(clusters, [1], '정치')).toHaveLength(
      LIMITS.articlesPerStoryWide,
    );
    expect(pickArticles(clusters, [1], '사회')).toHaveLength(3);
    expect(pickArticles(clusters, [1], '경제')).toHaveLength(
      LIMITS.articlesPerStory,
    );
    expect(pickArticles(clusters, [1], '경제').map((a) => a.source)).toEqual([
      '동아일보',
      '한겨레',
    ]);
  });
});

describe('언론사별 시각: 쓰기 · 정리', () => {
  it('프롬프트에 시각 항목이 있고, 정치 · 사회는 시각 비교를 따로 당부한다', () => {
    expect(writerPrompt(cluster, '경제')).toContain('perspectives:');
    expect(writerPrompt(cluster, '경제')).not.toContain(
      '언론사마다 다르게 보는',
    );
    expect(writerPrompt(cluster, '정치')).toContain('언론사마다 다르게 보는');
  });

  it('서로 다른 언론사가 둘 이상일 때만 남기고, 같은 언론사 · 빈 칸은 뺀다', () => {
    expect(
      perspectivesOf([
        { source: '한겨레', view: '절차적 정당성을 강조' },
        { source: '한겨레', view: '중복' },
        { source: '', view: '이름 없음' },
        { source: '조선일보', view: '정치적 의도를 지적' },
      ]),
    ).toEqual([
      { source: '한겨레', view: '절차적 정당성을 강조' },
      { source: '조선일보', view: '정치적 의도를 지적' },
    ]);
    expect(perspectivesOf([{ source: '한겨레', view: '하나뿐' }])).toEqual([]);
    expect(perspectivesOf(undefined)).toEqual([]);
  });
});

describe('언론사별 시각: 본문 · 메일', () => {
  const story: Story = {
    template: 'timeline',
    kicker: '선관위',
    heading: '투표지 공개 검증',
    lead: '리드',
    body: '본문',
    analysis: '전망',
    stats: [],
    timeline: [{ when: '28일', what: '검증' }],
    qa: [],
    quote: { text: '', by: '' },
    perspectives: [
      { source: '한겨레', view: '절차적 정당성을 강조' },
      { source: '조선일보', view: '정치적 의도를 지적' },
    ],
    sources: [],
    imageQuery: '',
  };

  it('본문 뒤 · 전망 앞에 언론사별 시각 칸', () => {
    const html = renderNewsletterHtml({
      briefing: '',
      stories: [story],
      watch: [],
    });
    expect(html).toContain(
      '<div class="perspectives"><h3>언론사별 시각</h3><ul><li><strong class="source">한겨레</strong><span class="view">절차적 정당성을 강조</span></li>',
    );
    expect(html.indexOf('class="body"')).toBeLessThan(
      html.indexOf('perspectives'),
    );
    expect(html.indexOf('perspectives')).toBeLessThan(
      html.indexOf('class="analysis"'),
    );
    expect(
      renderNewsletterHtml({
        briefing: '',
        stories: [{ ...story, perspectives: [] }],
        watch: [],
      }),
    ).not.toContain('perspectives');
  });

  it('메일은 저장된 본문에서 시각을 다시 읽어 그린다', () => {
    const html = renderNewsletterHtml({
      briefing: '',
      stories: [story],
      watch: [],
    });
    const [parsed] = parseNewsletterHtml(html).stories;
    expect(parsed.blocks.find((b) => b.type === 'perspectives')).toEqual({
      type: 'perspectives',
      rows: [
        { source: '한겨레', view: '절차적 정당성을 강조' },
        { source: '조선일보', view: '정치적 의도를 지적' },
      ],
    });

    const edition = composeEdition(
      [
        {
          newsletterId: 1,
          categoryId: 2,
          category: '정치',
          title: '정치 제목',
          subtitle: '부제',
          summary: '요약',
          stories: parseNewsletterHtml(html).stories,
          watch: [],
        },
      ],
      null,
      [2],
      new Date('2026-10-31T09:00:00+09:00'),
    )!;
    const mail = renderEditionMail(
      edition,
      'https://newpick.app/',
      'hello@newpick.app',
    );
    expect(mail).toContain('언론사별 시각');
    expect(mail).toContain('조선일보');
    expect(mail).toContain('정치적 의도를 지적');
    expect(mail).not.toMatch(/class=/);
  });
});

describe('같은 사건 묶기: 임베딩', () => {
  // 언론사마다 제목이 달라 제목으로는 못 묶는 같은 사건 (2026-10-26 정치)
  const titles = prepare([
    {
      title: "주진우 '황제 레슨' 폭로하더니",
      content: '본문1',
      source: 'JTBC',
    },
    {
      title: "주진우 '김 여사 골프 의혹' 지목 골퍼 반박",
      content: '본문2',
      source: 'JIBS',
    },
    {
      title: '안중근 의사 하얼빈 의거 기념식',
      content: '본문3',
      source: 'KBS',
    },
  ]);

  it('제목이 달라도 뜻이 비슷하면(임베딩 유사도 기준 이상) 한 사건으로 묶는다', () => {
    expect(clusterArticles(titles)).toHaveLength(3);
    const vectors = [
      [1, 0, 0],
      [0.9, 0.3, 0],
      [0, 0, 1],
    ];
    const clusters = clusterArticles(titles, vectors);
    expect(clusters).toHaveLength(2);
    expect(clusters[0].articles.map((a) => a.source).sort()).toEqual([
      'JIBS',
      'JTBC',
    ]);
  });

  it(`기준(${SAME_EVENT_EMBEDDING})에 못 미치면 묶지 않는다`, () => {
    // 코사인 0.6
    expect(
      clusterArticles(titles, [
        [1, 0, 0],
        [0.6, 0.8, 0],
        [0, 0, 1],
      ]),
    ).toHaveLength(3);
  });

  const claudeWrites = () => ({
    generate: jest.fn().mockImplementation(({ model }) =>
      Promise.resolve(
        model === CLAUDE_FAST_MODEL
          ? {
              text: JSON.stringify({
                scores: [
                  {
                    n: 1,
                    impact: 5,
                    novelty: 5,
                    relevance: 5,
                    followup: 5,
                    excluded: false,
                    repeat: false,
                    reason: '',
                  },
                ],
              }),
              usage: { model, input: 1, output: 1 },
            }
          : {
              text: JSON.stringify({
                title: '제목',
                subtitle: '',
                summary: '',
                briefing: '',
                stories: [
                  {
                    template: 'brief',
                    kicker: '정치',
                    heading: '골프 의혹',
                    lead: '리드',
                    body: '본문',
                    analysis: '',
                    stats: [],
                    timeline: [],
                    qa: [],
                    quote: { text: '', by: '' },
                    perspectives: [],
                    sources: [1],
                    imageQuery: '',
                  },
                ],
                watch: [],
                keywords: ['주진우', '골프', '의혹'],
              }),
              usage: { model: 'claude-sonnet-5-5', input: 1, output: 1 },
            },
      ),
    ),
  });

  it('뉴스레터를 쓸 때 기사를 임베딩해 묶고, 묶인 다른 언론사 기사를 함께 보낸다', async () => {
    const claude = claudeWrites();
    const open = {
      configured: true,
      embed: jest.fn().mockResolvedValue([
        [1, 0, 0],
        [0.9, 0.3, 0],
        [0, 0, 1],
      ]),
    };
    await new NewsletterWriterService(claude as never, open as never).write(
      [
        {
          title: "주진우 '황제 레슨' 폭로하더니",
          content: '본문1',
          source: 'JTBC',
        },
        {
          title: "주진우 '김 여사 골프 의혹' 지목 골퍼 반박",
          content: '본문2',
          source: 'JIBS',
        },
        {
          title: '안중근 의사 하얼빈 의거 기념식',
          content: '본문3',
          source: 'KBS',
        },
      ],
      '정치',
    );
    expect(open.embed).toHaveBeenCalledTimes(1);
    const write = claude.generate.mock.calls
      .map(([o]) => o)
      .find((o) => o.model !== CLAUDE_FAST_MODEL);
    expect(write.prompt).toContain('(JTBC)');
    expect(write.prompt).toContain('(JIBS)');
  });

  it('임베딩이 안 되면(할당 초과 등) 제목으로만 묶고 뉴스레터는 그대로 쓴다', async () => {
    const claude = claudeWrites();
    const open = {
      configured: true,
      embed: jest.fn().mockRejectedValue(new Error('429')),
    };
    const result = await new NewsletterWriterService(
      claude as never,
      open as never,
    ).write(
      [
        {
          title: "주진우 '황제 레슨' 폭로하더니",
          content: '본문1',
          source: 'JTBC',
        },
        {
          title: '안중근 의사 하얼빈 의거 기념식',
          content: '본문3',
          source: 'KBS',
        },
      ],
      '정치',
    );
    expect(result.newsletter.title).toBe('제목');
  });
});
