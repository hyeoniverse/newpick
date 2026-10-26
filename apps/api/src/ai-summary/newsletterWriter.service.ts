import { Injectable } from '@nestjs/common';
import { ClaudeService, CLAUDE_FAST_MODEL } from './claude.service';
import {
  Cluster,
  clusterArticles,
  LEAD_CHARS,
  prepare,
  PrepArticle,
} from './articlePrep';

/**
 * 소식마다 내용에 맞는 템플릿 (#48). 모두 꼬리표·헤드라인·리드·본문을 갖고, 템플릿마다 고유 요소가 하나씩 있다
 * - numbers: 지표 카드 (증시·경제지표·통계)
 * - timeline: 날짜별 경과 (수사·재판·외교·사고처럼 진행 중인 사건)
 * - qa: 문답 (정책·제도·규제 변화)
 * - quote: 인용문 (핵심이 누군가의 발언)
 * - analysis: 해설 (그 밖의 일반 소식)
 * - brief: 단신 (짧게 다뤄도 되는 소식, 시사점 없음)
 */
export const TEMPLATES = [
  'numbers',
  'timeline',
  'qa',
  'quote',
  'analysis',
  'brief',
] as const;
export type Template = (typeof TEMPLATES)[number];

export type Stat = { label: string; value: string; note: string };
export type Moment = { when: string; what: string };
export type QA = { q: string; a: string };

export type Story = {
  template: Template;
  kicker: string;
  heading: string;
  lead: string;
  body: string;
  /** 시사점. brief는 비어 있다 */
  analysis: string;
  stats: Stat[];
  timeline: Moment[];
  qa: QA[];
  quote: { text: string; by: string };
  /** 원래 기사 목록에서의 번호 (1부터) */
  sources: number[];
  /** 원출처 사진이 없을 때 Pexels·Unsplash에서 찾을 영어 검색어 */
  imageQuery: string;
  /** 쓰기가 끝난 뒤 서버가 붙인다 (storyImages.ts) */
  image?: StoryImage;
};

export type StoryImage = {
  url: string;
  alt: string;
  /** 사진 아래 표기: 언론사 또는 작가 */
  credit: string;
  creditUrl?: string;
  provider: 'article' | 'pexels' | 'unsplash';
  /** Pexels·Unsplash 페이지 (출처 표기 규칙) */
  providerUrl?: string;
};

/**
 * 뉴스레터 한 편 (#41, #42, #43, #47, #48)
 * 제목·부제목 + AI 요약 + 에디터 브리핑 → 소식 1~3개(템플릿별) → 관전 포인트
 */
export type WrittenNewsletter = {
  title: string;
  subtitle: string;
  summary: string;
  briefing: string;
  stories: Story[];
  watch: string[];
};

export type SourceArticle = {
  title: string;
  content: string;
  source?: string;
};

export type Usage = { model: string; input: number; output: number };

export const LIMITS = {
  title: 30,
  subtitle: 60,
  summary: 300,
  briefing: 200,
  stories: 3,
  kicker: 8,
  lead: 80,
  body: { min: 250, max: 450 },
  briefBody: { min: 100, max: 200 },
  analysis: { min: 150, max: 300 },
  stats: { min: 2, max: 4 },
  timeline: { min: 3, max: 5 },
  qa: { min: 2, max: 3 },
  watch: { max: 3, length: 60 },
  /** 쓰기 단계에 소식 하나당 보내는 기사 수 (같은 사건의 대표 기사) */
  articlesPerStory: 2,
} as const;

const PICK_CRITERIA = [
  '- 주요한 소식: 많은 사람의 생활·돈·안전에 영향을 주거나, 정책·시장·국제 정세를 바꾸거나, 여러 언론이 함께 다룬 사건.',
  '- 빼는 소식: 시상식·행사·후보 발표, 기업 홍보, 연예·가십, 단순 인사·동정, 지역 단신.',
  '- 개수를 채우려고 덜 중요한 소식을 넣지 않습니다.',
];

