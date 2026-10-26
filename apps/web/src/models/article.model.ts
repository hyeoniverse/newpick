export interface ArticleInfo {
	newsletter: ArticleDetail;
	previousNewsletter: ArticleDetail | null;
	nextNewsletter: ArticleDetail | null;
}

export interface ArticleDetail {
	id: number;
	title: string;
	/** 제목에 담지 않은 나머지 소식 한 줄. 이전 뉴스레터는 null */
	subtitle?: string | null;
	/** 키워드 (#50). 이전 뉴스레터는 null */
	keywords?: string[] | null;
	content: string;
	contentAsHTML: string;
	imageUrl: string | null;
	categoryId: number;
	viewcount: number;
	usedNews: string;
	createdAt: string;
}

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
