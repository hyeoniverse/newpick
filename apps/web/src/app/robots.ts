import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/constants/site';

/** 검색 엔진 안내 (#15): 로그인이 필요한 화면 · API 프록시는 빼고, sitemap 위치를 알린다 */
export default function robots(): MetadataRoute.Robots {
	return {
		rules: [{ userAgent: '*', allow: '/', disallow: ['/mypage', '/admin', '/api/'] }],
		sitemap: `${SITE_URL}/sitemap.xml`,
		host: SITE_URL,
	};
}
