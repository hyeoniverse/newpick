import { TEMPLATES } from './types';

/** 모델 응답 JSON 스키마: 고르기 점수 · 뉴스레터 본문 */

export const SELECT_SCHEMA = {
	type: 'object',
	properties: {
		scores: {
			type: 'array',
			items: {
				type: 'object',
				properties: {
					n: { type: 'integer' },
					title: { type: 'string' },
					impact: { type: 'integer' },
					novelty: { type: 'integer' },
					relevance: { type: 'integer' },
					followup: { type: 'integer' },
					excluded: { type: 'boolean' },
					repeat: { type: 'boolean' },
					reason: { type: 'string' },
				},
				required: ['n', 'title', 'impact', 'novelty', 'relevance', 'followup', 'excluded', 'repeat', 'reason'],
				additionalProperties: false,
			},
		},
	},
	required: ['scores'],
	additionalProperties: false,
};

/** 문자열 필드만 가진 객체 스키마 */
const pairs = (keys: string[]) => ({
	type: 'object',
	properties: Object.fromEntries(keys.map((k) => [k, { type: 'string' }])),
	required: keys,
	additionalProperties: false,
});

/** 소식 하나 (본문 소식 · 아침 속보 공통) */
export const STORY_SCHEMA = {
	type: 'object',
	properties: {
		template: { type: 'string', enum: [...TEMPLATES] },
		kicker: { type: 'string' },
		heading: { type: 'string' },
		lead: { type: 'string' },
		body: { type: 'string' },
		analysis: { type: 'string' },
		stats: {
			type: 'array',
			items: pairs(['label', 'value', 'note']),
		},
		timeline: { type: 'array', items: pairs(['when', 'what']) },
		qa: { type: 'array', items: pairs(['q', 'a']) },
		quote: pairs(['text', 'by']),
		debate: { type: 'array', items: pairs(['side', 'claim', 'source']) },
		next: { type: 'string' },
		tags: { type: 'array', items: { type: 'string' } },
		sources: { type: 'array', items: { type: 'integer' } },
		imageQuery: { type: 'string' },
		/** 오늘 아침 속보 기사로 쓴 소식이면 true. 아침 속보도 같은 소식 스키마로 받는다 (스키마를 두 번 넣으면 문법 한도를 넘었다) */
		morning: { type: 'boolean' },
	},
	required: [
		'template',
		'kicker',
		'heading',
		'lead',
		'body',
		'analysis',
		'stats',
		'timeline',
		'qa',
		'quote',
		'debate',
		'next',
		'tags',
		'sources',
		'imageQuery',
		'morning',
	],
	additionalProperties: false,
};

export const WRITER_SCHEMA = {
	type: 'object',
	properties: {
		title: { type: 'string' },
		subtitle: { type: 'string' },
		summary: { type: 'string' },
		briefing: { type: 'string' },
		// 본문 소식과 오늘 아침 속보를 한 배열로 (아침 속보는 morning: true). 같은 형식으로 쓰고 정리 단계에서 나눈다
		stories: { type: 'array', items: STORY_SCHEMA },
		keywords: { type: 'array', items: { type: 'string' } },
	},
	required: ['title', 'subtitle', 'summary', 'briefing', 'stories', 'keywords'],
	additionalProperties: false,
};
