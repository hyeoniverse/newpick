import { Injectable, Logger } from '@nestjs/common';
import { OpenModelService } from '../ai/open-model.service';
import { ClaudeService, CLAUDE_FAST_MODEL } from './claude.service';
import {
  Cluster,
  clusterArticles,
  embeddingText,
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
/** 같은 사건을 두고 언론사마다 다른 해석 · 주장 (다양한 시각) */
export type Perspective = { source: string; view: string };

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
  /** 언론사별 시각. 같은 사건을 다른 언론사가 다르게 해석 · 주장할 때만 2~3개, 아니면 빈 배열 */
  perspectives: Perspective[];
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
  /** 키워드 3~6개 (#50). 상세·목록의 태그, 지난 뉴스레터 검색(#20)에 쓴다 */
  keywords: string[];
};

export type SourceArticle = {
  title: string;
  content: string;
  source?: string;
};

export type Usage = {
  model: string;
  input: number;
  output: number;
  stage?: string;
};

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
  keywords: { min: 3, max: 6, length: 12 },
  /** 형광펜 강조 (#51): 소식마다 최대 개수, 한 곳 최대 길이 */
  marks: { max: 3, length: 30 },
  /** 쓰기 단계에 소식 하나당 보내는 기사 수 (같은 사건의 대표 기사, 다른 언론사 먼저) */
  articlesPerStory: 2,
  /** 시각이 갈리기 쉬운 분야(PERSPECTIVE_CATEGORIES)는 더 많이 보내 언론사별 주장을 비교하게 */
  articlesPerStoryWide: 3,
  /** 언론사별 시각: 최대 개수, 한 시각 최대 길이 */
  perspectives: { max: 3, view: 80 },
} as const;

/** 같은 사건을 두고 언론사마다 해석 · 주장이 갈리기 쉬운 분야: 기사를 더 보내고 시각 비교를 더 챙긴다 */
export const PERSPECTIVE_CATEGORIES = ['정치', '사회'];

/**
 * 중요도 점수표. 예전엔 '여러 언론이 함께 다룬 사건'을 앞세워,
 * 한 곳만 먼저 보도한 큰 소식(예: 앤트로픽 나스닥 상장 신청)이 국내 지수 기사에 밀렸다.
 * 묶음마다 네 가지를 1~5점으로 매기고 합계로 고른다. 보도 수는 합계가 같을 때만 본다
 */
export const SCORE_AXES = {
  impact: '파급',
  novelty: '새로움',
  relevance: '관심사',
  followup: '후속',
} as const;
export type ScoreAxis = keyof typeof SCORE_AXES;

export type ClusterScore = Record<ScoreAxis, number> & {
  /** 묶음 번호 (1부터) */
  n: number;
  /** 빼는 소식(행사·홍보·연예 등)이면 점수와 상관없이 고르지 않는다 */
  excluded: boolean;
  /** 최근 뉴스레터에서 이미 다룬 사건이고 새 진전이 없음 → 고르지 않는다 (새 진전이 있으면 false, 후속으로 다룸) */
  repeat: boolean;
  /** 한 줄 이유 (AI 기록에 남긴다) */
  reason: string;
};

/** 합계(4~20)가 이 아래면 '주요 소식'이 아니다. 단, 하나도 없으면 가장 높은 하나는 싣는다 */
export const MIN_TOTAL = 13;

