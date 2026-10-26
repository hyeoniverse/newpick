import { ArticleDetail as IArticleDetail, ArticleSummary as IArticleSummary } from '@/models/article.model';

import { getFirstImage } from '@/utils/getFirstImage';
import { mapIdToTitle } from '@/utils/mapInterests';
import { dateFormatter } from '@/utils/formatter';
import { stripCodeFence } from '@/utils/stripCodeFence';

const decode = (text: string) =>
	text
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&quot;/g, '"')
		.replace(/&#39;/g, "'")
		.replace(/&amp;/g, '&');

/**
 * 본문 HTML(서버 newsletterHtml.ts가 만든 구조)에서 소식의 꼬리표·제목만 꺼낸다.
 * 브라우저·서버 모두에서 쓰도록 DOM 대신 정규식. 구조가 없는 예전 뉴스레터는 빈 배열
 */
export function extractStories(html?: string | null): { kicker: string; heading: string }[] {
	if (!html) return [];
	const pattern = /<p class="kicker">(?:<span class="index">[^<]*<\/span>)?([^<]*)<\/p><h2>([^<]*)<\/h2>/g;
	return [...html.matchAll(pattern)].map(([, kicker, heading]) => ({
		kicker: decode(kicker).trim(),
		heading: decode(heading).trim(),
	}));
}

/**
 *  `ArticleDetail[]` → `ArticleSummary[]` 변환 함수
 */
export function parseArticles(trends: IArticleDetail[] = []): IArticleSummary[] {
	return trends.map((trend) => ({
		id: trend.id,
		categoryName: mapIdToTitle([trend.categoryId])[0],
		image: getFirstImage(trend.imageUrl!) || '',
		title: stripCodeFence(trend.title),
		...(trend.subtitle && { subtitle: trend.subtitle }),
		...(trend.keywords?.length && { keywords: trend.keywords }),
		summary: stripCodeFence(trend.content),
		date: dateFormatter(trend.createdAt),
		likes: trend.viewcount,
		views: trend.viewcount,
		...withStories(trend.contentAsHTML),
	}));
}

/** 부제목·키워드처럼, 소식이 있을 때만 넣는다 */
function withStories(html?: string | null) {
	const stories = extractStories(html);
	return stories.length ? { stories } : {};
}

export function parseUrls(urls: unknown, limit: number = 3): string[] {
	if (typeof urls !== 'string') {
		return [];
	}

	return urls
		.split(',')
		.map((url) => url.trim())
		.slice(0, limit);
}
