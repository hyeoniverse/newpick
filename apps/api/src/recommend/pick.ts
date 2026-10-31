import { cosine, SAME_EVENT_EMBEDDING } from '../ai-summary/articlePrep';
import type { TasteSignal } from '../edition/personalize';
import { tagKey } from '../tags/tags';

/**
 * 추천 기사: 북마크 · 스크랩한 소식과 뜻이 가까운 오늘 기사를 원문 그대로 권한다.
 * 글을 쓰지 않고 임베딩(bge-m3)을 비교만 하므로 무료 할당 안에서 끝난다
 */
export const RECOMMEND_LIMITS = {
  /** 이만큼 가까워야 권한다 (코사인. 실제 데이터에서 0.6 위는 같은 주제, 아래는 느슨한 연결) */
  min: 0.6,
  /** 한 사람에게 권하는 기사 수 */
  picks: 3,
  /** 팔로우한 태그가 제목에 나온 기사의 점수 (임베딩이 닿지 않아도 기준을 넘게) */
  keyword: 0.7,
};

export type Candidate = {
  title: string;
  link: string;
  source: string;
  category: string;
  vector: number[];
};

/** 메일 계획에 남기는 추천 기사 (받은 그대로 다시 보이게, 벡터는 빼고) */
export type ArticlePick = {
  title: string;
  link: string;
  source: string;
  category: string;
  score: number;
};

/**
 * 기사마다 가장 가까운 신호와의 코사인으로 매기고, 기준을 넘는 것 중 가까운 순으로.
 * 같은 사건(서로 SAME_EVENT_EMBEDDING 이상)은 하나만. 이미 뉴스레터에 쓴 기사(exclude)와,
 * 그 사람 메일에 실린 소식(shown)과 같은 사건인 기사는 뺀다 (다른 언론사가 쓴 같은 소식).
 * keywords: 팔로우한 태그(비교 열쇠, #123 5단계) — 제목에 나오면 RECOMMEND_LIMITS.keyword 이상으로 친다
 */
export function pickArticles(
  signals: Pick<TasteSignal, 'vector'>[],
  candidates: Candidate[],
  exclude: Set<string>,
  shown: number[][] = [],
  keywords: string[] = [],
  limits = RECOMMEND_LIMITS,
): ArticlePick[] {
  if (!signals.length && !keywords.length) return [];
  const keyed = keywords.filter((k) => k.length >= 2);
  const scored = candidates
    .filter((c) => !exclude.has(c.link))
    .filter(
      (c) => !shown.some((v) => cosine(v, c.vector) >= SAME_EVENT_EMBEDDING),
    )
    .map((candidate) => ({
      candidate,
      score: Math.max(
        -1,
        ...signals.map((s) => cosine(s.vector, candidate.vector)),
        keyed.some((k) => tagKey(candidate.title).includes(k))
          ? limits.keyword
          : -1,
      ),
    }))
    .filter((s) => s.score >= limits.min)
    .sort((a, b) => b.score - a.score);

  const picked: typeof scored = [];
  for (const s of scored) {
    if (picked.length >= limits.picks) break;
    const sameEvent = picked.some(
      (p) =>
        cosine(p.candidate.vector, s.candidate.vector) >= SAME_EVENT_EMBEDDING,
    );
    if (!sameEvent) picked.push(s);
  }
  return picked.map(({ candidate, score }) => ({
    title: candidate.title,
    link: candidate.link,
    source: candidate.source,
    category: candidate.category,
    score: Math.round(score * 1000) / 1000,
  }));
}
