import {
  Claim,
  LIMITS,
  Story,
  Template,
  TEMPLATES,
  WrittenNewsletter,
} from './types';

/** 쓰기 응답 정리: 따옴표 · 형광펜 · 키워드 · 템플릿 맞추기 · 아침 속보 나누기 (호출 없음) */

// ---------- 응답 정리 ----------

const QUOTE = /["'“”‘’「」]/;

/**
 * 모델이 지시와 달리 제목 전체를 따옴표로 감싸 오면 걷어 냅니다.
 * 이 대통령 "땅 뺏는 것 아니다"처럼 제목 안의 인용은 그대로 둡니다
 */
export const clean = (value: string) => {
  const text = value.trim();
  const inner = text.slice(1, -1);
  const wrapped =
    text.length > 2 &&
    QUOTE.test(text[0]) &&
    QUOTE.test(text[text.length - 1]) &&
    !QUOTE.test(inner);
  return (wrapped ? inner : text).trim();
};

/** 강조 표시 ==구절== (#51). 본문을 HTML로 바꿀 때 <mark>가 된다 */
const MARK = /==([^=\n]+?)==/g;

/** 강조를 쓰지 않는 항목(제목·요약·키워드 등)에 섞여 들어온 ==를 지운다 */
export const plain = (text: string) =>
  text.replace(MARK, '$1').replace(/==/g, '').trim();

/**
 * 소식 하나의 강조를 앞에서부터 max곳까지만 남기고, 너무 긴 강조와 나머지는 푼다.
 * 문단 전체가 칠해지면 강조가 아니게 되므로 길이도 제한한다
 */
export function limitMarks(
  texts: string[],
  max: number = LIMITS.marks.max,
  length: number = LIMITS.marks.length,
): string[] {
  let kept = 0;
  return texts.map((text) =>
    text
      // 남길 강조는 잠시 다른 문자로 바꿔 두고
      .replace(MARK, (_, inner: string) => {
        const phrase = inner.trim();
        if (phrase && phrase.length <= length && kept < max) {
          kept++;
          return `\u0001${phrase}\u0002`;
        }
        return inner;
      })
      // 짝이 맞지 않아 남은 ==는 지운 뒤 되돌린다
      .replace(/==/g, '')
      .replace(/[\u0001\u0002]/g, '=='),
  );
}

/** 모델이 지시와 달리 붙인 글머리 기호를 걷어 냅니다 */
const unbullet = (value: string) => plain(value).replace(/^[-•·*]\s*/, '');

/** '#'·공백 정리, 너무 긴 것 버리기, 대소문자 무시 중복 제거, 최대 6개 */
export const keywords = (items: string[]) => {
  const seen = new Set<string>();
  return items
    .map((k) => plain(k).replace(/^#+/, '').replace(/\s+/g, ' ').trim())
    .filter((k) => k && k.length <= LIMITS.keywords.length)
    .filter((k) => {
      const key = k.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, LIMITS.keywords.max);
};

/** 각 필드를 다듬고, 값이 모두 있는 항목만 max개까지 */
const rows = <T extends Record<string, string>>(items: T[], max: number) =>
  items
    .map(
      (item) =>
        Object.fromEntries(
          Object.entries(item).map(([k, v]) => [k, unbullet(v)]),
        ) as T,
    )
    .filter((item) => Object.values(item).every(Boolean))
    .slice(0, max);

/**
 * 템플릿의 고유 요소가 모자라면 해설형으로 바꾼다 (빈 지표 카드나 한 줄짜리 타임라인을 그리지 않게).
 * 해당하지 않는 템플릿의 요소는 비운다
 */
export function settleTemplate(story: Story): Story {
  const enough: Record<Template, boolean> = {
    numbers: story.stats.length >= LIMITS.stats.min,
    timeline: story.timeline.length >= LIMITS.timeline.min,
    qa: story.qa.length >= LIMITS.qa.min,
    quote: Boolean(story.quote.text && story.quote.by),
    analysis: true,
    brief: true,
  };
  const template: Template =
    TEMPLATES.includes(story.template) && enough[story.template]
      ? story.template
      : 'analysis';
  return {
    ...story,
    template,
    stats: template === 'numbers' ? story.stats : [],
    timeline: template === 'timeline' ? story.timeline : [],
    qa: template === 'qa' ? story.qa : [],
    quote: template === 'quote' ? story.quote : { text: '', by: '' },
    analysis: template === 'brief' ? '' : story.analysis,
  };
}

/**
 * 응답을 정리하고, 저장하면 안 되는 모양이면 오류를 던집니다.
 * toOriginal: 쓰기 단계 기사 번호(1부터) → 원래 기사 번호(1부터). 없는 번호는 버린다
 */
/**
 * 엇갈린 주장 정리: 빈 칸 · 같은 쪽 중복을 빼고, 주장하는 쪽이 둘 이상일 때만 남긴다 (한쪽뿐이면 '엇갈린' 주장이 아니다)
 */
export function debateOf(list: Claim[] = []): Claim[] {
  const seen = new Set<string>();
  const claims = list
    .map((c) => ({
      side: plain(c.side),
      claim: plain(c.claim),
      source: plain(c.source ?? ''),
    }))
    .filter((c) => c.side && c.claim && !seen.has(c.side) && seen.add(c.side))
    .slice(0, LIMITS.debate.max);
  return claims.length >= 2 ? claims : [];
}

/** 소식 하나 정리: 글머리 · 따옴표 · 강조 개수 · 항목 수 제한, 기사 번호를 원래 번호로 */
const normalizeStories = (
  list: Story[] = [],
  toOriginal: (n: number) => number | undefined,
  max: number,
) =>
  list
    .map((s) => {
      const qa = s.qa
        .map((x) => ({ q: unbullet(x.q), a: x.a.trim() }))
        .filter((x) => x.q && plain(x.a))
        .slice(0, LIMITS.qa.max);
      // 강조는 본문 → 시사점 → 문답 답 순서로 소식마다 최대 3곳
      const [body, analysis, ...answers] = limitMarks([
        s.body.trim(),
        s.analysis.trim(),
        ...qa.map((x) => x.a),
      ]);
      return {
        template: s.template,
        kicker: plain(s.kicker),
        heading: clean(plain(s.heading)),
        lead: plain(s.lead),
        body,
        analysis,
        stats: rows(s.stats, LIMITS.stats.max),
        timeline: rows(s.timeline, LIMITS.timeline.max),
        qa: qa.map((x, i) => ({ q: x.q, a: answers[i] })),
        quote: { text: clean(plain(s.quote.text)), by: plain(s.quote.by) },
        debate: debateOf(s.debate),
        next: plain(s.next ?? '').slice(0, LIMITS.next * 2),
        tags: keywords(s.tags ?? []).slice(0, LIMITS.storyTags.max),
        imageQuery: s.imageQuery.trim(),
        sources: [
          ...new Set(
            s.sources
              .filter(Number.isInteger)
              .map(toOriginal)
              .filter((n): n is number => n !== undefined),
          ),
        ],
      };
    })
    .map(settleTemplate)
    .filter((s) => s.heading && (s.lead || s.body))
    .slice(0, max);

/**
 * 아침 속보 표시를 근거 기사로 바로잡는다: 근거가 모두 아침 속보 기사(본문 기사 다음 번호)면 아침 속보, 아니면 본문 소식.
 * 모델이 아침 속보에 morning: false를 붙이면 본문 소식 넷째로 밀려 잘리고, 요약에는 그 문장이 남았다
 */
export function markMorning(
  raw: WrittenNewsletter,
  storyArticles: number,
  hasMorning: boolean,
): WrittenNewsletter {
  return {
    ...raw,
    stories: raw.stories.map((s) => {
      const sources = (s.sources ?? []).filter(Number.isInteger);
      const morning = !hasMorning
        ? false
        : sources.length
          ? sources.every((n) => n > storyArticles)
          : (s as Story & { morning?: boolean }).morning === true;
      return { ...s, morning };
    }),
  };
}

export function normalize(
  raw: WrittenNewsletter,
  toOriginal: (n: number) => number | undefined,
): WrittenNewsletter {
  // 아침 속보는 stories 안에 morning: true로 온다 (예전 응답은 따로 morning 배열). 본문 소식과 같은 형식으로 다듬는다
  const isMorning = (s: Story & { morning?: boolean }) => s.morning === true;
  const stories = normalizeStories(
    raw.stories.filter((s) => !isMorning(s)),
    toOriginal,
    LIMITS.stories,
  );
  const morning = normalizeStories(
    [...(raw.morning ?? []), ...raw.stories.filter(isMorning)],
    toOriginal,
    LIMITS.morning.max,
  );

  const result = {
    title: clean(plain(raw.title)),
    subtitle: clean(plain(raw.subtitle)),
    summary: plain(raw.summary),
    briefing: plain(raw.briefing),
    stories,
    ...(morning.length && { morning }),
    // 관전 포인트 모음 = 소식마다의 next. 같은 내용을 모델이 두 번 쓰지 않게
    watch: [...morning, ...stories]
      .map((s) => s.next)
      .filter((n): n is string => !!n),
    keywords: keywords(raw.keywords),
  };
  if (!result.title) throw new Error('빈 제목');
  if (!result.stories.length) throw new Error('소식이 없음');
  return result;
}
