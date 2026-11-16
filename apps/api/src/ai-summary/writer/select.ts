import { Cluster, isMorning, PrepArticle } from '../article-prep';
import { isDebateCategory, LIMITS } from './types';

/** 고르기 결과 처리: 점수 → 순위 → 본문 · 아침 속보 나누기 → 대표 기사 뽑기 (호출 없음) */

/**
 * 중요도 점수표. 예전엔 '여러 언론이 함께 다룬 사건'을 앞세워,
 * 한 곳만 먼저 보도한 큰 소식(예: 앤트로픽 나스닥 상장 신청)이 국내 지수 기사에 밀렸다.
 * 묶음마다 네 가지를 1~5점으로 매기고 합계로 고른다. 보도 수는 합계가 같을 때만 본다
 */
export const SCORE_AXES = {
  impact: '파급',
  novelty: '새로움',
  relevance: '관심사',
  followup: '후속',
} as const;
export type ScoreAxis = keyof typeof SCORE_AXES;

export type ClusterScore = Record<ScoreAxis, number> & {
  /** 묶음 번호 (1부터) */
  n: number;
  /** 그 번호 묶음의 첫 제목 앞부분. 번호와 점수가 어긋나지 않았는지 맞춰 본다 (alignScores) */
  title?: string;
  /** 빼는 소식(행사·홍보·연예 등)이면 점수와 상관없이 고르지 않는다 */
  excluded: boolean;
  /** 최근 뉴스레터에서 이미 다룬 사건이고 새 진전이 없음 → 고르지 않는다 (새 진전이 있으면 false, 후속으로 다룸) */
  repeat: boolean;
  /** 한 줄 이유 (AI 기록에 남긴다) */
  reason: string;
};

/** 합계(4~20)가 이 아래면 '주요 소식'이 아니다. 단, 하나도 없으면 가장 높은 하나는 싣는다 */
export const MIN_TOTAL = 13;

const clampScore = (v: unknown) =>
  Math.min(5, Math.max(1, Math.round(Number(v)) || 1));

export const totalScore = (s: ClusterScore) =>
  (Object.keys(SCORE_AXES) as ScoreAxis[]).reduce(
    (sum, axis) => sum + clampScore(s[axis]),
    0,
  );

/**
 * 점수 → 실을 묶음 번호 (중요한 순서). 빼는 소식 · 없는 번호 · 중복은 버리고,
 * 합계 높은 순 → 같으면 보도 많은 순 → 앞 번호 순. MIN_TOTAL 아래는 싣지 않되, 다 모자라면 1등 하나만
 */
export function rankClusters(
  clusters: Cluster[],
  scores: ClusterScore[],
  limit: number = LIMITS.stories,
  /** 주요 소식이 하나도 없을 때 가장 높은 하나라도 싣는가 */
  fallback = true,
) {
  const seen = new Set<number>();
  const ranked = scores
    .filter((s) => {
      const ok =
        Number.isInteger(s.n) &&
        s.n >= 1 &&
        s.n <= clusters.length &&
        !s.excluded &&
        !s.repeat &&
        !seen.has(s.n);
      seen.add(s.n);
      return ok;
    })
    .map((s) => ({ n: s.n, total: totalScore(s) }))
    .sort(
      (a, b) =>
        b.total - a.total ||
        clusters[b.n - 1].articles.length - clusters[a.n - 1].articles.length ||
        a.n - b.n,
    );
  const major = ranked.filter((s) => s.total >= MIN_TOTAL);
  return (major.length || !fallback ? major : ranked.slice(0, 1))
    .slice(0, limit)
    .map((s) => s.n);
}

/**
 * 오늘 아침 속보와 본문 소식을 따로 고른다: 아침 묶음은 '오늘 아침 속보'에 최대 LIMITS.morning.max개(주요한 것만),
 * 나머지 묶음은 지금처럼 최대 LIMITS.stories개. 아침 묶음뿐인 날은 예전처럼 본문 소식으로 고른다
 */
export function splitPicks(clusters: Cluster[], scores: ClusterScore[]) {
  const morningOf = (n: number) =>
    !!clusters[n - 1] && isMorning(clusters[n - 1]);
  const rest = scores.filter((s) => !morningOf(s.n));
  if (!rest.length || rest.length === scores.length)
    return { morning: [] as number[], stories: rankClusters(clusters, scores) };
  return {
    morning: rankClusters(
      clusters,
      scores.filter((s) => morningOf(s.n)),
      LIMITS.morning.max,
      false,
    ),
    stories: rankClusters(clusters, rest),
  };
}

