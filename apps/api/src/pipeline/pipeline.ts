import type { PipelineKind, PipelineStep } from '@newpick/shared';

/** 홈 '지금 뉴픽은'에 보이는 수 */
export const PIPELINE_LIMITS = {
	/** 키워드 수 */
	keywords: 14,
	/** 이만큼 넘게 나온 낱말만 키워드 */
	minKeyword: 2,
	/** 같은 사건 묶음 수 (2건 이상인 것만) */
	clusters: 6,
};

/** 단계 (처음에는 모두 기다림) */
export const PIPELINE_STEPS: Record<PipelineKind, Pick<PipelineStep, 'key' | 'label'>[]> = {
	crawl: [
		{ key: 'fetch', label: '기사 모으기' },
		{ key: 'classify', label: '분야 나누기' },
		{ key: 'cluster', label: '같은 사건 묶기' },
		{ key: 'breaking', label: '속보 판정' },
	],
	summary: [
		{ key: 'newsletters', label: '분야별 뉴스레터' },
		{ key: 'edition', label: '오늘의 편집' },
		{ key: 'links', label: '이어지는 소식' },
	],
};

/** 키워드로 치지 않는 낱말: 기사 제목의 상투어 · 꾸밈말 */
const STOPWORDS = new Set([
	'속보',
	'단독',
	'종합',
	'포토',
	'영상',
	'사진',
	'오늘',
	'내일',
	'어제',
	'올해',
	'내년',
	'지난해',
	'관련',
	'대한',
	'위해',
	'통해',
	'따라',
	'이번',
	'최대',
	'최고',
	'최초',
	'가능',
	'예정',
	'발표',
	'진행',
	'우려',
	'논란',
	'사실',
	'정도',
	'이후',
	'이상',
	'이하',
	'만에',
	'까지',
	'부터',
	'에서',
	'으로',
	'하는',
	'있는',
	'없는',
	'했다',
	'한다',
	'된다',
	'됐다',
	'이다',
	'아니',
	'나선',
	'나서',
	'기자',
	'뉴스',
	'가장',
	'대부분',
	'모두',
	'다시',
	'계속',
	'결국',
	'이제',
	'아직',
	'바로',
	'처음',
	'역대',
	'전국',
	'모든',
	'여러',
	'일부',
	'직접',
	'함께',
	'들어',
	'나와',
	'앞두고',
	'밝혀',
	'대해',
	'위한',
	'따른',
	'놓고',
]);

/** 낱말 끝의 두 글자 이상 조사: 떼고 두 글자 이상 남으면 늘 뗀다 */
const LONG_ENDINGS = [
	'에서는',
	'으로는',
	'에게서',
	'까지는',
	'에서',
	'으로',
	'에게',
	'까지',
	'부터',
	'하고',
	'이라',
	'라며',
	'이며',
	'에는',
	'와의',
	'과의',
];
/** 한 글자 조사: 세 글자 이상 남거나, 뗀 말이 다른 제목에도 따로 나올 때만 뗀다 ('어린이' · '올가을'을 자르지 않게) */
const SHORT_ENDINGS = ['은', '는', '이', '가', '을', '를', '의', '에', '로', '와', '과', '도', '만'];

const rawWords = (title: string) =>
	title
		.replace(/\[[^\]]*\]|\([^)]*\)|【[^】]*】/g, ' ')
		.split(/[^0-9A-Za-z가-힣]+/)
		.filter((word) => word.length >= 2);

function stem(raw: string, known: Set<string>) {
	for (const ending of LONG_ENDINGS)
		if (raw.length - ending.length >= 2 && raw.endsWith(ending)) return raw.slice(0, -ending.length);
	for (const ending of SHORT_ENDINGS) {
		if (!raw.endsWith(ending)) continue;
		const rest = raw.slice(0, -1);
		if (rest.length >= 3 || (rest.length === 2 && known.has(rest))) return rest;
	}
	return raw;
}

/**
 * 제목 한 줄의 낱말: 말머리([속보] · (종합))를 빼고 띄어쓰기로 나눈 뒤 조사를 뗀다.
 * 상투어 · 꾸밈말, 숫자로 시작하는 말(3000명 · 2%), '~다'로 끝나는 서술(온다 · 찾는다)은 뺀다. 한 제목에서는 한 번.
 * known: 같은 회차 다른 제목의 낱말 (한 글자 조사를 뗄지 정할 때)
 */
export function wordsOf(title: string, known: Set<string> = new Set()) {
	const words = rawWords(title)
		.map((raw) => stem(raw, known))
		.filter((word) => word.length >= 2 && !/^\d/.test(word) && !word.endsWith('다') && !STOPWORDS.has(word));
	return [...new Set(words)];
}

/** 제목들에서 많이 나온 낱말 (한 제목에서는 한 번만 센다) */
export function keywordsOf(titles: string[], limit = PIPELINE_LIMITS.keywords) {
	const known = new Set(titles.flatMap(rawWords));
	const counts = new Map<string, number>();
	for (const title of titles) for (const word of wordsOf(title, known)) counts.set(word, (counts.get(word) ?? 0) + 1);
	return [...counts]
		.filter(([, count]) => count >= PIPELINE_LIMITS.minKeyword)
		.sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'ko'))
		.slice(0, limit)
		.map(([word, count]) => ({ word, count }));
}

/** 묶음 이름: 묶음 안 제목에 가장 많이 함께 나온 낱말 둘 (기사 제목을 그대로 쓰지 않는다) */
export function clusterLabel(titles: string[]) {
	const top = keywordsOf(titles, 2).map((k) => k.word);
	if (top.length) return top.join(' · ');
	return wordsOf(titles[0] ?? '', new Set(titles.flatMap(rawWords)))
		.slice(0, 2)
		.join(' · ');
}
