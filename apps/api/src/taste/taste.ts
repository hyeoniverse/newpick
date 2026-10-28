import { TagRules, tagKey } from 'src/tags/tags';

/**
 * 취향 점수 (#123 2단계): 사용자가 남긴 신호(북마크 · 스크랩 · 메모)를 뉴스레터 태그 · 관심사별 점수로 모은다.
 * 오래된 신호는 반감기마다 절반으로 줄어, 요즘 관심이 앞에 온다. AI 호출 없이 계산만
 */

/** 신호마다 점수 (시작값, 맞춤 결과를 보며 조정) */
export const WEIGHTS = { bookmark: 1, scrap: 2, memo: 3 } as const;
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
}

export interface TopicScore {
  topic: string;
  score: number;
  bookmark: number;
  scrap: number;
  memo: number;
}

const DAY_MS = 24 * 60 * 60 * 1000;
const round = (n: number) => Math.round(n * 100) / 100;

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
  const categories = new Map<number, number>();

  for (const signal of signals) {
    const weight = WEIGHTS[signal.kind] * decay(signal.at, now);
    categories.set(
      signal.categoryId,
      (categories.get(signal.categoryId) ?? 0) + weight,
    );
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
        names: new Map<string, number>(),
      };
      const bonus = text.includes(key)
        ? MENTION_BONUS * decay(signal.at, now)
        : 0;
      topic.score += weight + bonus;
      topic[signal.kind] += 1;
      topic.names.set(name, (topic.names.get(name) ?? 0) + 1);
      topics.set(key, topic);
    }
  }

  return {
    topics: [...topics.values()]
      .map(({ names, ...topic }) => ({
        ...topic,
        topic: [...names.entries()].sort((a, b) => b[1] - a[1])[0][0],
        score: round(topic.score),
      }))
      .sort((a, b) => b.score - a.score || a.topic.localeCompare(b.topic)),
    categories: [...categories.entries()]
      .map(([categoryId, score]) => ({ categoryId, score: round(score) }))
      .sort((a, b) => b.score - a.score),
  };
}
