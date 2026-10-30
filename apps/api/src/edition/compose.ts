import type { Editorial, EditionSource } from './editor';
import { storyRef } from './editor';
import type { ParsedStory } from './parse';
import type { MailPlan } from './personalize';

/**
 * 구독자가 고른 분야로 그날의 메일 한 통을 엮는다 (#55). 호출 없음.
 *
 * 1. 오늘 한눈에: 고른 분야 전체에서 중요도 순
 * 2. 분야를 넘는 흐름: 고른 분야끼리만 잇는 흐름
 * 3. 분야별: 같은 사건은 중요도가 높은 쪽 한 번만 ("경제에도 실림")
 * 4. 관전 포인트: 합쳐서 중복 제거
 *
 * 편집 결과(editorial)가 없으면(호출 실패) 분야 순서·소식 순서로 정렬하고 흐름은 뺀다.
 * 맞춤 계획(plan, personalize.ts)이 있으면 취향에 닿는 소식을 앞당기고 이유를 붙이며, 다른 분야 소식을 더한다
 */

/** 그날 한 분야의 뉴스레터. 구조가 없는 예전 뉴스레터는 stories가 비어 있다 */
export type EditionNewsletter = EditionSource & {
  subtitle: string | null;
  summary: string;
  watch: string[];
};

export type ComposedStory = {
  ref: string;
  story: ParsedStory;
  /** 같은 사건을 다룬 다른 분야 (그쪽 소식은 빠진다) */
  alsoIn: string[];
};

export type ComposedSection = {
  category: string;
  newsletterId: number;
  title: string;
  stories: ComposedStory[];
  /** 구조가 없는 예전 뉴스레터: 부제목·요약만 */
  fallback?: { subtitle: string | null; summary: string };
};

export type ComposedEdition = {
  /** "10월 27일" */
  dateLabel: string;
  subject: string;
  categories: string[];
  top: {
    ref: string;
    category: string;
    heading: string;
    line: string;
    /** 맞춤: 앞당긴 이유 (닿은 관심 태그) */
    topics?: string[];
    /** 맞춤: 이 사람에게 왜 중요한지 (사람마다 쓴 한 줄) */
    why?: string;
  }[];
  /** 맞춤: 사람마다 쓴 브리핑 (메일 맨 위) */
  briefing?: string;
  threads: { title: string; text: string; categories: string[] }[];
  sections: ComposedSection[];
  watch: string[];
  /** 맞춤: 고르지 않은 분야에서 취향과 닿는 소식 (관심 가질 만한 소식) */
  extras: {
    ref: string;
    newsletterId: number;
    category: string;
    heading: string;
    line: string;
    topics: string[];
    why?: string;
  }[];
};

export const COMPOSE_LIMITS = { top: 5, watch: 5 };

type Item = {
  ref: string;
  source: EditionNewsletter;
  story?: ParsedStory;
  heading: string;
  line: string;
  importance: number;
  /** 정렬이 같을 때 순서: 분야 순서 → 소식 순서 */
  order: number;
  alsoIn: string[];
  /** 맞춤: 앞당긴 이유 */
  topics?: string[];
};

const dateLabel = (date: Date) =>
  new Intl.DateTimeFormat('ko-KR', {
    month: 'long',
    day: 'numeric',
    timeZone: 'Asia/Seoul',
  }).format(date);

/** 리드는 80자 이내라 그대로 들어간다 (newsletterWriter LIMITS.lead) */
const shorten = (text: string, max = 80) =>
  text.length > max ? `${text.slice(0, max - 1)}…` : text;

