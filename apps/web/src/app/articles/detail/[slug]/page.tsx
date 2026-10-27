import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ApiError, apiFetch } from '@/api/client';
import API_ENDPOINTS from '@/constants/api';
import { NEWSLETTER_CACHE_TAG } from '@/constants/cache';
import { DEFAULT_OG_IMAGE } from '@/constants/site';
import { ArticleInfo } from '@/models/article.model';
import { articleDescription, categoryName } from '@/utils/articleMeta';
import { getFirstImage } from '@/utils/getFirstImage';
import Article from '@/app/articles/detail/[slug]/_components/Article';

type Params = { params: Promise<{ slug: string }> };

/**
 * 서버에서 뉴스레터를 읽는다 (조회수는 올리지 않음). 메타데이터와 화면이 같은 주소 · 옵션으로 불러
 * Next가 한 번만 요청한다. 없으면 null, 서버 오류면 undefined
 */
async function loadNewsletter(slug: string) {
	if (!/^\d+$/.test(slug)) return null;
	try {
		const { data } = await apiFetch<{ data: ArticleInfo }>(`${API_ENDPOINTS.NEWSLETTER.BASE}/${slug}`, {
			next: { revalidate: 60, tags: [NEWSLETTER_CACHE_TAG] },
		});
		return data.newsletter;
	} catch (error) {
		if (error instanceof ApiError && (error.status === 404 || error.status === 400)) return null;
		return undefined;
	}
}

/**
 * 공유 미리보기 · 검색 결과 (#15): 기사 제목 · 부제(없으면 본문 앞부분) · 사진.
 * 사진이 없는 뉴스레터는 사이트 기본 이미지
 */
export async function generateMetadata({ params }: Params): Promise<Metadata> {
	const { slug } = await params;
	const newsletter = await loadNewsletter(slug);
	if (newsletter === null) return { title: '찾을 수 없는 뉴스레터', robots: { index: false } };
	if (!newsletter) return {};

	const description = articleDescription(newsletter);
	const section = categoryName(newsletter.categoryId);
	// imageUrl은 소식마다의 사진을 쉼표로 이어 둔 값이라 화면과 같이 첫 장만 쓴다
	const image = newsletter.imageUrl ? getFirstImage(newsletter.imageUrl) : '';
	const images = image ? [{ url: image, alt: newsletter.title }] : [DEFAULT_OG_IMAGE];
	const url = `/articles/detail/${newsletter.id}`;

	return {
		title: newsletter.title,
		description,
		keywords: newsletter.keywords ?? undefined,
		alternates: { canonical: url },
		openGraph: {
			type: 'article',
			url,
			title: newsletter.title,
			description,
			publishedTime: newsletter.createdAt,
			section,
			tags: newsletter.keywords ?? undefined,
			images,
		},
		twitter: {
			card: 'summary_large_image',
			title: newsletter.title,
			description,
			images: images.map((image) => image.url),
		},
	};
}

/**
 * 기사 본문은 Article에서 조회하고, 조회수는 브라우저에서 올립니다(useViewCount).
 * 지웠거나 없는 뉴스레터는 서버에서 먼저 확인해 404 상태와 안내 화면을 보냅니다.
 * 서버 오류면 화면은 그대로 그리고, 브라우저 조회에서 다시 시도 · 안내한다
 */
export default async function NewsletterDetailPage({ params }: Params) {
	const { slug } = await params;
	if ((await loadNewsletter(slug)) === null) notFound();

	return <Article />;
}
