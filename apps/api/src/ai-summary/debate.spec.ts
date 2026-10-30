import { clusterArticles, prepare, SAME_EVENT_EMBEDDING } from './articlePrep';
import { CLAUDE_FAST_MODEL } from './claude.service';
import { renderNewsletterHtml } from './newsletterHtml';
import {
  diverseArticles,
  LIMITS,
  NewsletterWriterService,
  debateOf,
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

describe('엇갈린 주장: 기사 고르기', () => {
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

describe('엇갈린 주장: 쓰기 · 정리', () => {
  it('프롬프트: 서로 반대되는 주장일 때만, 정치 · 사회는 따로 당부', () => {
    const prompt = writerPrompt(cluster, '경제');
    expect(prompt).toContain('debate:');
    expect(prompt).toContain('서로 반대되는 주장');
    expect(prompt).toContain('강조점만 다르거나');
    expect(prompt).not.toContain('주장이 맞서는 경우가 많습니다');
    expect(writerPrompt(cluster, '정치')).toContain(
      '주장이 맞서는 경우가 많습니다',
    );
  });

  it('주장하는 쪽이 둘 이상일 때만 남기고, 같은 쪽 · 빈 칸은 뺀다', () => {
    expect(
      debateOf([
        { side: '여당', claim: '적법한 절차', source: '한겨레' },
        { side: '여당', claim: '중복', source: '조선일보' },
        { side: '', claim: '주체 없음', source: 'KBS' },
        { side: '야당', claim: '권한 남용', source: '조선일보' },
      ]),
    ).toEqual([
      { side: '여당', claim: '적법한 절차', source: '한겨레' },
      { side: '야당', claim: '권한 남용', source: '조선일보' },
    ]);
    // 한쪽 주장만이면 '엇갈린' 주장이 아니다 (언론사가 달라도)
    expect(
      debateOf([
        { side: '정부', claim: '추진', source: '한겨레' },
        { side: '정부', claim: '추진', source: '조선일보' },
      ]),
    ).toEqual([]);
    expect(debateOf(undefined)).toEqual([]);
  });
});

describe('엇갈린 주장: 본문 · 메일', () => {
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
    debate: [
      { side: '여당', claim: '적법한 절차에 따른 검증', source: '한겨레' },
      { side: '야당', claim: '정치적 의도의 권한 남용', source: '조선일보' },
    ],
    sources: [],
    imageQuery: '',
  };

  it('본문 뒤 · 전망 앞에 엇갈린 주장 칸 (누가 · 무엇을 · 어느 기사에서)', () => {
    const html = renderNewsletterHtml({
      briefing: '',
      stories: [story],
      watch: [],
    });
    expect(html).toContain(
      '<div class="debate"><h3>엇갈린 주장</h3><ul><li><strong class="side">여당</strong><span class="claim">적법한 절차에 따른 검증</span><span class="source">한겨레</span></li>',
    );
    expect(html.indexOf('class="body"')).toBeLessThan(html.indexOf('debate'));
    expect(html.indexOf('debate')).toBeLessThan(
      html.indexOf('class="analysis"'),
    );
    expect(
      renderNewsletterHtml({
        briefing: '',
        stories: [{ ...story, debate: [] }],
        watch: [],
      }),
    ).not.toContain('debate');
  });

  it('메일은 저장된 본문에서 엇갈린 주장을 다시 읽어 그린다', () => {
    const html = renderNewsletterHtml({
      briefing: '',
      stories: [story],
      watch: [],
    });
    const [parsed] = parseNewsletterHtml(html).stories;
    expect(parsed.blocks.find((b) => b.type === 'debate')).toEqual({
      type: 'debate',
      rows: [
        { side: '여당', claim: '적법한 절차에 따른 검증', source: '한겨레' },
        { side: '야당', claim: '정치적 의도의 권한 남용', source: '조선일보' },
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
    expect(mail).toContain('엇갈린 주장');
    expect(mail).toContain('조선일보');
    expect(mail).toContain('정치적 의도의 권한 남용');
    expect(mail).toContain('야당');
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
                    debate: [],
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
