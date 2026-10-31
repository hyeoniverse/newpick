import {
  clean,
  keywords,
  limitMarks,
  plain,
  LIMITS,
  normalize,
  NewsletterWriterService,
  numberArticles,
  pickArticles,
  selectPrompt,
  rankClusters,
  describeScores,
  totalScore,
  MIN_TOTAL,
  ClusterScore,
  writerPrompt,
  Story,
  WrittenNewsletter,
} from './newsletterWriter.service';
import {
  cleanText,
  clusterArticles,
  MAX_ARTICLE_CHARS,
  prepare,
  titleSimilarity,
  truncate,
} from './articlePrep';
import { renderNewsletterHtml } from './newsletterHtml';
import { AiSummaryService, usedArticles } from './ai-summary.service';
import { CLAUDE_FAST_MODEL } from './claude.service';

const written = (
  overrides: Partial<WrittenNewsletter> = {},
): WrittenNewsletter => ({
  title: '제목',
  subtitle: '부제목',
  summary: '요약',
  briefing: '브리핑',
  stories: [
    {
      template: 'analysis',
      kicker: '증시',
      heading: '소제목',
      lead: '리드',
      body: '첫 문단\n\n둘째 문단',
      analysis: '시사점',
      stats: [],
      timeline: [],
      qa: [],
      quote: { text: '', by: '' },
      debate: [],
      sources: [2],
      imageQuery: 'stock market',
    },
  ],
  watch: ['FOMC 결과'],
  keywords: ['코스피', '외국인 매도'],
  ...overrides,
});

const usage = (model: string) => ({ model, input: 100, output: 10 });

describe('전처리 (#47)', () => {
  it('사진 설명·기자 서명·제보 안내·이메일을 걷어 내고, 붙어 있는 이름은 남긴다', () => {
    const raw =
      '원본보기 [서울=뉴시스] 고범준 기자 = 장관이 답변하고 있다. 2026.10.26. /사진=고범준강신철 장관이 밝혔다. abc@news.com ■ 제보하기▷ 전화 : 02-781-1234';
    expect(cleanText(raw)).toBe('장관이 답변하고 있다. 강신철 장관이 밝혔다.');
  });

  it('문장 경계에서 자른다', () => {
    const text = '가'.repeat(900) + '다. ' + '나'.repeat(600);
    expect(truncate(text, MAX_ARTICLE_CHARS)).toBe('가'.repeat(900) + '다.');
    expect(truncate('짧다.', MAX_ARTICLE_CHARS)).toBe('짧다.');
  });

  it('같은 사건 제목은 묶고, 비슷해 보이는 다른 사건은 묶지 않는다 (실제 기사 제목)', () => {
    expect(
      titleSimilarity(
        "[속보] 브라질 룰라 '초접전 승부' 끝에 당선, 4선 성공",
        "브라질 룰라 4선 성공…'우파 물결'에 제동",
      ),
    ).toBeGreaterThanOrEqual(0.25);
    expect(
      titleSimilarity(
        '대진 확정된 2026 대한민국 게임대상…후보작 살펴보니',
        "LG유플러스, '2026 대한민국 SNS대상' 기업부문 종합대상 수상",
      ),
    ).toBeLessThan(0.25);

    const clusters = clusterArticles(
      prepare([
        {
          title: '브라질 룰라 4선 성공…우파 물결에 제동',
          content: '짧은 본문',
        },
        { title: '마차도 베네수엘라 비밀 귀국', content: '본문' },
        {
          title: '[속보] 브라질 룰라 초접전 끝에 당선, 4선 성공',
          content: '더 긴 본문입니다',
        },
      ]),
    );
    expect(clusters).toHaveLength(2);
    // 큰 묶음이 먼저, 묶음 안에서는 긴 기사가 대표
    expect(clusters[0].articles.map((a) => a.index)).toEqual([2, 0]);
  });
});