// ---------- 1단계: 고르기 (가벼운 모델, 제목과 첫 부분만) ----------

export const SELECT_SYSTEM =
  'You are a senior news editor. You pick only the truly major stories of the day. Reply in Korean.';

/** 묶음마다 보도 수·언론사·제목·첫 부분만 보낸다 */
export const describeClusters = (clusters: Cluster[]) =>
  clusters
    .map((c, i) => {
      const [top] = c.articles;
      const outlets = [
        ...new Set(c.articles.map((a) => a.source).filter(Boolean)),
      ];
      return [
        `[${i + 1}] 보도 ${c.articles.length}건${outlets.length ? ` (${outlets.join(', ')})` : ''}`,
        ...c.articles.map((a) => `제목: ${a.title}`),
        `첫 부분: ${top.content.slice(0, LEAD_CHARS)}`,
      ].join('\n');
    })
    .join('\n\n');

export const selectPrompt = (clusters: Cluster[], category?: string) =>
  [
    `오늘 수집한 ${category ? `${category} 분야 ` : ''}소식 ${clusters.length}개입니다. 뉴스레터에 실을 정말 주요한 소식을 최대 ${LIMITS.stories}개, 중요한 순서로 골라 번호로 답해 주세요. 기준을 넘는 소식이 적으면 1~2개만 고릅니다.`,
    '',
    ...PICK_CRITERIA,
    ...(category ? [`- ${category} 분야가 아닌 소식은 고르지 않습니다.`] : []),
    '',
    describeClusters(clusters),
  ].join('\n');

const SELECT_SCHEMA = {
  type: 'object',
  properties: { picks: { type: 'array', items: { type: 'integer' } } },
  required: ['picks'],
  additionalProperties: false,
};

// ---------- 2단계: 쓰기 (기본 모델, 고른 소식의 기사만) ----------

export const WRITER_SYSTEM =
  'You are the chief editor of a Korean expert news briefing read by professionals. You write precise, analytical Korean.';

/** 쓰기 단계 입력. 번호는 이 목록 안에서의 번호다 (저장 전에 원래 번호로 바꾼다) */
export const numberArticles = (articles: PrepArticle[]) =>
  articles
    .map(
      (a, i) =>
        `[${i + 1}]${a.source ? ` (${a.source})` : ''} ${a.title}\n${a.content}`,
    )
    .join('\n\n');