/** 제목 비교용: 띄어쓰기 · 따옴표 · 기호를 빼고 소문자로 */
const titleKey = (text: string) =>
  text
    .toLowerCase()
    .replace(/&[a-z]+;|&#\d+;/g, '')
    .replace(/[\s"'“”‘’「」『』\[\]()<>…·,.:;!?~\-–—|/]/g, '');

/** 이 묶음의 제목 가운데 하나가 모델이 적은 제목 앞부분과 맞는가 */
const matchesCluster = (cluster: Cluster, title: string) => {
  const key = titleKey(title);
  if (key.length < 4) return false;
  return cluster.articles.some((a) => {
    const head = titleKey(a.title);
    return head.includes(key) || key.includes(head.slice(0, 12));
  });
};

/**
 * 고르기 응답의 번호가 적어 온 제목과 어긋나면 바로잡는다. 묶음이 많은 날 가벼운 모델이
 * 번호와 이유를 한 칸씩 밀려 써서 엉뚱한 소식이 뽑힌 적이 있다 (2026-11-07 세계: '아우디' 번호에 '미국 고용' 점수).
 * - 그 번호 묶음과 맞으면 그대로
 * - 다른 묶음 하나와만 맞으면 그 번호로 바꾼다
 * - 어디와도 맞지 않거나 여럿과 맞으면 버린다 (잘못 뽑기보다 빼는 쪽)
 * 제목을 적지 않은 응답(예전 형식)은 그대로 둔다
 */
export function alignScores(clusters: Cluster[], scores: ClusterScore[]) {
  let fixed = 0;
  let dropped = 0;
  const aligned: ClusterScore[] = [];
  for (const score of scores) {
    const title = score.title?.trim();
    const own = clusters[score.n - 1];
    if (!title || (own && matchesCluster(own, title))) {
      aligned.push(score);
      continue;
    }
    const others = clusters
      .map((cluster, i) => ({ cluster, n: i + 1 }))
      .filter(({ cluster }) => matchesCluster(cluster, title));
    if (others.length === 1) {
      aligned.push({ ...score, n: others[0].n });
      fixed++;
    } else dropped++;
  }
  return { scores: aligned, fixed, dropped };
}

/** AI 기록에 남길 고르기 결과: 합계 높은 순 5개까지, 실은 소식엔 ✓ */
export function describeScores(
  clusters: Cluster[],
  scores: ClusterScore[],
  picks: number[],
) {
  return scores
    .filter((s) => clusters[s.n - 1])
    .map((s) => ({ s, total: s.excluded || s.repeat ? 0 : totalScore(s) }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5)
    .map(({ s, total }) => {
      const mark = picks.includes(s.n) ? '✓' : ' ';
      const head = clusters[s.n - 1].articles[0].title;
      const detail = s.excluded
        ? '제외'
        : s.repeat
          ? '이미 다룸'
          : `${total}점 (${(Object.keys(SCORE_AXES) as ScoreAxis[])
              .map((axis) => `${SCORE_AXES[axis]} ${clampScore(s[axis])}`)
              .join(' · ')})`;
      return `${mark} ${head} — ${detail}. ${s.reason}`;
    })
    .join('\n');
}

/**
 * 한 묶음(같은 사건)에서 보낼 기사: 서로 다른 언론사 기사를 먼저(맞서는 주장을 찾을 수 있게),
 * 그다음 남은 기사. 묶음 안은 이미 긴 기사(정보가 많은) 순서
 */
export function diverseArticles(articles: PrepArticle[], count: number) {
  const seen = new Set<string>();
  const firstOfSource = articles.filter((a) => {
    const key = a.source || `#${a.index}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  const rest = articles.filter((a) => !firstOfSource.includes(a));
  return [...firstOfSource, ...rest].slice(0, count);
}

/** 고른 묶음에서 대표 기사만 꺼낸다 (중요한 묶음 순서 유지). 주장이 엇갈리기 쉬운 분야는 더 많이 */
export function pickArticles(
  clusters: Cluster[],
  picks: number[],
  category?: string,
  /** 묶음마다 보낼 기사 수 (아침 속보는 짧게 쓰므로 1건) */
  perCluster?: number,
) {
  const perStory =
    perCluster ??
    (isDebateCategory(category)
      ? LIMITS.articlesPerStoryWide
      : LIMITS.articlesPerStory);
  return [...new Set(picks)]
    .filter((n) => Number.isInteger(n) && n >= 1 && n <= clusters.length)
    .slice(0, LIMITS.stories)
    .flatMap((n) => diverseArticles(clusters[n - 1].articles, perStory));
}
