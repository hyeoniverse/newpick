import { Injectable } from '@nestjs/common';
import { ClaudeService } from './claude.service';

/** 뉴스레터 한 편 = 제목·부제목 + 짧은 AI 요약 + 주요 소식 1~3개 (#41, #42, #43) */
export type Story = { heading: string; body: string; sources: number[] };
export type WrittenNewsletter = {
  title: string;
  subtitle: string;
  summary: string;
  stories: Story[];
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
  stories: 3,
  storyBody: { min: 500, max: 800 },
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
    '## 쓰기',
    `- title: 가장 중요한 소식 하나를 담은 헤드라인. ${LIMITS.title}자 이내. 여러 소식을 ·, 쉼표, "외"로 나열하지 않고, 날짜·"주요 소식"·"브리핑" 같은 말은 넣지 않습니다.`,
    `- subtitle: 나머지 소식을 한 문장으로. ${LIMITS.subtitle}자 이내. 소식이 하나뿐이면 그 소식의 의미를 한 문장으로.`,
    `- summary: 오늘 뉴스레터 전체를 2~3문장, ${LIMITS.summary}자 이내로.`,
    `- stories: 고른 소식마다 heading(소제목, 25자 이내), body, sources.`,
    `  - body: ${LIMITS.storyBody.min}~${LIMITS.storyBody.max}자. 무슨 일이 있었는지, 배경, 앞으로의 영향이나 쟁점을 2~3문단으로. 문단 사이는 빈 줄 하나.`,
    '  - sources: 이 소식의 근거가 된 기사 번호 (가장 대표적인 기사를 먼저).',
    '- 숫자·이름·날짜는 기사에 있는 그대로 쓰고, 기사에 없는 내용은 더하지 않습니다.',
    '- 마크다운, HTML, 이모지, 인사말, 맺음말은 쓰지 않습니다. 따옴표로 제목을 감싸지 않습니다.',
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
    stories: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          heading: { type: 'string' },
          body: { type: 'string' },
          sources: { type: 'array', items: { type: 'integer' } },
        },
        required: ['heading', 'body', 'sources'],
        additionalProperties: false,
      },
    },
  },
  required: ['title', 'subtitle', 'summary', 'stories'],
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

/** 응답을 정리하고, 저장하면 안 되는 모양이면 오류를 던집니다 */
export function normalize(
  raw: WrittenNewsletter,
  articleCount: number,
): WrittenNewsletter {
  const stories = raw.stories
    .map((s) => ({
      heading: clean(s.heading),
      body: s.body.trim(),
      // 없는 번호는 버리고 중복을 없앤다
      sources: [...new Set(s.sources)].filter(
        (n) => Number.isInteger(n) && n >= 1 && n <= articleCount,
      ),
    }))
    .filter((s) => s.heading && s.body)
    .slice(0, LIMITS.stories);

  const result = {
    title: clean(raw.title),
    subtitle: clean(raw.subtitle),
    summary: raw.summary.trim(),
    stories,
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
