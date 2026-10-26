import { Injectable } from '@nestjs/common';
import { ClaudeService } from './claude.service';

/**
 * 뉴스레터 한 편 (#41, #42, #43)
 * 제목·부제목 + 짧은 AI 요약 + 여는 말 → 소식 1~3개(한 줄 핵심 · 포인트 · 왜 중요한지) → 맺는 말
 */
export type Story = {
  heading: string;
  lead: string;
  points: string[];
  why: string;
  sources: number[];
};
export type WrittenNewsletter = {
  title: string;
  subtitle: string;
  summary: string;
  intro: string;
  stories: Story[];
  outro: string;
};

export type SourceArticle = {
  title: string;
  content: string;
  source?: string;
};

export const LIMITS = {
  title: 30,
  subtitle: 60,
  summary: 300,
  intro: 120,
  stories: 3,
  lead: 60,
  points: { min: 2, max: 3, length: 70 },
  why: { min: 250, max: 450 },
  outro: 80,
} as const;

export const WRITER_SYSTEM =
  'You are the editor of a Korean daily news newsletter. You pick only the truly major stories and write in Korean.';

/** 기사에 번호를 붙여, 소식마다 근거 기사를 번호로 받습니다 (썸네일·관련 기사를 실제로 쓴 기사에서 고르기 위해) */
export const numberArticles = (articles: SourceArticle[]) =>
  articles
    .map(
      (a, i) =>
        `[${i + 1}]${a.source ? ` (${a.source})` : ''} ${a.title}\n${a.content}`,
    )
    .join('\n\n');

export const writerPrompt = (articles: SourceArticle[], category?: string) =>
  [
    `아래는 오늘 수집한 ${category ? `${category} 분야 ` : ''}기사 ${articles.length}건입니다. 이걸로 뉴스레터 한 편을 써 주세요.`,
    '',
    '## 소식 고르기',
    `- 정말 주요한 소식만 최대 ${LIMITS.stories}개 고릅니다. 기준을 넘는 소식이 적으면 1~2개만 씁니다. 개수를 채우려고 덜 중요한 소식을 넣지 않습니다.`,
    '- 주요한 소식: 많은 사람의 생활·돈·안전에 영향을 주거나, 정책·시장·국제 정세를 바꾸거나, 여러 언론이 함께 다룬 사건.',
    '- 빼는 소식: 시상식·행사·후보 발표, 기업 홍보, 연예·가십, 단순 인사·동정, 지역 단신.',
    ...(category
      ? [
          `- ${category} 분야에 해당하는 소식을 고릅니다. 다른 분야 기사가 섞여 있으면 뺍니다.`,
        ]
      : []),
    '- 같은 사건을 다룬 기사는 한 소식으로 합칩니다.',
    '',
    '## 말투',
    '- 구독자에게 오늘 소식을 정리해 주는 뉴스레터입니다. 기사체(~했다)가 아니라 친근하고 또렷한 해요체(~했어요, ~이에요)로 씁니다.',
    '- 어려운 용어는 풀어서 설명합니다. 과장, 감탄, 이모지는 쓰지 않습니다.',
    '',
    '## 쓰기',
    `- title: 가장 중요한 소식 하나를 담은 헤드라인. ${LIMITS.title}자 이내. 헤드라인이므로 해요체가 아닌 명사형·기사 제목 형식. 여러 소식을 ·, 쉼표, "외"로 나열하지 않고, 날짜·"주요 소식"·"브리핑" 같은 말은 넣지 않습니다.`,
    `- subtitle: 나머지 소식을 한 문장으로. ${LIMITS.subtitle}자 이내. 소식이 하나뿐이면 그 소식의 의미를 한 문장으로.`,
    `- summary: 오늘 뉴스레터 전체를 2~3문장, ${LIMITS.summary}자 이내로. 해요체.`,
    `- intro: 오늘 뉴스레터를 여는 말 1~2문장, ${LIMITS.intro}자 이내. 오늘 어떤 소식을 골랐는지 한눈에 알려 줍니다. "안녕하세요" 같은 판에 박힌 인사는 쓰지 않습니다.`,
    '- stories: 고른 소식마다',
    '  - heading: 소제목, 25자 이내.',
    `  - lead: 이 소식의 핵심 한 문장, ${LIMITS.lead}자 이내.`,
    `  - points: 꼭 알아야 할 사실 ${LIMITS.points.min}~${LIMITS.points.max}개. 하나에 ${LIMITS.points.length}자 이내의 짧은 문장. 숫자·날짜·누가 무엇을 했는지 위주로.`,
    `  - why: 왜 중요한지, 나와 어떤 관련이 있는지, 앞으로 무엇을 지켜봐야 하는지 ${LIMITS.why.min}~${LIMITS.why.max}자. 짧은 문단 1~2개, 문단 사이는 빈 줄 하나. points와 같은 문장을 반복하지 않습니다.`,
    '  - sources: 이 소식의 근거가 된 기사 번호 (가장 대표적인 기사를 먼저).',
    `- outro: 맺는 말 한 문장, ${LIMITS.outro}자 이내. 오늘 소식에서 이어 볼 만한 것이나 다음에 지켜볼 일정.`,
    '- 숫자·이름·날짜는 기사에 있는 그대로 쓰고, 기사에 없는 내용은 더하지 않습니다.',
    '- 마크다운, HTML, 글머리 기호 문자(-, •)는 쓰지 않습니다. 따옴표로 제목을 감싸지 않습니다.',
    '',
    '## 기사',
    numberArticles(articles),
  ].join('\n');

