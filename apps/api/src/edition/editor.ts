import type { ParsedStory } from './parse';
import { storyText } from './parse';

/**
 * 하루 한 번, 그날 나온 전 분야 소식을 한꺼번에 보고 편집한다 (#55).
 * 구독자마다 쓰지 않는다: 여기서 정한 중요도·같은 사건·분야를 넘는 흐름으로
 * 구독자의 분야 조합에 맞는 한 통을 코드로 엮는다 (compose.ts). 구독자가 늘어도 호출은 하루 한 번
 */

/** 편집할 뉴스레터 한 편 (그날 한 분야) */
export type EditionSource = {
  newsletterId: number;
  categoryId: number;
  category: string;
  title: string;
  stories: ParsedStory[];
};

/** 소식 번호: "뉴스레터 id-소식 순서(1부터)" */
export const storyRef = (newsletterId: number, index: number) =>
  `${newsletterId}-${index + 1}`;

export type Thread = { refs: string[]; title: string; text: string };

export type Editorial = {
  /** 소식별 중요도(1~5)와 한눈에 보기용 한 줄 */
  ranking: Record<string, { importance: number; line: string }>;
  /** 같은 사건을 다룬 소식 묶음 (분야가 달라도) */
  duplicates: string[][];
  /** 서로 다른 분야 소식을 잇는 흐름 */
  threads: Thread[];
};

export const EDITION_LIMITS = {
  line: 60,
  threads: 3,
  threadTitle: 30,
  threadText: 300,
};

export const EDITOR_SYSTEM =
  'You are the managing editor of a Korean daily news briefing. You judge news value across sections and write precise, analytical Korean.';

export const editorPrompt = (sources: EditionSource[]) => {
  const list = sources
    .flatMap((s) =>
      s.stories.map((story, i) =>
        [
          `[${storyRef(s.newsletterId, i)}] (${s.category}) ${story.heading}`,
          story.lead && `리드: ${story.lead}`,
          `본문: ${storyText(story)}`,
        ]
          .filter(Boolean)
          .join('\n'),
      ),
    )
    .join('\n\n');

  return `오늘 분야별 뉴스레터에 실린 소식입니다. 구독자는 여러 분야를 골라 한 통의 메일로 받습니다.
이 메일을 엮을 편집 정보를 만드세요. 소식 번호는 [ ] 안의 값을 그대로 씁니다.

${list}

1. ranking: 모든 소식에 대해
   - importance: 1~5. 분야를 가리지 않고 독자에게 미치는 영향·파장·새로움으로 판단 (5: 오늘 꼭 알아야 할 소식, 1: 단신)
   - line: 한눈에 보기용 한 줄 (${EDITION_LIMITS.line}자 이내, 평서체 '~했다'). 제목을 되풀이하지 말고 핵심 사실·수치를 담는다
2. duplicates: 분야가 달라도 같은 사건을 다룬 소식 번호 묶음. 없으면 빈 배열
3. threads: 서로 다른 분야의 소식이 한 흐름으로 이어질 때만 (최대 ${EDITION_LIMITS.threads}개, 억지로 만들지 않는다)
   - refs: 이어지는 소식 번호 (서로 다른 분야 2개 이상, 두 분야를 잇는 흐름을 우선)
   - title: ${EDITION_LIMITS.threadTitle}자 이내 (예: "반도체 수출 규제가 증시로")
   - text: 2~3문장. 어떻게 이어지는지, 독자가 무엇을 봐야 하는지. 근거는 소식에 있는 사실만`;
};

export const EDITOR_SCHEMA = {
  type: 'object',
  properties: {
    ranking: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          ref: { type: 'string' },
          importance: { type: 'integer' },
          line: { type: 'string' },
        },
        required: ['ref', 'importance', 'line'],
        additionalProperties: false,
      },
    },
    duplicates: {
      type: 'array',
      items: { type: 'array', items: { type: 'string' } },
    },
    threads: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          refs: { type: 'array', items: { type: 'string' } },
          title: { type: 'string' },
          text: { type: 'string' },
        },
        required: ['refs', 'title', 'text'],
        additionalProperties: false,
      },
    },
  },
  required: ['ranking', 'duplicates', 'threads'],
  additionalProperties: false,
};

type RawEditorial = {
  ranking: { ref: string; importance: number; line: string }[];
  duplicates: string[][];
  threads: Thread[];
};

const cut = (value: string, max: number) => {
  const text = value.replace(/\s+/g, ' ').trim();
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
};

/**
 * 응답 정리. 없는 소식 번호는 버리고, 중요도는 1~5로, 흐름은 두 분야 이상일 때만 남긴다.
 * categoryOf: 소식 번호 → 분야 id (없는 번호면 undefined)
 */
export function normalizeEditorial(
  raw: RawEditorial,
  categoryOf: (ref: string) => number | undefined,
): Editorial {
  const valid = (ref: string) => categoryOf(ref) !== undefined;
  const unique = (refs: string[]) => [...new Set(refs.filter(valid))];

  const ranking: Editorial['ranking'] = {};
  for (const r of raw.ranking) {
    if (!valid(r.ref) || ranking[r.ref]) continue;
    const importance = Math.round(Number(r.importance));
    ranking[r.ref] = {
      importance: Number.isFinite(importance)
        ? Math.min(5, Math.max(1, importance))
        : 3,
      line: cut(r.line, EDITION_LIMITS.line),
    };
  }

  const duplicates = raw.duplicates
    .map(unique)
    .filter((group) => group.length >= 2);

  const threads = raw.threads
    .map((t) => ({
      refs: unique(t.refs),
      title: cut(t.title, EDITION_LIMITS.threadTitle),
      text: cut(t.text, EDITION_LIMITS.threadText),
    }))
    .filter(
      (t) => t.title && t.text && new Set(t.refs.map(categoryOf)).size >= 2,
    )
    .slice(0, EDITION_LIMITS.threads);

  return { ranking, duplicates, threads };
}