const SCORING_RULES = [
  '## 점수 (각 1~5점)',
  '- 파급: 영향을 받는 사람·돈·시장의 크기. 5 = 나라 전체나 세계 시장·산업 판도(대형 IPO·M&A, 금리·환율 결정, 주요국 정책), 3 = 한 업종이나 지역, 1 = 한 기업·개인.',
  '- 새로움: 오늘 처음 일어난 일인가. 5 = 결정·발표·사상 처음·최대·최저, 3 = 진행 중인 일의 새 국면, 1 = 예고·전망·반복 보도.',
  '- 관심사: 이 분야 독자가 꼭 알아야 하는가. 5 = 분야의 핵심 주제(해외 기업·시장이라도 분야 핵심이면 5), 1 = 분야와 거의 무관.',
  '- 후속: 앞으로 며칠~몇 달 다른 소식·시장·정책에 이어질 일인가. 5 = 큰 후속이 확실, 1 = 오늘로 끝.',
  '',
  '## 주의',
  '- 보도 수(한 곳만 보도했는지)는 점수에 넣지 않습니다. 한 언론만 먼저 보도한 큰 소식도 크게 봅니다.',
  '- 국내 소식이라고 더 높게, 해외 소식이라고 더 낮게 보지 않습니다. 영향의 크기로만 봅니다.',
  '- 빼는 소식(excluded: true): 시상식·행사·후보 발표, 기업 홍보·제품 리뷰, 연예·가십, 단순 인사·동정, 지역 단신, 광고성 기사.',
  '- reason은 점수의 근거를 40자 안의 한 줄로 씁니다.',
];

/** 최근 이 분야 뉴스레터에서 다룬 소식 (겹치지 않게 고르는 기준) */
const recentRules = (recentTopics: string[]) =>
  recentTopics.length
    ? [
        '',
        '## 최근 이 분야 뉴스레터에서 이미 다룬 소식',
        ...recentTopics.map((t) => `- ${t}`),
        '',
        '- 위와 같은 사건이면 새 진전(결정·결과·수치 변화·새 국면)이 있을 때만 후속으로 다루고(repeat: false), 새 진전 없이 같은 내용이면 repeat: true로 답합니다.',
        '- 위에 없는 새 사건은 repeat: false.',
      ]
    : ['', '- repeat는 모두 false로 답합니다.'];

// ---------- 1단계: 고르기 (가벼운 모델, 제목과 첫 부분만) ----------

export const SELECT_SYSTEM =
  'You are a senior news editor. You score every story candidly on a fixed rubric so the truly major stories of the day can be picked. Reply in Korean.';

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

export const selectPrompt = (
  clusters: Cluster[],
  category?: string,
  recentTopics: string[] = [],
) =>
  [
    `오늘 수집한 ${category ? `${category} 분야 ` : ''}소식 ${clusters.length}개입니다. 뉴스레터에는 이 가운데 정말 주요한 소식 최대 ${LIMITS.stories}개만 싣습니다. 고르는 건 점수 합계로 하므로, 모든 소식(1~${clusters.length}번)에 아래 점수표대로 점수를 매겨 주세요.`,
    '',
    ...SCORING_RULES,
    ...(category
      ? [`- ${category} 분야가 아닌 소식은 관심사 1점으로 매깁니다.`]
      : []),
    ...recentRules(recentTopics),
    '',
    describeClusters(clusters),
  ].join('\n');

const SELECT_SCHEMA = {
  type: 'object',
  properties: {
    scores: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          n: { type: 'integer' },
          impact: { type: 'integer' },
          novelty: { type: 'integer' },
          relevance: { type: 'integer' },
          followup: { type: 'integer' },
          excluded: { type: 'boolean' },
          repeat: { type: 'boolean' },
          reason: { type: 'string' },
        },
        required: [
          'n',
          'impact',
          'novelty',
          'relevance',
          'followup',
          'excluded',
          'repeat',
          'reason',
        ],
        additionalProperties: false,
      },
    },
  },
  required: ['scores'],
  additionalProperties: false,
};

const clampScore = (v: unknown) =>
  Math.min(5, Math.max(1, Math.round(Number(v)) || 1));

export const totalScore = (s: ClusterScore) =>
  (Object.keys(SCORE_AXES) as ScoreAxis[]).reduce(
    (sum, axis) => sum + clampScore(s[axis]),
    0,
  );

/**
 * 점수 → 실을 묶음 번호 (중요한 순서). 빼는 소식 · 없는 번호 · 중복은 버리고,
 * 합계 높은 순 → 같으면 보도 많은 순 → 앞 번호 순. MIN_TOTAL 아래는 싣지 않되, 다 모자라면 1등 하나만
 */
