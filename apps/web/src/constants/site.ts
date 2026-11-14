import { META } from '@/copy';
/**
 * 사이트 기본 정보 (#15). 공유 미리보기(Open Graph) · 검색(sitemap · robots)의 절대 주소에 쓴다.
 * 미리보기 주소에서 확인할 때는 NEXT_PUBLIC_SITE_URL로 바꿀 수 있다
 */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://newpick.hyeoniverse.com').replace(/\/$/, '');
export const SITE_NAME = '뉴픽: NewPick';
export const SITE_DESCRIPTION = META.site;
/** 기본 공유 이미지 (1200×630). 사진이 없는 뉴스레터와 다른 화면이 쓴다 */
export const DEFAULT_OG_IMAGE = {
	url: '/og.png',
	width: 1200,
	height: 630,
	alt: META.siteTitle,
};

/**
 * 화면별 메타데이터. Next는 화면이 openGraph를 주면 사이트 공통 openGraph를 통째로 바꾸므로
 * 공유 제목 · 설명 · 주소와 함께 사이트 이름 · 기본 이미지도 다시 넣는다
 */
export function pageMetadata(title: string, description: string, path: string) {
	return {
		title,
		description,
		alternates: { canonical: path },
		openGraph: {
			type: 'website' as const,
			siteName: SITE_NAME,
			locale: 'ko_KR',
			url: path,
			title: `${title} | ${SITE_NAME}`,
			description,
			images: [DEFAULT_OG_IMAGE],
		},
		twitter: {
			card: 'summary_large_image' as const,
			title: `${title} | ${SITE_NAME}`,
			description,
			images: [DEFAULT_OG_IMAGE.url],
		},
	};
}
