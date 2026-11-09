/**
 * Claude에 보내기 전에 기사를 줄이는 전처리 (#47)
 *
 * 1. 상투 문구 제거: 사진 설명, 기자 서명, 제보 안내, 저작권 문구는 요약에 쓸모없는 입력 토큰이다.
 * 2. 길이 제한: 뉴스는 역피라미드라 앞부분에 핵심이 있다. 문장 경계에서 자른다.
 * 3. 같은 사건 묶기: 여러 언론이 같은 사건을 다루면 한 묶음으로. 묶음 크기는 중요도 신호로 쓰고,
 *    쓰기 단계에는 묶음마다 대표 기사 몇 건만 보낸다.
 */

export type PrepArticle = {
  /** 원래 기사 목록에서의 위치 (0부터) */
  index: number;
  title: string;
  source?: string;
  /** 보도 시각 'YYYY-MM-DD HH:mm:ss' (KST, 네이버 기사) */
  publishedAt?: string;
  /** 오늘 아침(05:00 이후) 보도: 뉴스레터 맨 위 '오늘 아침 속보'에 따로 싣는다 */
  morning?: boolean;
  content: string;
};

/** 보도 시각을 프롬프트용으로 짧게: '2026-10-30 18:30:00' → '10/30 18:30' */
export const publishedLabel = (publishedAt?: string) => {
  const m = publishedAt?.match(/^\d{4}-(\d{2})-(\d{2}) (\d{2}:\d{2})/);
  return m ? `${Number(m[1])}/${Number(m[2])} ${m[3]}` : '';
};

export type Cluster = { articles: PrepArticle[] };

/** 쓰기 단계에 보내는 기사 한 건의 최대 길이 */
export const MAX_ARTICLE_CHARS = 1200;
/** 고르기 단계에 보내는 첫 부분 길이 */
export const LEAD_CHARS = 150;

const BOILERPLATE: RegExp[] = [
  /\[[^\]]{0,30}=[^\]]{0,30}\]\s*[^=\n]{0,20}기자\s*=?/g, // [서울=뉴시스] 홍길동 기자 =
  /\[사진 출처[^\]]*\]/g,
  // /사진=고범준강신철 처럼 이름이 붙어 있어 언론사 이름이나 세 글자 이름만 지운다
  /\/?사진=(?:연합뉴스|뉴시스|뉴스1|[가-힣]{3}(?=[가-힣\s]|$))/g,
  /원본보기/g,
  /■\s*제보하기[\s\S]*$/g, // 기사 끝의 제보 안내
  /▷[^\n]*$/gm,
  /[^\s]+@[^\s]+\.[a-z]{2,}/gi, // 기자 이메일
  /(무단\s*전재|재배포\s*금지|저작권자)[^\n]*$/gm,
  /\[the\d+\]|\[\d{4} 국정감사\]/g,
  /\d{4}\.\d{1,2}\.\d{1,2}\.?\s*/g, // 사진 설명 끝의 날짜
];

export function cleanText(text: string): string {
  let result = text;
  for (const pattern of BOILERPLATE) result = result.replace(pattern, ' ');
  return result.replace(/\s+/g, ' ').trim();
}

/** 문장 경계에서 max자 이내로 자른다. 경계를 못 찾으면 그냥 자른다 */
export function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const end = Math.max(
    cut.lastIndexOf('다.'),
    cut.lastIndexOf('요.'),
    cut.lastIndexOf('. '),
  );
  return end > max * 0.6 ? cut.slice(0, end + 2).trim() : cut.trim();
}

const normalizeTitle = (title: string) =>
  title.replace(/\[[^\]]*\]|\([^)]*\)/g, ' ').replace(/[^0-9a-zA-Z가-힣]/g, '');

/** 제목의 두 글자 묶음 집합. 한국어 제목 유사도에 단어 분리 없이 쓸 수 있다 */
const bigrams = (text: string) => {
  const set = new Set<string>();
  for (let i = 0; i < text.length - 1; i++) set.add(text.slice(i, i + 2));
  return set;
};

export function titleSimilarity(a: string, b: string): number {
  const x = bigrams(normalizeTitle(a));
  const y = bigrams(normalizeTitle(b));
  if (!x.size || !y.size) return 0;
  let shared = 0;
  for (const g of x) if (y.has(g)) shared++;
  return shared / (x.size + y.size - shared);
}

/**
 * 제목이 이만큼 겹치면 같은 사건으로 본다.
 * 2026-10-26 기사 51건: 같은 사건(룰라 4선 두 건) 0.28, 다른 사건 중 가장 비슷한 쌍(게임대상·SNS대상) 0.19
 */
export const SAME_EVENT = 0.25;

