import { GENDER_RULES } from 'src/ai-summary/writingRules';
import type { ComposedEdition } from './compose';
import type { TasteProfile } from './personalize';

/**
 * 사람마다 쓰는 글 (#123 3단계): 메일 제목 · 맞춤 브리핑.
 * 소식 본문은 사람마다 다시 쓰지 않는다 (사실은 같고, 길어지면 비용 · 실패가 늘어난다).
 * 소식마다 '왜 나에게'는 쓰지 않는다: 써 보니 관심 주제 + 제목을 되읊을 뿐이라, 계산한 이유(personalize.ts)를 그대로 보여 준다.
 * 오픈 모델(Workers AI 무료 할당)로 쓰고, 안 되면 맞춤 순서만 있는 메일로 보낸다
 */
export type PersonalNote = {
  subject: string;
  briefing: string;
};

export const NOTE_LIMITS = { subject: 40, briefing: 220, topics: 8 };

export const NOTE_SYSTEM =
  'You are the personal editor of a Korean news briefing. You write one short, precise note for one reader in Korean.';

export const notePrompt = (edition: ComposedEdition, profile: TasteProfile) => {
  const topics = profile.topics
    .slice(0, NOTE_LIMITS.topics)
    .map((t) => t.name)
    .join(', ');
  const stories = edition.top
    .map((t) => `[${t.ref}] (${t.category}) ${t.heading} — ${t.line}`)
    .join('\n');
  return [
    `이 독자가 요즘 북마크 · 스크랩한 주제: ${topics}`,
    `오늘 메일에 실린 분야: ${edition.categories.join(', ')}`,
    '',
    '오늘 이 독자에게 보내는 소식입니다 (이 독자의 관심에 맞춰 고른 순서).',
    stories,
    '',
    '이 독자 한 사람을 위한 글을 씁니다.',
    `- subject: 메일 제목. 이 독자의 관심사와 가장 닿는 오늘 소식 하나를 담아 ${NOTE_LIMITS.subject}자 이내, 기사 제목 형식. 날짜 · "뉴픽"은 넣지 않습니다.`,
    `- briefing: 맞춤 브리핑 2~3문장, ${NOTE_LIMITS.briefing}자 이내. 독자에게 직접 건네는 글이라 부드러운 해요체(~했어요, ~보세요)로 씁니다.`,
    '  소식 하나하나를 되읊지 않습니다. 오늘 소식들이 서로, 그리고 독자의 관심과 어떻게 이어지는지 한 흐름으로 묶고, 무엇을 먼저 보면 좋은지 씁니다.',
    "  '관심 두신'은 브리핑 전체에서 많아야 한 번만 씁니다. 관심 주제와 닿는 소식이 적으면 오늘 꼭 알아야 할 소식을 중심으로 씁니다.",
    '- 해요체(~했어요, ~예요)로 씁니다. ~습니다체 · 반말은 쓰지 않습니다. "~님", 감탄, 칭찬, 이모지는 쓰지 않습니다.',
    '- "~할 필요가 있어요" · "~를 주시해야 해요"처럼 독자를 가르치는 말, "~분야 구독자로서" 같은 일반론은 쓰지 않습니다.',
    "- 독자가 북마크했는지 스크랩했는지 짐작해 쓰지 않습니다 ('스크랩하신' · '북마크하신').",
    '- 소식에 있는 사실만 씁니다. 숫자 · 이름은 그대로 쓰고 새 사실을 지어내지 않습니다.',
    ...GENDER_RULES,
  ].join('\n');
};

export const NOTE_SCHEMA = {
  type: 'object',
  properties: {
    subject: { type: 'string' },
    briefing: { type: 'string' },
  },
  required: ['subject', 'briefing'],
  additionalProperties: false,
};

const oneLine = (text: unknown, max: number) => {
  const value =
    typeof text === 'string' ? text.replace(/\s+/g, ' ').trim() : '';
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
};

/** 응답 정리: 길이 제한. 제목이나 브리핑이 비면 쓰지 않는다(null) */
export function normalizeNote(raw: unknown): PersonalNote | null {
  const value = raw as { subject?: unknown; briefing?: unknown };
  const subject = oneLine(value?.subject, NOTE_LIMITS.subject).replace(
    /^["'“”]+|["'“”]+$/g,
    '',
  );
  const briefing = oneLine(value?.briefing, NOTE_LIMITS.briefing * 1.3);
  if (!subject || !briefing) return null;
  return { subject, briefing };
}