export function rankClusters(clusters: Cluster[], scores: ClusterScore[]) {
  const seen = new Set<number>();
  const ranked = scores
    .filter((s) => {
      const ok =
        Number.isInteger(s.n) &&
        s.n >= 1 &&
        s.n <= clusters.length &&
        !s.excluded &&
        !s.repeat &&
        !seen.has(s.n);
      seen.add(s.n);
      return ok;
    })
    .map((s) => ({ n: s.n, total: totalScore(s) }))
    .sort(
      (a, b) =>
        b.total - a.total ||
        clusters[b.n - 1].articles.length - clusters[a.n - 1].articles.length ||
        a.n - b.n,
    );
  const major = ranked.filter((s) => s.total >= MIN_TOTAL);
  return (major.length ? major : ranked.slice(0, 1))
    .slice(0, LIMITS.stories)
    .map((s) => s.n);
}

/** AI 기록에 남길 고르기 결과: 합계 높은 순 5개까지, 실은 소식엔 ✓ */
export function describeScores(
  clusters: Cluster[],
  scores: ClusterScore[],
  picks: number[],
) {
  return scores
    .filter((s) => clusters[s.n - 1])
    .map((s) => ({ s, total: s.excluded || s.repeat ? 0 : totalScore(s) }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5)
    .map(({ s, total }) => {
      const mark = picks.includes(s.n) ? '✓' : ' ';
      const head = clusters[s.n - 1].articles[0].title;
      const detail = s.excluded
        ? '제외'
        : s.repeat
          ? '이미 다룸'
          : `${total}점 (${(Object.keys(SCORE_AXES) as ScoreAxis[])
              .map((axis) => `${SCORE_AXES[axis]} ${clampScore(s[axis])}`)
              .join(' · ')})`;
      return `${mark} ${head} — ${detail}. ${s.reason}`;
    })
    .join('\n');
}

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

export const writerPrompt = (
  articles: PrepArticle[],
  category?: string,
  existingTags: string[] = [],
  recentTopics: string[] = [],
) =>
  [
    `아래 ${category ? `${category} 분야 ` : ''}기사 ${articles.length}건은 오늘 뉴스레터에 실을 소식으로 이미 고른 것입니다. 이걸로 전문가용 뉴스 브리핑 한 편을 써 주세요. 같은 사건을 다룬 기사는 한 소식으로 합칩니다.`,
    '',
    '## 문체',
    '- 증권사·연구소 애널리스트 브리핑처럼 간결한 평서체(~다)로 씁니다. 감탄, 과장, 구어체, 이모지는 쓰지 않습니다.',
    '- 첫 문장에 사실(누가, 무엇을, 얼마나)을 쓰고 이어서 맥락을 씁니다. 형용사보다 수치와 근거를 씁니다.',
    '- 전문 용어는 그대로 쓰되, 처음 나올 때 괄호로 짧게 풉니다.',
    `- 강조: body·analysis·qa의 답(a)에서 독자가 꼭 기억할 핵심 구절(결정적 수치, 결론, 변화)을 ==구절==로 감쌉니다. 소식마다 1~${LIMITS.marks.max}곳(모든 소식에 최소 1곳), 한 곳은 ${LIMITS.marks.length}자 이내. 문장 전체가 아니라 핵심 구절만 감싸고, 다른 항목에는 쓰지 않습니다.`,
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
    `  - perspectives: 언론사별 시각. 같은 사건을 다룬 기사가 서로 다른 언론사에서 왔고, 해석 · 평가 · 주장(원인을 어디서 찾는지, 누구 책임으로 보는지, 정책을 찬성하는지 등)이 서로 다를 때만 언론사마다 하나씩 ${LIMITS.perspectives.max}개까지 (source: 기사에 표시된 언론사 이름 그대로, view: 그 언론이 강조하는 주장 · 해석 ${LIMITS.perspectives.view}자 이내). 어느 쪽 편도 들지 않고 각 기사에 있는 주장만 요약하며, 기사에 없는 입장을 지어내지 않습니다. 언론사가 하나뿐이거나 사실 전달만 같고 시각 차이가 없으면 빈 배열.`,
    '  - sources: 이 소식의 근거 기사 번호 (가장 대표적인 기사를 먼저).',
    '  - imageQuery: 이 소식에 어울리는 사진 검색어. 영어 2~4단어. 사람이 나오지 않는 사물·풍경 위주로 (자료 사진 속 인물이 기사 속 인물로 오해받지 않게). 실존 인물 이름·기업 로고 금지 (예: "stock market screen", "farmland korea", "ballot box").',
    `- watch: 관전 포인트. 앞으로 지켜볼 일정·변수 1~${LIMITS.watch.max}개, 하나에 ${LIMITS.watch.length}자 이내. 기사에 나온 것만.`,
    `- keywords: 이 뉴스레터의 핵심 키워드 ${LIMITS.keywords.min}~${LIMITS.keywords.max}개, 하나에 ${LIMITS.keywords.length}자 이내. 독자가 검색할 만한 고유명사·주제어(예: 코스피, 가상자산 과세, CPTPP). # 기호와 분야 이름 자체는 넣지 않고, 중요한 순서로.`,
    ...(category && PERSPECTIVE_CATEGORIES.includes(category)
      ? [
          `- ${category} 분야는 같은 사안을 언론사마다 다르게 보는 경우가 많습니다. 같은 사건을 다룬 기사가 여러 언론사에서 왔으면 주장 · 해석의 차이를 꼼꼼히 비교해 perspectives를 채우고, body · analysis도 한쪽 시각만 따르지 않게 씁니다.`,
        ]
      : []),
    ...(existingTags.length
      ? [
          `- keywords는 같은 대상·주제면 이미 쓰고 있는 태그 표기를 그대로 다시 씁니다 (띄어쓰기·영문 표기까지 같게). 정말 새로운 대상일 때만 새 태그를 만듭니다. 이미 쓰는 태그: ${existingTags.join(', ')}`,
        ]
      : []),
    ...(recentTopics.length
      ? [
          `- 최근 이 분야에서 다룬 소식: ${recentTopics.join(' / ')}. 이와 이어지는 소식이면 이전 내용을 되풀이하지 말고 새로 달라진 점을 중심으로 씁니다.`,
        ]
      : []),
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

export const WRITER_SCHEMA = {
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
          perspectives: { type: 'array', items: pairs(['source', 'view']) },
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
          'perspectives',
          'sources',
          'imageQuery',
        ],
        additionalProperties: false,
      },
    },
    watch: { type: 'array', items: { type: 'string' } },
    keywords: { type: 'array', items: { type: 'string' } },
  },
  required: [
    'title',
    'subtitle',
    'summary',
    'briefing',
    'stories',
    'watch',
    'keywords',
  ],
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

