import { tagKey } from 'src/tags/tags';
import type { EditionSource } from './editor';
import { storyRef } from './editor';
import { storyText } from './parse';
import type { PersonalNote } from './personalNote';

/**
 * 맞춤 메일 (#123 3단계, "같이 쓰고 사람마다 고르기"). AI 호출 없이 계산만.
 * 사람마다 취향(북마크 · 스크랩 · 메모로 모은 태그 점수, #136)이 소식에 나오는 만큼
 * - 고른 분야 안에서는 중요도에 더해 앞당기고(오늘 한눈에 · 분야 순서) 이유를 붙인다
 * - 고르지 않은 분야에서 취향과 강하게 닿는 소식은 '관심 가질 만한 소식'으로 더한다
 * 취향 신호가 없으면 계획이 없고, 메일은 지금과 같다
 */

/** 한 사람의 취향: 점수 큰 태그 (이름 · 비교 열쇠 · 점수) */
export type TasteProfile = {
  topics: { name: string; key: string; score: number }[];
};

/** 한 사람의 메일 계획. 발송 기록에 함께 남겨 마이페이지에서 받은 그대로 다시 만든다 */
export type MailPlan = {
  /** 소식(ref)마다 더하는 중요도와 그 이유(닿은 관심 태그) */
  boosts: Record<string, { bonus: number; topics: string[] }>;
  /** 고르지 않은 분야에서 더하는 소식 */
  extras: { ref: string; newsletterId: number; topics: string[] }[];
  /** 사람마다 쓴 제목 · 맞춤 브리핑 · '나에게 왜' (personalNote.ts). 못 쓰면 없음 */
  note?: PersonalNote | null;
};

export const PERSONAL_LIMITS = {
  /** 취향으로 더하는 중요도 최대치 (편집 중요도 1~5 위에) */
  maxBonus: 2,
  /** 비교에 쓰는 관심 태그 수 (점수 큰 순) */
  topics: 15,
  /** 다른 분야에서 더하는 소식 수 */
  extras: 2,
  /** 다른 분야 소식은 이만큼 강하게 닿아야 더한다 (가장 큰 관심 태그 점수 대비) */
  extraMin: 0.5,
  /** 이유로 보여 줄 태그 수 */
  reasons: 2,
};

/** 소식 글 (제목 · 리드 · 본문 앞부분)의 비교 열쇠 */
const storyKey = (story: EditionSource['stories'][number]) =>
  tagKey(`${story.heading} ${story.lead} ${storyText(story, 1200)}`);

/**
 * 소식이 취향에 얼마나 닿는지: 소식 글에 나오는 관심 태그 점수의 합을 가장 큰 관심 태그 점수로 나눈 값(0~).
 * 닿은 태그는 점수 큰 순
 */
export function relevance(text: string, profile: TasteProfile) {
  const top = profile.topics[0]?.score ?? 0;
  if (!top) return { rel: 0, topics: [] as string[] };
  const hit = profile.topics.filter(
    (t) => t.key.length >= 2 && text.includes(t.key),
  );
  return {
    rel: hit.reduce((sum, t) => sum + t.score, 0) / top,
    topics: hit.map((t) => t.name),
  };
}

export function planMail(
  sources: EditionSource[],
  interests: number[],
  profile: TasteProfile | null | undefined,
): MailPlan | null {
  if (!profile?.topics.length) return null;
  const topics = {
    topics: [...profile.topics]
      .sort((a, b) => b.score - a.score)
      .slice(0, PERSONAL_LIMITS.topics),
  };

  const boosts: MailPlan['boosts'] = {};
  const candidates: (MailPlan['extras'][number] & { rel: number })[] = [];
  for (const source of sources) {
    const chosen = interests.includes(source.categoryId);
    source.stories.forEach((story, i) => {
      const { rel, topics: hit } = relevance(storyKey(story), topics);
      if (!rel) return;
      const ref = storyRef(source.newsletterId, i);
      const reasons = hit.slice(0, PERSONAL_LIMITS.reasons);
      if (chosen) {
        boosts[ref] = {
          bonus:
            Math.round(
              Math.min(
                PERSONAL_LIMITS.maxBonus,
                PERSONAL_LIMITS.maxBonus * rel,
              ) * 100,
            ) / 100,
          topics: reasons,
        };
      } else if (rel >= PERSONAL_LIMITS.extraMin) {
        candidates.push({
          ref,
          newsletterId: source.newsletterId,
          topics: reasons,
          rel,
        });
      }
    });
  }

  // 다른 분야는 한 분야에서 하나씩, 가장 강하게 닿는 순
  const seen = new Set<number>();
  const extras = candidates
    .sort((a, b) => b.rel - a.rel)
    .filter((c) => !seen.has(c.newsletterId) && seen.add(c.newsletterId))
    .slice(0, PERSONAL_LIMITS.extras)
    .map(({ ref, newsletterId, topics: t }) => ({
      ref,
      newsletterId,
      topics: t,
    }));

  if (!Object.keys(boosts).length && !extras.length) return null;
  return { boosts, extras };
}