/** 비교용: 공백·문장부호를 걷어 낸다 */
const key = (text: string) => text.replace(/[\s.,·'"‘’“”!?~-]/g, '');

export function composeEdition(
  sources: EditionNewsletter[],
  editorial: Editorial | null,
  interests: number[],
  date: Date,
  plan?: MailPlan | null,
): ComposedEdition | null {
  const chosen = sources.filter((s) => interests.includes(s.categoryId));
  if (!chosen.length) return null;

  const items: Item[] = chosen.flatMap((source, si) => {
    // 구조가 없는 예전 뉴스레터는 제목을 소식 하나처럼
    if (!source.stories.length) {
      return [
        {
          ref: `${source.newsletterId}-0`,
          source,
          heading: source.title,
          line: shorten(source.subtitle || source.summary),
          importance: 2,
          order: si * 10,
          alsoIn: [],
        },
      ];
    }
    return source.stories.map((story, i) => {
      const ref = storyRef(source.newsletterId, i);
      const ranked = editorial?.ranking[ref];
      const boost = plan?.boosts[ref];
      return {
        ref,
        source,
        story,
        heading: story.heading,
        line: ranked?.line || shorten(story.lead || story.heading),
        // 편집 결과가 없으면 뉴스레터 안 순서 (앞 소식이 더 중요)
        // 취향에 닿으면 그만큼 더해 앞당긴다 (최대 +2)
        importance:
          (ranked?.importance ?? Math.max(1, 3 - i)) + (boost?.bonus ?? 0),
        order: si * 10 + i,
        alsoIn: [],
        topics: boost?.topics,
      };
    });
  });

  // 같은 사건은 중요도가 높은 쪽만 남기고, 빠진 쪽의 분야를 표시한다
  const dropped = new Set<string>();
  for (const group of editorial?.duplicates ?? []) {
    const members = items
      .filter((item) => group.includes(item.ref))
      .sort(byImportance);
    const [keep, ...rest] = members;
    for (const item of rest) {
      dropped.add(item.ref);
      if (
        item.source.category !== keep.source.category &&
        !keep.alsoIn.includes(item.source.category)
      ) {
        keep.alsoIn.push(item.source.category);
      }
    }
  }
  const kept = items.filter((item) => !dropped.has(item.ref));

  const top = [...kept]
    .sort(byImportance)
    .slice(0, COMPOSE_LIMITS.top)
    .map((item) => ({
      ref: item.ref,
      category: item.source.category,
      heading: item.heading,
      line: item.line,
      ...(item.topics?.length && { topics: item.topics }),
      ...(plan?.note?.whys[item.ref] && { why: plan.note.whys[item.ref] }),
    }));

  // 섹션은 가장 중요한 소식이 높은 분야부터
  const sections = chosen
    .map((source) => {
      const own = kept
        .filter((item) => item.source === source)
        .sort(byImportance);
      return { source, own, best: own[0] };
    })
    .filter((s) => s.best)
    .sort((a, b) => byImportance(a.best, b.best))
    .map(
      ({ source, own }): ComposedSection => ({
        category: source.category,
        newsletterId: source.newsletterId,
        title: source.title,
        stories: own
          .filter((item) => item.story)
          .map((item) => ({
            ref: item.ref,
            story: item.story!,
            alsoIn: item.alsoIn,
          })),
        fallback: source.stories.length
          ? undefined
          : { subtitle: source.subtitle, summary: source.summary },
      }),
    );

  // 흐름은 이어지는 분야를 모두 고른 구독자에게만
  const categoryOf = new Map(
    sources.flatMap((s) =>
      s.stories.map((_, i) => [storyRef(s.newsletterId, i), s] as const),
    ),
  );
  const threads = (editorial?.threads ?? [])
    .map((t) => ({
      ...t,
      sources: [
        ...new Set(t.refs.map((ref) => categoryOf.get(ref)).filter(Boolean)),
      ] as EditionNewsletter[],
    }))
    .filter(
      (t) =>
        t.sources.length >= 2 &&
        t.sources.every((s) => interests.includes(s.categoryId)),
    )
    .map((t) => ({
      title: t.title,
      text: t.text,
      categories: t.sources.map((s) => s.category),
    }));

  // 분야마다 돌아가며 하나씩: 앞 분야가 자리를 다 차지하지 않게
  const lists = sections.map(
    (s) => chosen.find((c) => c.newsletterId === s.newsletterId)!.watch,
  );
  const longest = Math.max(0, ...lists.map((l) => l.length));
  const seen = new Set<string>();
  const watch = Array.from({ length: longest }, (_, i) =>
    lists.map((l) => l[i]),
  )
    .flat()
    .filter((w): w is string => {
      const k = w && key(w);
      if (!k || seen.has(k)) return false;
      seen.add(k);
      return true;
    })
    .slice(0, COMPOSE_LIMITS.watch);

  // 맞춤: 고르지 않은 분야에서 더하는 소식 (같은 사건이 이미 메일에 있으면 빼고)
  const shown = new Set(kept.map((item) => item.ref));
  const dupOf = (ref: string) =>
    (editorial?.duplicates ?? []).some(
      (group) => group.includes(ref) && group.some((r) => shown.has(r)),
    );
  const extras = (plan?.extras ?? []).flatMap((extra) => {
    const source = sources.find((s) => s.newsletterId === extra.newsletterId);
    const index = Number(extra.ref.split('-')[1]) - 1;
    const story = source?.stories[index];
    if (
      !source ||
      !story ||
      interests.includes(source.categoryId) ||
      dupOf(extra.ref)
    )
      return [];
    return [
      {
        ref: extra.ref,
        newsletterId: source.newsletterId,
        category: source.category,
        heading: story.heading,
        line:
          editorial?.ranking[extra.ref]?.line ||
          shorten(story.lead || story.heading),
        topics: extra.topics,
        ...(plan?.note?.whys[extra.ref] && { why: plan.note.whys[extra.ref] }),
      },
    ];
  });

  const label = dateLabel(date);
  return {
    dateLabel: label,
    // 사람마다 쓴 제목이 있으면 그것으로
    subject: `${label} 뉴픽 · ${plan?.note?.subject || top[0]?.heading || chosen[0].title}`,
    ...(plan?.note?.briefing && { briefing: plan.note.briefing }),
    categories: sections.map((s) => s.category),
    top,
    threads,
    sections,
    watch,
    extras,
  };
}

function byImportance(a: Item, b: Item) {
  return b.importance - a.importance || a.order - b.order;
}
