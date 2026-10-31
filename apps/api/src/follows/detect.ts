import { cosine } from 'src/ai-summary/articlePrep';

/**
 * 후속 지켜보기 판정. 지켜보는 소식마다 오늘 새 소식 가운데
 * 1. 임베딩이 비슷한 후보를 추리고 (호출 없음, 비슷한 주제)
 * 2. 오픈 모델이 "같은 사건 · 사안의 새 진전인가"를 판정한다 (비슷한 주제의 다른 일은 뺀다).
 * 오픈 모델을 못 쓰는 날은 아주 비슷한 것만 받아들인다
 */
export const FOLLOW_LIMITS = {
  /** 이만큼 비슷해야 판정 후보 (같은 사건의 며칠 뒤 소식은 같은 날 다른 언론사 기사보다 덜 비슷하다) */
  candidate: 0.55,
  /** 오픈 모델을 못 쓸 때 판정 없이 받아들이는 유사도 */
  autoAccept: 0.72,
  /** 지켜보는 소식 하나에 판정할 후보 수 */
  perFollow: 3,
  /** 이보다 오래된 지켜보기는 더 찾지 않는다 (일) */
  maxAgeDays: 60,
  /** 이유 한 줄 길이 */
  reason: 80,
};

export type FollowTarget = {
  id: number;
  heading: string;
  text: string;
  vector: number[];
};

export type NewStory = {
  newsletterId: number;
  storyIndex: number;
  category: string;
  heading: string;
  text: string;
  vector: number[];
};

/** 지켜보는 소식에 비슷한 새 소식 (유사도 큰 순, 다른 뉴스레터만) */
export function candidatesFor(
  follow: FollowTarget & { newsletterId: number },
  stories: NewStory[],
) {
  return stories
    .filter((s) => s.newsletterId !== follow.newsletterId)
    .map((story) => ({ story, score: cosine(follow.vector, story.vector) }))
    .filter((c) => c.score >= FOLLOW_LIMITS.candidate)
    .sort((a, b) => b.score - a.score)
    .slice(0, FOLLOW_LIMITS.perFollow);
}

export const JUDGE_SYSTEM =
  'You are a careful Korean news editor. You decide whether new stories are follow-ups of an earlier story. Reply in Korean.';

export const judgePrompt = (
  follow: Pick<FollowTarget, 'heading' | 'text'>,
  candidates: { story: Pick<NewStory, 'heading' | 'text' | 'category'> }[],
) =>
  [
    '독자가 지켜보는 소식입니다.',
    `제목: ${follow.heading}`,
    `내용: ${follow.text.slice(0, 600)}`,
    '',
    '오늘 나온 소식입니다.',
    ...candidates.map(
      (c, i) =>
        `[${i + 1}] (${c.story.category}) ${c.story.heading}\n${c.story.text.slice(0, 400)}`,
    ),
    '',
    '소식마다 지켜보는 소식의 후속인지 판정합니다.',
    '- follow: true는 같은 사건 · 사안의 새 진전일 때만 (조사 결과 발표, 판결, 결정, 반응, 추가 피해, 일정 확정 등). 같은 분야 · 비슷한 주제의 다른 일이면 false.',
    `- reason: true면 무엇이 새로 나왔는지 ${FOLLOW_LIMITS.reason}자 이내 평서체 한 줄 (예: "민관합동조사단이 침투 경로를 확인했다"). false면 빈 문자열.`,
    '- 소식에 있는 사실만 씁니다.',
  ].join('\n');

export const JUDGE_SCHEMA = {
  type: 'object',
  properties: {
    results: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          n: { type: 'integer' },
          follow: { type: 'boolean' },
          reason: { type: 'string' },
        },
        required: ['n', 'follow', 'reason'],
        additionalProperties: false,
      },
    },
  },
  required: ['results'],
  additionalProperties: false,
};

/** 판정 결과 → 후속으로 받아들일 후보 번호(0부터)와 이유 */
export function acceptedFrom(raw: unknown, count: number) {
  const results = (raw as { results?: unknown[] })?.results;
  if (!Array.isArray(results)) return [];
  const seen = new Set<number>();
  return results.flatMap((r) => {
    const item = r as { n?: unknown; follow?: unknown; reason?: unknown };
    const index = Number(item.n) - 1;
    if (
      item.follow !== true ||
      !Number.isInteger(index) ||
      index < 0 ||
      index >= count ||
      seen.has(index)
    )
      return [];
    seen.add(index);
    const reason =
      typeof item.reason === 'string'
        ? item.reason.replace(/\s+/g, ' ').trim().slice(0, FOLLOW_LIMITS.reason)
        : '';
    return [{ index, reason }];
  });
}
