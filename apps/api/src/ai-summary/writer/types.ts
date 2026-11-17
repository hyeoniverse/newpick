import type { CategoryName } from '@newpick/shared';

/** 뉴스레터 한 편의 모양 · 글자 수 한도 (#199에서 newsletter-writer.service.ts를 나눔) */

/**
 * 소식마다 내용에 맞는 템플릿 (#48). 모두 꼬리표·헤드라인·리드·본문을 갖고, 템플릿마다 고유 요소가 하나씩 있다
 * - numbers: 지표 카드 (증시·경제지표·통계)
 * - timeline: 날짜별 경과 (수사·재판·외교·사고처럼 진행 중인 사건)
 * - qa: 문답 (정책·제도·규제 변화)
 * - quote: 인용문 (핵심이 누군가의 발언)
 * - analysis: 해설 (그 밖의 일반 소식)
 * - brief: 단신 (짧게 다뤄도 되는 소식, 시사점 없음)
 */
export const TEMPLATES = ['numbers', 'timeline', 'qa', 'quote', 'analysis', 'brief'] as const;
export type Template = (typeof TEMPLATES)[number];

export type Stat = { label: string; value: string; note: string };
export type Moment = { when: string; what: string };
export type QA = { q: string; a: string };
/** 엇갈린 주장 하나: 누가(side) 무엇을 주장하는지(claim), 그 주장이 실린 기사의 언론사(source) */
export type Claim = { side: string; claim: string; source: string };

export type Story = {
	template: Template;
	kicker: string;
	heading: string;
	lead: string;
	body: string;
	/** 시사점. brief는 비어 있다 */
	analysis: string;
	stats: Stat[];
	timeline: Moment[];
	qa: QA[];
	quote: { text: string; by: string };
	/** 엇갈린 주장. 같은 사안을 두고 서로 반대되는 주장이 있을 때만 2~3개, 아니면 빈 배열 */
	debate: Claim[];
	/** 관전 포인트: 이 소식에서 앞으로 지켜볼 일정 · 결정 · 변수 한 줄. 후속 지켜보기가 이것을 기다린다 */
	next?: string;
	/** 이 소식의 태그 1~3개 (#20 태그 표기). 뉴스레터 태그(keywords)는 소식 태그를 모아 만든다 */
	tags?: string[];
	/** 원래 기사 목록에서의 번호 (1부터) */
	sources: number[];
	/** 원출처 사진이 없을 때 Pexels·Unsplash에서 찾을 영어 검색어 */
	imageQuery: string;
	/** 쓰기가 끝난 뒤 서버가 붙인다 (story-images.ts) */
	image?: StoryImage;
};

export type StoryImage = {
	url: string;
	alt: string;
	/** 사진 아래 표기: 언론사 또는 작가 */
	credit: string;
	creditUrl?: string;
	provider: 'article' | 'pexels' | 'unsplash';
	/** Pexels·Unsplash 페이지 (출처 표기 규칙) */
	providerUrl?: string;
};

/**
 * 뉴스레터 한 편 (#41, #42, #43, #47, #48)
 * 제목·부제목 + AI 요약 + 에디터 브리핑 → 소식 1~3개(템플릿별) → 관전 포인트
 */
export type WrittenNewsletter = {
	title: string;
	subtitle: string;
	summary: string;
	briefing: string;
	stories: Story[];
	/** 오늘 아침 속보 (05:00 이후 보도): 별도 소식으로 맨 위에, 최대 LIMITS.morning.max개. 예전 뉴스레터에는 없다 */
	morning?: Story[];
	/** 관전 포인트 모음: 소식마다의 next를 모은 것 (모델이 따로 쓰지 않는다). 메일 '관전 포인트' 칸이 쓴다 */
	watch: string[];
	/** 키워드 3~6개 (#50). 상세·목록의 태그, 지난 뉴스레터 검색(#20)에 쓴다 */
	keywords: string[];
};

export type SourceArticle = {
	title: string;
	content: string;
	source?: string;
	/** 보도 시각 (KST). 프롬프트에 붙여 지난 일을 오늘 일처럼 쓰지 않게 한다 */
	publishedAt?: string;
};

export type Usage = {
	model: string;
	input: number;
	output: number;
	stage?: string;
};

export const LIMITS = {
	title: 30,
	subtitle: 60,
	// 소식마다 한 문장 (아침 속보 2 + 본문 3 = 최대 5문장)
	summary: 450,
	briefing: 200,
	stories: 3,
	kicker: 8,
	lead: 80,
	body: { min: 250, max: 450 },
	briefBody: { min: 100, max: 200 },
	analysis: { min: 150, max: 300 },
	stats: { min: 2, max: 4 },
	timeline: { min: 3, max: 5 },
	qa: { min: 2, max: 3 },
	keywords: { min: 3, max: 6, length: 12 },
	/** 소식 하나의 태그 수 */
	storyTags: { max: 3 },
	/** 형광펜 강조 (#51): 소식마다 최대 개수, 한 곳 최대 길이 */
	marks: { max: 3, length: 30 },
	/** 쓰기 단계에 소식 하나당 보내는 기사 수 (같은 사건의 대표 기사, 다른 언론사 먼저) */
	articlesPerStory: 2,
	/** 주장이 엇갈리기 쉬운 분야(DEBATE_CATEGORIES)는 더 많이 보내 반대 주장을 찾을 수 있게 */
	articlesPerStoryWide: 3,
	/** 엇갈린 주장: 최대 개수, 주장 하나 최대 길이 */
	debate: { max: 3, claim: 80 },
	next: 60,
	/** 오늘 아침 속보: 최대 개수 (소식은 brief 템플릿으로 짧게) */
	morning: { max: 2 },
} as const;

/** 같은 사안을 두고 주장이 엇갈리기 쉬운 분야: 기사를 더 보내고 반대 주장을 더 챙긴다 */
export const DEBATE_CATEGORIES: readonly CategoryName[] = ['정치', '사회'];
/** 같은 사안을 두고 주장이 맞서기 쉬운 분야인가 (debate를 적극 채운다) */
export const isDebateCategory = (category?: string) =>
	!!category && (DEBATE_CATEGORIES as readonly string[]).includes(category);
