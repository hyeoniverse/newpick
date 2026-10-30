import { GENDER_RULES } from 'src/ai-summary/writingRules';
import type { ComposedEdition } from './compose';
import type { TasteProfile } from './personalize';

/**
 * 사람마다 쓰는 글 (#123 3단계): 메일 제목 · 맞춤 브리핑 · '오늘 한눈에' 소식마다 '나에게 왜'.
 * 소식 본문은 사람마다 다시 쓰지 않는다 (사실은 같고, 길어지면 비용 · 실패가 늘어난다).
 * 오픈 모델(Workers AI 무료 할당)로 쓰고, 안 되면 맞춤 순서만 있는 메일로 보낸다
 */
export type PersonalNote = {
  subject: string;
  briefing: string;
  /** 소식(ref)마다 그 사람에게 왜 중요한지 한 줄 */
  whys: Record<string, string>;
};

export const NOTE_LIMITS = { subject: 40, briefing: 220, why: 60, topics: 8 };

export const NOTE_SYSTEM =
  'You are the personal editor of a Korean news briefing. You write one short, precise note for one reader in Korean.';

/** '나에게 왜'를 쓸 소식: 관심 태그와 닿아 앞당긴 소식 · 다른 분야에서 더한 소식 (닿지 않은 소식은 한 줄 요약만으로 충분) */
export const whyTargets = (edition: ComposedEdition) => [
  ...edition.top.filter((t) => t.topics?.length).map((t) => t.ref),
  ...edition.extras.map((x) => x.ref),
];

export const notePrompt = (edition: ComposedEdition, profile: TasteProfile) => {
  const topics = profile.topics
    .slice(0, NOTE_LIMITS.topics)
    .map((t) => t.name)
    .join(', ');
  const stories = [
    ...edition.top.map(
      (t) => `[${t.ref}] (${t.category}) ${t.heading} — ${t.line}`,
    ),
    ...edition.extras.map(
      (x) =>
        `[${x.ref}] (${x.category}, 구독하지 않은 분야) ${x.heading} — ${x.line}`,
    ),
  ].join('\n');
  return [
    `이 독자가 요즘 북마크 · 스크랩한 주제: ${topics}`,
    `이 독자가 구독하는 분야: ${edition.categories.join(', ')}`,
    '',
    '오늘 이 독자에게 보내는 소식입니다.',
    stories,
    '',
    '이 독자 한 사람을 위한 글을 씁니다.',
    `- subject: 메일 제목. 이 독자의 관심사와 가장 닿는 오늘 소식 하나를 담아 ${NOTE_LIMITS.subject}자 이내, 기사 제목 형식. 날짜 · "뉴픽"은 넣지 않습니다.`,
    `- briefing: 맞춤 브리핑 2~3문장, ${NOTE_LIMITS.briefing}자 이내. 독자의 관심 주제와 오늘 소식이 어떻게 이어지는지, 무엇을 먼저 보면 좋은지. 관심 주제와 닿는 소식이 적으면 오늘 꼭 알아야 할 소식을 중심으로 씁니다.`,
    `- whys: 이 소식들만 하나씩: ${whyTargets(edition).join(', ') || '(없음 — 빈 배열)'} (ref: 그 값 그대로, why: 독자의 관심 주제와 이 소식이 어떻게 이어지는지 ${NOTE_LIMITS.why}자 이내). 한 줄 요약을 되풀이하지 않습니다.`,
    '- 간결한 평서체(~다). "~님", 감탄, 칭찬, 이모지는 쓰지 않습니다.',
    '- 소식에 있는 사실만 씁니다. 숫자 · 이름은 그대로 쓰고 새 사실을 지어내지 않습니다.',
    ...GENDER_RULES,
  ].join('\n');
};

export const NOTE_SCHEMA = {
  type: 'object',
  properties: {
    subject: { type: 'string' },
    briefing: { type: 'string' },
    whys: {
      type: 'array',
      items: {
        type: 'object',
        properties: { ref: { type: 'string' }, why: { type: 'string' } },
        required: ['ref', 'why'],
        additionalProperties: false,
      },
    },
  },
  required: ['subject', 'briefing', 'whys'],
  additionalProperties: false,
};

const oneLine = (text: unknown, max: number) => {
  const value =
    typeof text === 'string' ? text.replace(/\s+/g, ' ').trim() : '';
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
};

/** 응답 정리: 메일에 있는 소식 번호만, 길이 제한. 제목이나 브리핑이 비면 쓰지 않는다(null) */
export function normalizeNote(
  raw: unknown,
  edition: ComposedEdition,
): PersonalNote | null {
  const value = raw as {
    subject?: unknown;
    briefing?: unknown;
    whys?: { ref?: unknown; why?: unknown }[];
  };
  const subject = oneLine(value?.subject, NOTE_LIMITS.subject).replace(
    /^["'“”]+|["'“”]+$/g,
    '',
  );
  const briefing = oneLine(value?.briefing, NOTE_LIMITS.briefing * 1.3);
  if (!subject || !briefing) return null;
  const refs = new Set(whyTargets(edition));
  const whys: Record<string, string> = {};
  for (const item of Array.isArray(value.whys) ? value.whys : []) {
    const ref =
      typeof item?.ref === 'string' ? item.ref.replace(/[[\]]/g, '') : '';
    const why = oneLine(item?.why, NOTE_LIMITS.why * 1.3);
    if (refs.has(ref) && why) whys[ref] = why;
  }
  return { subject, briefing, whys };
}