describe('1단계: 고르기', () => {
  const clusters = clusterArticles(
    prepare([
      { title: '코스피 급락', content: '코스피가 내렸다.', source: '연합뉴스' },
      { title: '게임대상 후보 발표', content: '후보가 정해졌다.' },
    ]),
  );

  it('제목·첫 부분과 보도 수만 보내고, 모든 소식에 점수표를 매기게 한다', () => {
    const prompt = selectPrompt(clusters, '경제');
    expect(prompt).toContain('[1] 보도 1건 (연합뉴스)');
    expect(prompt).toContain('첫 부분: 코스피가 내렸다.');
    expect(prompt).toContain('시상식·행사·후보 발표');
    expect(prompt).toContain('경제 분야가 아닌 소식은 관심사 1점');
    expect(prompt).toContain(
      '보도 수(한 곳만 보도했는지)는 점수에 넣지 않습니다',
    );
    expect(prompt).toContain('모든 소식(1~2번)');
    expect(prompt).toContain(`최대 ${LIMITS.stories}개`);
  });

  it('고른 묶음의 대표 기사만, 없는 번호·중복은 버린다', () => {
    expect(pickArticles(clusters, [2, 2, 9, 0]).map((a) => a.title)).toEqual([
      '게임대상 후보 발표',
    ]);
  });

  const score = (n: number, each: number, more: Partial<ClusterScore> = {}) =>
    ({
      n,
      impact: each,
      novelty: each,
      relevance: each,
      followup: each,
      excluded: false,
      repeat: false,
      reason: '',
      ...more,
    }) as ClusterScore;

  describe('점수 → 고르기', () => {
    // 1: 보도 3건, 2·3·4·5: 보도 1건
    const many = clusterArticles(
      prepare([
        { title: '코스피 7개월 만에 최저', content: 'a' },
        { title: '코스피 7개월 만에 최저 마감', content: 'b' },
        { title: '코스피 7개월만에 최저치', content: 'c' },
        { title: '앤트로픽 나스닥 상장 신청', content: 'd' },
        { title: '게임대상 후보 발표', content: 'e' },
        { title: '수협은행 행장 선정 불발', content: 'f' },
        { title: '가상자산 과세 유예', content: 'g' },
      ]),
    );

    it('보도 수보다 점수 합계가 먼저, 같으면 보도 많은 쪽', () => {
      expect(many[0].articles).toHaveLength(3);
      const picks = rankClusters(many, [
        score(1, 4), // 16
        score(2, 5), // 20, 한 곳 보도
        score(5, 4), // 16, 보도 1건 → 1번 다음
      ]);
      expect(picks).toEqual([2, 1, 5]);
    });

    it('빼는 소식 · 기준 미달 · 없는 번호 · 중복은 싣지 않는다', () => {
      const picks = rankClusters(many, [
        score(3, 5, { excluded: true }),
        score(4, 3), // 12 < MIN_TOTAL
        score(2, 4),
        score(2, 5),
        score(99, 5),
      ]);
      expect(MIN_TOTAL).toBeGreaterThan(12);
      expect(picks).toEqual([2]);
    });

    it('최근에 다룬 사건이고 새 진전이 없으면(repeat) 싣지 않는다', () => {
      expect(
        rankClusters(many, [score(2, 5, { repeat: true }), score(1, 4)]),
      ).toEqual([1]);
    });

    it('최근 다룬 소식을 주면 겹치지 않게 고르라고 한다', () => {
      const prompt = selectPrompt(many, '경제', [
        '10. 27. 코스피 7개월 만에 최저',
      ]);
      expect(prompt).toContain('최근 이 분야 뉴스레터에서 이미 다룬 소식');
      expect(prompt).toContain('- 10. 27. 코스피 7개월 만에 최저');
      expect(prompt).toContain('새 진전');
      expect(selectPrompt(many, '경제')).toContain('repeat는 모두 false');
    });

    it('기준을 넘는 소식이 없으면 가장 높은 하나만', () => {
      expect(rankClusters(many, [score(4, 2), score(5, 3)])).toEqual([5]);
    });

    it('점수는 1~5로 맞춰 더한다', () => {
      expect(totalScore(score(1, 9))).toBe(20);
      expect(totalScore(score(1, 0))).toBe(4);
    });

    it('AI 기록용 요약: 실은 소식에 ✓, 점수 · 이유', () => {
      const text = describeScores(
        many,
        [score(2, 5, { reason: '대형 IPO' }), score(3, 5, { excluded: true })],
        [2],
      );
      expect(text).toContain(
        '✓ 앤트로픽 나스닥 상장 신청 — 20점 (파급 5 · 새로움 5 · 관심사 5 · 후속 5). 대형 IPO',
      );
      expect(text).toContain('제외');
    });
  });
});

