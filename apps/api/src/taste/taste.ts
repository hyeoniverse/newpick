import { TagRules, tagKey } from 'src/tags/tags';

/**
 * 취향 점수 (#123 2단계): 사용자가 남긴 신호(북마크 · 스크랩 · 메모)를 뉴스레터 태그 · 관심사별 점수로 모은다.
 * 오래된 신호는 반감기마다 절반으로 줄어, 요즘 관심이 앞에 온다. AI 호출 없이 계산만
 */

/** 신호마다 점수 (시작값, 맞춤 결과를 보며 조정) */
export const WEIGHTS = { bookmark: 1, scrap: 2, memo: 3 } as const;
/** 별표(중요)한 스크랩 · 메모에 더 얹는 점수 */
export const STAR_BONUS = 2;
/** 스크랩한 문장 · 메모에 태그가 직접 나오면 더 얹는 점수 */
export const MENTION_BONUS = 1;
/** 이만큼 지나면 신호가 절반으로 */
export const HALF_LIFE_DAYS = 14;

export type SignalKind = keyof typeof WEIGHTS;

export interface Signal {
  kind: SignalKind;
  at: Date;
  categoryId: number;
  /** 그 뉴스레터의 태그 */
  keywords: string[];
  /** 스크랩한 문장 + 메모 (태그가 직접 나오는지 본다) */
  text?: string;
  /** 별표(중요)한 스크랩 */
  starred?: boolean;
}

export interface TopicScore {
  topic: string;
  score: number;
  bookmark: number;
  scrap: number;
  memo: number;
  /** 마지막 신호 시각 (ms). 점수가 같을 때 순서용, 응답에는 넣지 않는다 */
  lastAt: number;
}

const DAY_MS = 24 * 60 * 60 * 1000;
const round = (n: number) => Math.round(n * 100) / 100;

/** 순서를 정하는 데 쓰는 값: 신호 종류별 수(중요도) · 마지막 신호 시각(최신) */
interface Ranked {
  score: number;
  topic: string;
  memo: number;
  scrap: number;
  bookmark: number;
  /** 마지막 신호 시각 (ms) */
  lastAt: number;
  /** 운영 통계: 이 태그가 취향에 든 사람 수 */
  users?: number;
}

/**
 * 태그 순서: 점수 → (같으면) 더 중요한 신호 → (같으면) 더 최신 → 이름.
 * - 중요한 신호: 더 많은 사람(운영 통계) → 메모 → 스크랩 → 북마크 수 (가중치가 큰 신호일수록 뚜렷한 관심)
 * 점수가 같을 때 정하지 않으면 쿼리 결과 순서를 따라 불러올 때마다 순서 · 상위 N개 안에 드는 태그가 바뀐다
 */
export const byTopicScore = (a: Ranked, b: Ranked) =>
  b.score - a.score ||
  (b.users ?? 0) - (a.users ?? 0) ||
  b.memo - a.memo ||
  b.scrap - a.scrap ||
  b.bookmark - a.bookmark ||
  b.lastAt - a.lastAt ||
  a.topic.localeCompare(b.topic, 'ko');

/** 분야 순서: 점수 → (같으면) 더 최신 → 분야 번호 */
export const byCategoryScore = (
  a: { score: number; categoryId: number; lastAt: number },
  b: { score: number; categoryId: number; lastAt: number },
) => b.score - a.score || b.lastAt - a.lastAt || a.categoryId - b.categoryId;

export const decay = (at: Date, now: Date) =>
  0.5 ** (Math.max(0, now.getTime() - at.getTime()) / DAY_MS / HALF_LIFE_DAYS);

/**
 * 신호 → 태그 점수 · 관심사 점수. 태그는 지금의 합치기 · 지우기 규칙을 다시 적용해(예전 표기로 남은 것도) 같은 열쇠끼리 모으고,
 * 보이는 이름은 가장 많이 쓴 표기로. 점수 큰 순서
 */
export function scoreTaste(
  signals: Signal[],
  rules: TagRules,
  now = new Date(),
) {
  const topics = new Map<string, TopicScore & { names: Map<string, number> }>();
  const categories = new Map<number, { score: number; lastAt: number }>();

  for (const signal of signals) {
    const weight =
      (WEIGHTS[signal.kind] + (signal.starred ? STAR_BONUS : 0)) *
      decay(signal.at, now);
    const at = signal.at.getTime();
    const category = categories.get(signal.categoryId) ?? {
      score: 0,
      lastAt: 0,
    };
    categories.set(signal.categoryId, {
      score: category.score + weight,
      lastAt: Math.max(category.lastAt, at),
    });
    const text = signal.text ? tagKey(signal.text) : '';
    const seen = new Set<string>();
    for (const raw of signal.keywords) {
      const name = rules.aliases.get(tagKey(raw)) ?? raw;
      const key = tagKey(name);
      if (!key || rules.blocked.has(key) || seen.has(key)) continue;
      seen.add(key);
      const topic = topics.get(key) ?? {
        topic: name,
        score: 0,
        bookmark: 0,
        scrap: 0,
        memo: 0,
        lastAt: 0,
        names: new Map<string, number>(),
      };
      const bonus = text.includes(key)
        ? MENTION_BONUS * decay(signal.at, now)
        : 0;
      topic.score += weight + bonus;
      topic[signal.kind] += 1;
      topic.lastAt = Math.max(topic.lastAt, at);
      topic.names.set(name, (topic.names.get(name) ?? 0) + 1);
      topics.set(key, topic);
    }
  }

  return {
    topics: [...topics.values()]
      .map(({ names, ...topic }) => ({
        ...topic,
        topic: [...names.entries()].sort(
          (a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'ko'),
        )[0][0],
        score: round(topic.score),
      }))
      .sort(byTopicScore),
    categories: [...categories.entries()]
      .map(([categoryId, c]) => ({
        categoryId,
        score: round(c.score),
        lastAt: c.lastAt,
      }))
      .sort(byCategoryScore),
  };
}