/** 강조 표시 ==구절== (#51). 본문을 HTML로 바꿀 때 <mark>가 된다 */
const MARK = /==([^=\n]+?)==/g;

/** 강조를 쓰지 않는 항목(제목·요약·키워드 등)에 섞여 들어온 ==를 지운다 */
export const plain = (text: string) =>
  text.replace(MARK, '$1').replace(/==/g, '').trim();

/**
 * 소식 하나의 강조를 앞에서부터 max곳까지만 남기고, 너무 긴 강조와 나머지는 푼다.
 * 문단 전체가 칠해지면 강조가 아니게 되므로 길이도 제한한다
 */
export function limitMarks(
  texts: string[],
  max: number = LIMITS.marks.max,
  length: number = LIMITS.marks.length,
): string[] {
  let kept = 0;
  return texts.map((text) =>
    text
      // 남길 강조는 잠시 다른 문자로 바꿔 두고
      .replace(MARK, (_, inner: string) => {
        const phrase = inner.trim();
        if (phrase && phrase.length <= length && kept < max) {
          kept++;
          return `\u0001${phrase}\u0002`;
        }
        return inner;
      })
      // 짝이 맞지 않아 남은 ==는 지운 뒤 되돌린다
      .replace(/==/g, '')
      .replace(/[\u0001\u0002]/g, '=='),
  );
}

/** 모델이 지시와 달리 붙인 글머리 기호를 걷어 냅니다 */
const unbullet = (value: string) => plain(value).replace(/^[-•·*]\s*/, '');