export const writerPrompt = (articles: PrepArticle[], category?: string) =>
  [
    `아래 ${category ? `${category} 분야 ` : ''}기사 ${articles.length}건은 오늘 뉴스레터에 실을 소식으로 이미 고른 것입니다. 이걸로 전문가용 뉴스 브리핑 한 편을 써 주세요. 같은 사건을 다룬 기사는 한 소식으로 합칩니다.`,
    '',
    '## 문체',
    '- 증권사·연구소 애널리스트 브리핑처럼 간결한 평서체(~다)로 씁니다. 감탄, 과장, 구어체, 이모지는 쓰지 않습니다.',
    '- 첫 문장에 사실(누가, 무엇을, 얼마나)을 쓰고 이어서 맥락을 씁니다. 형용사보다 수치와 근거를 씁니다.',
    '- 전문 용어는 그대로 쓰되, 처음 나올 때 괄호로 짧게 풉니다.',
    '',
    '## 항목',
    `- title: 가장 중요한 소식 하나를 담은 헤드라인. ${LIMITS.title}자 이내, 기사 제목 형식. 여러 소식을 ·, 쉼표, "외"로 나열하지 않고, 날짜·"주요 소식"·"브리핑" 같은 말은 넣지 않습니다.`,
    `- subtitle: 나머지 소식을 한 문장으로. ${LIMITS.subtitle}자 이내. 소식이 하나뿐이면 그 소식의 의미를 한 문장으로.`,
    `- summary: 오늘 브리핑 전체를 2~3문장, ${LIMITS.summary}자 이내로.`,
    `- briefing: 에디터 브리핑. 오늘 소식들을 관통하는 흐름이나 공통 변수를 2~3문장, ${LIMITS.briefing}자 이내로. 소식 목록을 다시 나열하지 않습니다.`,
    '- stories: 소식마다 내용에 맞는 template을 하나 고르고, 그 템플릿의 고유 항목만 채웁니다. 나머지 고유 항목은 빈 배열·빈 문자열로 둡니다. 소식이 여러 개면 가능한 한 서로 다른 템플릿을 씁니다.',
    `  - template: ${TEMPLATES.join(' | ')}`,
    `    - numbers: 증시·경제지표·통계 발표처럼 숫자가 핵심인 소식 → stats ${LIMITS.stats.min}~${LIMITS.stats.max}개 (label: 지표 이름 12자 이내, value: 값 12자 이내 예 "5,469.47", note: 변화·비교 20자 이내 예 "-1.46%" 또는 "4월 6일 이후 최저", 등락은 반드시 +/- 부호를 붙인다)`,
    `    - timeline: 수사·재판·외교·사고처럼 단계적으로 진행 중인 사건 → timeline ${LIMITS.timeline.min}~${LIMITS.timeline.max}개 (when: 날짜·시점 12자 이내, what: 그때 일어난 일 50자 이내), 시간 순서대로`,
    `    - qa: 정책·제도·규제·세제 변화 → qa ${LIMITS.qa.min}~${LIMITS.qa.max}개 (q: "무엇이 바뀌나", "누가 영향을 받나", "언제부터" 같은 질문 30자 이내, a: 답 120자 이내)`,
    '    - quote: 핵심이 누군가의 발언인 소식 → quote (text: 기사에 나온 발언 그대로 80자 이내, by: 발언자와 직함 20자 이내)',
    '    - analysis: 위에 해당하지 않는 일반 소식',
    `    - brief: 짧게 다뤄도 되는 소식. body ${LIMITS.briefBody.min}~${LIMITS.briefBody.max}자, analysis는 빈 문자열`,
    `  - kicker: 주제 꼬리표 ${LIMITS.kicker}자 이내 (예: 증시, 세제, 사이버보안).`,
    '  - heading: 기사 제목 형식, 25자 이내.',
    `  - lead: 리드. 핵심 사실 한 문장, ${LIMITS.lead}자 이내.`,
    `  - body: 경과와 맥락 ${LIMITS.body.min}~${LIMITS.body.max}자, 문단 1~2개. 문단 사이는 빈 줄 하나. 템플릿 고유 항목(stats·timeline·qa·quote)과 같은 내용을 반복하지 않습니다.`,
    `  - analysis: 시사점 ${LIMITS.analysis.min}~${LIMITS.analysis.max}자. 파급 효과, 이해관계자, 쟁점, 전망. 기사에 근거가 없는 예측은 하지 않습니다.`,
    '  - sources: 이 소식의 근거 기사 번호 (가장 대표적인 기사를 먼저).',
    '  - imageQuery: 이 소식에 어울리는 사진 검색어. 영어 2~4단어. 실존 인물 이름·기업 로고 대신 장면이나 사물 (예: "stock market screen", "farmland korea", "ballot counting").',
    `- watch: 관전 포인트. 앞으로 지켜볼 일정·변수 1~${LIMITS.watch.max}개, 하나에 ${LIMITS.watch.length}자 이내. 기사에 나온 것만.`,
    '- 숫자·이름·날짜는 기사에 있는 그대로 쓰고, 기사에 없는 내용은 더하지 않습니다.',
    '- 마크다운, HTML, 글머리 기호 문자(-, •)는 쓰지 않습니다. 따옴표로 제목을 감싸지 않습니다.',
    '',
    '## 기사',
    numberArticles(articles),
  ].join('\n');

/** 문자열 필드만 가진 객체 스키마 */
const pairs = (keys: string[]) => ({
  type: 'object',
  properties: Object.fromEntries(keys.map((k) => [k, { type: 'string' }])),
  required: keys,
  additionalProperties: false,
});

