import type { Metadata } from 'next';
import { Suspense } from 'react';
import NewslettersList from '@/app/(protected)/admin/_components/NewslettersList';

export const metadata: Metadata = {
	title: '관리자 · 발행한 뉴스레터',
	robots: { index: false, follow: false },
};

/** 관리자 상세: 발행한 뉴스레터 (#21). 기간 · 쪽은 주소에서 읽으므로 Suspense 안에 */
export default function Page() {
	return (
		<Suspense fallback={null}>
			<NewslettersList />
		</Suspense>
	);
}
