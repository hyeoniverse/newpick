import type { MetadataRoute } from 'next';
import { apiFetch } from '@/api/client';
import API_ENDPOINTS from '@/constants/api';
import { NEWSLETTER_CACHE_TAG } from '@/constants/cache';
import { SITE_URL } from '@/constants/site';
import { ArticleDetail } from '@/models/article.model';

/** 한 시간마다 다시 만든다. 뉴스레터를 만들거나 지우면 사이트 캐시 비우기(#73)로 바로 바뀐다 */
export const revalidate = 3600;

const PAGE = 100;
const MAX = 2000;

/** 모든 뉴스레터 (최신순). api가 꺼져 있어도 고정 화면은 내보낸다 */
async function allNewsletters() {
	const list: ArticleDetail[] = [];
	try {
		for (let offset = 0; offset < MAX; offset += PAGE) {
			const { data } = await apiFetch<{ data: ArticleDetail[] }>(API_ENDPOINTS.NEWSLETTER.LIST(PAGE, offset), {
				next: { revalidate, tags: [NEWSLETTER_CACHE_TAG] },
			});
			list.push(...data);
			if (data.length < PAGE) break;
		}
	} catch (error) {
		console.error('sitemap: 뉴스레터 목록을 불러오지 못했습니다', error);
	}
	return list;
}

/** 검색 엔진에 알릴 주소 (#15): 고정 화면 + 뉴스레터마다 상세 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
	const newsletters = await allNewsletters();
	const latest = newsletters[0]?.createdAt ? new Date(newsletters[0].createdAt) : new Date();

	return [
		{ url: `${SITE_URL}/`, lastModified: latest, changeFrequency: 'daily', priority: 1 },
		{ url: `${SITE_URL}/articles`, lastModified: latest, changeFrequency: 'daily', priority: 0.9 },
		{ url: `${SITE_URL}/about`, changeFrequency: 'monthly', priority: 0.6 },
		{ url: `${SITE_URL}/terms`, changeFrequency: 'yearly', priority: 0.2 },
		{ url: `${SITE_URL}/privacy`, changeFrequency: 'yearly', priority: 0.2 },
		...newsletters.map((newsletter) => ({
			url: `${SITE_URL}/articles/detail/${newsletter.id}`,
			lastModified: new Date(newsletter.createdAt),
			changeFrequency: 'monthly' as const,
			priority: 0.7,
		})),
	];
}