const WRITER_SCHEMA = {
  type: 'object',
  properties: {
    title: { type: 'string' },
    subtitle: { type: 'string' },
    summary: { type: 'string' },
    briefing: { type: 'string' },
    stories: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          template: { type: 'string', enum: [...TEMPLATES] },
          kicker: { type: 'string' },
          heading: { type: 'string' },
          lead: { type: 'string' },
          body: { type: 'string' },
          analysis: { type: 'string' },
          stats: {
            type: 'array',
            items: pairs(['label', 'value', 'note']),
          },
          timeline: { type: 'array', items: pairs(['when', 'what']) },
          qa: { type: 'array', items: pairs(['q', 'a']) },
          quote: pairs(['text', 'by']),
          sources: { type: 'array', items: { type: 'integer' } },
          imageQuery: { type: 'string' },
        },
        required: [
          'template',
          'kicker',
          'heading',
          'lead',
          'body',
          'analysis',
          'stats',
          'timeline',
          'qa',
          'quote',
          'sources',
          'imageQuery',
        ],
        additionalProperties: false,
      },
    },
    watch: { type: 'array', items: { type: 'string' } },
  },
  required: ['title', 'subtitle', 'summary', 'briefing', 'stories', 'watch'],
  additionalProperties: false,
};

// ---------- 응답 정리 ----------

