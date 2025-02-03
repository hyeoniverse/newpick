export interface ArticleInfo {
	newsletter: ArticleDetail;
	previousNewsletter: ArticleDetail | null;
	nextNewsletter: ArticleDetail | null;
}

export interface ArticleDetail {
	id: number;
	title: string;
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
	userId: number;
	img: string;
	title: string;
	summary: string;
	like: number;
	createdAt: string;
}

export interface ArticleCard {
	id: number;
	categoryName: string;
	image: string;
	title: string;
	summary: string;
	date: string;
}
