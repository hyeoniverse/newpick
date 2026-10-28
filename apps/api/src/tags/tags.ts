/**
 * 태그 표기 맞추기 (#20 태그 정돈). 같은 태그가 'AI 해킹' · 'AI해킹' · 'ai 해킹'처럼 갈라져 따로 세어지지 않게
 * 띄어쓰기 · 대소문자를 뺀 열쇠로 비교한다
 */
export const tagKey = (tag: string) => tag.replace(/\s+/g, '').toLowerCase();

export type TagRules = {
  /** 열쇠 → 바꿔 쓸 태그 (합치기) */
  aliases: Map<string, string>;
  /** 쓰지 않을 태그의 열쇠 (지우기) */
  blocked: Set<string>;
};

export type TagRuleRow = {
  keyword: string;
  action: string;
  target: string | null;
};

export const toRules = (rows: TagRuleRow[]): TagRules => ({
  aliases: new Map(
    rows
      .filter((r) => r.action === 'alias' && r.target)
      .map((r) => [tagKey(r.keyword), r.target as string]),
  ),
  blocked: new Set(
    rows.filter((r) => r.action === 'block').map((r) => tagKey(r.keyword)),
  ),
});

/**
 * 새 뉴스레터의 태그를 정돈한다: 합치기 규칙 → 지우기 규칙 → 이미 있는 표기로 맞추기 → 겹친 것 빼기.
 * existing: 지금까지 쓴 태그 (많이 쓴 것부터). 같은 열쇠면 먼저 나온(많이 쓴) 표기를 쓴다
 */
export function canonicalTags(
  tags: string[],
  rules: TagRules,
  existing: string[] = [],
) {
  const known = new Map<string, string>();
  for (const tag of existing)
    if (!known.has(tagKey(tag))) known.set(tagKey(tag), tag);
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of tags) {
    const aliased = rules.aliases.get(tagKey(raw)) ?? raw;
    const key = tagKey(aliased);
    if (!key || rules.blocked.has(key) || seen.has(key)) continue;
    seen.add(key);
    out.push(known.get(key) ?? aliased);
  }
  return out;
}

/** 뉴스레터 한 편의 태그 목록에서 from들을 to로 합친다 (순서 유지, 겹치면 하나만). 바뀌었으면 새 목록, 아니면 null */
export function mergeInto(
  tags: string[],
  from: string[],
  to: string,
): string[] | null {
  const fromKeys = new Set(from.map(tagKey));
  if (!tags.some((t) => fromKeys.has(tagKey(t)))) return null;
  const seen = new Set<string>();
  const out: string[] = [];
  for (const t of tags) {
    const next = fromKeys.has(tagKey(t)) ? to : t;
    if (seen.has(tagKey(next))) continue;
    seen.add(tagKey(next));
    out.push(next);
  }
  return out;
}

/** 태그 목록에서 하나를 뺀다. 바뀌었으면 새 목록, 아니면 null */
export function removeTag(tags: string[], tag: string): string[] | null {
  const key = tagKey(tag);
  return tags.some((t) => tagKey(t) === key)
    ? tags.filter((t) => tagKey(t) !== key)
    : null;
}
