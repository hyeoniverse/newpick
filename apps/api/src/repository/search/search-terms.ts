/** MySQL 불린 모드에서 특별한 뜻이 있는 글자. 사용자가 넣은 것은 지운다 */
const BOOLEAN_OPERATORS = /[+\-<>()~*"@]/g;

/**
 * 검색어를 MySQL FULLTEXT 불린 모드 식으로 바꾼다 (#20).
 * 띄어쓴 낱말마다 반드시 들어가야 하고(+), 낱말은 따옴표로 묶어 ngram 조각이 이어진 그대로 찾는다.
 * 예: '더존 침해사고' → '+"더존" +"침해사고"'. ngram이 2글자 단위라 1글자 낱말은 뺀다
 */
export function toBooleanQuery(q: string): string | null {
  const words = q
    .replace(BOOLEAN_OPERATORS, ' ')
    .split(/\s+/)
    .filter((word) => [...word].length >= 2)
    .slice(0, 8);
  if (words.length === 0) return null;
  return words.map((word) => `+"${word}"`).join(' ');
}
