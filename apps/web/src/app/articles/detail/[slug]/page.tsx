import { notFound } from 'next/navigation';
import { ApiError, apiFetch } from '@/api/client';
import API_ENDPOINTS from '@/constants/api';
import Article from '@/app/articles/detail/[slug]/_components/Article';

/**
 * 기사 본문은 Article에서 조회하고, 조회수는 브라우저에서 올립니다(useViewCount).
 * 지웠거나 없는 뉴스레터는 서버에서 먼저 확인해 404 상태와 안내 화면을 보냅니다.
 * 전에는 200으로 빈 화면만 나갔다. 서버에서의 조회는 조회수를 올리지 않습니다
 */
export default async function NewsletterDetailPage({ params }: { params: Promise<{ slug: string }> }) {
	const { slug } = await params;
	if (!/^\d+$/.test(slug)) notFound();

	try {
		await apiFetch(`${API_ENDPOINTS.NEWSLETTER.BASE}/${slug}`, { next: { revalidate: 60 } });
	} catch (error) {
		if (error instanceof ApiError && (error.status === 404 || error.status === 400)) notFound();
		// 서버 오류면 화면은 그대로 그리고, 브라우저 조회에서 다시 시도·안내한다
	}

	return <Article />;
}