/**
 * 임베딩(bge-m3)이 이만큼 비슷하면 같은 사건으로 본다. 언론사마다 제목을 달리 달아 제목으로는 못 묶는 경우를 잡는다.
 * 2026-10-26 정치 기사 26건(제목으로는 26개 묶음): 같은 사건 0.66~0.84(주진우 골프 의혹 3곳 · 오세훈 무죄 2곳 · 전작권 3곳),
 * 다른 사건 중 가장 비슷한 쌍 0.615(같은 장관의 다른 사안)
 */
export const SAME_EVENT_EMBEDDING = 0.64;

/** 임베딩에 넣을 글: 제목 + 본문 앞부분 */
export const embeddingText = (article: PrepArticle) =>
  `${article.title}\n${article.content.slice(0, 300)}`;

export function cosine(a: number[], b: number[]): number {
  let dot = 0;
  let x = 0;
  let y = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    x += a[i] * a[i];
    y += b[i] * b[i];
  }
  return x && y ? dot / Math.sqrt(x * y) : 0;
}

/**
 * 같은 사건을 묶는다 (union-find). 큰 묶음이 먼저.
 * 제목이 비슷하거나, 임베딩(vectors, 기사와 같은 순서)이 있으면 뜻이 비슷한 기사끼리도 묶는다
 */
export function clusterArticles(
  articles: PrepArticle[],
  vectors?: number[][],
): Cluster[] {
  const parent = articles.map((_, i) => i);
  const find = (i: number): number =>
    parent[i] === i ? i : (parent[i] = find(parent[i]));
  for (let i = 0; i < articles.length; i++) {
    for (let j = i + 1; j < articles.length; j++) {
      if (
        titleSimilarity(articles[i].title, articles[j].title) >= SAME_EVENT ||
        (vectors?.[i] &&
          vectors[j] &&
          cosine(vectors[i], vectors[j]) >= SAME_EVENT_EMBEDDING)
      ) {
        parent[find(i)] = find(j);
      }
    }
  }
  const groups = new Map<number, PrepArticle[]>();
  articles.forEach((a, i) => {
    const root = find(i);
    groups.set(root, [...(groups.get(root) ?? []), a]);
  });
  return [...groups.values()]
    .map((group) => ({
      // 긴 기사(정보가 많은 기사)를 대표로
      articles: group.sort((a, b) => b.content.length - a.content.length),
    }))
    .sort((a, b) => b.articles.length - a.articles.length);
}

export function prepare(
  articles: {
    title: string;
    content: string;
    source?: string;
    publishedAt?: string;
  }[],
  /** 이 시각(KST 문자열 'YYYY-MM-DD HH:mm:ss') 이후 보도면 오늘 아침 속보 */
  morningSince?: string,
): PrepArticle[] {
  return articles.map((a, index) => ({
    index,
    title: a.title.trim(),
    source: a.source,
    ...(a.publishedAt && { publishedAt: a.publishedAt }),
    ...(morningSince &&
      a.publishedAt &&
      a.publishedAt >= morningSince && { morning: true }),
    content: truncate(cleanText(a.content), MAX_ARTICLE_CHARS),
  }));
}

/** 묶음이 오늘 아침 속보인가: 하나라도 아침 보도면 (어젯밤 보도에 오늘 아침 후속이 붙은 묶음도 아침) */
export const isMorning = (cluster: Cluster) =>
  cluster.articles.some((a) => a.morning);

/** 고르기에 보내는 묶음 수 한도. 묶음마다 점수 한 줄을 받으므로 이보다 많으면 응답이 한도에서 잘린다 */
export const SELECT_MAX_CLUSTERS = 50;
/** 그중 오늘 아침 속보 묶음은 작아도 이만큼은 넣는다 (아침 속보는 보도가 1~2건인 때가 많다) */
export const SELECT_MAX_MORNING = 10;

/**
 * 고르기 후보: 보도가 많은 묶음부터 SELECT_MAX_CLUSTERS개 + 거기 못 든 아침 속보 묶음 SELECT_MAX_MORNING개까지.
 * 묶음 순서(보도 많은 순)는 그대로 둔다. 기사가 많은 날은 묶음이 300개 가까워 점수 줄만으로 1만 6천 토큰을 넘겼다 (11/8 · 11/9)
 */
export function selectCandidates(
  clusters: Cluster[],
  max = SELECT_MAX_CLUSTERS,
  morningMax = SELECT_MAX_MORNING,
): Cluster[] {
  if (clusters.length <= max) return clusters;
  const top = new Set(clusters.slice(0, max));
  const morning = clusters.slice(max).filter(isMorning).slice(0, morningMax);
  morning.forEach((cluster) => top.add(cluster));
  return clusters.filter((cluster) => top.has(cluster));
}