const list = (items: string[], max: number) =>
  items.map(unbullet).filter(Boolean).slice(0, max);

/** '#'·공백 정리, 너무 긴 것 버리기, 대소문자 무시 중복 제거, 최대 6개 */
export const keywords = (items: string[]) => {
  const seen = new Set<string>();
  return items
    .map((k) => plain(k).replace(/^#+/, '').replace(/\s+/g, ' ').trim())
    .filter((k) => k && k.length <= LIMITS.keywords.length)
    .filter((k) => {
      const key = k.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, LIMITS.keywords.max);
};

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
/**
 * 언론사별 시각 정리: 빈 칸 · 같은 언론사 중복을 빼고, 서로 다른 언론사가 둘 이상일 때만 남긴다 (하나면 '시각 비교'가 아니다)
 */
export function perspectivesOf(list: Perspective[] = []): Perspective[] {
  const seen = new Set<string>();
  const views = list
    .map((p) => ({ source: plain(p.source), view: plain(p.view) }))
    .filter(
      (p) => p.source && p.view && !seen.has(p.source) && seen.add(p.source),
    )
    .slice(0, LIMITS.perspectives.max);
  return views.length >= 2 ? views : [];
}

export function normalize(
  raw: WrittenNewsletter,
  toOriginal: (n: number) => number | undefined,
): WrittenNewsletter {
  const stories = raw.stories
    .map((s) => {
      const qa = s.qa
        .map((x) => ({ q: unbullet(x.q), a: x.a.trim() }))
        .filter((x) => x.q && plain(x.a))
        .slice(0, LIMITS.qa.max);
      // 강조는 본문 → 시사점 → 문답 답 순서로 소식마다 최대 3곳
      const [body, analysis, ...answers] = limitMarks([
        s.body.trim(),
        s.analysis.trim(),
        ...qa.map((x) => x.a),
      ]);
      return {
        template: s.template,
        kicker: plain(s.kicker),
        heading: clean(plain(s.heading)),
        lead: plain(s.lead),
        body,
        analysis,
        stats: rows(s.stats, LIMITS.stats.max),
        timeline: rows(s.timeline, LIMITS.timeline.max),
        qa: qa.map((x, i) => ({ q: x.q, a: answers[i] })),
        quote: { text: clean(plain(s.quote.text)), by: plain(s.quote.by) },
        perspectives: perspectivesOf(s.perspectives),
        imageQuery: s.imageQuery.trim(),
        sources: [
          ...new Set(
            s.sources
              .filter(Number.isInteger)
              .map(toOriginal)
              .filter((n): n is number => n !== undefined),
          ),
        ],
      };
    })
    .map(settleTemplate)
    .filter((s) => s.heading && (s.lead || s.body))
    .slice(0, LIMITS.stories);

  const result = {
    title: clean(plain(raw.title)),
    subtitle: clean(plain(raw.subtitle)),
    summary: plain(raw.summary),
    briefing: plain(raw.briefing),
    stories,
    watch: list(raw.watch, LIMITS.watch.max),
    keywords: keywords(raw.keywords),
  };
  if (!result.title) throw new Error('빈 제목');
  if (!result.stories.length) throw new Error('소식이 없음');
  return result;
}

/**
 * 한 묶음(같은 사건)에서 보낼 기사: 서로 다른 언론사 기사를 먼저(언론사별 시각을 비교할 수 있게),
 * 그다음 남은 기사. 묶음 안은 이미 긴 기사(정보가 많은) 순서
 */
export function diverseArticles(articles: PrepArticle[], count: number) {
  const seen = new Set<string>();
  const firstOfSource = articles.filter((a) => {
    const key = a.source || `#${a.index}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  const rest = articles.filter((a) => !firstOfSource.includes(a));
  return [...firstOfSource, ...rest].slice(0, count);
}

/** 고른 묶음에서 대표 기사만 꺼낸다 (중요한 묶음 순서 유지). 시각이 갈리기 쉬운 분야는 더 많이 */
export function pickArticles(
  clusters: Cluster[],
  picks: number[],
  category?: string,
) {
  const perStory =
    category && PERSPECTIVE_CATEGORIES.includes(category)
      ? LIMITS.articlesPerStoryWide
      : LIMITS.articlesPerStory;
  return [...new Set(picks)]
    .filter((n) => Number.isInteger(n) && n >= 1 && n <= clusters.length)
    .slice(0, LIMITS.stories)
    .flatMap((n) => diverseArticles(clusters[n - 1].articles, perStory));
}

@Injectable()
export class NewsletterWriterService {
  private readonly logger = new Logger(NewsletterWriterService.name);

  constructor(
    private readonly claude: ClaudeService,
    private readonly open: OpenModelService,
  ) {}

  /**
   * 같은 사건 묶기용 임베딩 (bge-m3, 무료 할당 안). 설정이 없거나 할당 초과 · 장애면 null → 제목으로만 묶는다
   * (뉴스레터는 멈추지 않는다). 한 번에 50건씩
   */
  private async embeddings(articles: PrepArticle[]) {
    if (!this.open.configured || articles.length < 2) return null;
    try {
      const vectors: number[][] = [];
      for (let i = 0; i < articles.length; i += 50) {
        vectors.push(
          ...(await this.open.embed(
            articles.slice(i, i + 50).map(embeddingText),
          )),
        );
      }
      return vectors;
    } catch (error) {
      this.logger.warn(
        `같은 사건 묶기 임베딩 실패, 제목으로만 묶음: ${(error as Error).message}`,
      );
      return null;
    }
  }

  /**
   * 기사 → 뉴스레터 한 편.
   * 1. 전처리: 상투 문구 제거, 길이 제한, 같은 사건 묶기 (호출 없음)
   * 2. 고르기: 가벼운 모델에 묶음의 제목·첫 부분만 → 주요 소식 번호 (묶음이 하나면 건너뜀)
   * 3. 쓰기: 기본 모델에 고른 소식의 대표 기사만 → 제목·요약·본문 JSON
   */
  async write(
    articles: SourceArticle[],
    category?: string,
    hints: { existingTags?: string[]; recentTopics?: string[] } = {},
  ) {
    const { existingTags = [], recentTopics = [] } = hints;
    const prepared = prepare(articles);
    const clusters = clusterArticles(
      prepared,
      (await this.embeddings(prepared)) ?? undefined,
    );
    const usage: Usage[] = [];

    let chosen = clusters.length === 1 ? clusters[0].articles : [];
    // 고르기 점수 요약 (AI 기록에 남긴다). 묶음이 하나면 고르지 않아 비어 있다
    let selection = '';
    if (!chosen.length) {
      const selected = await this.claude.generate({
        model: CLAUDE_FAST_MODEL,
        system: SELECT_SYSTEM,
        prompt: selectPrompt(clusters, category, recentTopics),
        schema: SELECT_SCHEMA,
        effort: 'low',
        // 묶음마다 점수 한 줄씩 (30묶음이면 2천 토큰 남짓)
        maxTokens: 6000,
      });
      usage.push({ ...selected.usage, stage: 'select' });
      const { scores } = JSON.parse(selected.text) as {
        scores: ClusterScore[];
      };
      const picks = rankClusters(clusters, scores);
      selection = describeScores(clusters, scores, picks);
      chosen = pickArticles(clusters, picks, category);
      if (!chosen.length) throw new Error('고른 소식이 없음');
    }

    // 뉴스레터 본문이 되는 호출이라 effort를 높입니다.
    const written = await this.claude.generate({
      system: WRITER_SYSTEM,
      prompt: writerPrompt(chosen, category, existingTags, recentTopics),
      schema: WRITER_SCHEMA,
      effort: 'medium',
      maxTokens: 12000,
    });
    usage.push({ ...written.usage, stage: 'write' });

    const newsletter = normalize(
      JSON.parse(written.text) as WrittenNewsletter,
      (n) => (chosen[n - 1] ? chosen[n - 1].index + 1 : undefined),
    );
    const tokens = usage.reduce((sum, u) => sum + u.input + u.output, 0);
    return { newsletter, tokens, usage, selection };
  }
}
