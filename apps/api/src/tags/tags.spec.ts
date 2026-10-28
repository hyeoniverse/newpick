import { canonicalTags, mergeInto, removeTag, tagKey, toRules } from './tags';

describe('태그 정돈', () => {
  const rules = toRules([
    { keyword: 'NVIDIA', action: 'alias', target: '엔비디아' },
    { keyword: '단독', action: 'block', target: null },
  ]);

  it('띄어쓰기 · 대소문자를 빼고 비교한다', () => {
    expect(tagKey(' AI 해킹 ')).toBe(tagKey('ai해킹'));
  });

  it('합치기 → 지우기 → 이미 있는 표기 → 겹친 것 빼기', () => {
    expect(
      canonicalTags(['nvidia', 'AI해킹', '단독', 'ai 해킹', '코스피'], rules, [
        'AI 해킹',
        '엔비디아',
      ]),
    ).toEqual(['엔비디아', 'AI 해킹', '코스피']);
  });

  it('합치기: 순서를 지키고 겹치면 하나만, 해당 없으면 null', () => {
    expect(
      mergeInto(['AI해킹', '코스피', 'AI 해킹'], ['AI해킹'], 'AI 해킹'),
    ).toEqual(['AI 해킹', '코스피']);
    expect(mergeInto(['코스피'], ['AI해킹'], 'AI 해킹')).toBeNull();
  });

  it('지우기', () => {
    expect(removeTag(['단독', '코스피'], '단독')).toEqual(['코스피']);
    expect(removeTag(['코스피'], '단독')).toBeNull();
  });
});
