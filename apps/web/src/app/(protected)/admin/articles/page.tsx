import type { Metadata } from 'next';
import { Suspense } from 'react';
import ArticlesList from '@/app/(protected)/admin/_components/ArticlesList';

export const metadata: Metadata = {
	title: '관리자 · 수집 기사',
	robots: { index: false, follow: false },
};

/** 관리자 상세: 수집한 기사 (#31). 기간 · 쪽은 주소에서 읽으므로 Suspense 안에 */
export default function Page() {
	return (
		<Suspense fallback={null}>
			<ArticlesList />
		</Suspense>
	);
}
