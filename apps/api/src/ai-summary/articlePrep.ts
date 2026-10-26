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
  content: string;
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

/** 제목 유사도로 같은 사건을 묶는다 (union-find). 큰 묶음이 먼저 */
export function clusterArticles(articles: PrepArticle[]): Cluster[] {
  const parent = articles.map((_, i) => i);
  const find = (i: number): number =>
    parent[i] === i ? i : (parent[i] = find(parent[i]));
  for (let i = 0; i < articles.length; i++) {
    for (let j = i + 1; j < articles.length; j++) {
      if (titleSimilarity(articles[i].title, articles[j].title) >= SAME_EVENT) {
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
  articles: { title: string; content: string; source?: string }[],
): PrepArticle[] {
  return articles.map((a, index) => ({
    index,
    title: a.title.trim(),
    source: a.source,
    content: truncate(cleanText(a.content), MAX_ARTICLE_CHARS),
  }));
}
