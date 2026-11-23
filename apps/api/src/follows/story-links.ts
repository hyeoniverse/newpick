import { cosine } from 'src/ai-summary/article-prep';
import type { NewStory } from './detect';

/**
 * 이어지는 이야기: 오늘 소식마다 지난 며칠 소식 가운데 같은 사건의 앞 소식을 찾아 잇는다 (바로 앞 하나).
 * 후속 지켜보기와 같은 방식: 임베딩으로 후보를 추리고, 오픈 모델이 "같은 사건 · 사안의 새 진전인가"를 판정한다.
 * 앞 소식도 그날 자기 앞 소식과 이어져 있으므로, 거슬러 올라가면 며칠에 걸친 사건 하나가 된다
 */
export const LINK_LIMITS = {
	/** 지난 며칠 소식과 견줄지 */
	lookbackDays: 7,
	/** 이만큼 비슷해야 판정 후보 (후속 지켜보기와 같은 기준) */
	candidate: 0.55,
	/** 오픈 모델을 못 쓸 때 판정 없이 받아들이는 유사도 */
	autoAccept: 0.72,
	/** 오늘 소식 하나에 판정할 후보 수 */
	perStory: 3,
	/** 이유 한 줄 길이 */
	reason: 80,
	/** 거슬러 올라가는 최대 단계 (오늘 포함 소식 수) */
	maxSteps: 6,
};

/** 지난 소식 (견줄 대상): 날짜를 함께 */
export type PastStory = NewStory & { date: string };

/** 오늘 소식에 비슷한 지난 소식 (유사도 큰 순, 다른 날짜만) */
export function linkCandidates(story: NewStory & { date: string }, past: PastStory[]) {
	return past
		.filter((p) => p.date < story.date)
		.map((prev) => ({ prev, score: cosine(story.vector, prev.vector) }))
		.filter((c) => c.score >= LINK_LIMITS.candidate)
		.sort((a, b) => b.score - a.score)
		.slice(0, LINK_LIMITS.perStory);
}

/** 받아들인 후보 가운데 바로 앞 소식: 가장 최근 날짜, 같으면 더 비슷한 것 */
export function nearestPrev<T extends { prev: { date: string }; score: number }>(accepted: T[]): T | undefined {
	return [...accepted].sort((a, b) => b.prev.date.localeCompare(a.prev.date) || b.score - a.score)[0];
}

export const LINK_SYSTEM =
	'You are a careful Korean news editor. You decide whether a new story continues earlier stories about the same event. Reply in Korean.';

export const linkPrompt = (
	story: Pick<NewStory, 'heading' | 'text' | 'category'>,
	candidates: { prev: Pick<PastStory, 'heading' | 'text' | 'category' | 'date'> }[],
) =>
	[
		'오늘 나온 소식입니다.',
		`(${story.category}) ${story.heading}`,
		story.text.slice(0, 600),
		'',
		'지난 며칠 동안 나온 소식입니다.',
		...candidates.map(
			(c, i) => `[${i + 1}] (${c.prev.category}, ${c.prev.date}) ${c.prev.heading}\n${c.prev.text.slice(0, 400)}`,
		),
		'',
		'지난 소식마다 오늘 소식이 그 소식에 이어지는지 판정합니다.',
		'- follow: true는 같은 사건 · 사안이 오늘 새로 진전했을 때만 (조사 결과 발표, 판결, 결정, 반응, 추가 피해, 일정 확정 등). 같은 분야 · 비슷한 주제의 다른 일이면 false.',
		`- reason: true면 그 지난 소식보다 오늘 무엇이 새로 나왔는지 ${LINK_LIMITS.reason}자 이내 평서체 한 줄 (예: "법원이 구속영장을 발부했다"). false면 빈 문자열.`,
		'- 소식에 있는 사실만 씁니다.',
	].join('\n');

/** 저장된 연결 한 줄 (StoryLink) */
export type LinkRow = {
	newsletterId: number;
	storyIndex: number;
	prevNewsletterId: number;
	prevStoryIndex: number;
	reason: string;
};

export const refOf = (newsletterId: number, storyIndex: number) => `${newsletterId}-${storyIndex}`;

/**
 * 오늘 소식에서 앞 소식을 따라 거슬러 올라간 사슬 (오래된 것부터). 앞 소식이 없으면 빈 배열.
 * 각 단계의 reason은 그 소식이 앞 소식보다 새로 나온 것 (첫 단계는 빈 문자열)
 */
export function chainOf(start: { newsletterId: number; storyIndex: number }, links: Map<string, LinkRow>) {
	const steps: { newsletterId: number; storyIndex: number; reason: string }[] = [];
	const seen = new Set<string>();
	let current: { newsletterId: number; storyIndex: number } = start;
	while (steps.length < LINK_LIMITS.maxSteps) {
		const ref = refOf(current.newsletterId, current.storyIndex);
		if (seen.has(ref)) break;
		seen.add(ref);
		const link = links.get(ref);
		steps.unshift({ newsletterId: current.newsletterId, storyIndex: current.storyIndex, reason: link?.reason ?? '' });
		if (!link) break;
		current = { newsletterId: link.prevNewsletterId, storyIndex: link.prevStoryIndex };
	}
	if (steps.length < 2) return [];
	// 가장 오래된 단계는 그 앞이 없거나(시작) 단계 수 끝이라, 무엇이 새로 나왔는지 대신 사건의 시작으로 보인다
	steps[0] = { ...steps[0], reason: '' };
	return steps;
}
