import { cosine, SAME_EVENT_EMBEDDING } from '../ai-summary/articlePrep';

/**
 * 추천 기사: 북마크 · 스크랩한 소식과 뜻이 가까운 오늘 기사를 원문 그대로 권한다.
 * 글을 쓰지 않고 임베딩(bge-m3)을 비교만 하므로 무료 할당 안에서 끝난다
 */
export const RECOMMEND_LIMITS = {
  /** 이만큼 가까워야 권한다 (코사인. 실제 데이터에서 0.6 위는 같은 주제, 아래는 느슨한 연결) */
  min: 0.6,
  /** 한 사람에게 권하는 기사 수 */
  picks: 3,
  /** 한 사람의 신호 수 (최근 것부터) */
  signals: 24,
  /** 이 기간 안의 북마크 · 스크랩만 (기사는 30일 뒤 지워진다) */
  maxAgeDays: 30,
};

/** 취향 신호 하나: 북마크한 소식(제목 · 리드) 또는 스크랩한 문장 */
export type Signal = {
  kind: 'bookmark' | 'scrap';
  /** 메일에 보여 줄 이름 (소식 제목 · 스크랩 문장 앞부분) */
  label: string;
  vector: number[];
};

export type Candidate = {
  title: string;
  link: string;
  source: string;
  category: string;
  vector: number[];
};

/** 메일 계획에 남기는 추천 기사 (받은 그대로 다시 보이게 벡터는 빼고) */
export type ArticlePick = {
  title: string;
  link: string;
  source: string;
  category: string;
  /** 가장 가까운 신호 (왜 권했는지: 계산한 그대로 보여 준다) */
  because: { kind: Signal['kind']; label: string };
  score: number;
};

/**
 * 신호마다 가장 가까운 정도로 기사를 매기고, 기준을 넘는 것 중 가까운 순으로.
 * 같은 사건(서로 SAME_EVENT_EMBEDDING 이상)은 하나만, 이미 메일 · 북마크에 쓴 기사는 뺀다
 */
export function pickArticles(
  signals: Signal[],
  candidates: Candidate[],
  exclude: Set<string>,
  limits = RECOMMEND_LIMITS,
): ArticlePick[] {
  if (!signals.length) return [];
  const scored = candidates
    .filter((c) => !exclude.has(c.link))
    .map((c) => {
      let best = -1;
      let because = signals[0];
      for (const signal of signals) {
        const score = cosine(signal.vector, c.vector);
        if (score > best) {
          best = score;
          because = signal;
        }
      }
      return { candidate: c, score: best, because };
    })
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
  return picked.map(({ candidate, score, because }) => ({
    title: candidate.title,
    link: candidate.link,
    source: candidate.source,
    category: candidate.category,
    because: { kind: because.kind, label: because.label },
    score: Math.round(score * 1000) / 1000,
  }));
}

/** 스크랩 문장은 앞부분만 이름으로 */
export const signalLabel = (text: string, max = 30) => {
  const flat = text.replace(/\s+/g, ' ').trim();
  return flat.length > max ? `${flat.slice(0, max)}…` : flat;
};
