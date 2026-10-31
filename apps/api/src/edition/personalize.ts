import { cosine } from 'src/ai-summary/articlePrep';
import { tagKey } from 'src/tags/tags';
import type { Editorial, EditionSource } from './editor';
import { storyRef } from './editor';
import { storyText } from './parse';
import type { PersonalNote } from './personalNote';

/**
 * 맞춤 메일 (#123 3단계, "같이 쓰고 사람마다 고르기"). 글은 쓰지 않고 계산만.
 * 분야를 나누지 않고, 그날 모든 분야의 소식에 사람마다 점수를 매겨 높은 순으로 메일을 짠다:
 *   점수 = 편집 중요도(1~5) + 5 × 관심 점수(0~1) + 구독한 분야 가산
 * 관심 점수는 북마크 · 스크랩한 글과 뜻이 얼마나 가까운지(임베딩). 임베딩이 없는 날(할당 초과 등)은
 * 관심 태그(#136)가 소식 글에 나오는지로 대신한다.
 * 구독한 분야에서 편집 중요도가 가장 높은 소식(PERSONAL_LIMITS.keep개)은 늘 넣는다: 관심사만 보다 큰 소식을 놓치지 않게.
 * 구독하지 않은 분야는 관심이 닿는 소식만 들어온다.
 * 취향 신호가 없거나 어떤 소식에도 닿지 않으면 계획이 없고, 메일은 지금처럼 분야별이다
 */

/** 취향 신호 하나: 북마크한 소식(제목 · 리드) 또는 스크랩한 문장(+메모)의 임베딩 */
export type TasteSignal = {
  kind: 'bookmark' | 'scrap';
  /** 소식 제목 · 스크랩 문장 앞부분 (이미 본 소식을 알아보는 데 쓴다) */
  label: string;
  vector: number[];
};

/** 한 사람의 취향: 점수 큰 태그 (이름 · 비교 열쇠 · 점수)와 신호 임베딩 */
export type TasteProfile = {
  topics: { name: string; key: string; score: number }[];
  signals?: TasteSignal[];
};

/** 한 사람의 메일 계획. 발송 기록에 함께 남겨 마이페이지에서 받은 그대로 다시 만든다 */
export type MailPlan = {
  /** 메일에 싣는 소식, 점수 높은 순 */
  picks: { ref: string; newsletterId: number }[];
  /** 사람마다 쓴 제목 · 맞춤 브리핑 (personalNote.ts). 못 쓰면 없음 */
  note?: PersonalNote | null;
};

export const PERSONAL_LIMITS = {
  /** 메일에 싣는 소식 수 */
  stories: 7,
  /** 늘 넣는, 구독한 분야에서 편집 중요도가 가장 높은 소식 수 */
  keep: 2,
  /** 관심 점수 1이 더하는 점수: 편집 중요도(1~5)와 같은 무게 */
  interest: 5,
  /** 구독한 분야 가산: 중요도 3인 구독 분야 소식이 관심 없는 다른 분야의 중요도 5 소식과 같다 */
  subscribed: 2,
  /**
   * 임베딩 코사인을 관심 점수 0~1로 펴는 구간. 실제 데이터에서 관련 없는 소식은 0.5 아래,
   * 같은 주제는 0.57(셸 취약점끼리) · 0.74(방한객 통계) · 0.95(같은 사건)
   */
  similarity: { low: 0.5, high: 0.8 },
  /** 이만큼은 닿아야 관심으로 친다 (관심 점수). 어떤 소식도 안 닿으면 맞춤 없이 보낸다 */
  min: 0.2,
  /** 비교에 쓰는 관심 태그 수 (점수 큰 순) */
  topics: 15,
};

/** 소식 글 (제목 · 리드 · 본문 앞부분)의 비교 열쇠 */
const storyKey = (story: EditionSource['stories'][number]) =>
  tagKey(`${story.heading} ${story.lead} ${storyText(story, 1200)}`);

/** 소식 글에 나오는 관심 태그 점수의 합을 가장 큰 관심 태그 점수로 나눈 값(0~) */
export function relevance(text: string, profile: TasteProfile) {
  const top = profile.topics[0]?.score ?? 0;
  if (!top) return 0;
  return (
    profile.topics
      .filter((t) => t.key.length >= 2 && text.includes(t.key))
      .reduce((sum, t) => sum + t.score, 0) / top
  );
}