const QUOTE = /["'“”‘’「」]/;

/**
 * 모델이 지시와 달리 제목 전체를 따옴표로 감싸 오면 걷어 냅니다.
 * 이 대통령 "땅 뺏는 것 아니다"처럼 제목 안의 인용은 그대로 둡니다
 */
export const clean = (value: string) => {
  const text = value.trim();
  const inner = text.slice(1, -1);
  const wrapped =
    text.length > 2 &&
    QUOTE.test(text[0]) &&
    QUOTE.test(text[text.length - 1]) &&
    !QUOTE.test(inner);
  return (wrapped ? inner : text).trim();
};

/** 모델이 지시와 달리 붙인 글머리 기호를 걷어 냅니다 */
const unbullet = (value: string) => value.trim().replace(/^[-•·*]\s*/, '');

const list = (items: string[], max: number) =>
  items.map(unbullet).filter(Boolean).slice(0, max);

/** 각 필드를 다듬고, 값이 모두 있는 항목만 max개까지 */
const rows = <T extends Record<string, string>>(items: T[], max: number) =>
  items
    .map(
      (item) =>
        Object.fromEntries(
          Object.entries(item).map(([k, v]) => [k, unbullet(v)]),
        ) as T,
    )
    .filter((item) => Object.values(item).every(Boolean))
    .slice(0, max);

/**
 * 템플릿의 고유 요소가 모자라면 해설형으로 바꾼다 (빈 지표 카드나 한 줄짜리 타임라인을 그리지 않게).
 * 해당하지 않는 템플릿의 요소는 비운다
 */
export function settleTemplate(story: Story): Story {
  const enough: Record<Template, boolean> = {
    numbers: story.stats.length >= LIMITS.stats.min,
    timeline: story.timeline.length >= LIMITS.timeline.min,
    qa: story.qa.length >= LIMITS.qa.min,
    quote: Boolean(story.quote.text && story.quote.by),
    analysis: true,
    brief: true,
  };
  const template: Template =
    TEMPLATES.includes(story.template) && enough[story.template]
      ? story.template
      : 'analysis';
  return {
    ...story,
    template,
    stats: template === 'numbers' ? story.stats : [],
    timeline: template === 'timeline' ? story.timeline : [],
    qa: template === 'qa' ? story.qa : [],
    quote: template === 'quote' ? story.quote : { text: '', by: '' },
    analysis: template === 'brief' ? '' : story.analysis,
  };
}

/**
 * 응답을 정리하고, 저장하면 안 되는 모양이면 오류를 던집니다.
 * toOriginal: 쓰기 단계 기사 번호(1부터) → 원래 기사 번호(1부터). 없는 번호는 버린다
 */
export function normalize(
  raw: WrittenNewsletter,
  toOriginal: (n: number) => number | undefined,
): WrittenNewsletter {
  const stories = raw.stories
    .map((s) => ({
      template: s.template,
      kicker: s.kicker.trim(),
      heading: clean(s.heading),
      lead: s.lead.trim(),
      body: s.body.trim(),
      analysis: s.analysis.trim(),
      stats: rows(s.stats, LIMITS.stats.max),
      timeline: rows(s.timeline, LIMITS.timeline.max),
      qa: rows(s.qa, LIMITS.qa.max),
      quote: { text: clean(s.quote.text), by: s.quote.by.trim() },
      imageQuery: s.imageQuery.trim(),
      sources: [
        ...new Set(
          s.sources
            .filter(Number.isInteger)
            .map(toOriginal)
            .filter((n): n is number => n !== undefined),
        ),
      ],
    }))
    .map(settleTemplate)
    .filter((s) => s.heading && (s.lead || s.body))
    .slice(0, LIMITS.stories);

  const result = {
    title: clean(raw.title),
    subtitle: clean(raw.subtitle),
    summary: raw.summary.trim(),
    briefing: raw.briefing.trim(),
    stories,
    watch: list(raw.watch, LIMITS.watch.max),
  };
  if (!result.title) throw new Error('빈 제목');
  if (!result.stories.length) throw new Error('소식이 없음');
  return result;
}

/** 고른 묶음에서 대표 기사만 꺼낸다 (중요한 묶음 순서 유지) */
export function pickArticles(clusters: Cluster[], picks: number[]) {
  return [...new Set(picks)]
    .filter((n) => Number.isInteger(n) && n >= 1 && n <= clusters.length)
    .slice(0, LIMITS.stories)
    .flatMap((n) => clusters[n - 1].articles.slice(0, LIMITS.articlesPerStory));
}

@Injectable()
export class NewsletterWriterService {
  constructor(private readonly claude: ClaudeService) {}

  /**
   * 기사 → 뉴스레터 한 편.
   * 1. 전처리: 상투 문구 제거, 길이 제한, 같은 사건 묶기 (호출 없음)
   * 2. 고르기: 가벼운 모델에 묶음의 제목·첫 부분만 → 주요 소식 번호 (묶음이 하나면 건너뜀)
   * 3. 쓰기: 기본 모델에 고른 소식의 대표 기사만 → 제목·요약·본문 JSON
   */
  async write(articles: SourceArticle[], category?: string) {
    const clusters = clusterArticles(prepare(articles));
    const usage: Usage[] = [];

    let chosen = clusters.length === 1 ? clusters[0].articles : [];
    if (!chosen.length) {
      const selected = await this.claude.generate({
        model: CLAUDE_FAST_MODEL,
        system: SELECT_SYSTEM,
        prompt: selectPrompt(clusters, category),
        schema: SELECT_SCHEMA,
        effort: 'low',
        maxTokens: 2048,
      });
      usage.push(selected.usage);
      chosen = pickArticles(
        clusters,
        (JSON.parse(selected.text) as { picks: number[] }).picks,
      );
      if (!chosen.length) throw new Error('고른 소식이 없음');
    }

    // 뉴스레터 본문이 되는 호출이라 effort를 높입니다.
    const written = await this.claude.generate({
      system: WRITER_SYSTEM,
      prompt: writerPrompt(chosen, category),
      schema: WRITER_SCHEMA,
      effort: 'medium',
      maxTokens: 12000,
    });
    usage.push(written.usage);

    const newsletter = normalize(
      JSON.parse(written.text) as WrittenNewsletter,
      (n) => (chosen[n - 1] ? chosen[n - 1].index + 1 : undefined),
    );
    const tokens = usage.reduce((sum, u) => sum + u.input + u.output, 0);
    return { newsletter, tokens, usage };
  }
}