const WRITER_SCHEMA = {
  type: 'object',
  properties: {
    title: { type: 'string' },
    subtitle: { type: 'string' },
    summary: { type: 'string' },
    intro: { type: 'string' },
    stories: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          heading: { type: 'string' },
          lead: { type: 'string' },
          points: { type: 'array', items: { type: 'string' } },
          why: { type: 'string' },
          sources: { type: 'array', items: { type: 'integer' } },
        },
        required: ['heading', 'lead', 'points', 'why', 'sources'],
        additionalProperties: false,
      },
    },
    outro: { type: 'string' },
  },
  required: ['title', 'subtitle', 'summary', 'intro', 'stories', 'outro'],
  additionalProperties: false,
};

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

/** 응답을 정리하고, 저장하면 안 되는 모양이면 오류를 던집니다 */
export function normalize(
  raw: WrittenNewsletter,
  articleCount: number,
): WrittenNewsletter {
  const stories = raw.stories
    .map((s) => ({
      heading: clean(s.heading),
      lead: s.lead.trim(),
      points: s.points
        .map(unbullet)
        .filter(Boolean)
        .slice(0, LIMITS.points.max),
      why: s.why.trim(),
      // 없는 번호는 버리고 중복을 없앤다
      sources: [...new Set(s.sources)].filter(
        (n) => Number.isInteger(n) && n >= 1 && n <= articleCount,
      ),
    }))
    .filter((s) => s.heading && (s.lead || s.why))
    .slice(0, LIMITS.stories);

  const result = {
    title: clean(raw.title),
    subtitle: clean(raw.subtitle),
    summary: raw.summary.trim(),
    intro: raw.intro.trim(),
    stories,
    outro: raw.outro.trim(),
  };
  if (!result.title) throw new Error('빈 제목');
  if (!result.stories.length) throw new Error('소식이 없음');
  return result;
}

@Injectable()
export class NewsletterWriterService {
  constructor(private readonly claude: ClaudeService) {}

  /** 기사 → 뉴스레터 한 편. 제목·요약·본문을 한 번의 호출에서 JSON으로 받습니다 */
  async write(articles: SourceArticle[], category?: string) {
    // 뉴스레터 본문이 되는 호출이라 다른 호출보다 effort를 높입니다.
    const { text, tokens } = await this.claude.generate({
      system: WRITER_SYSTEM,
      prompt: writerPrompt(articles, category),
      schema: WRITER_SCHEMA,
      effort: 'medium',
      maxTokens: 12000,
    });
    const newsletter = normalize(
      JSON.parse(text) as WrittenNewsletter,
      articles.length,
    );
    return { newsletter, tokens };
  }
}