/**
 * 관심 점수 (0~1): 신호 임베딩이 있으면 가장 가까운 신호로, 없으면 관심 태그로.
 * seen: 가장 가까운 신호가 바로 이 소식(같은 제목)이면 이미 본 소식
 */
export function interestScore(
  story: EditionSource['stories'][number],
  vector: number[] | undefined,
  profile: TasteProfile,
): { score: number; seen: boolean } {
  if (!vector || !profile.signals?.length)
    return {
      score: Math.min(1, relevance(storyKey(story), profile)),
      seen: false,
    };

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
  return {
    score: Math.max(0, Math.min(1, (best - low) / (high - low))),
    seen: nearest.label === story.heading,
  };
}

/**
 * vectors: 소식(ref)마다 제목 · 리드 임베딩 (하루 한 번 계산, 구독자 모두가 같이 쓴다). 없으면 관심 태그로만.
 * editorial: 그날 편집 (중요도 · 같은 사건). 없으면 뉴스레터 안 순서를 중요도로
 */
export function planMail(
  sources: EditionSource[],
  interests: number[],
  profile: TasteProfile | null | undefined,
  vectors?: Map<string, number[]>,
  editorial?: Editorial | null,
): MailPlan | null {
  if (!profile?.topics.length && !profile?.signals?.length) return null;
  const taste = {
    ...profile,
    topics: [...profile.topics]
      .sort((a, b) => b.score - a.score)
      .slice(0, PERSONAL_LIMITS.topics),
  };

  const candidates = sources.flatMap((source) =>
    source.stories.map((story, i) => {
      const ref = storyRef(source.newsletterId, i);
      const chosen = interests.includes(source.categoryId);
      const importance =
        editorial?.ranking[ref]?.importance ?? Math.max(1, 3 - i);
      const { score: interest, seen } = interestScore(
        story,
        vectors?.get(ref),
        taste,
      );
      // 북마크한 그 소식이 다시 실린 것은 관심으로 치지 않는다 (새로 볼 게 없다)
      const touched = interest >= PERSONAL_LIMITS.min && !seen;
      return {
        ref,
        newsletterId: source.newsletterId,
        chosen,
        importance,
        touched,
        score:
          importance +
          (touched ? PERSONAL_LIMITS.interest * interest : 0) +
          (chosen ? PERSONAL_LIMITS.subscribed : 0),
        order: candidatesOrder(sources, source, i),
      };
    }),
  );
  if (!candidates.some((c) => c.touched)) return null;

  // 같은 사건은 하나만 (편집의 duplicates)
  const groupOf = (ref: string) =>
    editorial?.duplicates.find((group) => group.includes(ref)) ?? [ref];
  const picked: typeof candidates = [];
  const take = (list: typeof candidates, limit: number) => {
    for (const c of list) {
      if (picked.length >= limit) break;
      const group = groupOf(c.ref);
      if (!picked.some((p) => group.includes(p.ref))) picked.push(c);
    }
  };
  take(
    candidates
      .filter((c) => c.chosen)
      .sort((a, b) => b.importance - a.importance || a.order - b.order),
    PERSONAL_LIMITS.keep,
  );
  // 구독하지 않은 분야는 관심이 닿는 소식만 (자리를 채우려고 관심 없는 소식을 끌어오지 않는다)
  take(
    candidates
      .filter((c) => c.chosen || c.touched)
      .sort((a, b) => b.score - a.score || a.order - b.order),
    PERSONAL_LIMITS.stories,
  );

  return {
    picks: picked
      .sort((a, b) => b.score - a.score || a.order - b.order)
      .map(({ ref, newsletterId }) => ({ ref, newsletterId })),
  };
}

/** 점수가 같을 때: 분야 순서 → 소식 순서 */
const candidatesOrder = (
  sources: EditionSource[],
  source: EditionSource,
  index: number,
) => sources.indexOf(source) * 10 + index;

/** 소식 임베딩에 쓰는 글: 제목 · 리드 */
export const storyEmbeddingText = (story: EditionSource['stories'][number]) =>
  [story.heading, story.lead].filter(Boolean).join('\n');
