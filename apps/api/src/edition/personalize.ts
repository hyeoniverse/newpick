import { cosine } from 'src/ai-summary/articlePrep';
import { tagKey } from 'src/tags/tags';
import type { EditionSource } from './editor';
import { storyRef } from './editor';
import { storyText } from './parse';
import type { PersonalNote } from './personalNote';

/**
 * 맞춤 메일 (#123 3단계, "같이 쓰고 사람마다 고르기"). 글은 쓰지 않고 계산만.
 * 소식마다 관심 점수(0~1)를 매긴다: 북마크 · 스크랩한 글과 뜻이 얼마나 가까운지(임베딩).
 * 임베딩이 없는 날(할당 초과 등)은 관심 태그(#136)가 소식 글에 나오는지로 대신한다.
 * - 고른 분야 안에서는 편집 중요도(1~5)에 같은 무게로 더해 앞당기고, 계산한 이유를 붙인다
 * - 고르지 않은 분야에서 관심과 강하게 닿는 소식은 '관심 가질 만한 소식'으로 더한다
 * 취향 신호가 없으면 계획이 없고, 메일은 지금과 같다
 */

/** 취향 신호 하나: 북마크한 소식(제목 · 리드) 또는 스크랩한 문장(+메모)의 임베딩 */
export type TasteSignal = {
  kind: 'bookmark' | 'scrap';
  /** 메일에 보여 줄 이름 (소식 제목 · 스크랩 문장 앞부분) */
  label: string;
  vector: number[];
};

/** 한 사람의 취향: 점수 큰 태그 (이름 · 비교 열쇠 · 점수)와 신호 임베딩 */
export type TasteProfile = {
  topics: { name: string; key: string; score: number }[];
  signals?: TasteSignal[];
};

/** 맞춤 이유: 닿은 관심 태그, 태그가 안 닿으면 가장 가까운 북마크 · 스크랩 */
export type MatchReason = {
  topics: string[];
  because?: { kind: TasteSignal['kind']; label: string };
};

/** 한 사람의 메일 계획. 발송 기록에 함께 남겨 마이페이지에서 받은 그대로 다시 만든다 */
export type MailPlan = {
  /** 소식(ref)마다 더하는 중요도와 그 이유 */
  boosts: Record<string, { bonus: number } & MatchReason>;
  /** 고르지 않은 분야에서 더하는 소식 */
  extras: ({ ref: string; newsletterId: number } & MatchReason)[];
  /** 사람마다 쓴 제목 · 맞춤 브리핑 (personalNote.ts). 못 쓰면 없음 */
  note?: PersonalNote | null;
};

export const PERSONAL_LIMITS = {
  /** 관심 점수 1이 더하는 중요도: 편집 중요도(1~5)와 같은 무게 */
  maxBonus: 5,
  /**
   * 임베딩 코사인을 관심 점수 0~1로 펴는 구간. 실제 데이터에서 관련 없는 소식은 0.5 아래,
   * 같은 주제는 0.57(셸 취약점끼리) · 0.74(방한객 통계) · 0.95(같은 사건)
   */
  similarity: { low: 0.5, high: 0.8 },
  /** 이만큼 닿아야 이유를 붙인다 (관심 점수) */
  reasonMin: 0.2,
  /** 비교에 쓰는 관심 태그 수 (점수 큰 순) */
  topics: 15,
  /** 다른 분야에서 더하는 소식 수 */
  extras: 2,
  /** 다른 분야 소식은 이만큼 강하게 닿아야 더한다 (관심 점수, 코사인 0.62쯤) */
  extraMin: 0.4,
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

/** 관심 점수 (0~1)와 이유: 신호 임베딩이 있으면 가장 가까운 신호로, 없으면 관심 태그로 */
export function interestScore(
  text: string,
  vector: number[] | undefined,
  profile: TasteProfile,
): { score: number } & MatchReason {
  const { rel, topics } = relevance(text, profile);
  const reasons = topics.slice(0, PERSONAL_LIMITS.reasons);
  if (!vector || !profile.signals?.length)
    return { score: Math.min(1, rel), topics: reasons };

  let best = -1;
  let nearest = profile.signals[0];
  for (const signal of profile.signals) {
    const similarity = cosine(signal.vector, vector);
    if (similarity > best) {
      best = similarity;
      nearest = signal;
    }
  }
  const { low, high } = PERSONAL_LIMITS.similarity;
  const score = Math.max(0, Math.min(1, (best - low) / (high - low)));
  return {
    score,
    topics: reasons,
    // 태그가 안 닿아도 뜻이 가까우면, 가장 가까운 북마크 · 스크랩을 이유로
    ...(!reasons.length &&
      score >= PERSONAL_LIMITS.reasonMin && {
        because: { kind: nearest.kind, label: nearest.label },
      }),
  };
}

/**
 * vectors: 소식(ref)마다 제목 · 리드 임베딩 (하루 한 번 계산, 구독자 모두가 같이 쓴다). 없으면 관심 태그로만
 */
export function planMail(
  sources: EditionSource[],
  interests: number[],
  profile: TasteProfile | null | undefined,
  vectors?: Map<string, number[]>,
): MailPlan | null {
  if (!profile?.topics.length && !profile?.signals?.length) return null;
  const taste = {
    ...profile,
    topics: [...profile.topics]
      .sort((a, b) => b.score - a.score)
      .slice(0, PERSONAL_LIMITS.topics),
  };

  const boosts: MailPlan['boosts'] = {};
  const candidates: (MailPlan['extras'][number] & { score: number })[] = [];
  for (const source of sources) {
    const chosen = interests.includes(source.categoryId);
    source.stories.forEach((story, i) => {
      const ref = storyRef(source.newsletterId, i);
      const { score, ...reason } = interestScore(
        storyKey(story),
        vectors?.get(ref),
        taste,
      );
      if (score < PERSONAL_LIMITS.reasonMin) return;
      if (chosen) {
        boosts[ref] = {
          bonus: Math.round(PERSONAL_LIMITS.maxBonus * score * 100) / 100,
          ...reason,
        };
      } else if (
        score >= PERSONAL_LIMITS.extraMin &&
        // 이미 북마크한 그 소식이 다시 실린 것이면 더하지 않는다 (새로 볼 게 없다)
        reason.because?.label !== story.heading
      ) {
        candidates.push({
          ref,
          newsletterId: source.newsletterId,
          ...reason,
          score,
        });
      }
    });
  }

  // 다른 분야는 한 분야에서 하나씩, 가장 강하게 닿는 순
  const seen = new Set<number>();
  const extras = candidates
    .sort((a, b) => b.score - a.score)
    .filter((c) => !seen.has(c.newsletterId) && seen.add(c.newsletterId))
    .slice(0, PERSONAL_LIMITS.extras)
    .map(({ ref, newsletterId, topics, because }) => ({
      ref,
      newsletterId,
      topics,
      ...(because && { because }),
    }));

  if (!Object.keys(boosts).length && !extras.length) return null;
  return { boosts, extras };
}

/** 소식 임베딩에 쓰는 글: 제목 · 리드 */
export const storyEmbeddingText = (story: EditionSource['stories'][number]) =>
  [story.heading, story.lead].filter(Boolean).join('\n');