describe('2단계: 쓰기', () => {
  const articles = prepare([
    { title: '기사 A', content: '본문 A', source: '연합뉴스' },
    { title: '기사 B', content: '본문 B' },
  ]);

  it('고른 기사에 번호를 붙여 근거를 번호로 받는다', () => {
    expect(numberArticles(articles)).toBe(
      '[1] (연합뉴스) 기사 A\n본문 A\n\n[2] 기사 B\n본문 B',
    );
  });

  it('이미 쓰는 태그를 주면 같은 주제는 그 표기를 다시 쓰게 한다 (#20 태그 정돈)', () => {
    expect(writerPrompt(articles, 'IT')).not.toContain('이미 쓰는 태그');
    expect(writerPrompt(articles, 'IT', ['AI 해킹', '코스피'])).toContain(
      '이미 쓰는 태그: AI 해킹, 코스피',
    );
  });

  it('전문가 브리핑 문체: 평서체, 수치·근거', () => {
    const prompt = writerPrompt(articles, 'IT');
    expect(prompt).toContain('애널리스트 브리핑처럼 간결한 평서체(~다)');
    expect(prompt).toContain('형용사보다 수치와 근거');
    expect(prompt).not.toContain('해요체');
  });

  it('요약은 짧게, 소식은 리드·본문·핵심 사실·시사점, 끝에 관전 포인트', () => {
    const prompt = writerPrompt(articles);
    expect(prompt).toContain(`2~3문장, ${LIMITS.summary}자 이내`);
    for (const key of [
      'briefing',
      'kicker',
      'lead',
      'body',
      'template',
      'analysis',
      'watch',
      'keywords',
    ]) {
      expect(prompt).toContain(`- ${key}:`);
    }
    expect(prompt).toContain('나열하지 않고');
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

  it('근거 번호를 원래 기사 번호로 바꾸고, 소식·사실·관전 포인트 개수를 제한한다', () => {
    const toOriginal = (n: number) => ({ 1: 5, 2: 8 })[n];
    const result = normalize(
      written({
        stories: Array.from({ length: 4 }, (_, i) => ({
          ...written().stories[0],
          heading: `소식 ${i}`,
          template: 'numbers' as const,
          stats: [
            { label: '- 코스피', value: '5,469.47', note: '-1.46%' },
            { label: '코스닥', value: '727.21', note: '-3.26%' },
            { label: '빈 값', value: '', note: '' },
            { label: 'A', value: '1', note: 'x' },
            { label: 'B', value: '2', note: 'y' },
            { label: 'C', value: '3', note: 'z' },
          ],
          sources: [1, 1, 3, 2],
        })),
        watch: ['하나', '둘', '셋', '넷'],
      }),
      toOriginal,
    );
    expect(result.stories).toHaveLength(3);
    expect(result.stories[0].sources).toEqual([5, 8]);
    // 글머리는 걷어 내고, 값이 빈 줄은 버리고, 지표는 최대 4개
    expect(result.stories[0].stats).toHaveLength(4);
    expect(result.stories[0].stats[0].label).toBe('코스피');
    expect(result.watch).toHaveLength(3);
  });

  it('키워드: # 제거, 너무 긴 것 버리기, 대소문자 무시 중복 제거, 최대 6개 (#50)', () => {
    expect(
      keywords([
        '#코스피',
        ' 가상자산  과세 ',
        'AI',
        'ai',
        '아주아주아주아주아주아주긴키워드',
        '',
        'FOMC',
        'CPTPP',
        '전작권',
        '여덟째',
      ]),
    ).toEqual(['코스피', '가상자산 과세', 'AI', 'FOMC', 'CPTPP', '전작권']);
  });

  it('제목이 비거나 소식이 없으면 저장하지 않게 실패', () => {
    const same = (n: number) => n;
    expect(() => normalize(written({ title: ' ' }), same)).toThrow('빈 제목');
    expect(() => normalize(written({ stories: [] }), same)).toThrow(
      '소식이 없음',
    );
  });
});

describe('강조 (#51)', () => {
  it('소식마다 앞에서부터 3곳, 30자 넘는 강조와 짝이 안 맞는 ==는 푼다', () => {
    expect(
      limitMarks([
        '코스피가 ==1.46%== 내렸다. ==외국인 6968억원 순매도==',
        '==' + '가'.repeat(31) + '== 그리고 ==환율== 그리고 ==금리==',
        '짝이 안 맞는 ==표시',
      ]),
    ).toEqual([
      '코스피가 ==1.46%== 내렸다. ==외국인 6968억원 순매도==',
      '가'.repeat(31) + ' 그리고 ==환율== 그리고 금리',
      '짝이 안 맞는 표시',
    ]);
  });

  it('강조를 쓰지 않는 항목에서는 ==를 지운다', () => {
    expect(plain('==코스피== 7개월 만에 ==최저')).toBe(
      '코스피 7개월 만에 최저',
    );
    const result = normalize(
      written({
        title: '==코스피== 급락',
        summary: '요약 ==강조==',
        keywords: ['==코스피=='],
        stories: [
          {
            ...written().stories[0],
            heading: '==소제목==',
            body: '본문 ==핵심==',
          },
        ],
      }),
      (n) => n,
    );
    expect(result.title).toBe('코스피 급락');
    expect(result.summary).toBe('요약 강조');
    expect(result.keywords).toEqual(['코스피']);
    expect(result.stories[0].heading).toBe('소제목');
    expect(result.stories[0].body).toBe('본문 ==핵심==');
  });

  it('본문·시사점·문답 답의 강조는 <mark>로 그린다 (이스케이프 뒤)', () => {
    const html = renderNewsletterHtml(
      written({
        briefing: '',
        watch: [],
        stories: [
          {
            ...written().stories[0],
            template: 'qa',
            body: '코스피가 ==1.46%== 내렸다 <b>',
            qa: [{ q: '언제?', a: '==내년 1월==부터' }],
          },
        ],
      }),
    );
    expect(html).toContain(
      '<p>코스피가 <mark>1.46%</mark> 내렸다 &lt;b&gt;</p>',
    );
    expect(html).toContain('<dd><mark>내년 1월</mark>부터</dd>');
  });
});

describe('템플릿 (#48)', () => {
  const base = written().stories[0];

  it('고유 요소가 모자라면 해설형으로 바꾼다', () => {
    const story = normalize(
      written({
        stories: [
          {
            ...base,
            template: 'timeline',
            timeline: [{ when: '26일', what: '한 줄뿐' }],
          },
        ],
      }),
      (n) => n,
    ).stories[0];
    expect(story.template).toBe('analysis');
    expect(story.timeline).toEqual([]);
  });

  it('다른 템플릿의 요소는 비우고, 단신은 시사점이 없다', () => {
    const [quote, brief] = normalize(
      written({
        stories: [
          {
            ...base,
            template: 'quote',
            quote: { text: '“피할 수 없다”', by: '이재명 대통령' },
            stats: [{ label: 'x', value: '1', note: 'y' }],
          },
          { ...base, template: 'brief' },
        ],
      }),
      (n) => n,
    ).stories;
    expect(quote.quote).toEqual({ text: '피할 수 없다', by: '이재명 대통령' });
    expect(quote.stats).toEqual([]);
    expect(brief.analysis).toBe('');
  });

  it('템플릿마다 다른 레이아웃으로 그린다', () => {
    const render = (story: Partial<Story>) =>
      renderNewsletterHtml(
        written({ stories: [{ ...base, ...story }], briefing: '', watch: [] }),
      );
    expect(
      render({
        template: 'numbers',
        stats: [{ label: '코스피', value: '5,469.47', note: '-1.46%' }],
      }),
    ).toContain(
      '<div class="stats"><div class="stat"><span class="label">코스피</span><strong class="value">5,469.47</strong><span class="note">-1.46%</span></div></div>',
    );
    expect(
      render({
        template: 'timeline',
        timeline: [{ when: '16일', what: '1차 신고' }],
      }),
    ).toContain(
      '<ol class="timeline"><li><time>16일</time><span>1차 신고</span></li></ol>',
    );
    expect(render({ template: 'timeline' })).toContain('<h3>전망</h3>');
    expect(
      render({ template: 'qa', qa: [{ q: '언제부터?', a: '내년 1월' }] }),
    ).toContain('<dl class="qa"><dt>언제부터?</dt><dd>내년 1월</dd></dl>');
    expect(
      render({
        template: 'quote',
        quote: { text: '피할 수 없다', by: '대통령' },
      }),
    ).toContain(
      '<blockquote class="quote"><p>피할 수 없다</p><cite>대통령</cite></blockquote>',
    );
    const brief = render({ template: 'brief' });
    expect(brief).toContain('class="story story-brief"');
    expect(brief).not.toContain('class="analysis"');
  });
});

describe('NewsletterWriterService.write', () => {
  const oneSource = written({
    stories: [{ ...written().stories[0], sources: [1] }],
  });
  // 고르기 응답: 고를 번호는 만점, 나머지는 기준 미달
  const claudeWith = (picks: number[]) => ({
    generate: jest
      .fn()
      .mockResolvedValueOnce({
        text: JSON.stringify({
          scores: picks.map((n) => ({
            n,
            impact: 5,
            novelty: 5,
            relevance: 5,
            followup: 5,
            excluded: false,
            reason: '',
          })),
        }),
        usage: usage(CLAUDE_FAST_MODEL),
      })
      .mockResolvedValueOnce({
        text: JSON.stringify(oneSource),
        usage: usage('claude-sonnet-5-5'),
      }),
  });
  /** 오픈 모델 설정이 없을 때: 제목으로만 묶는다 */
  const noOpen = { configured: false, embed: jest.fn() };
  const articles = [
    { title: '게임대상 후보 발표', content: '후보 본문' },
    { title: '코스피 7개월 만에 최저', content: '코스피 본문' },
    { title: '가상자산 과세 유예 검토', content: '과세 본문' },
  ];

  it('가벼운 모델로 고르고, 고른 기사만 기본 모델로 쓴다', async () => {
    const claude = claudeWith([2]);
    const result = await new NewsletterWriterService(
      claude as never,
      noOpen as never,
    ).write(articles, '경제');

    const [select, write] = claude.generate.mock.calls.map(([o]) => o);
    expect(select.model).toBe(CLAUDE_FAST_MODEL);
    expect(select.effort).toBe('low');
    expect(write.model).toBeUndefined(); // 기본 모델 (CLAUDE_MODEL)
    expect(write.prompt).toContain('코스피 본문');
    expect(write.prompt).not.toContain('후보 본문');
    // 쓰기 단계의 [1]은 원래 목록의 두 번째 기사
    expect(result.newsletter.stories[0].sources).toEqual([2]);
    expect(result.tokens).toBe(220);
  });

  it('고른 소식이 없으면 쓰기를 호출하지 않고 실패', async () => {
    const claude = claudeWith([]);
    await expect(
      new NewsletterWriterService(claude as never, noOpen as never).write(
        articles,
      ),
    ).rejects.toThrow('고른 소식이 없음');
    expect(claude.generate).toHaveBeenCalledTimes(1);
  });

  it('묶음이 하나뿐이면 고르기를 건너뛴다', async () => {
    const claude = {
      generate: jest.fn().mockResolvedValue({
        text: JSON.stringify(oneSource),
        usage: usage('claude-sonnet-5-5'),
      }),
    };
    await new NewsletterWriterService(claude as never, noOpen as never).write([
      articles[1],
    ]);
    expect(claude.generate).toHaveBeenCalledTimes(1);
  });
});

describe('본문 HTML (#43)', () => {
  it('뉴스 기사 구조와 class만 만들고, 출처 언론사를 붙인다', () => {
    const html = renderNewsletterHtml(written(), [
      { source: 'KBS', link: 'https://news/1' },
      { source: '연합뉴스', link: 'https://news/2' },
    ]);
    expect(html).toBe(
      '<div class="newsletter">' +
        '<section class="briefing"><h3>에디터 브리핑</h3><p>브리핑</p></section>' +
        '<article class="story story-analysis"><p class="kicker"><span class="index">01</span>증시</p>' +
        '<h2>소제목</h2><p class="lead">리드</p>' +
        '<div class="body"><p>첫 문단</p><p>둘째 문단</p></div>' +
        '<div class="analysis"><h3>시사점</h3><p>시사점</p></div>' +
        '<p class="credit">출처 <a href="https://news/2" target="_blank" rel="noopener noreferrer">연합뉴스</a></p></article>' +
        '<section class="watch"><h3>관전 포인트</h3><ul><li>FOMC 결과</li></ul></section>' +
        '</div>',
    );
    expect(html).not.toContain('style=');
  });

  it('출처 링크는 http(s)만, 같은 기사는 한 번만', () => {
    const story = { ...written().stories[0], sources: [1, 2, 3] };
    const html = renderNewsletterHtml(written({ stories: [story] }), [
      { source: 'KBS', link: 'javascript:alert(1)' },
      { source: '뉴시스', link: 'https://news/2' },
      { source: '뉴시스', link: 'https://news/2' },
    ]);
    expect(html).toContain(
      '<p class="credit">출처 KBS · <a href="https://news/2" target="_blank" rel="noopener noreferrer">뉴시스</a></p>',
    );
    expect(html).not.toContain('javascript:');
  });

  it('모델이 쓴 글의 HTML은 글자로 바꾼다', () => {
    const html = renderNewsletterHtml(
      written({
        stories: [
          {
            ...written().stories[0],
            heading: '<b>x</b>',
            template: 'qa',
            qa: [{ q: '<script>alert(1)</script>', a: 'a' }],
            body: '<img src=x onerror=alert(1)>',
          },
        ],
      }),
    );
    expect(html).not.toContain('<img');
    expect(html).not.toContain('<script');
    expect(html).toContain('&lt;b&gt;x&lt;/b&gt;');
  });
});

describe('파이프라인', () => {
  const news = [
    { title: '증시', content: 'c1', link: 'l1', images: ['i1'], source: 'A' },
    {
      title: 'IT 소식',
      content: 'c2',
      link: 'l2',
      images: ['i2'],
      source: 'B',
    },
  ];

  it('썸네일·관련 기사는 소식이 실제로 쓴 기사에서 (없으면 전부)', () => {
    expect(usedArticles(news as never, [2])).toEqual([news[1]]);
    expect(usedArticles(news as never, [])).toEqual(news);
  });

  it('분야 이름을 넘기고, 쓴 기사의 링크·이미지와 렌더링한 HTML을 저장한다', async () => {
    const createNewsletter = jest.fn().mockResolvedValue({ id: 1 });
    const write = jest.fn().mockResolvedValue({
      newsletter: written(),
      tokens: 1,
      usage: [{ model: 'claude-sonnet-5-5', input: 1, output: 0 }],
      embeddings: [{ index: 1, vector: [0.1, 0.2] }],
    });
    const saveEmbeddings = jest.fn().mockResolvedValue(undefined);
    const prisma = {
      aiProcessLog: { create: jest.fn() },
      newsCategory: { findUnique: jest.fn().mockResolvedValue({ name: 'IT' }) },
      // 최근 이 분야 뉴스레터: 이미 쓴 기사(l9)는 빼고, 제목은 고르기 · 쓰기에 알린다
      newsletter: {
        findMany: jest.fn().mockResolvedValue([
          {
            title: '지난 소식',
            subtitle: null,
            usedNews: 'l9',
            createdAt: new Date('2026-10-27T00:00:00Z'),
          },
        ]),
      },
    };
    const service = new AiSummaryService(
      prisma as never,
      {} as never,
      { createNewsletter } as never,
      { write } as never,
      { attach: jest.fn(async (stories) => stories) } as never,
      // 태그 정돈: 최근 태그를 쓰기 단계에 넘기고, 저장 전에 'AI해킹' → 'AI 해킹'처럼 기존 표기로 맞춘다
      {
        recentTags: jest.fn().mockResolvedValue(['AI 해킹']),
        canonicalize: jest.fn(async (tags: string[]) =>
          tags.map((t) => (t === 'AI해킹' ? 'AI 해킹' : t)),
        ),
      } as never,
      { saveEmbeddings } as never,
    );

    await service.summarizeText(news as never, 1, false);

    // 최근 태그 · 최근 다룬 소식을 쓰기 단계에 넘긴다
    expect(write).toHaveBeenCalledWith(news, 'IT', {
      existingTags: ['AI 해킹'],
      recentTopics: ['10. 27. 지난 소식'],
    });
    expect(createNewsletter).toHaveBeenCalledWith(
      '제목',
      '부제목',
      '요약',
      'l2',
      1,
      renderNewsletterHtml(written(), news),
      'i2',
      ['코스피', '외국인 매도'],
    );
    // 같은 사건 묶기로 계산한 임베딩은 기사 링크로 남긴다 (추천 기사에서 다시 쓴다)
    expect(saveEmbeddings).toHaveBeenCalledWith([
      { link: 'l2', embedding: [0.1, 0.2] },
    ]);
  });
});
