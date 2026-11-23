/**
 * 속보 판정 규칙 (호출 없음). 매시 수집한 새 기사 제목을 한 번에 모아 판정 모델에 묻고, 아주 엄격한 기준을 넘는 사건만 남긴다.
 * 남긴 속보는 잠깐(holdMinutes) 뒤 저절로 나간다: 속보는 빨라야 해서 관리자 승인을 기다리지 않고, 판정이 틀렸을 때만 그 사이에 막는다.
 * 속보는 정말 큰 일만: 계엄 · 전쟁 · 대형 참사, 전 국민에게 바로 영향을 주는 긴급 결정(수능 긴급 대책 등) 수준
 */
export const BREAKING_LIMITS = {
	/** 이 점수 이상만 후보 */
	minScore: 9,
	/** 한 번에 판정 모델에 보낼 기사 수 (새것부터) */
	maxArticles: 80,
	/** 한 번에 남길 사건 수 */
	maxEvents: 3,
	/** 이만큼 지난 후보와 같은 사건인지 견준다 (시간) */
	dedupeHours: 48,
	/** 이만큼 비슷하면 같은 사건 (사건 한 줄 임베딩) */
	sameEvent: 0.8,
	/** 관련 기사로 남길 수 */
	articles: 5,
	/** 판정 뒤 이만큼 기다렸다가 저절로 보낸다: 그 사이 관리자가 '보내지 않기'로 막을 수 있다 (분) */
	holdMinutes: 5,
	/** 하루(KST)에 저절로 보내는 최대 수. 넘으면 보류로 남는다 (관리자가 직접 보낼 수는 있다) */
	dailyLimit: 3,
	/** 홈 속보 띠에 보이는 시간 (감지한 뒤, 시간) */
	noticeHours: 24,
};

/** 판정에 보낼 기사 */
export type BreakingInput = { title: string; link: string; source: string; category: string; image?: string };

export const BREAKING_SYSTEM =
	'You are a very strict Korean news desk chief. You decide whether any event deserves a breaking-news alert sent to every subscriber. Almost nothing does. Reply in Korean.';

export const breakingPrompt = (articles: BreakingInput[]) =>
	[
		'방금 수집한 기사 제목입니다.',
		...articles.map((a, i) => `[${i + 1}] (${a.category}) ${a.title}`),
		'',
		'같은 사건을 다룬 기사는 하나로 묶고, 사건마다 속보 점수를 매깁니다.',
		'- 10: 나라의 체계가 흔들리는 일. 계엄 선포, 전쟁 · 무력 충돌 발발, 대통령 탄핵 · 유고, 수백 명 이상이 숨진 대형 참사',
		'- 9: 전 국민의 생활에 바로 영향을 주는 긴급한 결정 · 사건. 수능 등 국가 시험의 긴급 대책, 전국 단위 긴급 조치(휴교 · 이동 제한 등), 증시 서킷브레이커 발동',
		'- 8 이하: 그 밖의 모든 주요 뉴스. 정책 발표, 예정된 선거 · 회의 결과, 기업 실적 · 인수, 일반 사건사고, 유명인 소식, 해외의 큰 뉴스라도 한국 생활에 바로 영향이 없으면 8 이하',
		'- 애매하면 낮게 매깁니다. 대부분의 시간에는 9 이상이 하나도 없습니다.',
		`- 9 이상인 사건만 최대 ${BREAKING_LIMITS.maxEvents}개 돌려줍니다. 없으면 빈 배열.`,
		'- headline: 무슨 일이 일어났는지 60자 이내 한 줄 (평서체). reason: 왜 속보인지 한두 문장. items: 그 사건을 다룬 기사 번호.',
		'- 기사 제목에 있는 사실만 씁니다.',
	].join('\n');

export const BREAKING_SCHEMA = {
	type: 'object',
	properties: {
		events: {
			type: 'array',
			items: {
				type: 'object',
				properties: {
					score: { type: 'integer' },
					headline: { type: 'string' },
					reason: { type: 'string' },
					items: { type: 'array', items: { type: 'integer' } },
				},
				required: ['score', 'headline', 'reason', 'items'],
				additionalProperties: false,
			},
		},
	},
	required: ['events'],
	additionalProperties: false,
};

export type BreakingEvent = { score: number; headline: string; reason: string; articles: BreakingInput[] };

/** 판정 결과 → 기준을 넘는 사건 (점수 · 한 줄이 이상하거나 기사가 하나도 없으면 뺀다), 점수 높은 순 */
export function eventsFrom(raw: unknown, articles: BreakingInput[]): BreakingEvent[] {
	const events = (raw as { events?: unknown[] })?.events;
	if (!Array.isArray(events)) return [];
	return events
		.flatMap((e) => {
			const item = e as { score?: unknown; headline?: unknown; reason?: unknown; items?: unknown };
			const score = Number(item.score);
			const headline = typeof item.headline === 'string' ? item.headline.replace(/\s+/g, ' ').trim().slice(0, 200) : '';
			const reason = typeof item.reason === 'string' ? item.reason.trim().slice(0, 1000) : '';
			const picked = Array.isArray(item.items)
				? [...new Set(item.items.map(Number))]
						.filter((n) => Number.isInteger(n) && n >= 1 && n <= articles.length)
						.map((n) => articles[n - 1])
				: [];
			if (!Number.isFinite(score) || score < BREAKING_LIMITS.minScore || score > 10 || !headline || !picked.length)
				return [];
			return [{ score, headline, reason, articles: picked.slice(0, BREAKING_LIMITS.articles) }];
		})
		.sort((a, b) => b.score - a.score)
		.slice(0, BREAKING_LIMITS.maxEvents);
}
