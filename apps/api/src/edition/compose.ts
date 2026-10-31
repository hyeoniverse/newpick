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
 * 맞춤 계획(plan, personalize.ts)이 있으면 분야를 나누지 않고 계획의 소식을 점수 순으로 싣는다 (composePersonal)
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
  /** 맞춤 메일: 소식마다 분야와 원래 뉴스레터 (분야별 묶음이 없어서) */
  category?: string;
  newsletterId?: number;
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
  top: { ref: string; category: string; heading: string; line: string }[];
  threads: { title: string; text: string; categories: string[] }[];
  sections: ComposedSection[];
  watch: string[];
  /** 맞춤 메일: 분야를 나누지 않고 점수 순 (sections는 소식 하나씩) */
  personal?: boolean;
  /** 맞춤: 사람마다 쓴 브리핑 (메일 맨 위) */
  briefing?: string;
  /** 메일에 엮은 뉴스레터 (발송 기록) */
  newsletterIds: number[];
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
  if (plan?.picks?.length) {
    const personal = composePersonal(sources, editorial, date, plan);
    if (personal) return personal;
  }
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
      return {
        ref,
        source,
        story,
        heading: story.heading,
        line: ranked?.line || shorten(story.lead || story.heading),
        // 편집 결과가 없으면 뉴스레터 안 순서 (앞 소식이 더 중요)
        importance: ranked?.importance ?? Math.max(1, 3 - i),
        order: si * 10 + i,
        alsoIn: [],
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

  const watch = mergeWatch(
    sections.map(
      (s) => chosen.find((c) => c.newsletterId === s.newsletterId)!.watch,
    ),
  );

  const label = dateLabel(date);
  return {
    dateLabel: label,
    subject: `${label} 뉴픽 · ${top[0]?.heading ?? chosen[0].title}`,
    categories: sections.map((s) => s.category),
    top,
    threads,
    sections,
    watch,
    newsletterIds: sections.map((s) => s.newsletterId),
  };
}

/**
 * 맞춤 메일: 계획(plan.picks)의 소식을 점수 순 그대로. 오늘 한눈에 = 실린 소식 전부,
 * 흐름은 양쪽 소식이 모두 실렸을 때만, 관전 포인트는 실린 분야에서.
 * 계획의 소식이 하나도 없으면(그날 뉴스레터가 바뀜 등) null — 분야별 메일로
 */
function composePersonal(
  sources: EditionNewsletter[],
  editorial: Editorial | null,
  date: Date,
  plan: MailPlan,
): ComposedEdition | null {
  const items = plan.picks.flatMap(({ ref, newsletterId }) => {
    const source = sources.find((s) => s.newsletterId === newsletterId);
    const story = source?.stories[Number(ref.split('-')[1]) - 1];
    return source && story ? [{ ref, source, story }] : [];
  });
  if (!items.length) return null;

  const top = items.map(({ ref, source, story }) => ({
    ref,
    category: source.category,
    heading: story.heading,
    line: editorial?.ranking[ref]?.line || shorten(story.lead || story.heading),
  }));
  const sections: ComposedSection[] = items.map(({ ref, source, story }) => ({
    category: source.category,
    newsletterId: source.newsletterId,
    title: source.title,
    stories: [
      {
        ref,
        story,
        alsoIn: [],
        category: source.category,
        newsletterId: source.newsletterId,
      },
    ],
  }));
  const shown = new Set(items.map((i) => i.ref));
  const threads = (editorial?.threads ?? [])
    .filter((t) => t.refs.filter((ref) => shown.has(ref)).length >= 2)
    .map((t) => ({
      title: t.title,
      text: t.text,
      categories: [
        ...new Set(
          items
            .filter((i) => t.refs.includes(i.ref))
            .map((i) => i.source.category),
        ),
      ],
    }));
  const used = [...new Set(items.map((i) => i.source))];
  const label = dateLabel(date);
  return {
    dateLabel: label,
    subject: `${label} 뉴픽 · ${plan.note?.subject || top[0].heading}`,
    ...(plan.note?.briefing && { briefing: plan.note.briefing }),
    categories: used.map((s) => s.category),
    top,
    threads,
    sections,
    watch: mergeWatch(used.map((s) => s.watch)),
    personal: true,
    newsletterIds: used.map((s) => s.newsletterId),
  };
}

/** 관전 포인트: 분야마다 돌아가며 하나씩 (앞 분야가 자리를 다 차지하지 않게), 겹치면 한 번 */
function mergeWatch(lists: string[][]) {
  const longest = Math.max(0, ...lists.map((l) => l.length));
  const seen = new Set<string>();
  return Array.from({ length: longest }, (_, i) => lists.map((l) => l[i]))
    .flat()
    .filter((w): w is string => {
      const k = w && key(w);
      if (!k || seen.has(k)) return false;
      seen.add(k);
      return true;
    })
    .slice(0, COMPOSE_LIMITS.watch);
}

function byImportance(a: Item, b: Item) {
  return b.importance - a.importance || a.order - b.order;
}
