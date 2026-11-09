import type { Newsletter, NewsletterDetail } from '@newpick/shared';

/** 뉴스레터 상세 응답 (@newpick/shared, api와 같은 타입) */
export type ArticleInfo = NewsletterDetail;

/** 뉴스레터 한 편 (@newpick/shared, api와 같은 타입) */
export type ArticleDetail = Newsletter;

export interface ArticleSummary {
	id: number;
	categoryName: string;
	userId?: number;
	image: string;
	title: string;
	subtitle?: string;
	keywords?: string[];
	summary: string;
	date: string;
	bookmarks?: number;
	views?: number;
	/** 뉴스레터에 담긴 소식 (꼬리표·제목). 본문 HTML에서 꺼냄, 구조가 없는 예전 뉴스레터는 비어 있음 */
	stories?: { kicker: string; heading: string }[];
}

export interface NewsInfo {
	id: string;
	link: string;
	category: string[];
	title: string;
	content: string;
	images: string[];
	publishedAt: string;
	source: string;
}
